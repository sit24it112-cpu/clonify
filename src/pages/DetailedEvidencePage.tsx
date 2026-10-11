import React, { useState, useEffect } from 'react';
import {
  FileCode2,
  GitCompare,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sliders,
  Sparkles,
  Layers,
  Save,
  ShieldAlert
} from 'lucide-react';
import { api } from '../services/api';
import { PairwiseResult, CodeSubmission, ReviewStatus } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';

interface DetailedEvidencePageProps {
  pairId: string | null;
  onBack: () => void;
  onReviewUpdated?: () => void;
}

export const DetailedEvidencePage: React.FC<DetailedEvidencePageProps> = ({
  pairId,
  onBack,
  onReviewUpdated
}) => {
  const [data, setData] = useState<{
    pair: PairwiseResult;
    submissionA: CodeSubmission & { cleanLines: string[]; normalizedString: string };
    submissionB: CodeSubmission & { cleanLines: string[]; normalizedString: string };
    matchedRegions: any[];
    contributions: any[];
    explanation: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View modes
  const [viewMode, setViewMode] = useState<'original' | 'normalized' | 'clean' | 'features'>('original');

  // Review decision form
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>('pending');
  const [decisionNotes, setDecisionNotes] = useState('');
  const [reviewerName, setReviewerName] = useState('Prof. Academic Reviewer');
  const [isSavingReview, setIsSavingReview] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!pairId) return;
    setIsLoading(true);
    setError(null);
    setSaveSuccess(false);

    api.getPairEvidence(pairId)
      .then((res) => {
        setData(res);
        setReviewStatus(res.pair.reviewStatus || 'pending');
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Failed to load evidence for this pair.');
        setIsLoading(false);
      });
  }, [pairId]);

  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;

    try {
      setIsSavingReview(true);
      await api.saveReview({
        pairId: data.pair.id,
        analysisId: data.pair.analysisId,
        status: reviewStatus,
        decisionNotes,
        reviewerId: reviewerName
      });

      setIsSavingReview(false);
      setSaveSuccess(true);
      if (onReviewUpdated) onReviewUpdated();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setIsSavingReview(false);
      alert(err.message || 'Failed to save review decision');
    }
  };

  if (isLoading) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading pairwise comparison syntax evidence and token representations...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 bg-white rounded-lg border border-slate-200 text-center space-y-3">
        <div className="text-sm font-semibold text-rose-600">
          {error || 'No comparison pair selected.'}
        </div>
        <button
          onClick={onBack}
          className="px-3 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg"
        >
          Return to Results
        </button>
      </div>
    );
  }

  const { pair, submissionA, submissionB, matchedRegions, contributions, explanation } = data;

  // Determine lines to render based on viewMode
  let linesA = submissionA.content.split('\n');
  let linesB = submissionB.content.split('\n');

  if (viewMode === 'clean' && submissionA.cleanLines) {
    linesA = submissionA.cleanLines;
    linesB = submissionB.cleanLines;
  }

  // Matching lines sets for visual highlight
  const highlightedLinesA = new Set<number>();
  const highlightedLinesB = new Set<number>();

  matchedRegions.forEach((r) => {
    for (let l = r.startLineA; l <= r.endLineA; l++) highlightedLinesA.add(l);
    for (let l = r.startLineB; l <= r.endLineB; l++) highlightedLinesB.add(l);
  });

  return (
    <div className="space-y-6">
      {/* Top Bar with Back Button & Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
            title="Back to list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">
                {pair.submissionAName} <span className="text-slate-400 font-normal">vs</span> {pair.submissionBName}
              </h1>
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                pair.language === 'python' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {pair.language}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed comparative analysis · {matchedRegions.length} matched code segments identified.
            </p>
          </div>
        </div>

        {/* Score Cluster */}
        <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-slate-200 shrink-0">
          <div className="text-right">
            <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Overall Score
            </div>
            <ScoreBadge score={pair.overallScore} zone={pair.zone} size="lg" showZoneLabel />
          </div>

          <div className="h-8 w-px bg-slate-200" />

          <div className="flex gap-4 text-xs font-mono tabular-nums text-slate-600">
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-sans">ML Score</div>
              <div className="font-semibold text-slate-900">{pair.mlModelScore}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-sans">Lexical</div>
              <div className="font-semibold text-slate-900">{pair.lexicalScore}%</div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-sans">AST Syntax</div>
              <div className="font-semibold text-slate-900">{pair.structuralScore}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Explanation Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-xs text-slate-700 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-slate-900">Model Synthesis Explanation</div>
          <p className="leading-relaxed text-slate-600">{explanation}</p>
        </div>
      </div>

      {/* View Mode Tabs Toolbar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setViewMode('original')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              viewMode === 'original'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Original Code Highlights
          </button>
          <button
            onClick={() => setViewMode('normalized')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              viewMode === 'normalized'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Normalized Identifiers
          </button>
          <button
            onClick={() => setViewMode('clean')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              viewMode === 'clean'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clean Stripped Code
          </button>
          <button
            onClick={() => setViewMode('features')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              viewMode === 'features'
                ? 'bg-white text-slate-900 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Feature Breakdown Chart
          </button>
        </div>

        <div className="text-[11px] text-slate-500 font-mono">
          {viewMode === 'normalized'
            ? 'Variables mapped to ID_1, ID_2 to reveal structure'
            : viewMode === 'clean'
            ? 'Comments & decorative whitespace stripped'
            : `${matchedRegions.length} matched sequences highlighted`}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'features' ? (
        /* Feature Contribution Breakdown View */
        <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6">
          <div>
            <h2 className="text-base font-bold text-slate-900">Feature Contribution Attribution</h2>
            <p className="text-xs text-slate-500 mt-1">
              Relative mathematical impact of lexical, syntactic, and structural features on the {pair.modelUsed} prediction.
            </p>
          </div>

          <div className="space-y-4">
            {contributions.map((c, idx) => {
              const percentage = Math.round(c.value * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-800">
                    <span>{c.label}</span>
                    <span className="font-mono tabular-nums">{percentage}% (Weight: {c.weight})</span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className={`h-full rounded-full ${
                        percentage >= 75 ? 'bg-rose-500' : percentage >= 40 ? 'bg-amber-500' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                  <div className="text-[11px] text-slate-400">{c.description}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : viewMode === 'normalized' ? (
        /* Normalized Identifier Comparison */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 font-mono">
              {submissionA.filename} — Normalized Form
            </div>
            <div className="p-4 font-mono text-xs bg-slate-900 text-slate-100 overflow-x-auto max-h-[600px] leading-relaxed">
              <pre className="whitespace-pre-wrap">{submissionA.normalizedString}</pre>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 font-mono">
              {submissionB.filename} — Normalized Form
            </div>
            <div className="p-4 font-mono text-xs bg-slate-900 text-slate-100 overflow-x-auto max-h-[600px] leading-relaxed">
              <pre className="whitespace-pre-wrap">{submissionB.normalizedString}</pre>
            </div>
          </div>
        </div>
      ) : (
        /* Side-by-Side Dual Source Code Viewer with Line Highlights */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submission A */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-900 font-mono truncate">
                File A: {submissionA.filename}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {linesA.length} lines
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px] font-mono text-xs bg-slate-900 text-slate-100 p-2 leading-relaxed">
              <pre>
                {linesA.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isMatch = highlightedLinesA.has(lineNum);
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isMatch ? 'bg-amber-500/20 text-amber-200 font-medium' : ''
                      }`}
                    >
                      <span className="w-10 text-slate-500 select-none text-right pr-3 shrink-0">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre-wrap">{line || ' '}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>

          {/* Submission B */}
          <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="font-semibold text-xs text-slate-900 font-mono truncate">
                File B: {submissionB.filename}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                {linesB.length} lines
              </span>
            </div>

            <div className="overflow-x-auto overflow-y-auto max-h-[600px] font-mono text-xs bg-slate-900 text-slate-100 p-2 leading-relaxed">
              <pre>
                {linesB.map((line, idx) => {
                  const lineNum = idx + 1;
                  const isMatch = highlightedLinesB.has(lineNum);
                  return (
                    <div
                      key={idx}
                      className={`flex ${
                        isMatch ? 'bg-amber-500/20 text-amber-200 font-medium' : ''
                      }`}
                    >
                      <span className="w-10 text-slate-500 select-none text-right pr-3 shrink-0">
                        {lineNum}
                      </span>
                      <span className="whitespace-pre-wrap">{line || ' '}</span>
                    </div>
                  );
                })}
              </pre>
            </div>
          </div>
        </div>
      )}

      {/* Matched Regions Evidence List */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900">
            Detected Matched Code Segments ({matchedRegions.length})
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {matchedRegions.filter((m) => m.matchType === 'exact').length} exact · {matchedRegions.filter((m) => m.matchType === 'normalized').length} normalized
          </span>
        </div>

        {matchedRegions.length === 0 ? (
          <div className="p-4 rounded-lg bg-slate-50 text-xs text-slate-500 text-center">
            No contiguous matching token blocks above threshold length were found.
          </div>
        ) : (
          <div className="space-y-3">
            {matchedRegions.map((region, idx) => (
              <div
                key={region.id || idx}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <span className="font-mono text-slate-400">#{idx + 1}</span>
                    <span>
                      Lines {region.startLineA}–{region.endLineA} in File A <span className="text-slate-400">↔</span> Lines {region.startLineB}–{region.endLineB} in File B
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                    region.matchType === 'exact'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {region.matchType} Match ({region.tokenCount} tokens)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 font-mono text-[11px] bg-slate-900 text-slate-200 p-2.5 rounded">
                  <div>
                    <div className="text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-0.5">
                      {submissionA.filename} (L{region.startLineA}–L{region.endLineA})
                    </div>
                    <pre className="whitespace-pre-wrap overflow-x-auto">{region.snippetA}</pre>
                  </div>
                  <div>
                    <div className="text-slate-400 font-semibold mb-1 border-b border-slate-800 pb-0.5">
                      {submissionB.filename} (L{region.startLineB}–L{region.endLineB})
                    </div>
                    <pre className="whitespace-pre-wrap overflow-x-auto">{region.snippetB}</pre>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Human Review Decision Panel */}
      <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-900" />
            <h2 className="text-sm font-bold text-slate-900">Human Review Decision & Audit Trail</h2>
          </div>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Decision Saved to Database</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveReview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Instructor Decision Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value as ReviewStatus)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="pending">Pending Evaluation</option>
                <option value="reviewed_clean">No Plagiarism Identified (Independent Logic)</option>
                <option value="reviewed_boilerplate">Common Boilerplate / Assignment Template</option>
                <option value="potential_plagiarism">Potential Plagiarism (Flagged for Honesty Hearing)</option>
                <option value="requires_investigation">Requires Additional Investigation</option>
                <option value="inconclusive">Inconclusive Evidence</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewer Name / Identification
              </label>
              <input
                type="text"
                value={reviewerName}
                onChange={(e) => setReviewerName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="e.g. Dr. Jane Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Decision Notes & Contextual Findings
            </label>
            <textarea
              rows={3}
              value={decisionNotes}
              onChange={(e) => setDecisionNotes(e.target.value)}
              placeholder="Explain context: did students share templates? Are variable renames systematic? Note any student interviews or mitigating factors..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 leading-relaxed"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-slate-500 italic">
              Decisions are logged to the persistent audit trail with timestamps.
            </p>
            <button
              type="submit"
              disabled={isSavingReview}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSavingReview ? 'Saving Decision...' : 'Save Review Decision'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
