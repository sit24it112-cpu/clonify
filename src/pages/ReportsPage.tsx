import React, { useState } from 'react';
import {
  FileText,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Layers,
  ExternalLink
} from 'lucide-react';
import { AnalysisSummary, PairwiseResult } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';

interface ReportsPageProps {
  currentAnalysis: (AnalysisSummary & { pairs: PairwiseResult[] }) | null;
  analyses: AnalysisSummary[];
  onSelectAnalysis: (id: string) => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  currentAnalysis,
  analyses,
  onSelectAnalysis
}) => {
  const [selectedAnalysisId, setSelectedAnalysisId] = useState<string>(
    currentAnalysis?.id || (analyses[0]?.id || '')
  );

  const active = analyses.find((a) => a.id === selectedAnalysisId) || currentAnalysis;
  const pairs = currentAnalysis?.pairs || [];

  const handleDownloadJson = () => {
    if (!active) return;
    window.location.href = `/api/reports/${active.id}/json`;
  };

  const handlePrintPdf = () => {
    if (!active) return;
    const printWindow = window.open(`/api/reports/${active.id}/pdf`, '_blank');
    if (printWindow) {
      printWindow.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Audit Reports & Export
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate printable PDF integrity dossiers and machine-readable JSON exports.
          </p>
        </div>

        {active && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadJson}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download JSON Dossier</span>
            </button>

            <button
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Select Analysis Selector */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-800">
          <Layers className="w-4 h-4 text-slate-500" />
          <span>Select Batch for Report:</span>
        </div>

        <select
          value={selectedAnalysisId}
          onChange={(e) => {
            setSelectedAnalysisId(e.target.value);
            onSelectAnalysis(e.target.value);
          }}
          className="w-full sm:w-auto px-3 py-1.5 border border-slate-200 rounded-md bg-slate-50 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-slate-900"
        >
          {analyses.map((a) => (
            <option key={a.id} value={a.id}>
              {a.assignmentName} ({a.batchId}) — {new Date(a.timestamp).toLocaleDateString()}
            </option>
          ))}
        </select>
      </div>

      {active && (
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          {/* Report Document Mockup Preview */}
          <div className="border border-slate-200 rounded-lg p-6 bg-slate-50/50 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase bg-slate-200 px-2 py-0.5 rounded font-bold text-slate-800">
                  OFFICIAL ACADEMIC AUDIT DOSSIER
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-2">
                  {active.assignmentName}
                </h2>
                <p className="text-xs text-slate-500">
                  Batch: {active.batchId} · Generated: {new Date(active.timestamp).toLocaleString()}
                </p>
              </div>

              <div className="text-right text-xs">
                <div className="font-bold text-slate-900 font-mono">Clonify Engine v2.4</div>
                <div className="text-slate-500">Calibrated ML + AST Syntax</div>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white p-4 rounded-lg border border-slate-200">
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Submissions</div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {active.submissionCount} files
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Pairs Analyzed</div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {active.pairsAnalyzedCount} pairs
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Flagged for Review</div>
                <div className="text-base font-bold font-mono text-rose-600">
                  {active.flaggedPairsCount} pairs
                </div>
              </div>
              <div>
                <div className="text-[10px] text-slate-400 uppercase font-bold">Review Threshold</div>
                <div className="text-base font-bold font-mono text-slate-900">
                  {Math.round(active.reviewThreshold * 100)}%
                </div>
              </div>
            </div>

            {/* High Similarity Table Preview */}
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide mb-2">
                Pairwise Comparison Summary
              </h3>

              <div className="overflow-x-auto bg-white rounded-lg border border-slate-200">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-semibold">
                    <tr>
                      <th className="py-2.5 px-3">Pair</th>
                      <th className="py-2.5 px-3">Language</th>
                      <th className="py-2.5 px-3">Overall Similarity</th>
                      <th className="py-2.5 px-3">ML Score</th>
                      <th className="py-2.5 px-3">Lexical</th>
                      <th className="py-2.5 px-3">Structural</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pairs.slice(0, 5).map((p) => (
                      <tr key={p.id}>
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          {p.submissionAName} vs {p.submissionBName}
                        </td>
                        <td className="py-2.5 px-3 capitalize">{p.language}</td>
                        <td className="py-2.5 px-3">
                          <ScoreBadge score={p.overallScore} zone={p.zone} size="sm" />
                        </td>
                        <td className="py-2.5 px-3 font-mono">{p.mlModelScore}%</td>
                        <td className="py-2.5 px-3 font-mono">{p.lexicalScore}%</td>
                        <td className="py-2.5 px-3 font-mono">{p.structuralScore}%</td>
                        <td className="py-2.5 px-3 capitalize text-[11px] text-slate-600">
                          {p.reviewStatus.replace('_', ' ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer in PDF Box */}
            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-[11px] text-amber-900 leading-relaxed">
              <strong>Mandatory Compliance Notice:</strong> This audit report compiles comparative similarity metrics. High pattern alignment warrants instructor review of student background, assignment instructions, and shared templates. Do not apply disciplinary measures solely based on automated output.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
