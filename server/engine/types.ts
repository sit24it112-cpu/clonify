/**
 * PS-23 Code Plagiarism Detection System - Core Type Definitions
 * Supports Python and Java similarity analysis, ML inference, and human review.
 */

export type SupportedLanguage = 'python' | 'java';

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
}

export interface TokenInfo {
  type: string;
  value: string;
  line: number;
  column: number;
  normalized?: string;
}

export interface ASTNodeInfo {
  type: string;
  name?: string;
  line: number;
  depth: number;
  childrenCount: number;
}

export interface StructuralMetrics {
  totalNodes: number;
  maxDepth: number;
  functionCount: number;
  loopCount: number;
  conditionalCount: number;
  returnCount: number;
  branchingComplexity: number;
  nodeTypes: Record<string, number>;
  subtreeHashes: string[];
}

export interface FeatureVector {
  tokenJaccard: number;            // Lexical n-gram Jaccard
  tokenCosine: number;             // Lexical token Cosine
  tfidfCosine: number;             // TF-IDF cosine similarity
  normalizedJaccard: number;       // Identifier-normalized Jaccard
  astStructuralSim: number;        // AST structural tree similarity
  controlFlowSim: number;          // Loop & branching similarity
  winnowingOverlap: number;        // Winnowing fingerprint overlap ratio
  lengthRatio: number;             // Relative token length ratio (0..1)
  functionSignatureSim: number;    // Function signature & structure similarity
  complexityDelta: number;         // Branching complexity alignment
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

export type ScoreZone = 'green' | 'yellow' | 'red';

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
  
  // Scores (0 - 100 scale)
  overallScore: number;
  lexicalScore: number;
  structuralScore: number;
  mlModelScore: number;
  zone: ScoreZone;
  
  // Threshold & Flag
  exceedsThreshold: boolean;
  thresholdApplied: number;
  
  // Evidence
  features: FeatureVector;
  featureContributions: FeatureContribution[];
  matchedRegions: MatchedRegion[];
  explanation: string;
  
  // Model Details
  modelUsed: string;
  modelVersion: string;
  isCalibrated: boolean;
  
  // Status
  reviewStatus: ReviewStatus;
}

export type ReviewStatus = 
  | 'pending'
  | 'reviewed_clean'
  | 'reviewed_suspicious'
  | 'potential_plagiarism'
  | 'reviewed_boilerplate'
  | 'requires_investigation'
  | 'inconclusive';

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
