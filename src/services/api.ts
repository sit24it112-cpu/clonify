/**
 * PS-23 API Service Client
 * Connects frontend to the backend endpoints.
 */

import {
  AnalysisSummary,
  CodeSubmission,
  PairwiseResult,
  ReviewRecord,
  ReviewStatus,
  GlobalStats,
  ModelMetricDetails
} from '../types';

const API_BASE = '/api';

export const api = {
  // Health & Stats
  async getHealth(): Promise<{ status: string; system: string; version: string; stats: GlobalStats }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Failed to fetch health status');
    return res.json();
  },

  // Model Info
  async getModelStatus(): Promise<any> {
    const res = await fetch(`${API_BASE}/model/status`);
    if (!res.ok) throw new Error('Failed to fetch model status');
    return res.json();
  },

  async getModelMetrics(): Promise<{ metrics: Record<string, ModelMetricDetails>; datasetValidation: any }> {
    const res = await fetch(`${API_BASE}/model/metrics`);
    if (!res.ok) throw new Error('Failed to fetch model metrics');
    return res.json();
  },

  // Analyses
  async getAnalyses(): Promise<AnalysisSummary[]> {
    const res = await fetch(`${API_BASE}/analyses`);
    if (!res.ok) throw new Error('Failed to fetch analyses list');
    return res.json();
  },

  async getAnalysis(id: string): Promise<AnalysisSummary & { pairs: PairwiseResult[]; submissions: CodeSubmission[] }> {
    const res = await fetch(`${API_BASE}/analyses/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch analysis ${id}`);
    return res.json();
  },

  async deleteAnalysis(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/analyses/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error(`Failed to delete analysis ${id}`);
    return res.json();
  },

  async runAnalysis(data: {
    assignmentName: string;
    batchId: string;
    courseName?: string;
    reviewerNotes?: string;
    reviewThreshold: number;
    submissions: { filename: string; content: string; studentId?: string }[];
  }): Promise<{ analysis: AnalysisSummary; pairs: PairwiseResult[]; submissions: CodeSubmission[] }> {
    const res = await fetch(`${API_BASE}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Analysis failed' }));
      throw new Error(err.error || 'Failed to execute analysis');
    }
    return res.json();
  },

  // Submissions
  async getSubmission(id: string): Promise<CodeSubmission> {
    const res = await fetch(`${API_BASE}/submissions/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch submission ${id}`);
    return res.json();
  },

  // Pairwise & Evidence
  async getPair(id: string): Promise<PairwiseResult> {
    const res = await fetch(`${API_BASE}/pairs/${id}`);
    if (!res.ok) throw new Error(`Failed to fetch pair ${id}`);
    return res.json();
  },

  async getPairEvidence(id: string): Promise<{
    pair: PairwiseResult;
    submissionA: CodeSubmission & { cleanLines: string[]; normalizedString: string };
    submissionB: CodeSubmission & { cleanLines: string[]; normalizedString: string };
    matchedRegions: any[];
    contributions: any[];
    explanation: string;
  }> {
    const res = await fetch(`${API_BASE}/pairs/${id}/evidence`);
    if (!res.ok) throw new Error(`Failed to fetch evidence for pair ${id}`);
    return res.json();
  },

  // Reviews
  async getReviews(analysisId?: string): Promise<ReviewRecord[]> {
    const url = analysisId ? `${API_BASE}/reviews?analysisId=${encodeURIComponent(analysisId)}` : `${API_BASE}/reviews`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  },

  async saveReview(data: {
    pairId: string;
    analysisId: string;
    status: ReviewStatus;
    decisionNotes: string;
    reviewerId?: string;
  }): Promise<{ success: boolean; review: ReviewRecord }> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to save review decision');
    return res.json();
  },

  // Sample data loader
  async loadSampleData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${API_BASE}/samples/load`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to load sample dataset');
    return res.json();
  }
};
