/**
 * PS-23 Automated Test Suite
 * Tests Preprocessing, Tokenization, AST Analysis, Lexical Similarity,
 * Winnowing Fingerprinting, ML Models, Scoring, and SQLite Persistence.
 */

import assert from 'assert';
import { preprocessCode, stripComments, tokenizeSource, normalizeIdentifiers } from '../server/engine/preprocessor';
import { analyzePythonStructure, analyzeJavaStructure, computeStructuralSimilarity } from '../server/engine/astAnalysis';
import {
  generateNGrams,
  computeJaccardSimilarity,
  computeCosineSimilarity,
  computeWinnowingFingerprints,
  computeFingerprintOverlap,
  findMatchingRegions
} from '../server/engine/lexicalAnalysis';
import { runModelInference, calculateOverallScore } from '../server/engine/mlModels';
import { compareSubmissionPair } from '../server/engine/pipeline';
import { dbInstance } from '../server/database';
import { SAMPLE_PYTHON_ALICE, SAMPLE_PYTHON_BOB, SAMPLE_JAVA_EVAN, SAMPLE_JAVA_FIONA } from '../server/seedData';

async function runTests() {
  console.log('=== Running PS-23 Automated Verification Tests ===\n');
  let passed = 0;
  let failed = 0;

  function test(name: string, fn: () => void) {
    try {
      fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
      failed++;
    }
  }

  // Test 1: Python Preprocessing and Comment Stripping
  test('Python Preprocessing & Comment Stripping', () => {
    const raw = '# This is a comment\nx = 10  # inline\n"""Block comment"""\ndef hello():\n    return x';
    const stripped = stripComments(raw, 'python');
    assert.strictEqual(stripped[0].trim(), '');
    assert.strictEqual(stripped[1].trim(), 'x = 10');
    assert.strictEqual(stripped[3].trim(), 'def hello():');
  });

  // Test 2: Java Preprocessing and Comment Stripping
  test('Java Preprocessing & Comment Stripping', () => {
    const raw = '// Single comment\nint x = 5; /* block */\n/* multiline\ncomment */\nvoid test() {}';
    const stripped = stripComments(raw, 'java');
    assert.strictEqual(stripped[0].trim(), '');
    assert.strictEqual(stripped[1].trim(), 'int x = 5;');
    assert.strictEqual(stripped[4].trim(), 'void test() {}');
  });

  // Test 3: Tokenization & Keyword Tagging
  test('Language-Aware Tokenization', () => {
    const py = 'def calculate(n):\n    return n * 2';
    const tokens = tokenizeSource(py, 'python').tokens;
    assert.strictEqual(tokens[0].value, 'def');
    assert.strictEqual(tokens[0].type, 'keyword');
    assert.strictEqual(tokens[1].value, 'calculate');
    assert.strictEqual(tokens[1].type, 'identifier');
  });

  // Test 4: Identifier Normalization
  test('Identifier Normalization mapping', () => {
    const tokens = [
      { type: 'keyword', value: 'def', line: 1, column: 1 },
      { type: 'identifier', value: 'foo', line: 1, column: 5 },
      { type: 'delimiter', value: '(', line: 1, column: 8 },
      { type: 'identifier', value: 'bar', line: 1, column: 9 },
      { type: 'delimiter', value: ')', line: 1, column: 12 },
    ];
    const { normalizedTokens, identifierMap } = normalizeIdentifiers(tokens);
    assert.strictEqual(identifierMap.get('foo'), 'ID_1');
    assert.strictEqual(identifierMap.get('bar'), 'ID_2');
    assert.strictEqual(normalizedTokens[1].normalized, 'ID_1');
    assert.strictEqual(normalizedTokens[3].normalized, 'ID_2');
  });

  // Test 5: AST Structural Metrics for Python
  test('Python AST Analysis & Loop/Conditional Counts', () => {
    const pyCode = 'def loop_test(items):\n    res = []\n    for x in items:\n        if x > 0:\n            res.append(x)\n    return res';
    const tokens = tokenizeSource(pyCode, 'python').tokens;
    const metrics = analyzePythonStructure(pyCode, tokens);
    assert(metrics.loopCount >= 1, 'Should detect loop');
    assert(metrics.conditionalCount >= 1, 'Should detect conditional');
    assert(metrics.functionCount >= 1, 'Should detect function');
  });

  // Test 6: Java AST / Syntax Tree Analysis
  test('Java Syntax Analysis & Class/Method Parsing', () => {
    const javaCode = 'public class MathUtil {\n    public static int square(int x) {\n        if (x < 0) return 0;\n        return x * x;\n    }\n}';
    const tokens = tokenizeSource(javaCode, 'java').tokens;
    const metrics = analyzeJavaStructure(javaCode, tokens);
    assert(metrics.totalNodes > 0);
    assert(metrics.conditionalCount >= 1);
  });

  // Test 7: Lexical N-Gram & Jaccard Similarity
  test('Lexical N-Gram Jaccard Calculation', () => {
    const gramsA = ['def compute fib', 'compute fib num', 'fib num if'];
    const gramsB = ['def compute fib', 'compute fib num', 'fib num while'];
    const sim = computeJaccardSimilarity(gramsA, gramsB);
    assert(sim >= 0.5 && sim <= 1.0);
  });

  // Test 8: Winnowing Fingerprinting Algorithm
  test('Winnowing Fingerprinting Overlap', () => {
    const tokensA = tokenizeSource(SAMPLE_PYTHON_ALICE, 'python').tokens;
    const tokensB = tokenizeSource(SAMPLE_PYTHON_BOB, 'python').tokens;
    const fpA = computeWinnowingFingerprints(tokensA, 4, 3, false);
    const fpB = computeWinnowingFingerprints(tokensB, 4, 3, false);
    assert(fpA.length > 0);
    assert(fpB.length > 0);
    const overlap = computeFingerprintOverlap(fpA, fpB);
    assert(overlap >= 0 && overlap <= 1.0);
  });

  // Test 9: Matched Regions Alignment
  test('Contiguous Matched Code Regions Finder', () => {
    const prepA = preprocessCode(SAMPLE_PYTHON_ALICE, 'python');
    const prepB = preprocessCode(SAMPLE_PYTHON_BOB, 'python');
    const regions = findMatchingRegions(
      prepA.normalizedTokens,
      prepB.normalizedTokens,
      prepA.originalLines,
      prepB.originalLines,
      4
    );
    assert(regions.length >= 1, 'Should identify at least 1 matching block');
    assert(regions[0].startLineA > 0);
    assert(regions[0].startLineB > 0);
  });

  // Test 10: ML Model Inference and Score Zones
  test('ML Model Inference & Zone Mapping', () => {
    const features = {
      tokenJaccard: 0.82,
      tokenCosine: 0.88,
      tfidfCosine: 0.85,
      normalizedJaccard: 0.90,
      astStructuralSim: 0.87,
      controlFlowSim: 0.92,
      winnowingOverlap: 0.80,
      lengthRatio: 0.95,
      functionSignatureSim: 0.85,
      complexityDelta: 0.90
    };
    const mlRes = runModelInference(features, 'python');
    assert(mlRes.calibratedScore >= 0.70, 'High similarity features should yield high calibrated ML score');
    assert.strictEqual(mlRes.isCalibrated, true);

    const { overallScore, zone } = calculateOverallScore(mlRes.calibratedScore, 0.85, 0.87);
    assert.strictEqual(zone, 'red');
    assert(overallScore >= 76);
  });

  // Test 11: End-to-End Pipeline on Alice vs Bob (Renamed Variables)
  test('End-to-End Python Pipeline on Refactored Pair', () => {
    const subA = {
      id: 'test-a',
      filename: 'alice.py',
      language: 'python' as const,
      content: SAMPLE_PYTHON_ALICE,
      fileSize: SAMPLE_PYTHON_ALICE.length,
      lineCount: 20,
      tokenCount: 50,
      hash: 'h-a',
      parseStatus: 'success' as const
    };
    const subB = {
      id: 'test-b',
      filename: 'bob.py',
      language: 'python' as const,
      content: SAMPLE_PYTHON_BOB,
      fileSize: SAMPLE_PYTHON_BOB.length,
      lineCount: 20,
      tokenCount: 50,
      hash: 'h-b',
      parseStatus: 'success' as const
    };
    const prepA = preprocessCode(subA.content, 'python');
    const prepB = preprocessCode(subB.content, 'python');
    const pair = compareSubmissionPair(subA, subB, prepA, prepB, [prepA, prepB], 0.78, 'test-analysis');
    assert(pair.overallScore >= 50, 'Refactored code should register elevated similarity');
    assert(pair.matchedRegions.length > 0);
  });

  // Test 12: SQLite Database Persistence Operations
  test('SQLite Persistence & Retrieval', () => {
    const stats = dbInstance.getGlobalStats();
    assert(typeof stats.totalSubmissions === 'number');
    assert(typeof stats.totalAnalyses === 'number');
    assert(typeof stats.pairsFlaggedForReview === 'number');

    const analyses = dbInstance.getAnalyses();
    assert(analyses.length >= 1, 'Seed data should have initialized at least 1 analysis');
  });

  console.log(`\n=== Verification Results: ${passed} Passed, ${failed} Failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
