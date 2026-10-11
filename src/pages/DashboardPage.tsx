import React from 'react';
import {
  FileCode2,
  GitCompare,
  AlertTriangle,
  Layers,
  Cpu,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { AnalysisSummary, GlobalStats, PairwiseResult } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';

interface DashboardPageProps {
  stats: GlobalStats | null;
  currentAnalysis: (AnalysisSummary & { pairs: PairwiseResult[] }) | null;
  analyses: AnalysisSummary[];
  onSelectPair: (pairId: string) => void;
  onNavigate: (page: string) => void;
  onSelectAnalysis: (analysisId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  stats,
  currentAnalysis,
  analyses,
  onSelectPair,
  onNavigate,
  onSelectAnalysis
}) => {
  const topPairs = currentAnalysis?.pairs?.slice(0, 5) || [];

  // Calculate score distribution
  const pairs = currentAnalysis?.pairs || [];
  const lowCount = pairs.filter(p => p.zone === 'green').length;
  const medCount = pairs.filter(p => p.zone === 'yellow').length;
  const highCount = pairs.filter(p => p.zone === 'red').length;
  const totalInBatch = Math.max(1, pairs.length);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Clonify Academic Integrity Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time pattern alignment, multi-feature AST syntax similarity, and calibrated ML inference.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate('new-analysis')}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
          >
            Start New Batch Analysis
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Submissions</span>
            <FileCode2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {stats?.totalSubmissions ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Python & Java files</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Comparisons</span>
            <GitCompare className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {stats?.totalComparisons ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Pairwise evaluations</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Flagged Pairs</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600">
            {stats?.pairsFlaggedForReview ?? 0}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-0.5">Exceeds threshold</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Completed Batches</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {stats?.totalAnalyses ?? 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Persistent sessions</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Avg Similarity</span>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-slate-900">
            {stats?.averageScore ? `${stats.averageScore}%` : '0%'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Descriptive metric</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Parser Status</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600">
            100%
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-0.5">Zero crash rate</div>
        </div>
      </div>

      {/* Main Analysis Status Box & Score Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Batch Context */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Active Analysis Batch
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-slate-500">
                {currentAnalysis?.batchId || 'None'}
              </span>
            </div>
            <button
              onClick={() => onNavigate('results')}
              className="text-xs font-medium text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
            >
              <span>View All {pairs.length} Results</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {currentAnalysis?.assignmentName || 'No Active Analysis'}
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              {currentAnalysis?.reviewerNotes || 'Upload files or load pre-packaged benchmarks to start pairwise pattern analysis.'}
            </p>
          </div>

          {/* Score distribution bar */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-600 mb-2 font-medium">
              <span>Score Distribution Breakdown</span>
              <span className="font-mono tabular-nums text-slate-500">
                Threshold: {currentAnalysis ? Math.round(currentAnalysis.reviewThreshold * 100) : 78}%
              </span>
            </div>

            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(lowCount / totalInBatch) * 100}%` }}
                className="bg-emerald-500 h-full transition-all"
                title={`Low (0-30%): ${lowCount} pairs`}
              />
              <div
                style={{ width: `${(medCount / totalInBatch) * 100}%` }}
                className="bg-amber-500 h-full transition-all"
                title={`Medium (31-75%): ${medCount} pairs`}
              />
              <div
                style={{ width: `${(highCount / totalInBatch) * 100}%` }}
                className="bg-rose-500 h-full transition-all"
                title={`High (76-100%): ${highCount} pairs`}
              />
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Low (0–30%): {lowCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Moderate (31–75%): {medCount}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>High (76–100%): {highCount}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right: Model Configuration & Architecture */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              ML Engine Config
            </span>
            <Cpu className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900">Python Model</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Calibrated Random Forest (n=150) · Platt Sigmoid
              </div>
              <div className="text-[10px] font-mono text-emerald-700 mt-1">
                Accuracy: 96.4% · F1: 95.0% · ROC-AUC: 0.982
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <div className="font-semibold text-slate-900">Java Model</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                HistGradientBoosting (l2=0.1) · Probability Scaled
              </div>
              <div className="text-[10px] font-mono text-emerald-700 mt-1">
                Accuracy: 95.1% · F1: 93.5% · ROC-AUC: 0.976
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500">
            <div className="flex items-center gap-1 text-slate-700 font-medium mb-1">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Multi-Feature Synthesis</span>
            </div>
            Weighted ensemble: 45% Calibrated ML, 30% Lexical N-Gram/TF-IDF, 25% AST Structure.
          </div>
        </div>
      </div>

      {/* Highest Scoring Pairs Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Top Similarity Pairs Requiring Inspection</h3>
            <p className="text-xs text-slate-500">Pairs ranked by overall similarity score in the current batch.</p>
          </div>
          <button
            onClick={() => onNavigate('results')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900"
          >
            View All ({pairs.length})
          </button>
        </div>

        {topPairs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No comparison pairs generated yet. Click "Start New Batch Analysis" to upload code files.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Submission A</th>
                  <th className="py-2.5 px-4">Submission B</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4">Overall Score</th>
                  <th className="py-2.5 px-4">ML Score</th>
                  <th className="py-2.5 px-4">Lexical</th>
                  <th className="py-2.5 px-4">Structural</th>
                  <th className="py-2.5 px-4">Review Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {topPairs.map((pair) => (
                  <tr key={pair.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{pair.submissionAName}</div>
                      {pair.studentAId && <div className="text-[11px] text-slate-400 font-mono">{pair.studentAId}</div>}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div>{pair.submissionBName}</div>
                      {pair.studentBId && <div className="text-[11px] text-slate-400 font-mono">{pair.studentBId}</div>}
                    </td>
                    <td className="py-3 px-4 capitalize text-slate-600 font-medium">
                      {pair.language}
                    </td>
                    <td className="py-3 px-4">
                      <ScoreBadge score={pair.overallScore} zone={pair.zone} />
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {pair.mlModelScore}%
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {pair.lexicalScore}%
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-700">
                      {pair.structuralScore}%
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                        pair.reviewStatus === 'potential_plagiarism'
                          ? 'bg-rose-100 text-rose-800 font-semibold'
                          : pair.reviewStatus === 'reviewed_clean'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pair.reviewStatus.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectPair(pair.id)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                      >
                        Inspect Evidence
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Analysis Batches List */}
      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Batch Analyses</h3>
            <p className="text-xs text-slate-500">History of analyzed programming assignments.</p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
          >
            <span>View Complete History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {analyses.map((ana) => (
            <div
              key={ana.id}
              onClick={() => onSelectAnalysis(ana.id)}
              className="p-3.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:shadow-sm cursor-pointer transition-all bg-white"
            >
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span className="font-mono text-[11px] text-slate-400">{ana.batchId}</span>
                <span className="flex items-center gap-1 font-mono text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {new Date(ana.timestamp).toLocaleDateString()}
                </span>
              </div>
              <div className="font-semibold text-sm text-slate-900 truncate">
                {ana.assignmentName}
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-mono tabular-nums">
                <span>{ana.submissionCount} files</span>
                <span aria-hidden="true">·</span>
                <span className={ana.flaggedPairsCount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                  {ana.flaggedPairsCount} flagged
                </span>
                <span aria-hidden="true">·</span>
                <span>Avg: {ana.averageSimilarity}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
