/**
 * PS-23 Seed Data
 * Provides initial realistic academic submissions, comparisons, and human reviews
 * so the dashboard and analytics are immediately functional.
 */

import { PlagiarismDatabase } from './database';
import { preprocessCode } from './engine/preprocessor';
import { compareSubmissionPair } from './engine/pipeline';
import { CodeSubmission, AnalysisSummary, ReviewRecord } from './engine/types';

import {
  SAMPLE_PYTHON_ALICE,
  SAMPLE_PYTHON_BOB,
  SAMPLE_PYTHON_CHARLIE,
  SAMPLE_JAVA_EVAN,
  SAMPLE_JAVA_FIONA
} from '../src/data/sampleCodes';

export {
  SAMPLE_PYTHON_ALICE,
  SAMPLE_PYTHON_BOB,
  SAMPLE_PYTHON_CHARLIE,
  SAMPLE_JAVA_EVAN,
  SAMPLE_JAVA_FIONA
};

export function seedInitialData(db: PlagiarismDatabase): void {
  const existing = db.getAnalyses();
  if (existing.length > 0) {
    return; // Already initialized
  }

  const analysisId = 'analysis-demo-2026';
  const timestamp = new Date().toISOString();

  // 1. Create submissions
  const subAlice: CodeSubmission = {
    id: 'sub-alice-01',
    filename: 'fibonacci_memoized.py',
    language: 'python',
    content: SAMPLE_PYTHON_ALICE,
    studentId: 'STU-10492',
    fileSize: SAMPLE_PYTHON_ALICE.length,
    lineCount: SAMPLE_PYTHON_ALICE.split('\n').length,
    tokenCount: 88,
    hash: 'sha256-alice-fib',
    parseStatus: 'success'
  };

  const subBob: CodeSubmission = {
    id: 'sub-bob-02',
    filename: 'fib_cache.py',
    language: 'python',
    content: SAMPLE_PYTHON_BOB,
    studentId: 'STU-10493',
    fileSize: SAMPLE_PYTHON_BOB.length,
    lineCount: SAMPLE_PYTHON_BOB.split('\n').length,
    tokenCount: 86,
    hash: 'sha256-bob-fib',
    parseStatus: 'success'
  };

  const subCharlie: CodeSubmission = {
    id: 'sub-charlie-03',
    filename: 'dijkstra_shortest_path.py',
    language: 'python',
    content: SAMPLE_PYTHON_CHARLIE,
    studentId: 'STU-10512',
    fileSize: SAMPLE_PYTHON_CHARLIE.length,
    lineCount: SAMPLE_PYTHON_CHARLIE.split('\n').length,
    tokenCount: 142,
    hash: 'sha256-charlie-dijkstra',
    parseStatus: 'success'
  };

  const subEvan: CodeSubmission = {
    id: 'sub-evan-04',
    filename: 'BinarySearchTree.java',
    language: 'java',
    content: SAMPLE_JAVA_EVAN,
    studentId: 'STU-20108',
    fileSize: SAMPLE_JAVA_EVAN.length,
    lineCount: SAMPLE_JAVA_EVAN.split('\n').length,
    tokenCount: 164,
    hash: 'sha256-evan-bst',
    parseStatus: 'success'
  };

  const subFiona: CodeSubmission = {
    id: 'sub-fiona-05',
    filename: 'BSTree.java',
    language: 'java',
    content: SAMPLE_JAVA_FIONA,
    studentId: 'STU-20109',
    fileSize: SAMPLE_JAVA_FIONA.length,
    lineCount: SAMPLE_JAVA_FIONA.split('\n').length,
    tokenCount: 160,
    hash: 'sha256-fiona-bst',
    parseStatus: 'success'
  };

  const allSubmissions = [subAlice, subBob, subCharlie, subEvan, subFiona];

  // Preprocess all
  const prepMap = new Map();
  for (const s of allSubmissions) {
    prepMap.set(s.id, preprocessCode(s.content, s.language));
  }
  const allPreps = Array.from(prepMap.values());

  // Compare pairs (Python with Python, Java with Java)
  const pair1 = compareSubmissionPair(
    subAlice, subBob,
    prepMap.get(subAlice.id), prepMap.get(subBob.id),
    allPreps, 0.78, analysisId
  );

  const pair2 = compareSubmissionPair(
    subAlice, subCharlie,
    prepMap.get(subAlice.id), prepMap.get(subCharlie.id),
    allPreps, 0.78, analysisId
  );

  const pair3 = compareSubmissionPair(
    subBob, subCharlie,
    prepMap.get(subBob.id), prepMap.get(subCharlie.id),
    allPreps, 0.78, analysisId
  );

  const pair4 = compareSubmissionPair(
    subEvan, subFiona,
    prepMap.get(subEvan.id), prepMap.get(subFiona.id),
    allPreps, 0.78, analysisId
  );

  const pairs = [pair1, pair2, pair3, pair4];
  const flaggedCount = pairs.filter(p => p.exceedsThreshold).length;
  const avgScore = pairs.reduce((acc, p) => acc + p.overallScore, 0) / pairs.length;

  const analysis: AnalysisSummary = {
    id: analysisId,
    assignmentName: 'Midterm Lab - Core Algorithms & Data Structures',
    batchId: 'BATCH-2026-Q1',
    courseName: 'CS101 / CS201 Computer Science Foundation',
    reviewerNotes: 'Verified calibration run comparing student submissions against Python & Java ML inference pipelines.',
    timestamp,
    submissionCount: allSubmissions.length,
    totalPossiblePairs: 10,
    pairsAnalyzedCount: pairs.length,
    flaggedPairsCount: flaggedCount,
    averageSimilarity: Math.round(avgScore * 10) / 10,
    reviewThreshold: 0.78,
    languages: ['python', 'java'],
    status: 'completed',
    candidateSearchMethod: 'exhaustive',
    durationMs: 412
  };

  db.saveAnalysis(analysis);
  db.saveSubmissions(allSubmissions, analysisId);
  db.savePairs(pairs);

  // Add a sample completed human review decision for audit record
  const review1: ReviewRecord = {
    id: 'rev-001',
    pairId: pair1.id,
    analysisId,
    status: 'potential_plagiarism',
    decisionNotes: 'Variable names and parameter identifiers renamed across functions. Structure and line-by-line memoization logic remain identical. Flagged for academic honesty meeting.',
    reviewerId: 'Prof. Alistair Vance',
    createdAt: timestamp,
    updatedAt: timestamp
  };
  db.saveReviewRecord(review1);
}
