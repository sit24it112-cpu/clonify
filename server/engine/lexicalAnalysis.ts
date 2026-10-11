/**
 * PS-23 Lexical Code Similarity Engine
 * Includes Token N-Gram, Jaccard, TF-IDF, Winnowing Fingerprinting, and Region Alignment.
 */

import { TokenInfo, MatchedRegion } from './types';

/**
 * Generate N-Grams from token stream
 */
export function generateNGrams(tokens: TokenInfo[], n: number, normalized = false): string[] {
  const ngrams: string[] = [];
  if (tokens.length < n) {
    if (tokens.length > 0) {
      ngrams.push(tokens.map(t => normalized ? (t.normalized || t.value) : t.value).join(' '));
    }
    return ngrams;
  }

  for (let i = 0; i <= tokens.length - n; i++) {
    const slice = tokens.slice(i, i + n);
    const gram = slice.map(t => normalized ? (t.normalized || t.value) : t.value).join(' ');
    ngrams.push(gram);
  }
  return ngrams;
}

/**
 * Jaccard similarity between two sets of n-grams or strings
 */
export function computeJaccardSimilarity(gramsA: string[], gramsB: string[]): number {
  if (gramsA.length === 0 && gramsB.length === 0) return 1.0;
  if (gramsA.length === 0 || gramsB.length === 0) return 0.0;

  const setA = new Set(gramsA);
  const setB = new Set(gramsB);

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0.0;
}

/**
 * Cosine similarity between two token frequency maps
 */
export function computeCosineSimilarity(freqA: Map<string, number>, freqB: Map<string, number>): number {
  if (freqA.size === 0 || freqB.size === 0) return 0.0;

  let dotProduct = 0;
  let magA = 0;
  let magB = 0;

  for (const count of freqA.values()) {
    magA += count * count;
  }
  for (const count of freqB.values()) {
    magB += count * count;
  }

  for (const [key, countA] of freqA.entries()) {
    const countB = freqB.get(key);
    if (countB !== undefined) {
      dotProduct += countA * countB;
    }
  }

  const magnitude = Math.sqrt(magA) * Math.sqrt(magB);
  return magnitude > 0 ? Math.min(1.0, dotProduct / magnitude) : 0.0;
}

/**
 * TF-IDF Cosine similarity using batch term frequencies
 */
export function computeTfidfSimilarity(
  freqA: Map<string, number>,
  freqB: Map<string, number>,
  allDocsFreqs: Map<string, number>[],
  totalDocs: number
): number {
  if (freqA.size === 0 || freqB.size === 0) return 0.0;

  // Calculate Document Frequency for terms
  const docFreq = new Map<string, number>();
  for (const doc of allDocsFreqs) {
    for (const term of doc.keys()) {
      docFreq.set(term, (docFreq.get(term) || 0) + 1);
    }
  }

  const tfidfA = new Map<string, number>();
  const tfidfB = new Map<string, number>();

  for (const [term, count] of freqA.entries()) {
    const df = docFreq.get(term) || 1;
    const idf = Math.log(1 + (totalDocs / df));
    tfidfA.set(term, count * idf);
  }

  for (const [term, count] of freqB.entries()) {
    const df = docFreq.get(term) || 1;
    const idf = Math.log(1 + (totalDocs / df));
    tfidfB.set(term, count * idf);
  }

  return computeCosineSimilarity(tfidfA, tfidfB);
}

/**
 * Winnowing Algorithm (Schleimer et al., 2003)
 * Selects minimum hash in each sliding window of k-gram hashes to form robust fingerprint.
 */
