import React, { useEffect, useState } from 'react';
import {
  LineChart,
  ShieldAlert,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  Database
} from 'lucide-react';
import { api } from '../services/api';
import { ModelMetricDetails } from '../types';

export const ModelPerformancePage: React.FC = () => {
  const [metrics, setMetrics] = useState<Record<string, ModelMetricDetails> | null>(null);
  const [validationInfo, setValidationInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.getModelMetrics()
      .then((res) => {
        setMetrics(res.metrics);
        setValidationInfo(res.datasetValidation);
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, []);

  if (isLoading || !metrics) {
    return (
      <div className="p-12 text-center text-xs text-slate-500">
        Loading verified evaluation benchmarks and calibration parameters...
      </div>
    );
  }

  const pythonMetrics = metrics.python;
  const javaMetrics = metrics.java;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Model Performance & Evaluation Benchmarks
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Quantitative validation metrics evaluated on held-out academic code datasets with grouped leak prevention.
        </p>
      </div>

      {/* Real vs Synthetic Data Policy Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>Held-Out Real Dataset Benchmarks</span>
          </div>
          <p className="text-xs text-emerald-800 leading-relaxed">
            Models are trained and calibrated on genuine multi-student code repositories. Evaluated on strictly isolated test sets grouped by problem family to prevent data leakage.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
            <AlertTriangle className="w-4 h-4 text-amber-700" />
            <span>Synthetic Demo Data Policy</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            Synthetic permutations (renamed variables, reordered loops) are used solely for boundary unit testing. They are never substituted for real evaluation metrics.
          </p>
        </div>
      </div>

      {/* Python & Java Model Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Python Model Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                  PYTHON
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {pythonMetrics.modelName}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {pythonMetrics.algorithm} · {pythonMetrics.calibrationMethod}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              v{pythonMetrics.version}
            </span>
          </div>

          {/* Metric KPI Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">F1 Score</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(pythonMetrics.f1Score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Precision</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(pythonMetrics.precision * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Recall</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(pythonMetrics.recall * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                {pythonMetrics.rocAuc.toFixed(3)}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">PR-AUC</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                {pythonMetrics.prAuc.toFixed(3)}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">False Positive</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900 text-emerald-700">
                {(pythonMetrics.falsePositiveRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div>
            <div className="text-xs font-semibold text-slate-800 mb-2">
              Confusion Matrix (Held-out N={pythonMetrics.totalEvaluationSamples})
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <div className="text-[10px] text-slate-400 font-sans">True Negative</div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {pythonMetrics.confusionMatrix.trueNegative}
                </div>
              </div>
              <div className="bg-rose-50 p-2.5 rounded border border-rose-100">
                <div className="text-[10px] text-rose-500 font-sans">False Positive</div>
                <div className="text-sm font-bold text-rose-700 tabular-nums">
                  {pythonMetrics.confusionMatrix.falsePositive}
                </div>
              </div>
              <div className="bg-amber-50 p-2.5 rounded border border-amber-100">
                <div className="text-[10px] text-amber-500 font-sans">False Negative</div>
                <div className="text-sm font-bold text-amber-700 tabular-nums">
                  {pythonMetrics.confusionMatrix.falseNegative}
                </div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-sans">True Positive</div>
                <div className="text-sm font-bold text-emerald-700 tabular-nums">
                  {pythonMetrics.confusionMatrix.truePositive}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Java Model Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                  JAVA
                </span>
                <h2 className="text-base font-bold text-slate-900">
                  {javaMetrics.modelName}
                </h2>
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {javaMetrics.algorithm} · {javaMetrics.calibrationMethod}
              </p>
            </div>
            <span className="text-xs font-mono font-semibold text-slate-600">
              v{javaMetrics.version}
            </span>
          </div>

          {/* Metric KPI Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">F1 Score</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(javaMetrics.f1Score * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Precision</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(javaMetrics.precision * 100).toFixed(1)}%
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Recall</div>
              <div className="text-lg font-bold font-mono tabular-nums text-slate-900">
                {(javaMetrics.recall * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">ROC-AUC</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                {javaMetrics.rocAuc.toFixed(3)}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">PR-AUC</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900">
                {javaMetrics.prAuc.toFixed(3)}
              </div>
            </div>
            <div className="p-2.5 bg-slate-50 rounded border border-slate-100 text-center">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">False Positive</div>
              <div className="text-base font-bold font-mono tabular-nums text-slate-900 text-emerald-700">
                {(javaMetrics.falsePositiveRate * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Confusion Matrix */}
          <div>
            <div className="text-xs font-semibold text-slate-800 mb-2">
              Confusion Matrix (Held-out N={javaMetrics.totalEvaluationSamples})
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
              <div className="bg-slate-50 p-2.5 rounded border border-slate-100">
                <div className="text-[10px] text-slate-400 font-sans">True Negative</div>
                <div className="text-sm font-bold text-slate-900 tabular-nums">
                  {javaMetrics.confusionMatrix.trueNegative}
                </div>
              </div>
              <div className="bg-rose-50 p-2.5 rounded border border-rose-100">
                <div className="text-[10px] text-rose-500 font-sans">False Positive</div>
                <div className="text-sm font-bold text-rose-700 tabular-nums">
                  {javaMetrics.confusionMatrix.falsePositive}
                </div>
              </div>
              <div className="bg-amber-50 p-2.5 rounded border border-amber-100">
                <div className="text-[10px] text-amber-500 font-sans">False Negative</div>
                <div className="text-sm font-bold text-amber-700 tabular-nums">
                  {javaMetrics.confusionMatrix.falseNegative}
                </div>
              </div>
              <div className="bg-emerald-50 p-2.5 rounded border border-emerald-100">
                <div className="text-[10px] text-emerald-600 font-sans">True Positive</div>
                <div className="text-sm font-bold text-emerald-700 tabular-nums">
                  {javaMetrics.confusionMatrix.truePositive}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
