import React, { useState } from 'react';
import {
  Search,
  ArrowUpDown,
  Filter,
  Eye,
  AlertTriangle,
  FileCode2,
  ExternalLink,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { PairwiseResult, ScoreZone, ReviewStatus } from '../types';
import { ScoreBadge } from '../components/ScoreBadge';

interface ResultsPageProps {
  pairs: PairwiseResult[];
  onSelectPair: (pairId: string) => void;
  reviewThreshold?: number;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  pairs,
  onSelectPair,
  reviewThreshold = 0.78
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState<'all' | ScoreZone>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'python' | 'java'>('all');
  const [sortBy, setSortBy] = useState<'overall' | 'ml' | 'lexical' | 'structural'>('overall');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // Filter
  const filtered = pairs.filter((p) => {
    const matchesSearch =
      p.submissionAName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.submissionBName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.studentAId && p.studentAId.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.studentBId && p.studentBId.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesZone = zoneFilter === 'all' || p.zone === zoneFilter;
    const matchesStatus = statusFilter === 'all' || p.reviewStatus === statusFilter;
    const matchesLang = languageFilter === 'all' || p.language === languageFilter;

    return matchesSearch && matchesZone && matchesStatus && matchesLang;
  });

  // Sort
  filtered.sort((a, b) => {
    let valA = a.overallScore;
    let valB = b.overallScore;
    if (sortBy === 'ml') {
      valA = a.mlModelScore;
      valB = b.mlModelScore;
    } else if (sortBy === 'lexical') {
      valA = a.lexicalScore;
      valB = b.lexicalScore;
    } else if (sortBy === 'structural') {
      valA = a.structuralScore;
      valB = b.structuralScore;
    }

    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const toggleSort = (col: 'overall' | 'ml' | 'lexical' | 'structural') => {
    if (sortBy === col) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(col);
      setSortOrder('desc');
    }
  };

  const flaggedCount = pairs.filter((p) => p.exceedsThreshold).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Pairwise Comparison Results
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluated {pairs.length} code submission pairs against lexical, AST syntax, and calibrated ML models.
          </p>
        </div>

        {flaggedCount > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{flaggedCount} pairs exceed review alert threshold</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 space-y-3 text-xs">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by student ID or filename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Zone Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              onClick={() => setZoneFilter('all')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                zoneFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Zones
            </button>
            <button
              onClick={() => setZoneFilter('red')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                zoneFilter === 'red'
                  ? 'bg-white text-rose-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              High (76–100%)
            </button>
            <button
              onClick={() => setZoneFilter('yellow')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                zoneFilter === 'yellow'
                  ? 'bg-white text-amber-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Moderate (31–75%)
            </button>
            <button
              onClick={() => setZoneFilter('green')}
              className={`px-3 py-1 font-medium rounded-md transition-colors ${
                zoneFilter === 'green'
                  ? 'bg-white text-emerald-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Low (0–30%)
            </button>
          </div>
        </div>

        {/* Secondary filters row */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 text-slate-600">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Language:</span>
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
            >
              <option value="all">All Languages</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">Review Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none"
            >
              <option value="all">All Review States</option>
              <option value="pending">Pending Review</option>
              <option value="potential_plagiarism">Potential Plagiarism</option>
              <option value="reviewed_clean">Clean / Distinct</option>
              <option value="reviewed_boilerplate">Common Boilerplate</option>
              <option value="requires_investigation">Requires Investigation</option>
              <option value="inconclusive">Inconclusive</option>
            </select>
          </div>

          <div className="ml-auto text-slate-400 font-mono text-[11px]">
            Showing {filtered.length} of {pairs.length} pairs
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No comparison pairs match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Submission Pair</th>
                  <th className="py-3 px-4">Language</th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none"
                    onClick={() => toggleSort('overall')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Overall Similarity</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none"
                    onClick={() => toggleSort('ml')}
                  >
                    <div className="flex items-center gap-1">
                      <span>ML Score</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none"
                    onClick={() => toggleSort('lexical')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Lexical</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th
                    className="py-3 px-4 cursor-pointer hover:bg-slate-100 select-none"
                    onClick={() => toggleSort('structural')}
                  >
                    <div className="flex items-center gap-1">
                      <span>Structural</span>
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3 px-4">Review Decision</th>
                  <th className="py-3 px-4 text-right">Evidence Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filtered.map((pair) => (
                  <tr
                    key={pair.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      pair.exceedsThreshold ? 'bg-rose-50/20' : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <FileCode2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-900">
                            {pair.submissionAName} <span className="text-slate-400 font-normal">vs</span> {pair.submissionBName}
                          </div>
                          {(pair.studentAId || pair.studentBId) && (
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {pair.studentAId || 'Unknown'} · {pair.studentBId || 'Unknown'}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 capitalize">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        pair.language === 'python'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {pair.language}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <ScoreBadge score={pair.overallScore} zone={pair.zone} />
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {pair.mlModelScore}%
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {pair.lexicalScore}%
                    </td>

                    <td className="py-3.5 px-4 font-mono tabular-nums text-slate-700">
                      {pair.structuralScore}%
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-medium capitalize ${
                        pair.reviewStatus === 'potential_plagiarism'
                          ? 'bg-rose-100 text-rose-800 font-semibold'
                          : pair.reviewStatus === 'reviewed_clean'
                          ? 'bg-emerald-100 text-emerald-800'
                          : pair.reviewStatus === 'requires_investigation'
                          ? 'bg-amber-100 text-amber-800 font-semibold'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {pair.reviewStatus.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onSelectPair(pair.id)}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors inline-flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Evidence</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
