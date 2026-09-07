export type NetworkType = 'UPI' | 'NEFT' | 'RTGS' | 'CARD' | 'SWIFT' | 'INTERNAL';

export type BankFormatType = 'MT940_V1' | 'MT940_V2' | 'CAMT053_V1' | 'CAMT053_V2';

export interface Bank {
  id: string;
  name: string;
  bicCode: string;
  accountNumber: string;
  formatType: BankFormatType;
  formatLabel: string;
  currency: string;
  active: boolean;
  country: string;
  description: string;
}

export interface BankTransaction {
  id: string;
  statementId: string;
  bankName: string;
  accountNumber: string;
  valueDate: string;
  bookingDate: string;
  direction: 'CREDIT' | 'DEBIT';
  amount: number;
  feeAmount?: number;
  network: NetworkType;
  reference: string;
  counterpartyName: string;
  counterpartyAccount?: string;
  bankIdentifier?: string;
  title?: string;
  description: string;
  rawText?: string;
}

export interface BusinessRecord {
  id: string;
  recordType: 'INVOICE' | 'RECEIPT';
  documentId: string;
  payerName: string;
  payeeName: string;
  taxId?: string;
  amount: number;
  currency: string;
  transactionDate: string;
  expectedSettlementDate?: string;
  designatedBank: string;
  designatedAccount: string;
  network: NetworkType;
  referenceNumber: string;
  poNumber?: string;
  contractId?: string;
  status: string;
  description: string;
  splitPayments?: Array<{ ref: string; amount: number }>;
  feeBreakdown?: {
    gross: number;
    mdr_fee: number;
    net_expected: number;
  };
  createdBy?: string;
  approvedBy?: string;
  notes?: string;
}

export interface CanonicalRow {
  origin: 'BUSINESS' | 'BANK';
  documentId: string;
  sourceType: string;
  bankName: string;
  accountNumber: string;
  transactionDate: string;
  settlementDate: string;
  payerName: string;
  payeeName: string;
  network: NetworkType;
  currency: string;
  amount: number;
  feeAmount: number;
  netAmount: number;
  direction: 'CREDIT' | 'DEBIT';
  rawReference: string;
  normalizedReference: string;
  description: string;
  status: string;
  rawPayload?: any;
}

export interface MatchedPair {
  matchId: string;
  rule: string;
  confidenceScore: number;
  businessRecord: CanonicalRow | BusinessRecord;
  bankRecord: CanonicalRow | BankTransaction | any;
  network: NetworkType;
  status: string;
  feeReconciled?: number;
  variance: number;
  timingLagDays?: number;
  details: string;
  matchedAt: string;
}

export type ExceptionCategory =
  | 'TIMING_BASED'
  | 'AMOUNT_MISMATCH'
  | 'MISSING_COUNTERPART'
  | 'DUPLICATE_ENTRY'
  | 'DATA_ENTRY_ERROR'
  | 'REVERSAL_DISPUTE'
  | 'STRUCTURAL_FORMAT'
  | 'CROSS_BANK_SPECIFIC'
  | 'COMPLIANCE_AML'
  | 'TEMPLATE_FORMAT';

export type ExceptionSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type ExceptionStatus =
  | 'OPEN'
  | 'INVESTIGATING'
  | 'PENDING_CHECKER_APPROVAL'
  | 'RESOLVED'
  | 'WRITTEN_OFF';

export interface MakerCheckerWorkflow {
  dualAuthorizationRequired: boolean;
  maker: {
    userId: string;
    action: string;
    timestamp: string | null;
    justification: string;
  };
  checker: {
    userId: string;
    signoffStatus: 'AWAITING_MAKER' | 'PENDING_CHECKER_SIGNOFF' | 'APPROVED' | 'REJECTED';
    signoffTimestamp: string | null;
    approvalComments: string;
  };
}

export interface AuditTrail {
  exceptionId: string;
  generatedAt: string;
  sourceDocuments: {
    primaryDocumentId: string;
    documentType: string;
    invoiceNumber: string;
    poNumber: string;
    contractId: string;
    documentUrl: string;
    customerMaster: {
      name: string;
      taxId: string;
      registeredBankAccount: string;
      paymentTerms: string;
      creditRating: string;
    };
  };
  lifecycleHistory: {
    createdBy: string;
    createdAt: string;
    ingestionChannel: string;
    modificationLog: Array<{
      timestamp: string;
      userId: string;
      fieldModified: string;
      oldValue: string;
      newValue: string;
    }>;
    approvalTrail: Array<{
      approverName: string;
      role: string;
      authorizationLevel: string;
      approvedAt: string;
      digitalSignatureHash: string;
    }>;
  };
  paymentInitiation: {
    instructionId: string;
    paymentMode: string;
    designatedBank: string;
    beneficiaryAccount: string;
    batchId: string;
    submissionTimestamp: string;
    clearingCycle: string;
  };
  disputeContext: {
    internalNotes: Array<{
      author: string;
      timestamp: string;
      note: string;
    }>;
    crmTicketId: string;
    emailThreadRef: string;
    priorExceptionHistory: {
      hasPriorExceptions: boolean;
      priorCount: number;
      lastOccurrenceDate: string;
      recurringDiscrepancyFlag: boolean;
    };
  };
  reconciliationMetadata: {
    invoiceNumber: string;
    erpJournalNumber: string;
    internalTxId: string;
    utrOrRrn: string;
    bankReference: string;
    engineDecisionLog: {
      ruleEvaluated: string;
      failedCriteria: string;
      confidenceScore: number;
      varianceDetected: number;
      reason: string;
    };
  };
  resolutionAudit: {
    assignedAnalyst: string;
    investigationStartedAt: string;
    currentStatus: ExceptionStatus;
    suggestedAction: string;
    manualOverrideApplied: boolean;
    resolutionNotes: string;
    resolvedAt: string | null;
    firstLevelActionBy: string | null;
    makerCheckerWorkflow: MakerCheckerWorkflow;
  };
}

export interface ExceptionRecord {
  exceptionId: string;
  categoryId: ExceptionCategory;
  categoryName: string;
  subType: string;
  severity: ExceptionSeverity;
  status: ExceptionStatus;
  businessRecord?: CanonicalRow | null;
  bankRecord?: CanonicalRow | null;
  discrepancyAmount: number;
  rootCauseAnalysis: string;
  suggestedAction: string;
  requiresApproval: boolean;
  escalationTier: string;
  createdAt: string;
  auditTrail?: AuditTrail;
}

export interface ReconciliationSummary {
  totalBusinessRecords: number;
  totalBankRecords: number;
  reconciledPairsCount: number;
  exceptionsCount: number;
  autoMatchRatePercentage: number;
  totalSettledVolumeInrEquiv: number;
  timestamp: string;
}

export interface BankHealth {
  name: string;
  format: string;
  totalTx: number;
  matched: number;
  exceptions: number;
  volume: number;
  currency: string;
  status: 'HEALTHY' | 'ATTENTION' | 'CRITICAL';
}
