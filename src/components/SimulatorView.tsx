import React, { useState } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  Percent,
  Split,
  Clock,
  RotateCcw,
  Sparkles
} from 'lucide-react';

interface Scenario {
  id: string;
  number: number;
  title: string;
  category: string;
  banksInvolved: string[];
  networks: string[];
  inputDescription: string;
  expectedBehavior: string;
  engineVerification: string;
  status: 'PASSED' | 'VERIFIED';
  details: {
    ledgerEntry: string;
    bankEntry: string;
    algorithmUsed: string;
    resolutionRule: string;
  };
}

export const SimulatorView: React.FC = () => {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-1');
  const [simulating, setSimulating] = useState<boolean>(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const scenarios: Scenario[] = [
    {
      id: 'scenario-1',
      number: 1,
      title: 'Clean Automated High-Volume Matching',
      category: 'Exact Reference & Amount Match',
      banksInvolved: ['Apex Commercial Bank (MT940 v1)', 'Horizon Trust Bank (MT940 v2)'],
      networks: ['UPI', 'NEFT'],
      inputDescription:
        'Invoice INV-2026-001 (₹145,000) with UPI RRN 426091002931 and Invoice INV-2026-002 (₹420,000) with NEFT Batch B04.',
      expectedBehavior:
        'Engine normalizes MT940 tags :61: and :86:, strips prefixes, matches exact amount and reference with 100% confidence.',
      engineVerification: 'Algorithm PASS-1: Zero variance, status immediately marked RECONCILED with no manual intervention.',
      status: 'PASSED',
      details: {
        ledgerEntry: 'INV-2026-001 • ₹145,000.00 • RRN: 426091002931',
        bankEntry: 'Apex MT940 • Tag :86:<63REF426091002931 • ₹145,000.00',
        algorithmUsed: 'EXACT_REFERENCE_AND_AMOUNT (Pass 1)',
        resolutionRule: 'Auto-closed with 100% confidence score.'
      }
    },
    {
      id: 'scenario-2',
      number: 2,
      title: 'Cutoff Timing & T+1 Settlement Lag',
      category: '1. Timing-Based Mismatch',
      banksInvolved: ['Vanguard International Bank (ISO 20022 CAMT.053)'],
      networks: ['RTGS'],
      inputDescription:
        'Receipt RCP-2026-004 logged in ERP on Sep 3 at 18:05 (post-RTGS cutoff), cleared on bank statement on Sep 4 (T+1).',
      expectedBehavior:
        'Engine evaluates value date difference (+1 business day) within standard tolerance, resolves as timing lag rather than missing funds.',
      engineVerification: 'Algorithm PASS-4: Automatically matched with TIMING_LAG_RESOLVED tag and 1-day variance metadata.',
      status: 'PASSED',
      details: {
        ledgerEntry: 'RCP-2026-004 • ₹380,000.00 • Booking Date: 2026-09-03 (Post 18:00)',
        bankEntry: 'Vanguard CAMT.053 • <Ntry><BookgDt>2026-09-04</BookgDt> • ₹380,000.00',
        algorithmUsed: 'SETTLEMENT_TIMING_LAG_T_PLUS_1 (Pass 4)',
        resolutionRule: 'Matched with T+1 tag, tolerance window 48 hours satisfied.'
      }
    },
    {
      id: 'scenario-3',
      number: 3,
      title: 'Card Acquiring MDR Interchange Fee Netting',
      category: '2. Amount Mismatch (Fee Deduction)',
      banksInvolved: ['Meridian Capital Bank (ISO 20022 CAMT.053.001.08)'],
      networks: ['CARD'],
      inputDescription:
        'E-commerce gross batch for $24,500.00 settled as net credit of $24,010.00 after 2.0% MDR fee ($490.00) in CAMT.053 <Chrgs>.',
      expectedBehavior:
        'Engine reconciles gross invoice against net deposit by extracting the fee component from ISO 20022 <TtlChrgsAndTaxAmt>.',
      engineVerification: 'Algorithm PASS-2: Verified Netting Formula (Gross - Fee = Net), Reconciled with Fee Breakdown.',
      status: 'PASSED',
      details: {
        ledgerEntry: 'INV-2026-004 • Gross: $24,500.00 • Expected Net: $24,010.00',
        bankEntry: 'Meridian CAMT.053 • Cleared: $24,010.00 • <Chrgs> $490.00',
        algorithmUsed: 'CARD_NETWORK_MDR_NETTING (Pass 2)',
        resolutionRule: 'Auto-reconciled with $490.00 fee booked to Interchange Expense.'
      }
    },
    {
      id: 'scenario-4',
      number: 4,
      title: 'Split Payment Aggregation (1-to-Many)',
      category: '2. Amount Mismatch (Split Remittances)',
      banksInvolved: ['Apex Commercial Bank (MT940 v1)'],
      networks: ['UPI'],
      inputDescription:
        'Invoice INV-2026-005 for ₹350,000.00 paid by Omega Global in two partial UPI tranches: ₹200,000.00 and ₹150,000.00.',
      expectedBehavior:
        'Engine aggregates multiple partial transactions with shared invoice references to balance against single parent receivable.',
      engineVerification: 'Algorithm PASS-3: Composite Match formed (₹200,000 + ₹150,000 = ₹350,000) with 98% confidence.',
      status: 'PASSED',
      details: {
        ledgerEntry: 'INV-2026-005 • ₹350,000.00 (Omega Global Logistics)',
        bankEntry: 'Apex MT940 • Tranche 1: ₹200,000.00 + Tranche 2: ₹150,000.00',
        algorithmUsed: 'SPLIT_PAYMENT_AGGREGATION (Pass 3)',
        resolutionRule: 'Composite parent match verified with zero aggregate variance.'
      }
    },
    {
      id: 'scenario-5',
      number: 5,
      title: 'Transposed Digits Human Data Entry Error',
      category: '5. Data Entry / Identification Error',
      banksInvolved: ['Horizon Trust Bank (MT940 v2)'],
      networks: ['NEFT'],
      inputDescription:
        'Invoice INV-2026-006 entered in ERP as ₹910,000.00, but customer remitted ₹190,000.00 (transposed 9 and 1).',
      expectedBehavior:
        'Engine identifies mismatch of ₹720,000.00, applies modulo 9 mathematical check (720,000 % 9 === 0) to flag transposition.',
      engineVerification: 'Exception Manager: Categorized as TRANSPOSED_DIGITS, assigned to Treasury Analyst with suggested adjustment.',
      status: 'VERIFIED',
      details: {
        ledgerEntry: 'INV-2026-006 • ₹910,000.00 (Delta Synergy Ltd)',
        bankEntry: 'Horizon MT940 • /TRF/ Cleared: ₹190,000.00',
        algorithmUsed: 'MODULO_9_TRANSPOSITION_DETECTOR',
        resolutionRule: 'Flagged as High-Severity Exception EXC-001 with Maker-Checker dual authorization.'
      }
    },
    {
      id: 'scenario-6',
      number: 6,
      title: 'Cross-Bank Wrong Account Routing',
      category: '8. Cross-Bank Specific Mismatch',
      banksInvolved: ['Horizon Trust Bank & Apex Commercial Bank'],
      networks: ['UPI'],
      inputDescription:
        'ERP receipt RCP-2026-006 instructed payment to Horizon Trust Bank, but customer mistakenly deposited ₹120,000 into Apex Commercial.',
      expectedBehavior:
        'Engine flags unmatched ledger entry in Horizon, detects matching credit in Apex, and diagnoses inter-bank misrouting.',
      engineVerification: 'Exception Manager: Recommends internal inter-bank treasury sweep from Apex to Horizon.',
      status: 'VERIFIED',
      details: {
        ledgerEntry: 'RCP-2026-006 • Expected Bank: Horizon Trust Bank (₹120,000.00)',
        bankEntry: 'Deposited into: Apex Commercial Bank',
        algorithmUsed: 'CROSS_BANK_ROUTING_ANALYZER',
        resolutionRule: 'Exception EXC-002 flagged with Inter-Bank Sweep recommendation.'
      }
    },
    {
      id: 'scenario-7',
      number: 7,
      title: 'Chargeback Dispute & AML Velocity Hold',
      category: '6. Reversal & 9. Compliance Anomaly',
      banksInvolved: ['Meridian Capital Bank (CAMT.053 v2)'],
      networks: ['CARD', 'SWIFT'],
      inputDescription:
        'Cardholder chargeback reversal ($1,250.00 reason 4837) and unidentified offshore remittance of $9,990.00 under $10k threshold.',
      expectedBehavior:
        'Engine isolates chargeback to dispute desk and applies compliance hold on structuring pattern wire.',
      engineVerification: 'Audit Store: Logs full compliance context, assigns SAR review ticket to Compliance Officer.',
      status: 'VERIFIED',
      details: {
        ledgerEntry: 'No matching receivables in ERP',
        bankEntry: 'Debit: $1,250.00 (Chargeback) • Credit: $9,990.00 (Offshore Wire)',
        algorithmUsed: 'AML_VELOCITY_AND_DISPUTE_ISOLATOR',
        resolutionRule: 'Exceptions EXC-003 and EXC-004 created with dual sign-off freeze.'
      }
    }
  ];

  const currentScenario = scenarios.find(s => s.id === selectedScenarioId) || scenarios[0];

  const runSimulation = () => {
    setSimulating(true);
    setSimulationLog([]);

    const steps = [
      `[STEP 1] Ingesting test payloads for ${currentScenario.title}...`,
      `[STEP 2] DocumentScanner: Parsing statement files from ${currentScenario.banksInvolved.join(', ')}...`,
      `[STEP 3] TabularConverter: Normalizing to canonical 14-column schema...`,
      `[STEP 4] Executing rule engine: ${currentScenario.details.algorithmUsed}...`,
      `[STEP 5] Verification: ${currentScenario.engineVerification}`,
      `[COMPLETE] Scenario test executed successfully! Engine state: 100% compliant.`
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setSimulationLog(prev => [...prev, step]);
        if (idx === steps.length - 1) {
          setSimulating(false);
        }
      }, (idx + 1) * 350);
    });
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="bg-[#16161A] p-6 rounded-xl border border-gray-800 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-gray-100 flex items-center">
              <PlayCircle className="w-5 h-5 mr-2 text-amber-500" /> Multi-Bank Settlement Scenario Simulator (Part 7)
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-3xl">
              Simulates complex real-world financial settlement anomalies across the 4 banks, verifying multi-pass matching, tolerance rules, and root-cause classification.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={simulating}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 self-start"
          >
            <Sparkles className={`w-4 h-4 ${simulating ? 'animate-spin' : ''}`} />
            <span>{simulating ? 'Simulating Feeds...' : 'Run Selected Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Scenario List */}
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">
            7 Settlement Test Scenarios
          </h3>

          {scenarios.map(s => {
            const isSelected = selectedScenarioId === s.id;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setSelectedScenarioId(s.id);
                  setSimulationLog([]);
                }}
                className={`w-full p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-gradient-to-b from-[#1E1E24] to-[#16161A] border-amber-500/50 text-white shadow-lg'
                    : 'bg-[#16161A] border-gray-800 hover:border-gray-700 text-gray-300 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        isSelected
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-gray-800 text-gray-400'
                      }`}
                    >
                      Scenario {s.number}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> {s.status}
                    </span>
                  </div>
                  <h4 className="font-bold text-xs leading-snug text-gray-100">{s.title}</h4>
                </div>

                <div
                  className={`mt-2.5 pt-2 border-t text-[10px] truncate ${
                    isSelected ? 'border-gray-800 text-gray-400' : 'border-gray-800/60 text-gray-500'
                  }`}
                >
                  {s.category}
                </div>
              </button>
            );
          })}
        </div>

        {/* Scenario Detail & Simulator Console */}
        <div className="lg:col-span-2 space-y-4">
          {/* Detail Card */}
          <div className="bg-[#16161A] rounded-xl border border-gray-800 shadow-lg p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-800 gap-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  Scenario {currentScenario.number}: {currentScenario.category}
                </span>
                <h3 className="text-base font-bold text-gray-100 mt-1">{currentScenario.title}</h3>
              </div>
              <div className="flex items-center space-x-1.5">
                {currentScenario.networks.map((n, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono font-bold text-[10px] border border-gray-700">
                    {n}
                  </span>
                ))}
              </div>
            </div>

            {/* Banks Involved */}
            <div className="text-xs text-gray-400 flex items-center space-x-2">
              <span className="font-semibold text-gray-300">Banks Tested:</span>
              <div className="flex flex-wrap gap-1">
                {currentScenario.banksInvolved.map((b, idx) => (
                  <span key={idx} className="font-mono text-gray-300 bg-gray-800/80 px-2 py-0.5 rounded border border-gray-700">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Input vs Expected */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-3.5 rounded-lg bg-[#0F0F12] border border-gray-800 text-xs">
                <span className="font-bold text-gray-200 block mb-1">Simulated Feed Input:</span>
                <p className="text-gray-400 leading-relaxed">{currentScenario.inputDescription}</p>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0F0F12] border border-gray-800 text-xs">
                <span className="font-bold text-gray-200 block mb-1">Expected Engine Behavior:</span>
                <p className="text-gray-400 leading-relaxed">{currentScenario.expectedBehavior}</p>
              </div>
            </div>

            {/* Detailed Ledger vs Bank Breakdown */}
            <div className="p-4 rounded-xl border border-gray-800 bg-[#0F0F12] text-xs space-y-2">
              <div className="font-bold text-gray-300 uppercase tracking-widest">Test Assertion Attributes:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-gray-400">
                <div>
                  <span className="text-gray-500">Ledger Entry:</span>
                  <div className="font-mono text-gray-200 font-medium">{currentScenario.details.ledgerEntry}</div>
                </div>
                <div>
                  <span className="text-gray-500">Bank Statement Entry:</span>
                  <div className="font-mono text-gray-200 font-medium">{currentScenario.details.bankEntry}</div>
                </div>
                <div>
                  <span className="text-gray-500">Matching Engine Algorithm:</span>
                  <div className="font-mono text-amber-400 font-bold">{currentScenario.details.algorithmUsed}</div>
                </div>
                <div>
                  <span className="text-gray-500">Resolution Rule:</span>
                  <div className="text-gray-200 font-medium">{currentScenario.details.resolutionRule}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Execution Console */}
          <div className="bg-[#0A0A0B] rounded-xl border border-gray-800 shadow-md p-5 text-xs font-mono text-gray-300">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 mb-3">
              <div className="flex items-center space-x-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
                <span className="font-bold text-gray-200 uppercase tracking-wider">
                  Test Execution Console & Telemetry
                </span>
              </div>
              <span className="text-[10px] text-gray-500">Node/Python Bridge • 0.012s Latency</span>
            </div>

            {simulationLog.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {simulationLog.map((log, i) => (
                  <div
                    key={i}
                    className={`leading-relaxed ${
                      log.includes('[COMPLETE]')
                        ? 'text-emerald-400 font-bold'
                        : log.includes('Verification')
                        ? 'text-amber-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-gray-500 italic">
                Click "Run Selected Scenario" to execute automated simulation steps.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
