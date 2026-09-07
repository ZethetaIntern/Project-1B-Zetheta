import React, { useState } from 'react';
import { NetworkType, MatchedPair, ExceptionRecord } from '../types/reconciliation';
import {
  Zap,
  Clock,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Split,
  Percent,
  Layers,
  FileCheck
} from 'lucide-react';

interface NetworkPipelinesViewProps {
  matchedPairs: MatchedPair[];
  exceptions: ExceptionRecord[];
  onSelectException: (exc: ExceptionRecord) => void;
}

export const NetworkPipelinesView: React.FC<NetworkPipelinesViewProps> = ({
  matchedPairs,
  exceptions,
  onSelectException
}) => {
  const [activeNetwork, setActiveNetwork] = useState<NetworkType>('UPI');

  const networks = [
    {
      id: 'UPI' as NetworkType,
      name: 'UPI Pipeline (Instant Retail)',
      icon: Zap,
      badge: '12-Digit RRN & VPA',
      color: 'purple',
      description:
        'Reconciles instant 24/7 retail transfers using NPCI 12-digit Retrieval Reference Numbers (RRN) and Virtual Payment Addresses (VPA), with split-payment aggregation algorithms.'
    },
    {
      id: 'NEFT' as NetworkType,
      name: 'NEFT Pipeline (Hourly Batches)',
      icon: Clock,
      badge: 'Batch Cycles B01-B48',
      color: 'blue',
      description:
        'Processes scheduled interbank clearing batches, matching internal payment runs to Reserve Bank / Clearing House settlement batch sequences.'
    },
    {
      id: 'RTGS' as NetworkType,
      name: 'RTGS Pipeline (High-Value Gross)',
      icon: ShieldCheck,
      badge: 'UTR & Dual Maker-Checker',
      color: 'emerald',
      description:
        'Continuous real-time settlement for gross wholesale payments (≥ ₹200,000). Enforces mandatory 2-tier approval sign-offs and UTR validation.'
    },
    {
      id: 'CARD' as NetworkType,
      name: 'Card Pipeline (MDR & Chargebacks)',
      icon: CreditCard,
      badge: 'MDR Netting & Disputes',
      color: 'amber',
      description:
        'Acquiring network settlement reconciling gross merchant transactions against net bank deposits, automatically verifying MDR interchange fees and chargeback disputes.'
    }
  ];

  const currentMatched = matchedPairs.filter(m => m.network === activeNetwork);
  const currentExceptions = exceptions.filter(e => {
    const bizNet = e.businessRecord?.network;
    const bkNet = e.bankRecord?.network;
    return bizNet === activeNetwork || bkNet === activeNetwork;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Network Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {networks.map(net => {
          const Icon = net.icon;
          const isSelected = activeNetwork === net.id;
          return (
            <button
              key={net.id}
              id={`pipeline-btn-${net.id.toLowerCase()}`}
              onClick={() => setActiveNetwork(net.id)}
              className={`p-5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-[#1E1E24] to-[#16161A] border-amber-500/50 text-white shadow-xl scale-[1.02]'
                  : 'bg-[#16161A] border-gray-800 text-gray-300 hover:border-gray-700 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isSelected
                        ? 'bg-amber-500 text-black font-bold'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {net.badge}
                  </span>
                </div>
                <h3 className="font-bold text-sm tracking-tight text-gray-100">{net.name}</h3>
              </div>

              <div
                className={`mt-4 pt-3 border-t text-[11px] font-medium flex justify-between ${
                  isSelected ? 'border-gray-800 text-gray-400' : 'border-gray-800/60 text-gray-500'
                }`}
              >
                <span>Pipeline Status:</span>
                <span className="text-emerald-400 font-bold flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Active Feed
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Network Operational Details */}
      <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-800 gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded bg-[#0F0F12] text-amber-400 border border-amber-500/20 text-xs font-mono font-bold">
                {activeNetwork} SETTLEMENT ENGINE
              </span>
              <h2 className="text-base font-bold text-gray-100">
                {networks.find(n => n.id === activeNetwork)?.name}
              </h2>
            </div>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl">
              {networks.find(n => n.id === activeNetwork)?.description}
            </p>
          </div>

          <div className="flex items-center space-x-2 self-start">
            <span className="text-xs font-semibold px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              {currentMatched.length} Auto-Reconciled
            </span>
            <span className="text-xs font-semibold px-3 py-1 bg-amber-500/10 text-amber-400 rounded-lg border border-amber-500/20">
              {currentExceptions.length} Discrepancies
            </span>
          </div>
        </div>

        {/* Network Specific Architecture Rules Callout */}
        <div className="mt-5 p-4 rounded-xl bg-[#0F0F12] border border-gray-800 text-xs">
          <h4 className="font-bold text-gray-300 uppercase tracking-widest mb-3 flex items-center">
            <Layers className="w-4 h-4 mr-1.5 text-amber-500" /> Pipeline Specialized Settlement Mechanics:
          </h4>

          {activeNetwork === 'UPI' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-purple-400 block mb-1">1. RRN / VPA Key Normalization</span>
                Strips bank prefixes (`REF`, `RRN:`, `TXN-`) and normalizes 12-digit numeric codes to match MT940 Millennium subfield `&lt;63` against ERP reference.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-purple-400 block mb-1 flex items-center">
                  <Split className="w-3.5 h-3.5 mr-1" /> 2. Split Payment Aggregation
                </span>
                Groups multiple partial UPI deposits sharing the same parent invoice (e.g. ₹200k + ₹150k for ₹350k invoice) into a single composite match.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-purple-400 block mb-1">3. Inter-Bank Route Guard</span>
                Flags cross-bank routing if customer remits to alternate corporate bank account (e.g., Apex instead of Horizon).
              </div>
            </div>
          )}

          {activeNetwork === 'NEFT' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-blue-400 block mb-1">1. Batch Cycle Matching</span>
                Aligns ERP payment batches with hourly clearing runs (e.g. `NEFT20260902B04`).
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-blue-400 block mb-1">2. Transposition Error Detector</span>
                Detects human entry transposition typos (e.g. ₹910,000 logged vs ₹190,000 cleared) by verifying mod-9 divisibility.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-blue-400 block mb-1">3. Clearing Surcharge Auto-Booking</span>
                Isolates small bank-only clearing surcharges (₹450) and auto-tags for expense booking.
              </div>
            </div>
          )}

          {activeNetwork === 'RTGS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-emerald-400 block mb-1">1. High-Value Gross Clearance</span>
                Wholesale transactions (≥ ₹200,000) matched with zero variance against ISO 20022 CAMT.053 `&lt;Ntry&gt;` entries.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-emerald-400 block mb-1">2. Cutoff Time & T+1 Timing Lag</span>
                Transactions submitted post-cutoff (18:00) automatically matched with T+1 bank clearing slips with lag tagging.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-emerald-400 block mb-1">3. Mandatory Dual Sign-off</span>
                All exceptions involving RTGS require second-level checker authorization with digital signature hash tracking.
              </div>
            </div>
          )}

          {activeNetwork === 'CARD' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-400">
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-amber-400 block mb-1 flex items-center">
                  <Percent className="w-3.5 h-3.5 mr-1" /> 1. MDR Interchange Fee Netting
                </span>
                Calculates and verifies 2% merchant discount rate: Gross $24,500 - $490 fee = $24,010 net bank deposit.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-amber-400 block mb-1">2. Chargeback Reversal Protocol</span>
                Identifies cardholder chargeback debits (Reason code 4837), generates dispute representment case files.
              </div>
              <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                <span className="font-bold text-amber-400 block mb-1">3. Multi-Currency Schema</span>
                Supports USD/EUR/GBP card acquiring files with ISO 20022 CAMT.053.001.08 schema structures.
              </div>
            </div>
          )}
        </div>

        {/* Matched & Exception lists for this network */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          {/* Matched in this network */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center">
              <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Reconciled In This Network ({currentMatched.length})
            </h4>

            {currentMatched.length > 0 ? (
              <div className="space-y-2">
                {currentMatched.map(m => (
                  <div key={m.matchId} className="p-3 rounded-lg border border-gray-800 bg-[#0F0F12] space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-gray-200">
                        {(m.businessRecord as any).documentId || 'SPLIT RECORD'}
                      </span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {(m.businessRecord as any).currency || 'INR'} {(m.businessRecord as any).amount?.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">{m.details}</p>
                    <div className="text-[10px] font-mono text-gray-500">Rule: {m.rule}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No reconciled pairs for this network.</p>
            )}
          </div>

          {/* Exceptions in this network */}
          <div>
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1.5 text-amber-500" /> Active Exceptions In This Network ({currentExceptions.length})
            </h4>

            {currentExceptions.length > 0 ? (
              <div className="space-y-2">
                {currentExceptions.map(e => (
                  <div
                    key={e.exceptionId}
                    onClick={() => onSelectException(e)}
                    className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10 transition-colors cursor-pointer space-y-1"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-mono font-bold text-amber-400">{e.exceptionId}</span>
                      <span className="font-mono font-bold text-gray-200">
                        Variance: {e.discrepancyAmount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-300">{e.subType}</div>
                    <p className="text-[11px] text-gray-400 line-clamp-1">{e.rootCauseAnalysis}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No exceptions currently pending for this network.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
