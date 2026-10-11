import React, { useState } from 'react';
import {
  Sliders,
  ShieldCheck,
  Cpu,
  Database,
  Lock,
  Sparkles,
  Info,
  CheckCircle2
} from 'lucide-react';

interface SettingsPageProps {
  onLoadSamples: () => void;
  isLoadingSamples: boolean;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onLoadSamples,
  isLoadingSamples
}) => {
  const [defaultThreshold, setDefaultThreshold] = useState(0.78);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSaveDefaults = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Engine Settings & Methodology Documentation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review mathematical scoring formulas, feature weights, privacy guarantees, and system diagnostics.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mathematical Methodology Documentation */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            <Info className="w-4 h-4 text-slate-500" />
            <span>Similarity Scoring Formulation</span>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <p>
              The Clonify engine utilizes an ensemble scoring mechanism that combines machine learning probabilities with deterministic lexical and syntactic features:
            </p>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs text-slate-900 space-y-1">
              <div className="text-slate-400 font-semibold">// Composite Scoring Formula</div>
              <div>Score = 0.45 × ML_Calibrated + 0.30 × Lexical + 0.25 × Structural</div>
            </div>

            <div className="space-y-2 pt-2">
              <div className="font-semibold text-slate-900">Feature Definitions:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600">
                <li><strong className="text-slate-900">Token N-Gram Jaccard:</strong> Measures 3-gram sequence overlap after comment stripping.</li>
                <li><strong className="text-slate-900">Identifier Normalization:</strong> Maps variable/function identifiers to positional tokens (ID_1, ID_2) to neutralize superficial variable renaming.</li>
                <li><strong className="text-slate-900">AST Structural Trees:</strong> Evaluates node depth, control flow constructs (loops, conditionals, branching complexity), and subtree signatures.</li>
                <li><strong className="text-slate-900">Winnowing Fingerprinting:</strong> Applies Rabin-Karp polynomial rolling hash with sliding window for partial block and snippet detection.</li>
                <li><strong className="text-slate-900">Probability Calibration:</strong> Platt Sigmoid scaling ensures model outputs reflect verified probability densities.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Security & Isolation Policies */}
        <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wide border-b border-slate-100 pb-2">
            <Lock className="w-4 h-4 text-slate-500" />
            <span>Security & Privacy Safeguards</span>
          </div>

          <div className="text-xs text-slate-700 space-y-3 leading-relaxed">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
              <strong className="block mb-1">Untrusted Code Execution Ban</strong>
              Uploaded Python and Java source files are parsed statically. The application never executes submitted student programs with <code>eval()</code>, <code>exec()</code>, or runtime processes.
            </div>

            <ul className="list-disc list-inside space-y-1.5 text-slate-600">
              <li><strong className="text-slate-900">Input Validation:</strong> File sizes capped, character encodings validated as UTF-8, malformed syntax handled gracefully without application crashes.</li>
              <li><strong className="text-slate-900">Local Persistence:</strong> Ingested metadata, token frequencies, and audit logs are stored securely in local SQLite with parameterized queries.</li>
              <li><strong className="text-slate-900">Independent Review:</strong> Automated metrics serve solely as decision support. Institutional integrity protocols require human validation.</li>
            </ul>

            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-semibold text-slate-900 mb-2">Benchmark Sample Management</div>
              <button
                type="button"
                onClick={onLoadSamples}
                disabled={isLoadingSamples}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md border border-slate-200 transition-colors inline-flex items-center gap-1.5"
              >
                <Database className="w-3.5 h-3.5 text-slate-600" />
                <span>{isLoadingSamples ? 'Reloading...' : 'Reload Verified Sample Benchmarks'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
