import React from 'react';
import {
  Building2,
  AlertTriangle,
  Network,
  PlayCircle,
  FileText,
  RefreshCw,
  Layers
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  exceptionCount: number;
  onRefresh: () => void;
  isReconciling: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  exceptionCount,
  onRefresh,
  isReconciling
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Building2 },
    { id: 'exceptions', label: 'Exception Queue', icon: AlertTriangle, badge: exceptionCount },
    { id: 'networks', label: 'Network Pipelines', icon: Network },
    { id: 'simulator', label: 'Scenarios Simulator', icon: PlayCircle },
    { id: 'reporting', label: 'Reports & Zetheta Docs', icon: FileText }
  ];

  return (
    <header id="main-header" className="bg-[#0F0F12] border-b border-gray-800 sticky top-0 z-40 text-gray-200 shadow-lg shadow-black/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand and Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shadow-md">
              <Layers className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-serif italic text-amber-500 text-lg font-bold tracking-tight">Zetheta</span>
                <span className="text-gray-600 font-serif">|</span>
                <span className="font-medium text-sm text-gray-200 tracking-tight">Reconciliation Engine</span>
                <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider rounded-full bg-gray-900 text-amber-400 border border-gray-800">
                  v4.2.1
                </span>
              </div>
              <p className="text-[11px] text-gray-500 font-mono">
                4 Banks • MT940 & CAMT.053 • UPI / NEFT / RTGS / Card
              </p>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 text-[11px] text-gray-400 bg-gray-900/60 px-3 py-1.5 rounded-lg border border-gray-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono">Engine: Operational</span>
            </div>

            <button
              id="btn-trigger-reconciliation"
              onClick={onRefresh}
              disabled={isReconciling}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs uppercase tracking-wider font-bold transition-all shadow-sm ${
                isReconciling
                  ? 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
                  : 'bg-amber-500 hover:bg-amber-400 text-black border border-amber-600 shadow-amber-500/10'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isReconciling ? 'animate-spin text-gray-400' : 'text-black'}`} />
              <span>{isReconciling ? 'Reconciling Feeds...' : 'Run Reconciliation'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 -mb-px overflow-x-auto scrollbar-none py-1">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-3.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-[#16161A] text-amber-400 font-semibold border-b-2 border-amber-500'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-gray-500'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
