import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { ExceptionQueueView } from './components/ExceptionQueueView';
import { ExceptionDetailModal } from './components/ExceptionDetailModal';
import { NetworkPipelinesView } from './components/NetworkPipelinesView';
import { SimulatorView } from './components/SimulatorView';
import { ReportingView } from './components/ReportingView';
import { ReconciliationEngineService, EngineResult } from './services/reconciliationEngine';
import { ExceptionRecord } from './types/reconciliation';

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [engineData, setEngineData] = useState<EngineResult | null>(null);
  const [selectedException, setSelectedException] = useState<ExceptionRecord | null>(null);
  const [isReconciling, setIsReconciling] = useState<boolean>(false);

  const loadData = () => {
    setIsReconciling(true);
    setTimeout(() => {
      const data = ReconciliationEngineService.getInstance().runReconciliation();
      setEngineData(data);
      setIsReconciling(false);
    }, 400);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleResolveException = (
    exceptionId: string,
    actionType: 'MAKER' | 'CHECKER',
    user: string,
    justification: string,
    approved: boolean
  ) => {
    const updated = ReconciliationEngineService.getInstance().resolveException(
      exceptionId,
      actionType,
      user,
      justification,
      approved
    );
    if (updated) {
      setSelectedException(updated);
      // Reload overall state to update counts and queues
      const data = ReconciliationEngineService.getInstance().runReconciliation();
      setEngineData(data);
    }
  };

  if (!engineData) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] flex items-center justify-center text-gray-200 font-mono text-sm">
        <div className="flex items-center space-x-3 bg-[#16161A] p-6 rounded-xl border border-gray-800 shadow-xl">
          <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Initializing Multi-Bank Settlement Feeds...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-200 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-400">
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        exceptionCount={engineData.exceptions.filter(e => e.status !== 'RESOLVED').length}
        onRefresh={loadData}
        isReconciling={isReconciling}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === 'dashboard' && (
          <DashboardView
            summary={engineData.summary}
            bankHealth={engineData.bankHealth}
            matchedPairs={engineData.matchedPairs}
            exceptions={engineData.exceptions}
            onNavigateToExceptions={() => setCurrentTab('exceptions')}
            onNavigateToNetworks={() => setCurrentTab('networks')}
          />
        )}

        {currentTab === 'exceptions' && (
          <ExceptionQueueView
            exceptions={engineData.exceptions}
            onSelectException={exc => setSelectedException(exc)}
          />
        )}

        {currentTab === 'networks' && (
          <NetworkPipelinesView
            matchedPairs={engineData.matchedPairs}
            exceptions={engineData.exceptions}
            onSelectException={exc => setSelectedException(exc)}
          />
        )}

        {currentTab === 'simulator' && <SimulatorView />}

        {currentTab === 'reporting' && (
          <ReportingView
            summary={engineData.summary}
            exceptions={engineData.exceptions}
            bankHealth={engineData.bankHealth}
          />
        )}
      </main>

      {/* Exception Detail & 6-Tier Audit Trail Modal */}
      {selectedException && (
        <ExceptionDetailModal
          exception={selectedException}
          onClose={() => setSelectedException(null)}
          onResolve={handleResolveException}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0F0F12] py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-2">
          <div className="flex items-center space-x-2">
            <span className="font-serif italic text-amber-500 text-sm">Zetheta</span>
            <span className="text-gray-600">•</span>
            <span className="font-semibold text-gray-300">Automated Reconciliation Engine</span>
            <span className="text-gray-600">•</span>
            <span className="text-gray-400">Multi-Bank Settlement (MT940 & CAMT.053)</span>
          </div>
          <div className="font-mono text-[11px] text-gray-400">
            Zetheta Fintech Evaluation Submission • Python Django & React
          </div>
        </div>
      </footer>
    </div>
  );
}
