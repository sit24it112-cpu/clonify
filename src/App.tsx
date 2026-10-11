import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { NewAnalysisPage } from './pages/NewAnalysisPage';
import { SubmissionsPage } from './pages/SubmissionsPage';
import { ResultsPage } from './pages/ResultsPage';
import { DetailedEvidencePage } from './pages/DetailedEvidencePage';
import { ReportsPage } from './pages/ReportsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { ReviewDecisionsPage } from './pages/ReviewDecisionsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';
import {
  AnalysisSummary,
  CodeSubmission,
  PairwiseResult,
  GlobalStats
} from './types';

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);

  // Data states
  const [stats, setStats] = useState<GlobalStats | null>(null);
  const [analyses, setAnalyses] = useState<AnalysisSummary[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<(AnalysisSummary & { pairs: PairwiseResult[]; submissions: CodeSubmission[] }) | null>(null);
  const [selectedPairId, setSelectedPairId] = useState<string | null>(null);
  const [isLoadingSamples, setIsLoadingSamples] = useState(false);

  const fetchGlobalData = async (preferredAnalysisId?: string) => {
    try {
      const [healthRes, analysesRes] = await Promise.all([
        api.getHealth(),
        api.getAnalyses()
      ]);

      setStats(healthRes.stats);
      setAnalyses(analysesRes);

      if (analysesRes.length > 0) {
        const targetId = preferredAnalysisId || (currentAnalysis?.id ? currentAnalysis.id : analysesRes[0].id);
        const fullAnalysis = await api.getAnalysis(targetId).catch(() => api.getAnalysis(analysesRes[0].id));
        setCurrentAnalysis(fullAnalysis);

        if (!selectedPairId && fullAnalysis.pairs?.length > 0) {
          setSelectedPairId(fullAnalysis.pairs[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  useEffect(() => {
    fetchGlobalData();
  }, []);

  const handleSelectAnalysis = async (id: string) => {
    try {
      const full = await api.getAnalysis(id);
      setCurrentAnalysis(full);
      if (full.pairs?.length > 0) {
        setSelectedPairId(full.pairs[0].id);
      }
    } catch (err) {
      console.error('Failed to load analysis:', err);
    }
  };

  const handleAnalysisComplete = async (analysisId: string) => {
    await fetchGlobalData(analysisId);
    setCurrentPage('results');
  };

  const handleInspectPair = (pairId: string) => {
    setSelectedPairId(pairId);
    setCurrentPage('evidence');
  };

  const handleDeleteAnalysis = async (id: string) => {
    try {
      await api.deleteAnalysis(id);
      await fetchGlobalData();
      if (currentAnalysis?.id === id) {
        setCurrentAnalysis(null);
        setSelectedPairId(null);
      }
    } catch (err) {
      console.error('Failed to delete analysis:', err);
    }
  };

  const handleLoadSamples = async () => {
    try {
      setIsLoadingSamples(true);
      await api.loadSampleData();
      await fetchGlobalData();
      setIsLoadingSamples(false);
      setCurrentPage('dashboard');
    } catch (err) {
      setIsLoadingSamples(false);
      console.error('Failed to reload samples:', err);
    }
  };

  const flaggedCount = currentAnalysis?.pairs?.filter(p => p.exceedsThreshold).length || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {/* Top Navigation */}
      <Navbar
        currentAnalysis={currentAnalysis}
        onNavigate={setCurrentPage}
        onLoadSamples={handleLoadSamples}
        isLoadingSamples={isLoadingSamples}
      />

      {/* Main Container with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          currentPage={currentPage}
          onNavigate={setCurrentPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          flaggedCount={flaggedCount}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            {currentPage === 'dashboard' && (
              <DashboardPage
                stats={stats}
                currentAnalysis={currentAnalysis}
                analyses={analyses}
                onSelectPair={handleInspectPair}
                onNavigate={setCurrentPage}
                onSelectAnalysis={(id) => {
                  handleSelectAnalysis(id);
                  setCurrentPage('dashboard');
                }}
              />
            )}

            {currentPage === 'new-analysis' && (
              <NewAnalysisPage onAnalysisComplete={handleAnalysisComplete} />
            )}

            {currentPage === 'submissions' && (
              <SubmissionsPage
                submissions={currentAnalysis?.submissions || []}
                batchId={currentAnalysis?.batchId}
              />
            )}

            {currentPage === 'results' && (
              <ResultsPage
                pairs={currentAnalysis?.pairs || []}
                onSelectPair={handleInspectPair}
                reviewThreshold={currentAnalysis?.reviewThreshold}
              />
            )}

            {currentPage === 'evidence' && (
              <DetailedEvidencePage
                pairId={selectedPairId}
                onBack={() => setCurrentPage('results')}
                onReviewUpdated={() => fetchGlobalData()}
              />
            )}

            {currentPage === 'reports' && (
              <ReportsPage
                currentAnalysis={currentAnalysis}
                analyses={analyses}
                onSelectAnalysis={handleSelectAnalysis}
              />
            )}

            {currentPage === 'history' && (
              <HistoryPage
                analyses={analyses}
                currentAnalysisId={currentAnalysis?.id || null}
                onSelectAnalysis={handleSelectAnalysis}
                onDeleteAnalysis={handleDeleteAnalysis}
                onNavigate={setCurrentPage}
              />
            )}

            {currentPage === 'performance' && (
              <ModelPerformancePage />
            )}

            {currentPage === 'decisions' && (
              <ReviewDecisionsPage
                onSelectPair={handleInspectPair}
                pairs={currentAnalysis?.pairs || []}
              />
            )}

            {currentPage === 'settings' && (
              <SettingsPage
                onLoadSamples={handleLoadSamples}
                isLoadingSamples={isLoadingSamples}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
