import React, { useState } from 'react';
import { ExceptionRecord, AuditTrail } from '../types/reconciliation';
import {
  X,
  FileText,
  History,
  Send,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  AlertOctagon,
  Building2,
  ExternalLink,
  Lock,
  UserCheck,
  FileCheck
} from 'lucide-react';

interface ExceptionDetailModalProps {
  exception: ExceptionRecord | null;
  onClose: () => void;
  onResolve: (
    exceptionId: string,
    actionType: 'MAKER' | 'CHECKER',
    user: string,
    justification: string,
    approved: boolean
  ) => void;
}

export const ExceptionDetailModal: React.FC<ExceptionDetailModalProps> = ({
  exception,
  onClose,
  onResolve
}) => {
  const [activeTab, setActiveTab] = useState<'side_by_side' | 'audit_tiers' | 'maker_checker'>('side_by_side');
  const [activeTier, setActiveTier] = useState<number>(1);
  const [makerJustification, setMakerJustification] = useState('');
  const [checkerComments, setCheckerComments] = useState('');
  const [makerUser, setMakerUser] = useState('sarah.chen@fintech-ops.com');
  const [checkerUser, setCheckerUser] = useState('alex.vance@fintech-treasury.com');

  if (!exception) return null;

  const audit = exception.auditTrail;
  const bRec = exception.businessRecord;
  const bkRec = exception.bankRecord;
  const workflow = audit?.resolutionAudit.makerCheckerWorkflow;

  const handleMakerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!makerJustification.trim()) return;
    onResolve(exception.exceptionId, 'MAKER', makerUser, makerJustification, true);
    setMakerJustification('');
  };

  const handleCheckerSubmit = (approved: boolean) => {
    onResolve(exception.exceptionId, 'CHECKER', checkerUser, checkerComments || 'Verified and approved', approved);
    setCheckerComments('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-[#16161A] w-full max-w-5xl rounded-2xl shadow-2xl border border-gray-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#0F0F12] text-white flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              exception.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              exception.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-blue-500/20 text-blue-400 border border-blue-500/30'
            }`}>
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight text-gray-100">{exception.categoryName}</h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-gray-800 text-amber-400 border border-gray-700">
                  {exception.exceptionId}
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                  exception.status === 'RESOLVED' ? 'bg-emerald-950 text-emerald-400 border-emerald-800' :
                  exception.status === 'PENDING_CHECKER_APPROVAL' ? 'bg-purple-950 text-purple-400 border-purple-800' :
                  'bg-amber-950 text-amber-400 border-amber-800'
                }`}>
                  {exception.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-400 font-mono mt-0.5">
                Sub-type: <span className="text-gray-200 font-semibold">{exception.subType}</span> • Discrepancy: <span className="text-amber-400 font-semibold">{exception.discrepancyAmount.toLocaleString()}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-800 bg-[#0F0F12] px-6 pt-2">
          <button
            onClick={() => setActiveTab('side_by_side')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'side_by_side'
                ? 'border-amber-500 text-amber-400 bg-[#16161A] rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            Side-by-Side Comparison
          </button>
          <button
            onClick={() => setActiveTab('audit_tiers')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all ${
              activeTab === 'audit_tiers'
                ? 'border-amber-500 text-amber-400 bg-[#16161A] rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            6-Tier Audit Store Trail
          </button>
          <button
            onClick={() => setActiveTab('maker_checker')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
              activeTab === 'maker_checker'
                ? 'border-amber-500 text-amber-400 bg-[#16161A] rounded-t-lg'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Maker-Checker Resolution</span>
            {workflow?.dualAuthorizationRequired && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 bg-[#16161A] space-y-6">
          {/* TAB 1: SIDE BY SIDE COMPARISON */}
          {activeTab === 'side_by_side' && (
            <div className="space-y-6">
              {/* Root cause callout */}
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs">
                <div className="font-bold uppercase tracking-wider mb-1 flex items-center text-amber-400">
                  <AlertOctagon className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Root Cause Diagnosis:
                </div>
                <p className="leading-relaxed font-medium">{exception.rootCauseAnalysis}</p>
                <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[11px] text-amber-300/80">
                  <span><strong className="text-amber-300">Suggested Action:</strong> {exception.suggestedAction}</span>
                  <span className="font-mono font-bold">Escalation: {exception.escalationTier}</span>
                </div>
              </div>

              {/* Side-by-side Ledger vs Bank comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Ledger (Internal Business Record) */}
                <div className="border border-gray-800 rounded-xl p-5 bg-[#0F0F12]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-blue-400" /> Internal Ledger Record
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 font-semibold font-mono">
                      {bRec ? bRec.documentId : 'MISSING IN LEDGER'}
                    </span>
                  </div>

                  {bRec ? (
                    <dl className="mt-4 space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Document Type:</dt>
                        <dd className="font-semibold text-gray-200">{bRec.sourceType}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Payer / Customer:</dt>
                        <dd className="font-semibold text-gray-200">{bRec.payerName}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Designated Bank:</dt>
                        <dd className="font-semibold text-gray-200">{bRec.bankName}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Account Number:</dt>
                        <dd className="font-mono text-gray-300">{bRec.accountNumber}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Ledger Amount:</dt>
                        <dd className="font-bold text-sm text-gray-100">
                          {bRec.currency} {bRec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Network / Mode:</dt>
                        <dd className="font-semibold text-purple-400">{bRec.network}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Reference / UTR:</dt>
                        <dd className="font-mono text-gray-300">{bRec.rawReference}</dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-500">Posting Date:</dt>
                        <dd className="text-gray-300 font-mono">{bRec.transactionDate}</dd>
                      </div>
                    </dl>
                  ) : (
                    <div className="mt-8 text-center text-xs text-gray-500 italic">
                      No corresponding entry found in ERP ledger (Bank-originated fee or unrecorded wire).
                    </div>
                  )}
                </div>

                {/* Bank Statement Entry */}
                <div className="border border-gray-800 rounded-xl p-5 bg-[#0F0F12]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-300 flex items-center">
                      <Building2 className="w-4 h-4 mr-1.5 text-emerald-400" /> Bank Statement Record
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono">
                      {bkRec ? bkRec.documentId : 'MISSING IN BANK'}
                    </span>
                  </div>

                  {bkRec ? (
                    <dl className="mt-4 space-y-2.5 text-xs">
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Bank & Format:</dt>
                        <dd className="font-semibold text-gray-200">{bkRec.bankName}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Statement Account:</dt>
                        <dd className="font-mono text-gray-300">{bkRec.accountNumber}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Counterparty:</dt>
                        <dd className="font-semibold text-gray-200">{bkRec.payerName}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Cleared Amount:</dt>
                        <dd className="font-bold text-sm text-gray-100">
                          {bkRec.currency} {bkRec.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Fee / Deductions:</dt>
                        <dd className="font-semibold text-amber-400">{bkRec.currency} {bkRec.feeAmount.toFixed(2)}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Bank Reference:</dt>
                        <dd className="font-mono text-gray-300">{bkRec.rawReference}</dd>
                      </div>
                      <div className="flex justify-between py-1 border-b border-gray-800/60">
                        <dt className="text-gray-500">Value Date:</dt>
                        <dd className="text-gray-300 font-mono">{bkRec.settlementDate}</dd>
                      </div>
                      <div className="flex justify-between py-1">
                        <dt className="text-gray-500">Direction:</dt>
                        <dd className={`font-bold ${bkRec.direction === 'CREDIT' ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {bkRec.direction}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <div className="mt-8 text-center text-xs text-gray-500 italic">
                      No corresponding clearance found on bank statement (In-transit timing lag, or wrong-bank routed).
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: 6-TIER AUDIT STORE TRAIL */}
          {activeTab === 'audit_tiers' && audit && (
            <div className="space-y-4">
              {/* Tier selector pills */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                {[
                  { num: 1, label: '1. Source Docs', icon: FileText },
                  { num: 2, label: '2. Lifecycle', icon: History },
                  { num: 3, label: '3. Payment Init', icon: Send },
                  { num: 4, label: '4. Dispute Context', icon: MessageSquare },
                  { num: 5, label: '5. Recon Meta', icon: FileCheck },
                  { num: 6, label: '6. User Actions', icon: UserCheck }
                ].map(tier => {
                  const Icon = tier.icon;
                  return (
                    <button
                      key={tier.num}
                      onClick={() => setActiveTier(tier.num)}
                      className={`p-2.5 rounded-xl border text-left text-xs transition-all flex flex-col justify-between ${
                        activeTier === tier.num
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-semibold shadow-sm'
                          : 'bg-[#0F0F12] border-gray-800 text-gray-400 hover:bg-white/5'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mb-1.5 ${activeTier === tier.num ? 'text-amber-400' : 'text-gray-500'}`} />
                      <span className="leading-tight">{tier.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tier Content Area */}
              <div className="p-5 rounded-xl border border-gray-800 bg-[#0F0F12] text-xs text-gray-300">
                {/* Tier 1 */}
                {activeTier === 1 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <FileText className="w-4 h-4 mr-1.5 text-amber-500" /> Tier 1: Source Document References & Master Data
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <div><span className="text-gray-500">Primary Doc ID:</span> <span className="font-mono font-semibold text-gray-200">{audit.sourceDocuments.primaryDocumentId}</span></div>
                        <div><span className="text-gray-500">Invoice Number:</span> <span className="font-mono text-gray-300">{audit.sourceDocuments.invoiceNumber}</span></div>
                        <div><span className="text-gray-500">PO Reference:</span> <span className="font-mono text-gray-300">{audit.sourceDocuments.poNumber}</span></div>
                        <div><span className="text-gray-500">Contract ID:</span> <span className="font-mono text-gray-300">{audit.sourceDocuments.contractId}</span></div>
                      </div>
                      <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-4 border-gray-800">
                        <div><span className="text-gray-500">Customer Master:</span> <span className="font-semibold text-gray-200">{audit.sourceDocuments.customerMaster.name}</span></div>
                        <div><span className="text-gray-500">Tax ID / GSTIN:</span> <span className="font-mono text-gray-300">{audit.sourceDocuments.customerMaster.taxId}</span></div>
                        <div><span className="text-gray-500">Registered Bank A/C:</span> <span className="font-mono text-gray-300">{audit.sourceDocuments.customerMaster.registeredBankAccount}</span></div>
                        <div><span className="text-gray-500">Agreed Terms:</span> <span className="font-semibold text-emerald-400">{audit.sourceDocuments.customerMaster.paymentTerms}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 2 */}
                {activeTier === 2 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <History className="w-4 h-4 mr-1.5 text-blue-400" /> Tier 2: Transaction Lifecycle History & High-Value Approval Trail
                    </h4>
                    <div className="space-y-2 pt-2">
                      <div><span className="text-gray-500">Created By:</span> <span className="font-mono text-gray-200">{audit.lifecycleHistory.createdBy}</span> at {audit.lifecycleHistory.createdAt}</div>
                      <div><span className="text-gray-500">Ingestion Channel:</span> <span className="font-mono text-gray-300">{audit.lifecycleHistory.ingestionChannel}</span></div>

                      <div className="mt-3">
                        <span className="font-bold text-gray-200 block mb-1">Authorization Trail (Maker/Approval Authority):</span>
                        {audit.lifecycleHistory.approvalTrail.map((appr, idx) => (
                          <div key={idx} className="p-2.5 rounded-lg bg-[#16161A] border border-gray-800 space-y-1">
                            <div className="flex justify-between">
                              <span className="font-semibold text-gray-200">{appr.approverName} ({appr.role})</span>
                              <span className="text-gray-500 font-mono">{appr.approvedAt}</span>
                            </div>
                            <div className="text-[11px] text-gray-400">Level: {appr.authorizationLevel}</div>
                            <div className="text-[10px] font-mono text-gray-500 truncate">Signature Hash: {appr.digitalSignatureHash}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 3 */}
                {activeTier === 3 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <Send className="w-4 h-4 mr-1.5 text-purple-400" /> Tier 3: Payment Initiation Details & Clearing Submission
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <div><span className="text-gray-500">Instruction ID:</span> <span className="font-mono font-semibold text-gray-200">{audit.paymentInitiation.instructionId}</span></div>
                        <div><span className="text-gray-500">Payment Mode:</span> <span className="font-bold text-purple-400">{audit.paymentInitiation.paymentMode}</span></div>
                        <div><span className="text-gray-500">Designated Bank:</span> <span className="text-gray-300">{audit.paymentInitiation.designatedBank}</span></div>
                      </div>
                      <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-4 border-gray-800">
                        <div><span className="text-gray-500">Batch / File ID:</span> <span className="font-mono text-gray-300">{audit.paymentInitiation.batchId}</span></div>
                        <div><span className="text-gray-500">Submission Timestamp:</span> <span className="font-mono text-gray-300">{audit.paymentInitiation.submissionTimestamp}</span></div>
                        <div><span className="text-gray-500">Clearing Cycle:</span> <span className="font-mono text-gray-300">{audit.paymentInitiation.clearingCycle}</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 4 */}
                {activeTier === 4 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1.5 text-amber-400" /> Tier 4: Communication & Dispute Context
                    </h4>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between">
                        <span><strong className="text-gray-500">CRM Ticket:</strong> <code className="font-bold text-amber-400">{audit.disputeContext.crmTicketId}</code></span>
                        <span><strong className="text-gray-500">Email Thread:</strong> <code className="text-gray-300">{audit.disputeContext.emailThreadRef}</code></span>
                      </div>
                      <div className="p-2.5 rounded-lg bg-[#16161A] border border-gray-800">
                        <span className="font-bold text-gray-200 block mb-1">Prior Exception History:</span>
                        <div className="text-xs text-gray-400">
                          {audit.disputeContext.priorExceptionHistory.hasPriorExceptions
                            ? `⚠️ Customer has ${audit.disputeContext.priorExceptionHistory.priorCount} historical mismatches. Last occurrence: ${audit.disputeContext.priorExceptionHistory.lastOccurrenceDate}. Recurring discrepancy pattern flagged.`
                            : 'Clean relationship history: 0 prior exception records in the past 12 months.'}
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="font-bold text-gray-200 block mb-1">Investigator Internal Notes:</span>
                        {audit.disputeContext.internalNotes.map((n, i) => (
                          <div key={i} className="p-2 rounded bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                            <span className="font-semibold text-gray-100">{n.author} ({n.timestamp}):</span> {n.note}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 5 */}
                {activeTier === 5 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <FileCheck className="w-4 h-4 mr-1.5 text-emerald-400" /> Tier 5: Reference & Matching Engine Decision Log
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1.5">
                        <div><span className="text-gray-500">Invoice Number:</span> <span className="font-mono text-gray-300">{audit.reconciliationMetadata.invoiceNumber}</span></div>
                        <div><span className="text-gray-500">ERP Journal Ref:</span> <span className="font-mono text-gray-300">{audit.reconciliationMetadata.erpJournalNumber}</span></div>
                        <div><span className="text-gray-500">Internal Tx ID:</span> <span className="font-mono text-gray-300">{audit.reconciliationMetadata.internalTxId}</span></div>
                      </div>
                      <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l sm:pl-4 border-gray-800">
                        <div><span className="text-gray-500">UTR / RRN:</span> <span className="font-mono font-bold text-gray-200">{audit.reconciliationMetadata.utrOrRrn}</span></div>
                        <div><span className="text-gray-500">Engine Rule:</span> <span className="font-mono text-gray-300">{audit.reconciliationMetadata.engineDecisionLog.ruleEvaluated}</span></div>
                        <div><span className="text-gray-500">Match Confidence:</span> <span className="font-bold text-amber-400">{audit.reconciliationMetadata.engineDecisionLog.confidenceScore}%</span></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tier 6 */}
                {activeTier === 6 && (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-100 text-sm flex items-center">
                      <UserCheck className="w-4 h-4 mr-1.5 text-amber-400" /> Tier 6: User Resolution Actions & Audit Trail
                    </h4>
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between">
                        <span><strong className="text-gray-500">Assigned Analyst:</strong> <span className="font-semibold text-gray-200">{audit.resolutionAudit.assignedAnalyst}</span></span>
                        <span><strong className="text-gray-500">Status:</strong> <span className="font-bold text-amber-400">{audit.resolutionAudit.currentStatus}</span></span>
                      </div>
                      <div className="p-3 bg-[#16161A] rounded-lg border border-gray-800">
                        <span className="font-bold text-gray-200 block mb-1">Maker-Checker Dual Sign-off Status:</span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2 text-xs">
                          <div className="p-2 rounded bg-[#0F0F12] border border-gray-800">
                            <span className="font-semibold text-gray-100 block">Level 1: Maker (Analyst)</span>
                            <span className="text-gray-500">Action: </span>
                            <span className="font-mono text-gray-300">{workflow?.maker.action}</span>
                            <p className="mt-1 text-gray-400 italic">"{workflow?.maker.justification || 'No action yet'}"</p>
                          </div>
                          <div className="p-2 rounded bg-[#0F0F12] border border-gray-800">
                            <span className="font-semibold text-gray-100 block">Level 2: Checker (Sign-off)</span>
                            <span className="text-gray-500">Status: </span>
                            <span className="font-bold text-purple-400">{workflow?.checker.signoffStatus}</span>
                            <p className="mt-1 text-gray-400 italic">"{workflow?.checker.approvalComments || 'Awaiting checker review'}"</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: MAKER-CHECKER WORKFLOW RESOLUTION */}
          {activeTab === 'maker_checker' && (
            <div className="space-y-6">
              <div className="bg-purple-950/40 border border-purple-800/60 rounded-xl p-4 text-xs text-purple-200">
                <div className="font-bold flex items-center mb-1 text-purple-300">
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-purple-400" /> Dual-Authorization Governance (Maker-Checker):
                </div>
                <p className="text-purple-200/80">
                  Fintech compliance policy mandates two-party separation of duties for all material reconciliations.
                  The <strong>Maker</strong> investigates the root cause and proposes an adjustment or write-off. The <strong>Checker</strong> validates bank clearing slips before formal closure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Maker Action Card */}
                <div className="p-5 rounded-xl border border-gray-800 bg-[#0F0F12]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                      Step 1: Maker Investigation
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      workflow?.maker.action !== 'PENDING_ACTION'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    }`}>
                      {workflow?.maker.action !== 'PENDING_ACTION' ? 'ACTION PROPOSED' : 'AWAITING MAKER'}
                    </span>
                  </div>

                  <form onSubmit={handleMakerSubmit} className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Maker User ID:</label>
                      <input
                        type="text"
                        value={makerUser}
                        onChange={e => setMakerUser(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-[#16161A] border border-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Resolution Justification:</label>
                      <textarea
                        rows={3}
                        value={makerJustification}
                        onChange={e => setMakerJustification(e.target.value)}
                        placeholder="Detail the root cause investigation, journal voucher references, or adjustment voucher numbers..."
                        className="w-full text-xs p-3 rounded-lg bg-[#16161A] border border-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!makerJustification.trim() || exception.status === 'RESOLVED'}
                      className="w-full py-2 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:bg-gray-800 disabled:text-gray-500 text-black text-xs font-bold transition-all shadow-md flex items-center justify-center space-x-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Submit For Checker Approval</span>
                    </button>
                  </form>
                </div>

                {/* Checker Signoff Card */}
                <div className="p-5 rounded-xl border border-gray-800 bg-[#0F0F12]">
                  <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                      Step 2: Checker Authorization
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      workflow?.checker.signoffStatus === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      workflow?.checker.signoffStatus === 'PENDING_CHECKER_SIGNOFF' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {workflow?.checker.signoffStatus}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Checker (Approver) ID:</label>
                      <input
                        type="text"
                        value={checkerUser}
                        onChange={e => setCheckerUser(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-lg bg-[#16161A] border border-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-300 block mb-1">Checker Sign-off Comments:</label>
                      <textarea
                        rows={3}
                        value={checkerComments}
                        onChange={e => setCheckerComments(e.target.value)}
                        placeholder="Review bank clearance documents and state confirmation before final closing..."
                        className="w-full text-xs p-3 rounded-lg bg-[#16161A] border border-gray-700 text-gray-100 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <button
                        onClick={() => handleCheckerSubmit(false)}
                        disabled={exception.status !== 'PENDING_CHECKER_APPROVAL'}
                        className="py-2 px-3 rounded-lg border border-rose-800/80 bg-rose-950/40 hover:bg-rose-900/60 disabled:opacity-40 text-rose-300 text-xs font-bold transition-all"
                      >
                        Reject & Reroute
                      </button>
                      <button
                        onClick={() => handleCheckerSubmit(true)}
                        disabled={exception.status !== 'PENDING_CHECKER_APPROVAL'}
                        className="py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-500 text-white text-xs font-bold transition-all flex items-center justify-center space-x-1 shadow-sm"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Sign Off & Close</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#0F0F12] border-t border-gray-800 flex items-center justify-between">
          <span className="text-xs text-gray-500 font-mono">
            Audit Key: {audit?.reconciliationMetadata.internalTxId} • Created: {exception.createdAt}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg border border-gray-800 bg-[#16161A] hover:bg-white/5 text-gray-300 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
