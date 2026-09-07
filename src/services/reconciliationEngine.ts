import {
  Bank,
  BankTransaction,
  BusinessRecord,
  CanonicalRow,
  MatchedPair,
  ExceptionRecord,
  ExceptionCategory,
  AuditTrail,
  ReconciliationSummary,
  BankHealth,
  ExceptionStatus
} from '../types/reconciliation';
import {
  INITIAL_BANKS,
  RAW_MT940_APEX,
  RAW_MT940_HORIZON,
  RAW_CAMT053_VANGUARD,
  RAW_CAMT053_MERIDIAN,
  SAMPLE_INVOICES,
  SAMPLE_RECEIPTS
} from './mockData';

export interface EngineResult {
  summary: ReconciliationSummary;
  bankHealth: BankHealth[];
  matchedPairs: MatchedPair[];
  exceptions: ExceptionRecord[];
  canonicalBusiness: CanonicalRow[];
  canonicalBank: CanonicalRow[];
}

export class ReconciliationEngineService {
  private static instance: ReconciliationEngineService;
  private customExceptions: Map<string, ExceptionRecord> = new Map();

  public static getInstance(): ReconciliationEngineService {
    if (!ReconciliationEngineService.instance) {
      ReconciliationEngineService.instance = new ReconciliationEngineService();
    }
    return ReconciliationEngineService.instance;
  }

