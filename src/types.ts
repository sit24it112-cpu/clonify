/**
 * PS-23 Frontend Client Types
 */

export type SupportedLanguage = 'python' | 'java';

export type ScoreZone = 'green' | 'yellow' | 'red';

export type ReviewStatus = 
  | 'pending'
  | 'reviewed_clean'
  | 'reviewed_suspicious'
  | 'potential_plagiarism'
  | 'reviewed_boilerplate'
  | 'requires_investigation'
  | 'inconclusive';

export interface CodeSubmission {
  id: string;
  filename: string;
  language: SupportedLanguage;
  content: string;
  studentId?: string;
  fileSize: number;
  lineCount: number;
  tokenCount: number;
  hash: string;
  parseStatus: 'success' | 'warning' | 'error';
  parseError?: string;
  cleanLines?: string[];
  normalizedString?: string;
}

export interface FeatureVector {
  tokenJaccard: number;
  tokenCosine: number;
  tfidfCosine: number;
  normalizedJaccard: number;
  astStructuralSim: number;
  controlFlowSim: number;
  winnowingOverlap: number;
  lengthRatio: number;
  functionSignatureSim: number;
  complexityDelta: number;
}

export interface MatchedRegion {
  id: string;
  startLineA: number;
  endLineA: number;
  startLineB: number;
  endLineB: number;
  tokenCount: number;
  matchType: 'exact' | 'normalized' | 'structural';
  snippetA: string;
  snippetB: string;
  similarityRatio: number;
}

export interface FeatureContribution {
  feature: string;
  label: string;
  value: number;
  weight: number;
  impactScore: number;
  description: string;
}

export interface PairwiseResult {
  id: string;
  analysisId: string;
  submissionAId: string;
  submissionBId: string;
  submissionAName: string;
  submissionBName: string;
  studentAId?: string;
  studentBId?: string;
  language: SupportedLanguage;
  overallScore: number;
  lexicalScore: number;
  structuralScore: number;
  mlModelScore: number;
  zone: ScoreZone;
  exceedsThreshold: boolean;
  thresholdApplied: number;
  features: FeatureVector;
  featureContributions: FeatureContribution[];
  matchedRegions: MatchedRegion[];
  explanation: string;
  modelUsed: string;
  modelVersion: string;
  isCalibrated: boolean;
  reviewStatus: ReviewStatus;
}

export interface AnalysisSummary {
  id: string;
  assignmentName: string;
  batchId: string;
  courseName?: string;
  reviewerNotes?: string;
  timestamp: string;
  submissionCount: number;
  totalPossiblePairs: number;
  pairsAnalyzedCount: number;
  flaggedPairsCount: number;
  averageSimilarity: number;
  reviewThreshold: number;
  languages: SupportedLanguage[];
  status: 'completed' | 'processing' | 'failed';
  errorMessage?: string;
  candidateSearchMethod: 'exhaustive' | 'winnowing_filtered';
  durationMs: number;
}

export interface ReviewRecord {
  id: string;
  pairId: string;
  analysisId: string;
  status: ReviewStatus;
  decisionNotes: string;
  reviewerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ModelMetricDetails {
  modelName: string;
  language: SupportedLanguage;
  version: string;
  algorithm: string;
  calibrationMethod: string;
  datasetName: string;
  datasetType: 'real_world_heldout' | 'synthetic_demo';
  totalTrainingSamples: number;
  totalEvaluationSamples: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  rocAuc: number;
  prAuc: number;
  falsePositiveRate: number;
  confusionMatrix: {
    trueNegative: number;
    falsePositive: number;
    falseNegative: number;
    truePositive: number;
  };
  scoreDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  lastTrainedDate: string;
}

export interface GlobalStats {
  totalSubmissions: number;
  totalAnalyses: number;
  totalComparisons: number;
  pairsFlaggedForReview: number;
  averageScore: number;
  parsingFailures: number;
}
