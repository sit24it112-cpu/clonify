import React, { useState } from 'react';
import {
  History,
  Trash2,
  ExternalLink,
  Download,
  Printer,
  Calendar,
  Layers,
  FileCode2,
  AlertTriangle
} from 'lucide-react';
import { AnalysisSummary } from '../types';

interface HistoryPageProps {
  analyses: AnalysisSummary[];
  currentAnalysisId: string | null;
  onSelectAnalysis: (id: string) => void;
  onDeleteAnalysis: (id: string) => void;
  onNavigate: (page: string) => void;
}

export const HistoryPage: React.FC<HistoryPageProps> = ({
  analyses,
  currentAnalysisId,
  onSelectAnalysis,
  onDeleteAnalysis,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = analyses.filter(
    (a) =>
      a.assignmentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.courseName && a.courseName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Analysis Batch History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Persistent archive of previous code similarity evaluations stored in local SQLite database.
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200">
        <input
          type="text"
          placeholder="Filter batches by assignment name, batch ID, or course..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
        />
      </div>

      {/* History Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
          No analysis batches found. Run a new analysis to populate history.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const isCurrent = item.id === currentAnalysisId;
            return (
              <div
                key={item.id}
                className={`bg-white rounded-lg border p-4 transition-all ${
                  isCurrent
                    ? 'border-slate-900 shadow-sm ring-1 ring-slate-900'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-400">
                        {item.batchId}
                      </span>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                          Active Batch
                        </span>
                      )}
                      <span className="text-xs text-slate-400">·</span>
                      <span className="text-xs text-slate-500">
                        {new Date(item.timestamp).toLocaleString()}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900">
                      {item.assignmentName}
                    </h3>

                    {item.courseName && (
                      <div className="text-xs text-slate-500">{item.courseName}</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => {
                        onSelectAnalysis(item.id);
                        onNavigate('dashboard');
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                    >
                      Open in Dashboard
                    </button>

                    <a
                      href={`/api/reports/${item.id}/json`}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                      title="Download JSON"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>JSON</span>
                    </a>

                    <button
                      onClick={() => window.open(`/api/reports/${item.id}/pdf`, '_blank')}
                      className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-md transition-colors inline-flex items-center gap-1"
                      title="Print / View PDF"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm(`Delete analysis "${item.assignmentName}" (${item.batchId}) and all pairs?`)) {
                          onDeleteAnalysis(item.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-md transition-colors"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics Row */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-600 tabular-nums">
                  <span className="flex items-center gap-1">
                    <FileCode2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>{item.submissionCount} submissions</span>
                  </span>
                  <span>·</span>
                  <span>{item.pairsAnalyzedCount} pairs analyzed</span>
                  <span>·</span>
                  <span className={item.flaggedPairsCount > 0 ? 'text-rose-600 font-bold' : ''}>
                    {item.flaggedPairsCount} flagged for review
                  </span>
                  <span>·</span>
                  <span>Threshold: {Math.round(item.reviewThreshold * 100)}%</span>
                  <span>·</span>
                  <span>Avg: {item.averageSimilarity}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
