import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Search,
  Filter,
  Eye,
  Clock,
  User,
  ShieldAlert,
  FileCode2
} from 'lucide-react';
import { api } from '../services/api';
import { ReviewRecord, ReviewStatus, PairwiseResult } from '../types';

interface ReviewDecisionsPageProps {
  onSelectPair: (pairId: string) => void;
  pairs: PairwiseResult[];
}

export const ReviewDecisionsPage: React.FC<ReviewDecisionsPageProps> = ({
  onSelectPair,
  pairs
}) => {
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadReviews = () => {
    setIsLoading(true);
    api.getReviews()
      .then((res) => {
        setReviews(res);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const pairMap = new Map<string, PairwiseResult>();
  pairs.forEach((p) => pairMap.set(p.id, p));

  const filtered = reviews.filter((r) => {
    const pair = pairMap.get(r.pairId);
    const names = pair ? `${pair.submissionAName} ${pair.submissionBName}` : '';
    const matchesSearch =
      names.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.decisionNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.reviewerId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Human Review Decisions & Audit Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete compliance record of academic instructor integrity determinations and audit notes.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by student, reviewer, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
          >
            <option value="all">All ({reviews.length})</option>
            <option value="potential_plagiarism">Potential Plagiarism</option>
            <option value="reviewed_clean">No Plagiarism (Clean)</option>
            <option value="reviewed_boilerplate">Common Boilerplate</option>
            <option value="requires_investigation">Requires Investigation</option>
            <option value="inconclusive">Inconclusive</option>
          </select>
        </div>
      </div>

      {/* Decisions List */}
      {isLoading ? (
        <div className="p-8 text-center text-xs text-slate-500">
          Loading audit decision records...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-slate-200 p-8 text-center text-xs text-slate-500">
          No review records match the active filter. Open a pair in "Comparison Results" to record a review decision.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((rev) => {
            const pair = pairMap.get(rev.pairId);
            return (
              <div
                key={rev.id}
                className="bg-white rounded-lg border border-slate-200 p-4 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-bold capitalize ${
                      rev.status === 'potential_plagiarism'
                        ? 'bg-rose-100 text-rose-800'
                        : rev.status === 'reviewed_clean'
                        ? 'bg-emerald-100 text-emerald-800'
                        : rev.status === 'requires_investigation'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}>
                      {rev.status.replace('_', ' ')}
                    </span>

                    {pair && (
                      <span className="text-xs font-semibold text-slate-900">
                        {pair.submissionAName} vs {pair.submissionBName} ({pair.overallScore}%)
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{rev.reviewerId}</span>
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(rev.updatedAt).toLocaleDateString()}</span>
                    </span>
                  </div>
                </div>

                {/* Notes */}
                <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">
                  <span className="font-semibold text-slate-900">Instructor Findings: </span>
                  {rev.decisionNotes || 'No contextual notes recorded for this decision.'}
                </div>

                {/* Footer Link to Pair */}
                {pair && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => onSelectPair(pair.id)}
                      className="text-xs font-semibold text-slate-700 hover:text-slate-900 inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect Pair Source Code & Evidence</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
