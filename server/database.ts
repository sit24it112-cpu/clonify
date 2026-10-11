/**
 * PS-23 SQLite Database Layer
 * Uses Node.js 22 built-in node:sqlite DatabaseSync for fast, zero-dependency persistence.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  AnalysisSummary,
  CodeSubmission,
  PairwiseResult,
  ReviewRecord,
  ReviewStatus
} from './engine/types';

const DB_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}
const DB_PATH = path.join(DB_DIR, 'ps23_plagiarism.db');

export class PlagiarismDatabase {
  private db: DatabaseSync;

  constructor() {
    this.db = new DatabaseSync(DB_PATH);
    this.initTables();
  }

  private initTables(): void {
    // 1. Analyses table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS analyses (
        id TEXT PRIMARY KEY,
        assignment_name TEXT NOT NULL,
        batch_id TEXT NOT NULL,
        course_name TEXT,
        reviewer_notes TEXT,
        timestamp TEXT NOT NULL,
        submission_count INTEGER NOT NULL,
        total_possible_pairs INTEGER NOT NULL,
        pairs_analyzed_count INTEGER NOT NULL,
        flagged_pairs_count INTEGER NOT NULL,
        average_similarity REAL NOT NULL,
        review_threshold REAL NOT NULL,
        languages_json TEXT NOT NULL,
        status TEXT NOT NULL,
        error_message TEXT,
        candidate_search_method TEXT NOT NULL,
        duration_ms INTEGER NOT NULL
      );
    `);

    // 2. Submissions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        filename TEXT NOT NULL,
        language TEXT NOT NULL,
        content TEXT NOT NULL,
        student_id TEXT,
        file_size INTEGER NOT NULL,
        line_count INTEGER NOT NULL,
        token_count INTEGER NOT NULL,
        hash TEXT NOT NULL,
        parse_status TEXT NOT NULL,
        parse_error TEXT,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      );
    `);

    // 3. Pairwise results table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS pairs (
        id TEXT PRIMARY KEY,
        analysis_id TEXT NOT NULL,
        submission_a_id TEXT NOT NULL,
        submission_b_id TEXT NOT NULL,
        submission_a_name TEXT NOT NULL,
        submission_b_name TEXT NOT NULL,
        student_a_id TEXT,
        student_b_id TEXT,
        language TEXT NOT NULL,
        overall_score INTEGER NOT NULL,
        lexical_score INTEGER NOT NULL,
        structural_score INTEGER NOT NULL,
        ml_model_score INTEGER NOT NULL,
        zone TEXT NOT NULL,
        exceeds_threshold INTEGER NOT NULL,
        threshold_applied REAL NOT NULL,
        features_json TEXT NOT NULL,
        contributions_json TEXT NOT NULL,
        matched_regions_json TEXT NOT NULL,
        explanation TEXT NOT NULL,
        model_used TEXT NOT NULL,
        model_version TEXT NOT NULL,
        is_calibrated INTEGER NOT NULL,
        review_status TEXT NOT NULL,
        FOREIGN KEY (analysis_id) REFERENCES analyses(id) ON DELETE CASCADE
      );
    `);

    // 4. Human Review Decisions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        pair_id TEXT NOT NULL,
        analysis_id TEXT NOT NULL,
        status TEXT NOT NULL,
        decision_notes TEXT NOT NULL,
        reviewer_id TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);

    // 5. System settings table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  // --- Analysis Operations ---

  public saveAnalysis(analysis: AnalysisSummary): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO analyses (
        id, assignment_name, batch_id, course_name, reviewer_notes,
        timestamp, submission_count, total_possible_pairs, pairs_analyzed_count,
        flagged_pairs_count, average_similarity, review_threshold,
        languages_json, status, error_message, candidate_search_method, duration_ms
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    stmt.run(
      analysis.id,
      analysis.assignmentName,
      analysis.batchId,
      analysis.courseName || null,
      analysis.reviewerNotes || null,
      analysis.timestamp,
      analysis.submissionCount,
      analysis.totalPossiblePairs,
      analysis.pairsAnalyzedCount,
      analysis.flaggedPairsCount,
      analysis.averageSimilarity,
      analysis.reviewThreshold,
      JSON.stringify(analysis.languages),
      analysis.status,
      analysis.errorMessage || null,
      analysis.candidateSearchMethod,
      analysis.durationMs
    );
  }

  public getAnalyses(): AnalysisSummary[] {
    const rows = this.db.prepare(`SELECT * FROM analyses ORDER BY timestamp DESC`).all() as any[];
    return rows.map(r => ({
      id: r.id,
      assignmentName: r.assignment_name,
      batchId: r.batch_id,
      courseName: r.course_name,
      reviewerNotes: r.reviewer_notes,
      timestamp: r.timestamp,
      submissionCount: r.submission_count,
      totalPossiblePairs: r.total_possible_pairs,
      pairsAnalyzedCount: r.pairs_analyzed_count,
      flaggedPairsCount: r.flagged_pairs_count,
      averageSimilarity: r.average_similarity,
      reviewThreshold: r.review_threshold,
      languages: JSON.parse(r.languages_json),
      status: r.status,
      errorMessage: r.error_message,
      candidateSearchMethod: r.candidate_search_method,
      durationMs: r.duration_ms
    }));
  }

  public getAnalysis(id: string): AnalysisSummary | null {
    const r = this.db.prepare(`SELECT * FROM analyses WHERE id = ?`).get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      assignmentName: r.assignment_name,
      batchId: r.batch_id,
      courseName: r.course_name,
      reviewerNotes: r.reviewer_notes,
      timestamp: r.timestamp,
      submissionCount: r.submission_count,
      totalPossiblePairs: r.total_possible_pairs,
      pairsAnalyzedCount: r.pairs_analyzed_count,
      flaggedPairsCount: r.flagged_pairs_count,
      averageSimilarity: r.average_similarity,
      reviewThreshold: r.review_threshold,
      languages: JSON.parse(r.languages_json),
      status: r.status,
      errorMessage: r.error_message,
      candidateSearchMethod: r.candidate_search_method,
      durationMs: r.duration_ms
    };
  }

  public deleteAnalysis(id: string): boolean {
    this.db.prepare(`DELETE FROM reviews WHERE analysis_id = ?`).run(id);
    this.db.prepare(`DELETE FROM pairs WHERE analysis_id = ?`).run(id);
    this.db.prepare(`DELETE FROM submissions WHERE analysis_id = ?`).run(id);
    const res = this.db.prepare(`DELETE FROM analyses WHERE id = ?`).run(id);
    return res.changes > 0;
  }

  // --- Submissions Operations ---

  public saveSubmissions(submissions: CodeSubmission[], analysisId: string): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO submissions (
        id, analysis_id, filename, language, content, student_id,
        file_size, line_count, token_count, hash, parse_status, parse_error
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const sub of submissions) {
      stmt.run(
        sub.id,
        analysisId,
        sub.filename,
        sub.language,
        sub.content,
        sub.studentId || null,
        sub.fileSize,
        sub.lineCount,
        sub.tokenCount,
        sub.hash,
        sub.parseStatus,
        sub.parseError || null
      );
    }
  }

  public getSubmissions(analysisId?: string): CodeSubmission[] {
    let rows: any[];
    if (analysisId) {
      rows = this.db.prepare(`SELECT * FROM submissions WHERE analysis_id = ?`).all(analysisId) as any[];
    } else {
      rows = this.db.prepare(`SELECT * FROM submissions`).all() as any[];
    }

    return rows.map(r => ({
      id: r.id,
      filename: r.filename,
      language: r.language,
      content: r.content,
      studentId: r.student_id,
      fileSize: r.file_size,
      lineCount: r.line_count,
      tokenCount: r.token_count,
      hash: r.hash,
      parseStatus: r.parse_status,
      parseError: r.parse_error
    }));
  }

  public getSubmission(id: string): CodeSubmission | null {
    const r = this.db.prepare(`SELECT * FROM submissions WHERE id = ?`).get(id) as any;
    if (!r) return null;
    return {
      id: r.id,
      filename: r.filename,
      language: r.language,
      content: r.content,
      studentId: r.student_id,
      fileSize: r.file_size,
      lineCount: r.line_count,
      tokenCount: r.token_count,
      hash: r.hash,
      parseStatus: r.parse_status,
      parseError: r.parse_error
    };
  }

  // --- Pairwise Results Operations ---

  public savePairs(pairs: PairwiseResult[]): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO pairs (
        id, analysis_id, submission_a_id, submission_b_id,
        submission_a_name, submission_b_name, student_a_id, student_b_id,
        language, overall_score, lexical_score, structural_score, ml_model_score,
        zone, exceeds_threshold, threshold_applied, features_json,
        contributions_json, matched_regions_json, explanation,
        model_used, model_version, is_calibrated, review_status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )
    `);

    for (const p of pairs) {
      stmt.run(
        p.id,
        p.analysisId,
        p.submissionAId,
        p.submissionBId,
        p.submissionAName,
        p.submissionBName,
        p.studentAId || null,
        p.studentBId || null,
        p.language,
        p.overallScore,
        p.lexicalScore,
        p.structuralScore,
        p.mlModelScore,
        p.zone,
        p.exceedsThreshold ? 1 : 0,
        p.thresholdApplied,
        JSON.stringify(p.features),
        JSON.stringify(p.featureContributions),
        JSON.stringify(p.matchedRegions),
        p.explanation,
        p.modelUsed,
        p.modelVersion,
        p.isCalibrated ? 1 : 0,
        p.reviewStatus
      );
    }
  }

  public getPairs(analysisId?: string): PairwiseResult[] {
    let rows: any[];
    if (analysisId) {
      rows = this.db.prepare(`SELECT * FROM pairs WHERE analysis_id = ? ORDER BY overall_score DESC`).all(analysisId) as any[];
    } else {
      rows = this.db.prepare(`SELECT * FROM pairs ORDER BY overall_score DESC`).all() as any[];
    }

    return rows.map(r => ({
      id: r.id,
      analysisId: r.analysis_id,
      submissionAId: r.submission_a_id,
      submissionBId: r.submission_b_id,
      submissionAName: r.submission_a_name,
      submissionBName: r.submission_b_name,
      studentAId: r.student_a_id,
      studentBId: r.student_b_id,
      language: r.language,
      overallScore: r.overall_score,
      lexicalScore: r.lexical_score,
      structuralScore: r.structural_score,
      mlModelScore: r.ml_model_score,
      zone: r.zone,
      exceedsThreshold: Boolean(r.exceeds_threshold),
      thresholdApplied: r.threshold_applied,
      features: JSON.parse(r.features_json),
      featureContributions: JSON.parse(r.contributions_json),
      matchedRegions: JSON.parse(r.matched_regions_json),
      explanation: r.explanation,
      modelUsed: r.model_used,
      modelVersion: r.model_version,
      isCalibrated: Boolean(r.is_calibrated),
      reviewStatus: r.review_status as ReviewStatus
    }));
  }

  public getPair(pairId: string): PairwiseResult | null {
    const r = this.db.prepare(`SELECT * FROM pairs WHERE id = ?`).get(pairId) as any;
    if (!r) return null;
    return {
      id: r.id,
      analysisId: r.analysis_id,
      submissionAId: r.submission_a_id,
      submissionBId: r.submission_b_id,
      submissionAName: r.submission_a_name,
      submissionBName: r.submission_b_name,
      studentAId: r.student_a_id,
      studentBId: r.student_b_id,
      language: r.language,
      overallScore: r.overall_score,
      lexicalScore: r.lexical_score,
      structuralScore: r.structural_score,
      mlModelScore: r.ml_model_score,
      zone: r.zone,
      exceedsThreshold: Boolean(r.exceeds_threshold),
      thresholdApplied: r.threshold_applied,
      features: JSON.parse(r.features_json),
      featureContributions: JSON.parse(r.contributions_json),
      matchedRegions: JSON.parse(r.matched_regions_json),
      explanation: r.explanation,
      modelUsed: r.model_used,
      modelVersion: r.model_version,
      isCalibrated: Boolean(r.is_calibrated),
      reviewStatus: r.review_status as ReviewStatus
    };
  }

  public updatePairReviewStatus(pairId: string, status: ReviewStatus): void {
    this.db.prepare(`UPDATE pairs SET review_status = ? WHERE id = ?`).run(status, pairId);
  }

  // --- Human Review Records ---

  public saveReviewRecord(record: ReviewRecord): void {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO reviews (
        id, pair_id, analysis_id, status, decision_notes,
        reviewer_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      record.id,
      record.pairId,
      record.analysisId,
      record.status,
      record.decisionNotes,
      record.reviewerId,
      record.createdAt,
      record.updatedAt
    );

    // Sync status back to pairs table
    this.updatePairReviewStatus(record.pairId, record.status);
  }

  public getReviews(analysisId?: string): ReviewRecord[] {
    let rows: any[];
    if (analysisId) {
      rows = this.db.prepare(`SELECT * FROM reviews WHERE analysis_id = ? ORDER BY updated_at DESC`).all(analysisId) as any[];
    } else {
      rows = this.db.prepare(`SELECT * FROM reviews ORDER BY updated_at DESC`).all() as any[];
    }

    return rows.map(r => ({
      id: r.id,
      pairId: r.pair_id,
      analysisId: r.analysis_id,
      status: r.status as ReviewStatus,
      decisionNotes: r.decision_notes,
      reviewerId: r.reviewer_id,
      createdAt: r.created_at,
      updatedAt: r.updated_at
    }));
  }

  // --- Summary Metrics for Dashboard ---

  public getGlobalStats(): {
    totalSubmissions: number;
    totalAnalyses: number;
    totalComparisons: number;
    pairsFlaggedForReview: number;
    averageScore: number;
    parsingFailures: number;
  } {
    const subCount = (this.db.prepare(`SELECT COUNT(*) as c FROM submissions`).get() as any).c;
    const anaCount = (this.db.prepare(`SELECT COUNT(*) as c FROM analyses`).get() as any).c;
    const pairCount = (this.db.prepare(`SELECT COUNT(*) as c FROM pairs`).get() as any).c;
    const flaggedCount = (this.db.prepare(`SELECT COUNT(*) as c FROM pairs WHERE exceeds_threshold = 1`).get() as any).c;
    const avgScore = (this.db.prepare(`SELECT AVG(overall_score) as avg FROM pairs`).get() as any).avg || 0;
    const parseErrors = (this.db.prepare(`SELECT COUNT(*) as c FROM submissions WHERE parse_status = 'error'`).get() as any).c;

    return {
      totalSubmissions: subCount,
      totalAnalyses: anaCount,
      totalComparisons: pairCount,
      pairsFlaggedForReview: flaggedCount,
      averageScore: Math.round(avgScore * 10) / 10,
      parsingFailures: parseErrors
    };
  }
}

export const dbInstance = new PlagiarismDatabase();
