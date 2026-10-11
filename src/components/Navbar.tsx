import React from 'react';
import { ShieldCheck, Plus, Database, Sparkles, BookOpen } from 'lucide-react';
import { AnalysisSummary } from '../types';
import { ClonifyLogo } from './ClonifyLogo';

interface NavbarProps {
  currentAnalysis: AnalysisSummary | null;
  onNavigate: (page: string) => void;
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentAnalysis,
  onNavigate,
  onLoadSamples,
  isLoadingSamples
}) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white sticky top-0 z-30 px-6 flex items-center justify-between gap-8">
      {/* Zone 1: Brand Zone */}
      <button
        onClick={() => onNavigate('dashboard')}
        className="flex items-center text-left hover:opacity-90 transition-opacity"
      >
        <ClonifyLogo size="md" />
      </button>

      {/* Zone 2: Context Navigation / Breadcrumb */}
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-600 truncate">
        {currentAnalysis ? (
          <>
            <span className="font-semibold text-slate-900 truncate">
              {currentAnalysis.assignmentName}
            </span>
            <span aria-hidden="true" className="text-slate-300">/</span>
            <span className="font-mono text-slate-500">{currentAnalysis.batchId}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-500">
              {currentAnalysis.submissionCount} files
            </span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span className="font-mono tabular-nums text-slate-500">
              Threshold: {Math.round(currentAnalysis.reviewThreshold * 100)}%
            </span>
          </>
        ) : (
          <span className="text-slate-400">Ready for Code Analysis Batch</span>
        )}
      </div>

      {/* Zone 3: Primary Action Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onLoadSamples}
          disabled={isLoadingSamples}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition-colors whitespace-nowrap disabled:opacity-50"
          title="Reload pre-verified Python & Java academic comparison benchmarks"
        >
          <Database className="w-3.5 h-3.5 text-slate-600" />
          <span>{isLoadingSamples ? 'Loading...' : 'Load Sample Benchmarks'}</span>
        </button>

        <button
          onClick={() => onNavigate('new-analysis')}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>New Analysis</span>
        </button>
      </div>
    </header>
  );
};
