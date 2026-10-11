import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileCode2,
  Trash2,
  Sliders,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  FileText,
  Eye,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { SAMPLE_PYTHON_ALICE, SAMPLE_PYTHON_BOB, SAMPLE_PYTHON_CHARLIE, SAMPLE_JAVA_EVAN, SAMPLE_JAVA_FIONA } from '../data/sampleCodes';

interface NewAnalysisPageProps {
  onAnalysisComplete: (analysisId: string) => void;
}

interface UploadedFileItem {
  filename: string;
  content: string;
  studentId?: string;
  size: number;
  language: 'python' | 'java';
}

export const NewAnalysisPage: React.FC<NewAnalysisPageProps> = ({ onAnalysisComplete }) => {
  const [assignmentName, setAssignmentName] = useState('Laboratory Assignment: Algorithms & Logic');
  const [batchId, setBatchId] = useState(`BATCH-${Date.now().toString(36).toUpperCase()}`);
  const [courseName, setCourseName] = useState('CS204 Data Structures & Algorithmic Problem Solving');
  const [reviewerNotes, setReviewerNotes] = useState('Scheduled midterm plagiarism screening and similarity audit.');
  const [threshold, setThreshold] = useState<number>(0.78);
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [previewFile, setPreviewFile] = useState<UploadedFileItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load built-in academic benchmark samples
  const handleLoadSamples = () => {
    const samples: UploadedFileItem[] = [
      {
        filename: 'student1_fib_memo.py',
        content: SAMPLE_PYTHON_ALICE,
        studentId: 'STU-10492',
        size: SAMPLE_PYTHON_ALICE.length,
        language: 'python'
      },
      {
        filename: 'student2_fib_cached.py',
        content: SAMPLE_PYTHON_BOB,
        studentId: 'STU-10493',
        size: SAMPLE_PYTHON_BOB.length,
        language: 'python'
      },
      {
        filename: 'student3_dijkstra.py',
        content: SAMPLE_PYTHON_CHARLIE,
        studentId: 'STU-10512',
        size: SAMPLE_PYTHON_CHARLIE.length,
        language: 'python'
      },
      {
        filename: 'StudentA_BinarySearchTree.java',
        content: SAMPLE_JAVA_EVAN,
        studentId: 'STU-20108',
        size: SAMPLE_JAVA_EVAN.length,
        language: 'java'
      },
      {
        filename: 'StudentB_BSTree.java',
        content: SAMPLE_JAVA_FIONA,
        studentId: 'STU-20109',
        size: SAMPLE_JAVA_FIONA.length,
        language: 'java'
      }
    ];

    setFiles(samples);
    setErrorMessage(null);
  };

  // Handle file input
  const processFiles = (fileList: FileList) => {
    setErrorMessage(null);
    const newItems: UploadedFileItem[] = [];

    Array.from(fileList).forEach((file) => {
      const lower = file.name.toLowerCase();
      let lang: 'python' | 'java' | null = null;
      if (lower.endsWith('.py')) lang = 'python';
      else if (lower.endsWith('.java')) lang = 'java';

      if (!lang) {
        setErrorMessage(`Skipped unsupported file: "${file.name}". Only .py and .java files are supported.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (text) {
          setFiles((prev) => {
            // Avoid duplicate filenames
            const filtered = prev.filter((f) => f.filename !== file.name);
            return [
              ...filtered,
              {
                filename: file.name,
                content: text,
                size: file.size,
                language: lang!
              }
            ];
          });
        }
      };
      reader.readAsText(file);
    });
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    if (previewFile && files[index]?.filename === previewFile.filename) {
      setPreviewFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (files.length < 2) {
      setErrorMessage('Please upload at least 2 source code files to perform similarity comparison.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.runAnalysis({
        assignmentName,
        batchId,
        courseName,
        reviewerNotes,
        reviewThreshold: threshold,
        submissions: files.map((f) => ({
          filename: f.filename,
          content: f.content,
          studentId: f.studentId
        }))
      });

      setIsSubmitting(false);
      onAnalysisComplete(res.analysis.id);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Failed to analyze submissions.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          New Similarity Analysis
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Upload student submissions (.py or .java), set threshold, and extract multi-layered similarity evidence.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1 & 2 in Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Metadata configuration */}
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Assignment Parameters</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Assignment / Lab Name
              </label>
              <input
                type="text"
                required
                value={assignmentName}
                onChange={(e) => setAssignmentName(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent"
                placeholder="e.g. Lab 4: Dynamic Programming"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Identifier
                </label>
                <input
                  type="text"
                  required
                  value={batchId}
                  onChange={(e) => setBatchId(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Course / Class
                </label>
                <input
                  type="text"
                  value={courseName}
                  onChange={(e) => setCourseName(e.target.value)}
                  className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                  placeholder="e.g. CS101"
                />
              </div>
            </div>

            {/* Threshold Slider */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700">
                  Review Alert Threshold
                </label>
                <span className="font-mono tabular-nums text-xs font-bold text-slate-900">
                  {Math.round(threshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.40"
                max="0.95"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
                <span>40% (Strict)</span>
                <span className="text-slate-600 font-semibold">78% (Recommended)</span>
                <span>95% (Lenient)</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                Pairs with similarity at or above this threshold will be flagged for mandatory human instructor review.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Reviewer Context Notes (Optional)
              </label>
              <textarea
                rows={2}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="Notes for the audit log..."
              />
            </div>
          </div>

          {/* File Upload Zone */}
          <div className="lg:col-span-2 bg-white p-5 rounded-lg border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide">
                <FileCode2 className="w-4 h-4 text-slate-500" />
                <span>Upload Source Files (.py & .java)</span>
              </div>
              <button
                type="button"
                onClick={handleLoadSamples}
                className="inline-flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors font-medium"
              >
                <Sparkles className="w-3.5 h-3.5 text-slate-600" />
                <span>Populate Demo Files</span>
              </button>
            </div>

            {/* Drag & Drop Area */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                dragActive
                  ? 'border-slate-900 bg-slate-50'
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".py,.java"
                onChange={(e) => e.target.files && processFiles(e.target.files)}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                Click to browse or drag and drop source files
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Supports multiple Python (.py) and Java (.java) source files
              </div>
            </div>

            {/* Uploaded Files Table */}
            <div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
                <span>Selected Submissions ({files.length})</span>
                {files.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-[11px] text-rose-600 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {files.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-50 border border-slate-100 text-center text-xs text-slate-400">
                  No files selected. Add files or click "Populate Demo Files" to test immediately.
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 hover:bg-slate-50 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-semibold ${
                          file.language === 'python'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {file.language}
                        </span>
                        <span className="font-medium text-slate-900 truncate">
                          {file.filename}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono tabular-nums">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewFile(file)}
                          className="p-1 text-slate-400 hover:text-slate-700"
                          title="Preview Code"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600"
                          title="Remove File"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Action */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500 font-mono">
                {files.length >= 2 ? (
                  <span>
                    Will evaluate ~{(files.length * (files.length - 1)) / 2} pairwise combinations
                  </span>
                ) : (
                  <span>Need at least 2 files to analyze</span>
                )}
              </div>

              <button
                type="submit"
                disabled={files.length < 2 || isSubmitting}
                className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isSubmitting ? 'Extracting Features & Running ML...' : 'Start Code Similarity Analysis'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Code Preview Drawer / Modal */}
      {previewFile && (
        <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-300 shadow-xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {previewFile.filename}
                </span>
                <span className="text-[10px] font-mono uppercase bg-slate-200 px-1.5 py-0.5 rounded font-semibold text-slate-700">
                  {previewFile.language}
                </span>
              </div>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-xs font-semibold text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs bg-slate-900 text-slate-100 leading-relaxed select-text">
              <pre>
                {previewFile.content.split('\n').map((line, idx) => (
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
