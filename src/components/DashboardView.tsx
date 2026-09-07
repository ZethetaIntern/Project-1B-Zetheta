import React from 'react';
import {
  BankHealth,
  ReconciliationSummary,
  MatchedPair,
  ExceptionRecord
} from '../types/reconciliation';
import {
  CheckCircle2,
  AlertCircle,
  Building,
  TrendingUp,
  CreditCard,
  Zap,
  ArrowUpRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from 'recharts';

interface DashboardViewProps {
  summary: ReconciliationSummary;
  bankHealth: BankHealth[];
  matchedPairs: MatchedPair[];
  exceptions: ExceptionRecord[];
  onNavigateToExceptions: () => void;
  onNavigateToNetworks: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  bankHealth,
  matchedPairs,
  exceptions,
  onNavigateToExceptions,
  onNavigateToNetworks
}) => {
  const chartData = bankHealth.map(b => ({
    name: b.name.split(' ')[0],
    fullName: b.name,
    matched: b.matched,
    exceptions: b.exceptions,
    volume: b.volume
  }));

  const networkStats = [
    { name: 'UPI', count: 4, volume: '₹695,000', color: 'text-purple-400 bg-purple-950/30 border-purple-900/50' },
    { name: 'NEFT', count: 3, volume: '₹610,000', color: 'text-blue-400 bg-blue-950/30 border-blue-900/50' },
    { name: 'RTGS', count: 2, volume: '₹2,880,000', color: 'text-emerald-400 bg-emerald-950/30 border-emerald-900/50' },
    { name: 'CARD (MDR)', count: 2, volume: '$25,750', color: 'text-amber-400 bg-amber-950/30 border-amber-900/50' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div id="metric-match-rate" className="bg-[#16161A] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Auto-Match Rate</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif italic text-white tracking-tight">{summary.autoMatchRatePercentage}%</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> High Confidence
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 font-mono">
            {summary.reconciledPairsCount} matched pairs across all 4 banks
          </p>
        </div>

        <div id="metric-settled-volume" className="bg-[#16161A] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Settled Volume (INR Eq.)</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif italic text-amber-500 tracking-tight">
              ₹{(summary.totalSettledVolumeInrEquiv / 100000).toFixed(1)}L
            </span>
            <span className="text-xs font-mono text-gray-500">Total Cleared</span>
          </div>
          <p className="mt-1 text-xs text-gray-500 font-mono">
            Multi-currency treasury sweep active
          </p>
        </div>

        <div id="metric-exceptions" className="bg-[#16161A] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Open Exceptions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif italic text-amber-400 tracking-tight">{exceptions.length}</span>
            <button
              onClick={onNavigateToExceptions}
              className="text-xs font-semibold text-amber-500 hover:text-amber-400 flex items-center ml-auto transition-colors"
            >
              Inspect Queue <ArrowUpRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500 font-mono">
            Across 10 discrepancy categories
          </p>
        </div>

        <div id="metric-active-banks" className="bg-[#16161A] p-5 rounded-xl border border-gray-800 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-500">Connected Banks</span>
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-serif italic text-white tracking-tight">4 / 4</span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ShieldCheck className="w-3 h-3 mr-0.5" /> All Online
            </span>
          </div>
          <p className="mt-1 text-xs text-gray-500 font-mono">
            2x MT940 + 2x ISO 20022 CAMT.053
          </p>
        </div>
      </div>

      {/* Bank-by-Bank Health Section */}
      <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-800 gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-100 flex items-center space-x-2">
              <span>Multi-Bank Settlement Health & Formats</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Live ingest verification across MT940 and ISO 20022 CAMT.053 standard variants
            </p>
          </div>
          <button
            onClick={onNavigateToNetworks}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20 flex items-center self-start transition-colors"
          >
            View Settlement Pipelines
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {bankHealth.map((b, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-gray-800/80 bg-[#0F0F12] hover:border-gray-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 font-mono">Bank {idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                      b.status === 'HEALTHY'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-gray-100 leading-tight">{b.name}</h3>
                <p className="text-xs font-mono text-amber-400/90 mt-1.5 bg-gray-900/80 px-2 py-1 rounded border border-gray-800">
                  {b.format}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-800 space-y-1.5 text-xs text-gray-400">
                <div className="flex justify-between">
                  <span>Transactions:</span>
                  <span className="font-semibold text-gray-200">{b.totalTx} entries</span>
                </div>
                <div className="flex justify-between">
                  <span>Auto-Matched:</span>
                  <span className="font-semibold text-emerald-400">{b.matched}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exceptions:</span>
                  <span className="font-semibold text-amber-400">{b.exceptions}</span>
                </div>
                <div className="flex justify-between">
                  <span>Settled Volume:</span>
                  <span className="font-semibold text-gray-200">
                    {b.currency} {b.volume.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Volume comparison chart */}
        <div className="mt-6 pt-6 border-t border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-[10px] uppercase font-bold tracking-widest text-gray-400 font-mono">
              Transaction Volume Distribution By Bank
            </h4>
            <span className="text-xs text-gray-500">Green = Reconciled, Amber = Exceptions</span>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barCategoryGap="30%">
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#16161A', borderColor: '#374151', borderRadius: '8px', color: '#f3f4f6' }}
                  formatter={(val: any, name: any) => [val, name === 'matched' ? 'Matched' : 'Exceptions']}
                  labelFormatter={(label: any) => `Bank: ${label}`}
                />
                <Bar dataKey="matched" name="Matched" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="exceptions" name="Exceptions" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Payment Networks & Live Reconciled Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Networks Overview */}
        <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-semibold text-gray-100">Payment Network Pipelines</h3>
              <button
                onClick={onNavigateToNetworks}
                className="text-xs font-semibold text-amber-500 hover:text-amber-400 transition-colors"
              >
                Configure
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2 mb-4">
              Specialized pipelines with network-specific rules (UPI VPA/RRN, NEFT Batch cycles, RTGS high-value dual sign-off, Card MDR netting).
            </p>

            <div className="space-y-3">
              {networkStats.map((net, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg border flex items-center justify-between ${net.color}`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Zap className="w-4 h-4" />
                    <span className="font-semibold text-xs tracking-wide">{net.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-xs">{net.volume}</div>
                    <div className="text-[10px] opacity-80">{net.count} records handled</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-800">
            <div className="bg-[#0F0F12] p-3 rounded-lg text-[11px] text-gray-400 border border-gray-800/80 flex items-center justify-between">
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 text-gray-500 mr-1.5" /> Next NEFT Batch Cycle:
              </span>
              <span className="font-mono font-semibold text-amber-400">19:00:00 UTC (Hourly)</span>
            </div>
          </div>
        </div>

        {/* Live Reconciled Stream */}
        <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg p-6 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-gray-100">Recently Reconciled Ledger & Bank Pairs</h3>
              <p className="text-xs text-gray-500">
                Multi-pass matched records including Card fee netting and Split payments
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20">
              {matchedPairs.length} Matched
            </span>
          </div>

          <div className="mt-4 divide-y divide-gray-800 max-h-80 overflow-y-auto pr-1">
            {matchedPairs.map(m => (
              <div key={m.matchId} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-white/[0.02] px-2 rounded-lg transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-gray-800 text-gray-300 border border-gray-700">
                      {m.network}
                    </span>
                    <span className="text-xs font-semibold text-gray-200">
                      {(m.businessRecord as any).documentId || 'SPLIT'}
                    </span>
                    <span className="text-[10px] text-gray-500">↔</span>
                    <span className="text-xs text-gray-400">
                      {(m.bankRecord as any).documentId || (m.bankRecord as any).bankName}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      {m.confidenceScore}% conf
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-1">{m.details}</p>
                </div>

                <div className="text-right whitespace-nowrap self-start sm:self-center">
                  <div className="text-xs font-serif italic text-white font-bold">
                    {(m.businessRecord as any).currency || 'INR'} {(m.businessRecord as any).amount?.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-mono text-amber-500/90">{m.rule}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
