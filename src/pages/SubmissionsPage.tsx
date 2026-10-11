import React, { useState } from 'react';
import {
  FileCode2,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle,
  Hash,
  Download
} from 'lucide-react';
import { CodeSubmission } from '../types';

interface SubmissionsPageProps {
  submissions: CodeSubmission[];
  batchId?: string;
}

export const SubmissionsPage: React.FC<SubmissionsPageProps> = ({ submissions, batchId }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'python' | 'java'>('all');
  const [selectedSubmission, setSelectedSubmission] = useState<CodeSubmission | null>(null);

  const filtered = submissions.filter((s) => {
    const matchesSearch =
      s.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.studentId && s.studentId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesLang = languageFilter === 'all' || s.language === languageFilter;
    return matchesSearch && matchesLang;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Source Submissions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Program source files ingested and preprocessed for similarity extraction {batchId ? `in batch ${batchId}` : ''}.
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by filename or student ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
          />
        </div>

        {/* Segmented Filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
          <button
            onClick={() => setLanguageFilter('all')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              languageFilter === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({submissions.length})
          </button>
          <button
            onClick={() => setLanguageFilter('python')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              languageFilter === 'python'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Python ({submissions.filter((s) => s.language === 'python').length})
          </button>
          <button
            onClick={() => setLanguageFilter('java')}
            className={`px-3 py-1 font-medium rounded-md transition-colors ${
              languageFilter === 'java'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Java ({submissions.filter((s) => s.language === 'java').length})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No submissions match the active search or filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Filename</th>
                  <th className="py-2.5 px-4">Student ID</th>
                  <th className="py-2.5 px-4">Language</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Lines</th>
                  <th className="py-2.5 px-4">Tokens</th>
                  <th className="py-2.5 px-4">SHA-256 Hash</th>
                  <th className="py-2.5 px-4">Parse Status</th>
                  <th className="py-2.5 px-4 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filtered.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-slate-400" />
                      <span>{sub.filename}</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {sub.studentId || 'Anonymous'}
                    </td>
                    <td className="py-3 px-4 capitalize">
                      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${
                        sub.language === 'python'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sub.language}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {(sub.fileSize / 1024).toFixed(1)} KB
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {sub.lineCount}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-slate-600">
                      {sub.tokenCount}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 truncate max-w-xs" title={sub.hash}>
                      {sub.hash ? `${sub.hash.slice(0, 12)}...` : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {sub.parseStatus === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-medium text-[11px]">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Valid</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-amber-700 font-medium text-[11px]">
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Warning</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedSubmission(sub)}
                        className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Source</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Source Code Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {selectedSubmission.filename}
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                  {selectedSubmission.language}
                </span>
                {selectedSubmission.studentId && (
                  <span className="text-xs text-slate-500 font-mono">
                    ({selectedSubmission.studentId})
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs bg-slate-900 text-slate-100 leading-relaxed select-text">
              <pre>
                {selectedSubmission.content.split('\n').map((line, idx) => (
                  <div key={idx} className="flex">
                    <span className="w-10 text-slate-500 select-none text-right pr-4 shrink-0">
                      {idx + 1}
                    </span>
                    <span className="whitespace-pre-wrap">{line}</span>
                  </div>
                ))}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