export function computeWinnowingFingerprints(
  tokens: TokenInfo[],
  k = 5,
  windowSize = 4,
  normalized = true
): { hash: number; pos: number; line: number }[] {
  if (tokens.length < k) {
    return [];
  }

  // 1. Calculate k-gram hashes using polynomial rolling hash (Rabin-Karp)
  const kgramHashes: { hash: number; pos: number; line: number }[] = [];
  const base = 31;
  const mod = 1000000007;

  for (let i = 0; i <= tokens.length - k; i++) {
    let hash = 0;
    for (let j = 0; j < k; j++) {
      const token = tokens[i + j];
      const str = normalized ? (token.normalized || token.value) : token.value;
      for (let c = 0; c < str.length; c++) {
        hash = (hash * base + str.charCodeAt(c)) % mod;
      }
    }
    kgramHashes.push({
      hash,
      pos: i,
      line: tokens[i].line
    });
  }

  // 2. Select minimum in each window of size windowSize
  const fingerprints: { hash: number; pos: number; line: number }[] = [];
  let minIdx = -1;

  for (let i = 0; i <= kgramHashes.length - windowSize; i++) {
    let currentMinIdx = i;
    for (let j = 1; j < windowSize; j++) {
      if (kgramHashes[i + j].hash <= kgramHashes[currentMinIdx].hash) {
        currentMinIdx = i + j;
      }
    }

    if (currentMinIdx !== minIdx) {
      fingerprints.push(kgramHashes[currentMinIdx]);
      minIdx = currentMinIdx;
    }
  }

  return fingerprints;
}

/**
 * Calculates winnowing fingerprint overlap ratio
 */
export function computeFingerprintOverlap(
  fpA: { hash: number }[],
  fpB: { hash: number }[]
): number {
  if (fpA.length === 0 || fpB.length === 0) return 0.0;

  const setB = new Set(fpB.map(f => f.hash));
  let matchCount = 0;

  for (const f of fpA) {
    if (setB.has(f.hash)) {
      matchCount++;
    }
  }

  return (2 * matchCount) / (fpA.length + fpB.length);
}

/**
 * Aligns source code and finds contiguous matching regions for side-by-side evidence inspection.
 */
export function findMatchingRegions(
  tokensA: TokenInfo[],
  tokensB: TokenInfo[],
  linesA: string[],
  linesB: string[],
  minTokenLength = 6
): MatchedRegion[] {
  const regions: MatchedRegion[] = [];
  const matchedTokensA = new Set<number>();
  const matchedTokensB = new Set<number>();

  // Look for longest common token sequences
  for (let i = 0; i < tokensA.length; i++) {
    if (matchedTokensA.has(i)) continue;

    for (let j = 0; j < tokensB.length; j++) {
      if (matchedTokensB.has(j)) continue;

      // Check match length starting at tokensA[i] and tokensB[j]
      let len = 0;
      let isExact = true;

      while (
        i + len < tokensA.length &&
        j + len < tokensB.length &&
        !matchedTokensA.has(i + len) &&
        !matchedTokensB.has(j + len)
      ) {
        const tA = tokensA[i + len];
        const tB = tokensB[j + len];
        const valA = tA.normalized || tA.value;
        const valB = tB.normalized || tB.value;

        if (valA === valB) {
          if (tA.value !== tB.value) {
            isExact = false;
          }
          len++;
        } else {
          break;
        }
      }

      if (len >= minTokenLength) {
        // Mark tokens as matched
        for (let k = 0; k < len; k++) {
          matchedTokensA.add(i + k);
          matchedTokensB.add(j + k);
        }

        const startLineA = tokensA[i].line;
        const endLineA = tokensA[i + len - 1].line;
        const startLineB = tokensB[j].line;
        const endLineB = tokensB[j + len - 1].line;

        const snippetA = linesA.slice(Math.max(0, startLineA - 1), endLineA).join('\n');
        const snippetB = linesB.slice(Math.max(0, startLineB - 1), endLineB).join('\n');

        regions.push({
          id: `region-${regions.length + 1}`,
          startLineA,
          endLineA,
          startLineB,
          endLineB,
          tokenCount: len,
          matchType: isExact ? 'exact' : 'normalized',
          snippetA: snippetA.length > 500 ? snippetA.slice(0, 500) + '...' : snippetA,
          snippetB: snippetB.length > 500 ? snippetB.slice(0, 500) + '...' : snippetB,
          similarityRatio: isExact ? 1.0 : 0.88
        });

        break; // Advance i
      }
    }
  }

  // Sort regions by starting line in A
  regions.sort((a, b) => a.startLineA - b.startLineA);

  return regions;
}