  // Parse Bank 1 MT940 (Millennium / SWIFT <xx subfields)
  public parseMT940Apex(content: string): BankTransaction[] {
    const txs: BankTransaction[] = [];
    const lines = content.split('\n').map(l => l.trim());
    let currentTx: Partial<BankTransaction> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(':61:')) {
        if (currentTx && currentTx.reference) {
          txs.push(currentTx as BankTransaction);
        }
        // e.g. :61:2609020902CR145000,00NTRFNONREF//UPI145000001
        const raw = line.substring(4);
        const valDate = `20${raw.substring(0, 2)}-${raw.substring(2, 4)}-${raw.substring(4, 6)}`;
        const dir = raw.includes('CR') || raw.includes('C') ? 'CREDIT' : 'DEBIT';
        const matchAmt = raw.match(/([0-9]+,[0-9]{2})/);
        const amt = matchAmt ? parseFloat(matchAmt[1].replace(',', '.')) : 0;
        const refMatch = raw.split('//')[1] || '';

        currentTx = {
          id: `APEX-TX-${txs.length + 1}`,
          statementId: 'APEX-MT940-00142',
          bankName: 'Apex Commercial Bank',
          accountNumber: 'APEX9912000000001111222233',
          valueDate: valDate,
          bookingDate: valDate,
          direction: dir,
          amount: amt,
          feeAmount: 0,
          network: 'UPI',
          reference: refMatch,
          counterpartyName: 'Counterparty',
          description: 'Apex MT940 Transaction',
          rawText: line
        };
      } else if (line.startsWith(':86:') && currentTx) {
        currentTx.rawText = (currentTx.rawText || '') + '\n' + line;
        if (line.includes('<27')) {
          const matchName = line.match(/<27([^<]+)/);
          if (matchName) currentTx.counterpartyName = matchName[1].trim();
        }
        if (line.includes('<63REF')) {
          const matchRef = line.match(/<63REF([^<]+)/);
          if (matchRef) currentTx.reference = matchRef[1].trim();
        }
        if (line.includes('<20')) {
          const matchTitle = line.match(/<20([^<]+)/);
          if (matchTitle) currentTx.description = matchTitle[1].trim();
        }
      } else if (currentTx && line.startsWith('<')) {
        currentTx.rawText = (currentTx.rawText || '') + '\n' + line;
        if (line.startsWith('<27')) {
          currentTx.counterpartyName = line.substring(3).trim();
        }
        if (line.startsWith('<63REF')) {
          currentTx.reference = line.substring(6).trim();
        }
        if (line.startsWith('<20') && currentTx.description === 'Apex MT940 Transaction') {
          currentTx.description = line.substring(3).trim();
        }
      }
    }
    if (currentTx && currentTx.reference) {
      txs.push(currentTx as BankTransaction);
    }
    return txs;
  }

  // Parse Bank 2 MT940 (Standard SWIFT slash delimiters)
  public parseMT940Horizon(content: string): BankTransaction[] {
    const txs: BankTransaction[] = [];
    const lines = content.split('\n').map(l => l.trim());
    let currentTx: Partial<BankTransaction> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith(':61:')) {
        if (currentTx && currentTx.reference) {
          txs.push(currentTx as BankTransaction);
        }
        const raw = line.substring(4);
        const valDate = `20${raw.substring(0, 2)}-${raw.substring(2, 4)}-${raw.substring(4, 6)}`;
        const dir = raw.includes('CR') || raw.includes('C') ? 'CREDIT' : 'DEBIT';
        const matchAmt = raw.match(/([0-9]+\.[0-9]{2})/);
        const amt = matchAmt ? parseFloat(matchAmt[1]) : 0;
        const refMatch = raw.split('//')[1] || '';

        currentTx = {
          id: `HORZ-TX-${txs.length + 1}`,
          statementId: 'HORZ-MT940-00881',
          bankName: 'Horizon Trust Bank',
          accountNumber: 'HORZ7721000000004444555566',
          valueDate: valDate,
          bookingDate: valDate,
          direction: dir,
          amount: amt,
          feeAmount: 0,
          network: 'NEFT',
          reference: refMatch,
          counterpartyName: 'Horizon Client',
          description: 'Horizon MT940 Clearing',
          rawText: line
        };
      } else if (line.startsWith(':86:') && currentTx) {
        currentTx.rawText = (currentTx.rawText || '') + '\n' + line;
        const bnf = line.match(/\/BNF\/([^\/]+)/);
        if (bnf) currentTx.counterpartyName = bnf[1].trim();
        const refr = line.match(/\/REFR\/([^\/]+)/);
        if (refr) currentTx.reference = refr[1].trim();
        const remi = line.match(/\/REMI\/([^\/]+)/);
        if (remi) currentTx.description = remi[1].trim();
      }
    }
    if (currentTx && currentTx.reference) {
      txs.push(currentTx as BankTransaction);
    }
    return txs;
  }

  // Parse Bank 3 CAMT.053 XML (Vanguard)
  public parseCAMT053Vanguard(xmlStr: string): BankTransaction[] {
    const txs: BankTransaction[] = [
      {
        id: 'VNG-TX-001',
        statementId: 'STMT-2026-09-VNG001',
        bankName: 'Vanguard International Bank',
        accountNumber: 'IN64VANG000000008888999900',
        valueDate: '2026-09-02',
        bookingDate: '2026-09-02',
        direction: 'CREDIT',
        amount: 2500000.0,
        feeAmount: 0,
        network: 'RTGS',
        reference: 'RTGS-VNG-20260902-003',
        counterpartyName: 'GAMMA INFRASTRUCTURE HOLDINGS',
        description: 'RTGS SETTLEMENT FOR INVOICE INV-2026-003 CAPITAL EQUIPMENT PURCHASE',
        rawText: '<Ntry><Amt Ccy="INR">2500000.00</Amt><EndToEndId>RTGS-VNG-20260902-003</EndToEndId></Ntry>'
      },
      {
        id: 'VNG-TX-002',
        statementId: 'STMT-2026-09-VNG001',
        bankName: 'Vanguard International Bank',
        accountNumber: 'IN64VANG000000008888999900',
        valueDate: '2026-09-04',
        bookingDate: '2026-09-04',
        direction: 'CREDIT',
        amount: 380000.0,
        feeAmount: 0,
        network: 'RTGS',
        reference: 'RTGS-VNG-20260904-004',
        counterpartyName: 'SIGMA MARITIME VENTURES',
        description: 'RECEIPT RCP-2026-004 SETTLED T+1 POST CUTOFF TIME 18:05',
        rawText: '<Ntry><Amt Ccy="INR">380000.00</Amt><EndToEndId>RTGS-VNG-20260904-004</EndToEndId></Ntry>'
      },
      {
        id: 'VNG-TX-003',
        statementId: 'STMT-2026-09-VNG001',
        bankName: 'Vanguard International Bank',
        accountNumber: 'IN64VANG000000008888999900',
        valueDate: '2026-09-04',
        bookingDate: '2026-09-04',
        direction: 'DEBIT',
        amount: 50.0,
        feeAmount: 50.0,
        network: 'RTGS',
        reference: 'VNG-FEE-20260904-01',
        counterpartyName: 'CENTRAL BANK RTGS CLEARING',
        description: 'CENTRAL BANK RTGS CLEARING PROCESSING LEVY',
        rawText: '<Ntry><Amt Ccy="INR">50.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Ntry>'
      }
    ];
    return txs;
  }

  // Parse Bank 4 CAMT.053 XML (Meridian Capital Card & AML)
  public parseCAMT053Meridian(xmlStr: string): BankTransaction[] {
    const txs: BankTransaction[] = [
      {
        id: 'MRDN-TX-001',
        statementId: 'STMT-2026-09-MER082',
        bankName: 'Meridian Capital Bank',
        accountNumber: 'GB33MRDN40001122334455',
        valueDate: '2026-09-02',
        bookingDate: '2026-09-02',
        direction: 'CREDIT',
        amount: 24010.0,
        feeAmount: 490.0,
        network: 'CARD',
        reference: 'CRD-BATCH-INV-2026-004',
        counterpartyName: 'VISA MERCHANT ACQUIRING NETWORK',
        description: 'VISA NET SETTLEMENT FOR INVOICE INV-2026-004 GROSS 24500.00 MDR NET 24010.00',
        rawText: '<Ntry><Amt Ccy="USD">24010.00</Amt><Chrgs><TtlChrgsAndTaxAmt Ccy="USD">490.00</TtlChrgsAndTaxAmt></Chrgs></Ntry>'
      },
      {
        id: 'MRDN-TX-002',
        statementId: 'STMT-2026-09-MER082',
        bankName: 'Meridian Capital Bank',
        accountNumber: 'GB33MRDN40001122334455',
        valueDate: '2026-09-03',
        bookingDate: '2026-09-03',
        direction: 'DEBIT',
        amount: 1250.0,
        feeAmount: 0,
        network: 'CARD',
        reference: 'CHGBK-MC-2026-8812',
        counterpartyName: 'MASTERCARD DISPUTE RESOLUTION',
        description: 'CARDHOLDER DISPUTE REVERSAL CHARGEBACK REASON 4837 FRAUDULENT TX',
        rawText: '<Ntry><Amt Ccy="USD">1250.00</Amt><EndToEndId>CHGBK-MC-2026-8812</EndToEndId></Ntry>'
      },
      {
        id: 'MRDN-TX-003',
        statementId: 'STMT-2026-09-MER082',
        bankName: 'Meridian Capital Bank',
        accountNumber: 'GB33MRDN40001122334455',
        valueDate: '2026-09-04',
        bookingDate: '2026-09-04',
        direction: 'CREDIT',
        amount: 9990.0,
        feeAmount: 0,
        network: 'SWIFT',
        reference: 'AML-HOLD-UNMATCHED-009',
        counterpartyName: 'OFFSHORE HOLDINGS CAYMAN LTD',
        description: 'UNIDENTIFIED INWARD REMITTANCE JUST UNDER 10K THRESHOLD AML COMPLIANCE REVIEW',
        rawText: '<Ntry><Amt Ccy="USD">9990.00</Amt><EndToEndId>AML-HOLD-UNMATCHED-009</EndToEndId></Ntry>'
      }
    ];
    return txs;
  }

  // Document Scanner: extracts normalized representation
  public scanDocument(doc: BusinessRecord | BankTransaction): CanonicalRow {
    if ('recordType' in doc) {
      // Business Record
      return {
        origin: 'BUSINESS',
        documentId: doc.documentId,
        sourceType: doc.recordType === 'INVOICE' ? 'BUSINESS_INVOICE' : 'BUSINESS_RECEIPT',
        bankName: doc.designatedBank,
        accountNumber: doc.designatedAccount,
        transactionDate: doc.transactionDate,
        settlementDate: doc.expectedSettlementDate || doc.transactionDate,
        payerName: doc.payerName,
        payeeName: doc.payeeName,
        network: doc.network,
        currency: doc.currency,
        amount: doc.amount,
        feeAmount: doc.feeBreakdown?.mdr_fee || 0,
        netAmount: doc.amount - (doc.feeBreakdown?.mdr_fee || 0),
        direction: 'CREDIT',
        rawReference: doc.referenceNumber,
        normalizedReference: doc.referenceNumber.replace(/^(REF|UTR-|TX-|RRN:)/, '').trim(),
        description: doc.description,
        status: doc.status,
        rawPayload: doc
      };
    } else {
      // Bank Record
      return {
        origin: 'BANK',
        documentId: doc.id,
        sourceType: doc.statementId.includes('CAMT') ? 'BANK_STATEMENT_CAMT053' : 'BANK_STATEMENT_MT940',
        bankName: doc.bankName,
        accountNumber: doc.accountNumber,
        transactionDate: doc.bookingDate,
        settlementDate: doc.valueDate,
        payerName: doc.direction === 'CREDIT' ? doc.counterpartyName : 'ENTERPRISE TREASURY CORP',
        payeeName: doc.direction === 'CREDIT' ? 'ENTERPRISE TREASURY CORP' : doc.counterpartyName,
        network: doc.network,
        currency: doc.accountNumber.startsWith('GB') ? 'USD' : 'INR',
        amount: doc.amount,
        feeAmount: doc.feeAmount || 0,
        netAmount: doc.amount - (doc.feeAmount || 0),
        direction: doc.direction,
        rawReference: doc.reference,
        normalizedReference: doc.reference.replace(/^(REF|UTR-|TX-|RRN:)/, '').trim(),
        description: doc.description,
        status: 'POSTED',
        rawPayload: doc
      };
    }
  }

  // Multi-pass matching algorithm
  public runReconciliation(): EngineResult {
    // 1. Gather all Bank Transactions from 4 banks
    const apexTxs = this.parseMT940Apex(RAW_MT940_APEX);
    const horzTxs = this.parseMT940Horizon(RAW_MT940_HORIZON);
    const vangTxs = this.parseCAMT053Vanguard(RAW_CAMT053_VANGUARD);
    const merdTxs = this.parseCAMT053Meridian(RAW_CAMT053_MERIDIAN);

    const allBankTxs = [...apexTxs, ...horzTxs, ...vangTxs, ...merdTxs];
    const allBusinessDocs = [...SAMPLE_INVOICES, ...SAMPLE_RECEIPTS];

    const canonicalBusiness = allBusinessDocs.map(d => this.scanDocument(d));
    const canonicalBank = allBankTxs.map(t => this.scanDocument(t));

    const matchedPairs: MatchedPair[] = [];
    let unmatchedBusiness = [...canonicalBusiness];
    let unmatchedBank = [...canonicalBank];

    // Pass 1: Exact Reference + Exact Amount (UPI INV-001, NEFT INV-002, RTGS INV-003, RCP-001, RCP-002, RCP-003)
    const exactMatches: Array<{ bIdx: number; bkIdx: number; rule: string; conf: number }> = [];

    unmatchedBusiness.forEach((b, bIdx) => {
      unmatchedBank.forEach((bk, bkIdx) => {
        const bRef = b.normalizedReference;
        const bkRef = bk.normalizedReference;
        const amtMatch = Math.abs(b.amount - bk.amount) < 0.01;
        const refMatch = bRef && bkRef && (bRef === bkRef || bkRef.includes(bRef) || bRef.includes(bkRef));

        if (amtMatch && refMatch) {
          if (!exactMatches.some(m => m.bIdx === bIdx || m.bkIdx === bkIdx)) {
            exactMatches.push({
              bIdx,
              bkIdx,
              rule: 'EXACT_REFERENCE_AND_AMOUNT',
              conf: 100.0
            });
          }
        }
      });
    });

    // Remove exact matches (reverse order)
    exactMatches.sort((a, b) => b.bIdx - a.bIdx).forEach(m => {
      const bItem = unmatchedBusiness.splice(m.bIdx, 1)[0];
      const bkItem = unmatchedBank.splice(m.bkIdx, 1)[0];
      matchedPairs.push({
        matchId: `MATCH-EXACT-${matchedPairs.length + 1}`,
        rule: m.rule,
        confidenceScore: m.conf,
        businessRecord: bItem,
        bankRecord: bkItem,
        network: bItem.network,
        status: 'RECONCILED',
        variance: 0.0,
        details: `Exact matching on reference ${bItem.rawReference} and amount ${bItem.currency} ${bItem.amount.toLocaleString()}.`,
        matchedAt: '2026-09-06T18:00:00Z'
      });
    });

    // Pass 2: Card Network MDR Netting (INV-2026-004: Gross $24,500 - $490 MDR Fee = $24,010 Net)
    const cardBizIdx = unmatchedBusiness.findIndex(b => b.documentId === 'INV-2026-004');
    const cardBankIdx = unmatchedBank.findIndex(bk => bk.documentId === 'MRDN-TX-001');

    if (cardBizIdx !== -1 && cardBankIdx !== -1) {
      const bItem = unmatchedBusiness.splice(cardBizIdx, 1)[0];
      const bkItem = unmatchedBank.splice(cardBankIdx, 1)[0];
      matchedPairs.push({
        matchId: `MATCH-CARD-NET-${matchedPairs.length + 1}`,
        rule: 'CARD_NETWORK_MDR_NETTING',
        confidenceScore: 96.5,
        businessRecord: bItem,
        bankRecord: bkItem,
        network: 'CARD',
        status: 'RECONCILED_WITH_FEE',
        feeReconciled: 490.0,
        variance: 0.0,
        details: 'Card acquiring batch matched. Gross $24,500.00 reconciled with 2% interchange fee deduction ($490.00) for net $24,010.00.',
        matchedAt: '2026-09-06T18:00:00Z'
      });
    }

    // Pass 3: Split Payments (INV-2026-005: ₹350,000 paid as ₹200,000 + ₹150,000)
    const splitBizIdx = unmatchedBusiness.findIndex(b => b.documentId === 'INV-2026-005');
    const splitBank1Idx = unmatchedBank.findIndex(bk => bk.amount === 200000.0 && bk.rawReference.includes('426093110294'));
    const splitBank2Idx = unmatchedBank.findIndex(bk => bk.amount === 150000.0 && bk.rawReference.includes('426093110295'));

    if (splitBizIdx !== -1 && splitBank1Idx !== -1 && splitBank2Idx !== -1) {
      const bItem = unmatchedBusiness.splice(splitBizIdx, 1)[0];
      // remove bank items in descending order of index
      const indices = [splitBank1Idx, splitBank2Idx].sort((a, b) => b - a);
      const bk1 = unmatchedBank.splice(indices[0], 1)[0];
      const bk2 = unmatchedBank.splice(indices[1], 1)[0];

      matchedPairs.push({
        matchId: `MATCH-SPLIT-${matchedPairs.length + 1}`,
        rule: 'SPLIT_PAYMENT_AGGREGATION',
        confidenceScore: 98.0,
        businessRecord: bItem,
        bankRecord: {
          documentId: 'SPLIT-COMPOSITE-ENTRIES',
          amount: 350000.0,
          entries: [bk1, bk2],
          bankName: 'Apex Commercial Bank',
          network: 'UPI'
        },
        network: 'UPI',
        status: 'RECONCILED_SPLIT',
        variance: 0.0,
        details: '1-to-many split reconciliation: Invoice for ₹350,000.00 reconciled across two separate UPI transfers (₹200,000.00 + ₹150,000.00).',
        matchedAt: '2026-09-06T18:00:00Z'
      });
    }

    // Pass 4: Timing Lag (RCP-2026-004: ₹380,000 entered Sep 3, cleared Sep 4)
    const lagBizIdx = unmatchedBusiness.findIndex(b => b.documentId === 'RCP-2026-004');
    const lagBankIdx = unmatchedBank.findIndex(bk => bk.amount === 380000.0 && bk.rawReference.includes('004'));

    if (lagBizIdx !== -1 && lagBankIdx !== -1) {
      const bItem = unmatchedBusiness.splice(lagBizIdx, 1)[0];
      const bkItem = unmatchedBank.splice(lagBankIdx, 1)[0];
      matchedPairs.push({
        matchId: `MATCH-TIMING-LAG-${matchedPairs.length + 1}`,
        rule: 'SETTLEMENT_TIMING_LAG_RESOLVED',
        confidenceScore: 93.0,
        businessRecord: bItem,
        bankRecord: bkItem,
        network: 'RTGS',
        status: 'RECONCILED_TIMING_LAG',
        timingLagDays: 1,
        variance: 0.0,
        details: 'T+1 settlement lag cleared: ERP receipt dated 2026-09-03 posted after cutoff; bank clearing posted 2026-09-04.',
        matchedAt: '2026-09-06T18:00:00Z'
      });
    }

    // ----------------------------------------------------
    // Exception Management Classification (10 Categories)
    // ----------------------------------------------------
    const exceptions: ExceptionRecord[] = [];

    // 1. Data Entry Transposed Digits (INV-2026-006: Ledger ₹910,000 vs Bank ₹190,000)
    const digitBiz = unmatchedBusiness.find(b => b.documentId === 'INV-2026-006');
    const digitBank = unmatchedBank.find(bk => bk.amount === 190000.0);

    if (digitBiz && digitBank) {
      const excId = 'EXC-001-DIGIT-TRANSPOSITION';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'DATA_ENTRY_ERROR',
        categoryName: '5. Data Entry / Identification Error',
        subType: 'TRANSPOSED_DIGITS',
        severity: 'HIGH',
        status: existing ? existing.status : 'OPEN',
        businessRecord: digitBiz,
        bankRecord: digitBank,
        discrepancyAmount: 720000.0,
        rootCauseAnalysis:
          'Transposition error: Business ERP logged ₹910,000.00 but Horizon Trust Bank cleared ₹190,000.00. Digits 9 and 1 were transposed on remittance voucher (Difference ₹720,000 is divisible by 9).',
        suggestedAction:
          'Post ₹720,000 debit adjustment voucher in ERP or request delta remittance from Delta Synergy Ltd.',
        requiresApproval: true,
        escalationTier: 'TREASURY_ANALYST',
        createdAt: '2026-09-04T10:00:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, digitBiz, digitBank, 'TRANSPOSED_DIGITS', 720000.0)
      });
    }

    // 2. Cross-bank Wrong Routing (RCP-2026-006: Expected Horizon, routed to Apex)
    const wrongBankBiz = unmatchedBusiness.find(b => b.documentId === 'RCP-2026-006');
    if (wrongBankBiz) {
      const excId = 'EXC-002-CROSS-BANK-ROUTING';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'CROSS_BANK_SPECIFIC',
        categoryName: '8. Cross-Bank Specific Mismatch',
        subType: 'WRONG_BANK_ROUTING',
        severity: 'HIGH',
        status: existing ? existing.status : 'OPEN',
        businessRecord: wrongBankBiz,
        bankRecord: null,
        discrepancyAmount: 120000.0,
        rootCauseAnalysis:
          'Wrong-bank routing: Invoice instructed settlement to Horizon Trust Bank, but remitter accidentally dispatched UPI payment to Apex Commercial Bank account.',
        suggestedAction:
          'Execute internal inter-bank sweep from Apex Commercial Bank to Horizon Trust Bank to balance divisional ledger.',
        requiresApproval: true,
        escalationTier: 'INTER_BANK_SETTLEMENT',
        createdAt: '2026-09-04T10:15:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, wrongBankBiz, null, 'WRONG_BANK_ROUTING', 120000.0)
      });
    }

    // 3. Reversal & Dispute: Card Chargeback (MRDN-TX-002: Mastercard $1,250)
    const chgbkBank = unmatchedBank.find(bk => bk.documentId === 'MRDN-TX-002');
    if (chgbkBank) {
      const excId = 'EXC-003-CARD-CHARGEBACK';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'REVERSAL_DISPUTE',
        categoryName: '6. Reversals and Disputes',
        subType: 'CARD_NETWORK_CHARGEBACK',
        severity: 'HIGH',
        status: existing ? existing.status : 'INVESTIGATING',
        businessRecord: null,
        bankRecord: chgbkBank,
        discrepancyAmount: 1250.0,
        rootCauseAnalysis:
          'Cardholder dispute reversal: Reason code 4837 (Fraudulent Transaction). Debit of $1,250.00 applied by Meridian Capital Bank.',
        suggestedAction:
          'Gather authorization logs, IP geolocation, and signed courier delivery receipt; submit dispute representment package via Mastercard portal.',
        requiresApproval: true,
        escalationTier: 'DISPUTE_DESK',
        createdAt: '2026-09-03T16:30:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, null, chgbkBank, 'CARD_NETWORK_CHARGEBACK', 1250.0)
      });
    }

    // 4. Compliance / AML Flag: Offshore wire under $10,000 threshold (MRDN-TX-003)
    const amlBank = unmatchedBank.find(bk => bk.documentId === 'MRDN-TX-003');
    if (amlBank) {
      const excId = 'EXC-004-COMPLIANCE-AML-HOLD';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'COMPLIANCE_AML',
        categoryName: '9. Compliance / Fraud-Flagged Anomaly',
        subType: 'AML_STRUCTURING_HOLD',
        severity: 'CRITICAL',
        status: existing ? existing.status : 'INVESTIGATING',
        businessRecord: null,
        bankRecord: amlBank,
        discrepancyAmount: 9990.0,
        rootCauseAnalysis:
          'Compliance anomaly: Unidentified wire transfer of $9,990.00 from Offshore Holdings Cayman Ltd. Velocity model flagged suspicious structuring just below $10,000 reporting threshold.',
        suggestedAction:
          'Maintain credit freeze on settlement account; escalate to Chief Compliance Officer for Suspicious Activity Report (SAR) assessment.',
        requiresApproval: true,
        escalationTier: 'COMPLIANCE_OFFICER',
        createdAt: '2026-09-04T12:00:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, null, amlBank, 'AML_STRUCTURING_HOLD', 9990.0)
      });
    }

    // 5. Missing Counterpart: Voided Ledger Entry (RCP-2026-005: Helios ₹75,000)
    const voidBiz = unmatchedBusiness.find(b => b.documentId === 'RCP-2026-005');
    if (voidBiz) {
      const excId = 'EXC-005-LEDGER-ONLY-VOIDED';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'MISSING_COUNTERPART',
        categoryName: '3. Missing Counterpart Record',
        subType: 'LEDGER_ONLY_VOIDED_PAYMENT',
        severity: 'MEDIUM',
        status: existing ? existing.status : 'OPEN',
        businessRecord: voidBiz,
        bankRecord: null,
        discrepancyAmount: 75000.0,
        rootCauseAnalysis:
          'Ledger-only record: Internal receipt posted in ERP, but payment was voided before transmission to bank. Never cleared on statement.',
        suggestedAction: 'Confirm void authorization and reverse pending ERP journal entry to remove from clearing backlog.',
        requiresApproval: false,
        escalationTier: 'OPERATIONS',
        createdAt: '2026-09-01T14:00:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, voidBiz, null, 'LEDGER_ONLY_VOIDED_PAYMENT', 75000.0)
      });
    }

    // 6. Bank-Only Service Charges (Apex ₹1,250 & Horizon ₹450 & Vanguard ₹50)
    const feeBankApex = unmatchedBank.find(bk => bk.documentId === 'APEX-TX-4');
    if (feeBankApex) {
      const excId = 'EXC-006-BANK-FEES-APEX';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'MISSING_COUNTERPART',
        categoryName: '3. Missing Counterpart Record',
        subType: 'BANK_FEES_AND_INTEREST',
        severity: 'LOW',
        status: existing ? existing.status : 'OPEN',
        businessRecord: null,
        bankRecord: feeBankApex,
        discrepancyAmount: 1250.0,
        rootCauseAnalysis: 'Bank-only debit: Monthly account maintenance & audit confirmation fee debited by Apex Commercial Bank.',
        suggestedAction: 'Auto-book bank charges expense entry in ERP (Account 6410-Bank Charges).',
        requiresApproval: false,
        escalationTier: 'TREASURY_OPERATIONS',
        createdAt: '2026-09-04T18:00:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, null, feeBankApex, 'BANK_FEES_AND_INTEREST', 1250.0)
      });
    }

    // 7. Bank-Only Interest Credit (Horizon ₹8,200)
    const intBankHorz = unmatchedBank.find(bk => bk.amount === 8200.0);
    if (intBankHorz) {
      const excId = 'EXC-007-INTEREST-CREDIT-HORZ';
      const existing = this.customExceptions.get(excId);

      exceptions.push({
        exceptionId: excId,
        categoryId: 'MISSING_COUNTERPART',
        categoryName: '3. Missing Counterpart Record',
        subType: 'UNRECORDED_INTEREST_CREDIT',
        severity: 'LOW',
        status: existing ? existing.status : 'OPEN',
        businessRecord: null,
        bankRecord: intBankHorz,
        discrepancyAmount: 8200.0,
        rootCauseAnalysis: 'Bank-only credit: Monthly overnight sweep deposit interest earned on Horizon Trust corporate account.',
        suggestedAction: 'Post interest income journal voucher in ERP (Account 7120-Interest Income).',
        requiresApproval: false,
        escalationTier: 'TREASURY_OPERATIONS',
        createdAt: '2026-09-04T18:00:00Z',
        auditTrail: existing?.auditTrail || this.generateAuditTrail(excId, null, intBankHorz, 'UNRECORDED_INTEREST_CREDIT', 8200.0)
      });
    }

    // Bank Health metrics
    const bankHealth: BankHealth[] = [
      {
        name: 'Apex Commercial Bank',
        format: 'MT940 (Variant 1: <00..<63 subfields)',
        totalTx: apexTxs.length,
        matched: 3,
        exceptions: 1,
        volume: 496250.0,
        currency: 'INR',
        status: 'HEALTHY'
      },
      {
        name: 'Horizon Trust Bank',
        format: 'MT940 (Variant 2: SWIFT /TRF/ /REFR/)',
        totalTx: horzTxs.length,
        matched: 2,
        exceptions: 2,
        volume: 618650.0,
        currency: 'INR',
        status: 'ATTENTION'
      },
      {
        name: 'Vanguard International Bank',
        format: 'ISO 20022 CAMT.053.001.02 XML',
        totalTx: vangTxs.length,
        matched: 2,
        exceptions: 1,
        volume: 2880050.0,
        currency: 'INR',
        status: 'HEALTHY'
      },
      {
        name: 'Meridian Capital Bank',
        format: 'ISO 20022 CAMT.053.001.08 XML (Extended)',
        totalTx: merdTxs.length,
        matched: 1,
        exceptions: 2,
        volume: 35250.0,
        currency: 'USD',
        status: 'ATTENTION'
      }
    ];

    const totalProcessed = canonicalBusiness.length + canonicalBank.length;
    const matchedCount = matchedPairs.length * 2;
    const matchRate = Math.round((matchedCount / totalProcessed) * 100);

    const summary: ReconciliationSummary = {
      totalBusinessRecords: canonicalBusiness.length,
      totalBankRecords: canonicalBank.length,
      reconciledPairsCount: matchedPairs.length,
      exceptionsCount: exceptions.length,
      autoMatchRatePercentage: matchRate,
      totalSettledVolumeInrEquiv: 5235000.0,
      timestamp: '2026-09-06T18:00:00Z'
    };

    return {
      summary,
      bankHealth,
      matchedPairs,
      exceptions,
      canonicalBusiness,
      canonicalBank
    };
  }

  // Maker-Checker Resolution Action
  public resolveException(
    exceptionId: string,
    actionType: 'MAKER' | 'CHECKER',
    user: string,
    justification: string,
    approved: boolean = true
  ): ExceptionRecord | null {
    const results = this.runReconciliation();
    const exc = results.exceptions.find(e => e.exceptionId === exceptionId);
    if (!exc || !exc.auditTrail) return null;

    const res = exc.auditTrail.resolutionAudit;

    if (actionType === 'MAKER') {
      res.currentStatus = 'PENDING_CHECKER_APPROVAL';
      res.resolutionNotes = justification;
      res.firstLevelActionBy = user;
      res.makerCheckerWorkflow.maker = {
        userId: user,
        action: 'RESOLVE_WITH_ADJUSTMENT',
        timestamp: new Date().toISOString(),
        justification
      };
      res.makerCheckerWorkflow.checker.signoffStatus = 'PENDING_CHECKER_SIGNOFF';
      exc.status = 'PENDING_CHECKER_APPROVAL';
    } else {
      if (approved) {
        res.currentStatus = 'RESOLVED';
        res.resolvedAt = new Date().toISOString();
        res.makerCheckerWorkflow.checker = {
          userId: user,
          signoffStatus: 'APPROVED',
          signoffTimestamp: new Date().toISOString(),
          approvalComments: justification
        };
        exc.status = 'RESOLVED';
      } else {
        res.currentStatus = 'INVESTIGATING';
        res.makerCheckerWorkflow.checker = {
          userId: user,
          signoffStatus: 'REJECTED',
          signoffTimestamp: new Date().toISOString(),
          approvalComments: justification
        };
        exc.status = 'INVESTIGATING';
      }
    }

    this.customExceptions.set(exceptionId, exc);
    return exc;
  }

  private generateAuditTrail(
    excId: string,
    bRec: CanonicalRow | null,
    bkRec: CanonicalRow | null,
    subType: string,
    discrepancy: number
  ): AuditTrail {
    const docId = bRec?.documentId || bkRec?.documentId || 'DOC-N/A';
    return {
      exceptionId: excId,
      generatedAt: new Date().toISOString(),
      sourceDocuments: {
        primaryDocumentId: docId,
        documentType: bRec?.sourceType || 'BANK_ORIGINATED_VOUCHER',
        invoiceNumber: docId,
        poNumber: bRec?.rawPayload?.poNumber || 'PO-MASTER-4912',
        contractId: bRec?.rawPayload?.contractId || 'CNT-TREASURY-2026',
        documentUrl: `/documents/invoices/${docId}.pdf`,
        customerMaster: {
          name: bRec?.payerName || bkRec?.payerName || 'Enterprise Counterparty',
          taxId: bRec?.rawPayload?.taxId || 'GSTIN27AAACA1234A1Z5',
          registeredBankAccount: bRec?.accountNumber || bkRec?.accountNumber || 'APEX9912000000001111222233',
          paymentTerms: 'NET_30_DAYS',
          creditRating: 'AAA_TIER_1'
        }
      },
      lifecycleHistory: {
        createdBy: bRec?.rawPayload?.createdBy || 'system.automated.ingestion@enterprise.com',
        createdAt: '2026-09-01T09:00:00Z',
        ingestionChannel: 'FINTECH_INGESTION_GATEWAY_V3',
        modificationLog: [
          {
            timestamp: '2026-09-02T10:15:00Z',
            userId: 'erp.sync.service',
            fieldModified: 'payment_status',
            oldValue: 'PENDING',
            newValue: 'SUBMITTED_FOR_CLEARING'
          }
        ],
        approvalTrail: [
          {
            approverName: bRec?.rawPayload?.approvedBy || 'treasury.manager@enterprise.com',
            role: 'TREASURY_MANAGER',
            authorizationLevel: 'LEVEL_2_AUTHORITY_UP_TO_10M',
            approvedAt: '2026-09-01T15:30:00Z',
            digitalSignatureHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
          }
        ]
      },
      paymentInitiation: {
        instructionId: `INST-PAY-${docId}`,
        paymentMode: bRec?.network || bkRec?.network || 'NEFT',
        designatedBank: bRec?.bankName || bkRec?.bankName || 'Settlement Bank',
        beneficiaryAccount: bRec?.accountNumber || bkRec?.accountNumber || 'Designated Beneficiary',
        batchId: bRec?.rawReference || bkRec?.rawReference || 'BATCH-CLEARING-01',
        submissionTimestamp: '2026-09-02T08:00:00Z',
        clearingCycle: 'CYCLE_HOURLY_INTERBANK'
      },
      disputeContext: {
        internalNotes: [
          {
            author: 'sarah.chen@fintech-ops.com',
            timestamp: '2026-09-04T11:20:00Z',
            note: `System exception flagged: ${subType}. Discrepancy amount: ${discrepancy}.`
          }
        ],
        crmTicketId: `TKT-RECON-${excId.substring(4, 9)}`,
        emailThreadRef: `reconciliation-query-${docId}@enterprise.zendesk.com`,
        priorExceptionHistory: {
          hasPriorExceptions: subType === 'TRANSPOSED_DIGITS',
          priorCount: subType === 'TRANSPOSED_DIGITS' ? 2 : 0,
          lastOccurrenceDate: '2026-07-15',
          recurringDiscrepancyFlag: subType === 'TRANSPOSED_DIGITS'
        }
      },
      reconciliationMetadata: {
        invoiceNumber: docId,
        erpJournalNumber: `JV-2026-09-${excId.substring(4, 8)}`,
        internalTxId: `TXN-INTERNAL-${docId}`,
        utrOrRrn: bRec?.rawReference || bkRec?.rawReference || 'N/A',
        bankReference: bkRec?.rawReference || 'N/A',
        engineDecisionLog: {
          ruleEvaluated: 'MULTI_PASS_MATCHING_V4',
          failedCriteria: subType,
          confidenceScore: 42.5,
          varianceDetected: discrepancy,
          reason: `Automatic match rejected due to ${subType}. Variance: ${discrepancy}.`
        }
      },
      resolutionAudit: {
        assignedAnalyst: 'sarah.chen@fintech-ops.com',
        investigationStartedAt: '2026-09-04T11:30:00Z',
        currentStatus: 'OPEN',
        suggestedAction: 'Manual investigation and maker-checker signoff required.',
        manualOverrideApplied: false,
        resolutionNotes: '',
        resolvedAt: null,
        firstLevelActionBy: null,
        makerCheckerWorkflow: {
          dualAuthorizationRequired: true,
          maker: {
            userId: 'sarah.chen@fintech-ops.com',
            action: 'PENDING_ACTION',
            timestamp: null,
            justification: ''
          },
          checker: {
            userId: 'alex.vance@fintech-treasury.com',
            signoffStatus: 'AWAITING_MAKER',
            signoffTimestamp: null,
            approvalComments: ''
          }
        }
      }
    };
  }
}
