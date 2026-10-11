/**
 * PS-23 End-to-End Analysis Pipeline
 * Integrates Preprocessing, Feature Extraction, Candidate Search, ML Scoring, and Evidence Generation.
 */

import {
  CodeSubmission,
  PairwiseResult,
  FeatureVector,
  SupportedLanguage
} from './types';
import { preprocessCode, PreprocessedSource } from './preprocessor';
import {
  analyzePythonStructure,
  analyzeJavaStructure,
  computeStructuralSimilarity
} from './astAnalysis';
import {
  generateNGrams,
  computeJaccardSimilarity,
  computeCosineSimilarity,
  computeTfidfSimilarity,
  computeWinnowingFingerprints,
  computeFingerprintOverlap,
  findMatchingRegions
} from './lexicalAnalysis';
import {
  runModelInference,
  calculateOverallScore
} from './mlModels';

export interface BatchAnalysisOptions {
  analysisId: string;
  submissions: {
    filename: string;
    content: string;
    studentId?: string;
  }[];
  reviewThreshold: number; // e.g. 0.78 or 78
}

/**
 * Compares two submissions and produces full pairwise results with evidence
 */
export function compareSubmissionPair(
  subA: CodeSubmission,
  subB: CodeSubmission,
  prepA: PreprocessedSource,
  prepB: PreprocessedSource,
  allPreps: PreprocessedSource[],
  reviewThreshold: number,
  analysisId: string
): PairwiseResult {
  const language = subA.language;

  // 1. Lexical features
  const ngramsA = generateNGrams(prepA.tokens, 3, false);
  const ngramsB = generateNGrams(prepB.tokens, 3, false);
  const tokenJaccard = computeJaccardSimilarity(ngramsA, ngramsB);

  const tokenCosine = computeCosineSimilarity(prepA.tokenFrequencies, prepB.tokenFrequencies);

  const allDocFreqs = allPreps.map(p => p.tokenFrequencies);
  const tfidfCosine = computeTfidfSimilarity(prepA.tokenFrequencies, prepB.tokenFrequencies, allDocFreqs, allPreps.length);

  const normGramsA = generateNGrams(prepA.normalizedTokens, 3, true);
  const normGramsB = generateNGrams(prepB.normalizedTokens, 3, true);
  const normalizedJaccard = computeJaccardSimilarity(normGramsA, normGramsB);

  const fpA = computeWinnowingFingerprints(prepA.normalizedTokens, 5, 4, true);
  const fpB = computeWinnowingFingerprints(prepB.normalizedTokens, 5, 4, true);
  const winnowingOverlap = computeFingerprintOverlap(fpA, fpB);

  // 2. Structural & AST features
  const structA = language === 'python'
    ? analyzePythonStructure(subA.content, prepA.tokens)
    : analyzeJavaStructure(subA.content, prepA.tokens);

  const structB = language === 'python'
    ? analyzePythonStructure(subB.content, prepB.tokens)
    : analyzeJavaStructure(subB.content, prepB.tokens);

  const astStructuralSim = computeStructuralSimilarity(structA, structB);

  // Control flow similarity (loops & conditionals)
  const totalFlowA = structA.loopCount + structA.conditionalCount;
  const totalFlowB = structB.loopCount + structB.conditionalCount;
  const maxFlow = Math.max(1, Math.max(totalFlowA, totalFlowB));
  const controlFlowSim = 1.0 - (Math.abs(totalFlowA - totalFlowB) / maxFlow);

  // Length ratio
  const maxTokens = Math.max(1, Math.max(prepA.tokens.length, prepB.tokens.length));
  const lengthRatio = Math.min(prepA.tokens.length, prepB.tokens.length) / maxTokens;

  // Function signature similarity
  const maxFunc = Math.max(1, Math.max(structA.functionCount, structB.functionCount));
  const functionSignatureSim = 1.0 - (Math.abs(structA.functionCount - structB.functionCount) / maxFunc);

  // Complexity alignment
  const maxComplexity = Math.max(1, Math.max(structA.branchingComplexity, structB.branchingComplexity));
  const complexityDelta = 1.0 - (Math.abs(structA.branchingComplexity - structB.branchingComplexity) / maxComplexity);

  const features: FeatureVector = {
    tokenJaccard,
    tokenCosine,
    tfidfCosine,
    normalizedJaccard,
    astStructuralSim,
    controlFlowSim,
    winnowingOverlap,
    lengthRatio,
    functionSignatureSim,
    complexityDelta
  };

  // 3. Composite lexical score
  const lexicalScore = (0.35 * tokenJaccard) + (0.35 * normalizedJaccard) + (0.20 * tfidfCosine) + (0.10 * winnowingOverlap);

  // 4. ML Model Inference
  const mlResult = runModelInference(features, language);

  // 5. Overall score and score zone
  const { overallScore, zone } = calculateOverallScore(
    mlResult.calibratedScore,
    lexicalScore,
    astStructuralSim
  );

  // 6. Matched code regions for side-by-side evidence inspection
  const matchedRegions = findMatchingRegions(
    prepA.normalizedTokens,
    prepB.normalizedTokens,
    prepA.originalLines,
    prepB.originalLines,
    6
  );

  // Normalize threshold to 0-100 scale for comparison
  const effectiveThreshold = reviewThreshold > 1 ? reviewThreshold : reviewThreshold * 100;
  const exceedsThreshold = overallScore >= effectiveThreshold;

  return {
    id: `pair-${subA.id}-${subB.id}`,
    analysisId,
    submissionAId: subA.id,
    submissionBId: subB.id,
    submissionAName: subA.filename,
    submissionBName: subB.filename,
    studentAId: subA.studentId,
    studentBId: subB.studentId,
    language,
    overallScore,
    lexicalScore: Math.round(lexicalScore * 100),
    structuralScore: Math.round(astStructuralSim * 100),
    mlModelScore: Math.round(mlResult.calibratedScore * 100),
    zone,
    exceedsThreshold,
    thresholdApplied: effectiveThreshold,
    features,
    featureContributions: mlResult.contributions,
    matchedRegions,
    explanation: mlResult.explanation,
    modelUsed: mlResult.modelUsed,
    modelVersion: mlResult.modelVersion,
    isCalibrated: mlResult.isCalibrated,
    reviewStatus: exceedsThreshold ? 'pending' : 'reviewed_clean'
  };
}

/**
 * Detect language by file extension or content
 */
export function detectLanguage(filename: string): SupportedLanguage | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.py')) return 'python';
  if (lower.endsWith('.java')) return 'java';
  return null;
}
