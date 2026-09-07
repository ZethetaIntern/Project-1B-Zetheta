import { Bank, BusinessRecord } from '../types/reconciliation';

export const INITIAL_BANKS: Bank[] = [
  {
    id: 'bank-1',
    name: 'Apex Commercial Bank',
    bicCode: 'APEXINBBXXX',
    accountNumber: 'APEX9912000000001111222233',
    formatType: 'MT940_V1',
    formatLabel: 'MT940 (Millennium / SWIFT subfields <00..<63)',
    currency: 'INR',
    active: true,
    country: 'India / Central EU Clearing',
    description: 'Corporate clearing gateway utilizing structured MT940 with <xx subfield tags and comma decimals.'
  },
  {
    id: 'bank-2',
    name: 'Horizon Trust Bank',
    bicCode: 'HORZINBBXXX',
    accountNumber: 'HORZ7721000000004444555566',
    formatType: 'MT940_V2',
    formatLabel: 'MT940 (Standard SWIFT slash delimiters /TRF/)',
    currency: 'INR',
    active: true,
    country: 'India Domestic Treasury',
    description: 'Core banking settlement using SWIFT MT940 format with slash delimiters and dot decimals.'
  },
  {
    id: 'bank-3',
    name: 'Vanguard International Bank',
    bicCode: 'VANGINBBXXX',
    accountNumber: 'IN64VANG000000008888999900',
    formatType: 'CAMT053_V1',
    formatLabel: 'ISO 20022 CAMT.053.001.02 XML',
    currency: 'INR',
    active: true,
    country: 'Global Wholesale RTGS',
    description: 'High-value gross settlement and treasury cash reporting via ISO 20022 CAMT.053 XML schema.'
  },
  {
    id: 'bank-4',
    name: 'Meridian Capital Bank',
    bicCode: 'MRDNGBLONXXX',
    accountNumber: 'GB33MRDN40001122334455',
    formatType: 'CAMT053_V2',
    formatLabel: 'ISO 20022 CAMT.053.001.08 XML (Extended)',
    currency: 'USD',
    active: true,
    country: 'United Kingdom / Multi-Currency',
    description: 'E-commerce merchant acquirer settlement with MDR fee breakdown, batch headers and dispute records.'
  }
];

export const RAW_MT940_APEX = `:20:1720446
:25:APEX9912000000001111222233
:28C:00142
:NS:22APEX COMMERCIAL BANK CORP
:NS:23MAIN SETTLEMENT TREASURY ACCT
:60F:C260901INR1450000,00
:61:2609020902CR145000,00NTRFNONREF//UPI145000001
PRZELEW PRZYCHODZACY
:86:010<00UPI INWARD SETTLEMENT
<102609020001
<20UPI SETTLEMENT INV-2026-001
<21RRN: 426091002931 / VPA: alpha.retail@okhdfcbank
<22ZAPLATA ZA FAK. INV-2026-001
<27ALPHA RETAIL CORP
<28Tech Park Road, Phase 2
<30HDFC0001234
<31426091002931
<32ALPHA RETAIL CORP
<389912000000001111222233
<63REF426091002931
:61:2609030903CR200000,00NTRFNONREF//UPI145000002
PRZELEW PRZYCHODZACY
:86:010<00UPI INWARD SETTLEMENT PART 1
<102609030002
<20SPLIT PAYMENT PART 1 FOR INV-2026-005
<21RRN: 426093110294 / VPA: omega.global@axisbank
<22ZAPLATA ZA FAK. INV-2026-005 PARTIAL
<27OMEGA GLOBAL LOGISTICS
<28Harbor View Blvd 45
<30UTIB0000567
<31426093110294
<32OMEGA GLOBAL
<389912000000001111222233
<63REF426093110294
:61:2609030903CR150000,00NTRFNONREF//UPI145000003
PRZELEW PRZYCHODZACY
:86:010<00UPI INWARD SETTLEMENT PART 2
<102609030003
<20SPLIT PAYMENT PART 2 FOR INV-2026-005
<21RRN: 426093110295 / VPA: omega.global@axisbank
<22ZAPLATA ZA FAK. INV-2026-005 FINAL
<27OMEGA GLOBAL LOGISTICS
<28Harbor View Blvd 45
<30UTIB0000567
<31426093110295
<32OMEGA GLOBAL
<389912000000001111222233
<63REF426093110295
:61:2609040904DR1250,00NTRFNONREF//BANKFEE991
PROWIZJA BANKOWA
:86:012<00OPLATA ZA PROWADZENIE RACHUNKU
<102609040004
<20ACCOUNT MAINTENANCE & AUDIT CHARGE
<21BANK STATEMENT FEE
<27APEX COMMERCIAL BANK
<63REFAPEX-FEE-2026-09
:62F:C260905INR1943750,00
:64:C260905INR1943750,00`;

export const RAW_MT940_HORIZON = `:20:HORIZON2026090401
:25:HORZ7721000000004444555566
:28C:00881/1
:60F:C260901INR2800000.00
:61:2609020902CR420000.00NTRFNONREF//NEFT20260902B04
/TRF/NEFT BATCH SETTLEMENT
:86:/REFR/NEFT20260902B04/BNF/BETA ENTERPRISES PVT LTD/AC/50200019283741/IFSC/SBIN0001423/REMI/SETTLEMENT FOR INV-2026-002 NEFT BATCH B04/TXT/CREDIT CLEARED
:61:2609030903CR190000.00NTRFNONREF//NEFT20260903B09
/TRF/NEFT INWARD PAYMENT
:86:/REFR/NEFT20260903B09/BNF/DELTA SYNERGY LTD/AC/60192837465102/IFSC/ICIC0000912/REMI/PAYMENT INV-2026-006 DIGIT ERROR 190000 VS 910000/TXT/AMOUNT MISMATCH INVESTIGATE
:61:2609040904DR450.00NTRFNONREF//CHRG2026090401
/CHG/NEFT BATCH PROCESSING CHARGES
:86:/REFR/CHRG2026090401/BNF/HORIZON TRUST BANK/REMI/INTERBANK CLEARING FEES SEP 2026
:61:2609040904CR8200.00NTRFNONREF//INT2026090401
/INT/INTEREST CREDIT
:86:/REFR/INT2026090401/BNF/HORIZON TRUST BANK/REMI/MONTHLY SWEEP DEPOSIT INTEREST EARNED
:62F:C260905INR3409750.00
:64:C260905INR3409750.00`;

export const RAW_CAMT053_VANGUARD = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>VANGUARD-CAMT053-20260904-001</MsgId>
      <CreDtTm>2026-09-04T18:30:00+05:30</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-2026-09-VNG001</Id>
      <Acct>
        <Id><IBAN>IN64VANG000000008888999900</IBAN></Id>
        <Ccy>INR</Ccy>
        <Nm>VANGUARD SETTLEMENT &amp; CASH MGMT CORP</Nm>
      </Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="INR">5000000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Dt><Dt>2026-09-01</Dt></Dt>
      </Bal>
      <Ntry>
        <Amt Ccy="INR">2500000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>2026-09-02</Dt></BookgDt>
        <BkTxCd><Domn><Fmly><SubFmlyCd>RTGS</SubFmlyCd></Fmly></Domn></BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs>
              <EndToEndId>RTGS-VNG-20260902-003</EndToEndId>
              <TxId>UTR-VANG-20260902-RTGS003</TxId>
            </Refs>
            <RltdPties><Dbtr><Nm>GAMMA INFRASTRUCTURE HOLDINGS</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>RTGS SETTLEMENT FOR INVOICE INV-2026-003 CAPITAL EQUIPMENT PURCHASE</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="INR">380000.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>2026-09-04</Dt></BookgDt>
        <BkTxCd><Domn><Fmly><SubFmlyCd>RTGS</SubFmlyCd></Fmly></Domn></BkTxCd>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>RTGS-VNG-20260904-004</EndToEndId></Refs>
            <RltdPties><Dbtr><Nm>SIGMA MARITIME VENTURES</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>RECEIPT RCP-2026-004 SETTLED T+1 POST CUTOFF TIME 18:05</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="INR">50.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <Sts>BOOK</Sts>
        <BookgDt><Dt>2026-09-04</Dt></BookgDt>
        <NtryDtls>
          <TxDtls><RmtInf><Ustrd>CENTRAL BANK RTGS CLEARING PROCESSING LEVY</Ustrd></RmtInf></TxDtls>
        </NtryDtls>
      </Ntry>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="INR">7879950.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
      </Bal>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

export const RAW_CAMT053_MERIDIAN = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08">
  <BkToCstmrStmt>
    <GrpHdr>
      <MsgId>MERIDIAN-CAMT053-20260904-B4</MsgId>
      <CreDtTm>2026-09-04T20:15:00Z</CreDtTm>
    </GrpHdr>
    <Stmt>
      <Id>STMT-2026-09-MER082</Id>
      <Acct>
        <Id><IBAN>GB33MRDN40001122334455</IBAN></Id>
        <Ccy>USD</Ccy>
        <Nm>MERIDIAN E-COMMERCE &amp; CARD NETWORK SETTLEMENT</Nm>
      </Acct>
      <Ntry>
        <Amt Ccy="USD">24010.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-02</Dt></BookgDt>
        <Chrgs><TtlChrgsAndTaxAmt Ccy="USD">490.00</TtlChrgsAndTaxAmt></Chrgs>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>CRD-BATCH-INV-2026-004</EndToEndId></Refs>
            <AmtDtls><TxAmt><Amt Ccy="USD">24500.00</Amt></TxAmt></AmtDtls>
            <RltdPties><Dbtr><Nm>VISA MERCHANT ACQUIRING NETWORK</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>VISA NET SETTLEMENT FOR INVOICE INV-2026-004 GROSS 24500.00 MDR NET 24010.00</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="USD">1250.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-09-03</Dt></BookgDt>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>CHGBK-MC-2026-8812</EndToEndId></Refs>
            <RltdPties><Dbtr><Nm>MASTERCARD DISPUTE RESOLUTION</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>CARDHOLDER DISPUTE REVERSAL CHARGEBACK REASON 4837 FRAUDULENT TX</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="USD">9990.00</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-09-04</Dt></BookgDt>
        <NtryDtls>
          <TxDtls>
            <Refs><EndToEndId>AML-HOLD-UNMATCHED-009</EndToEndId></Refs>
            <RltdPties><Dbtr><Nm>OFFSHORE HOLDINGS CAYMAN LTD</Nm></Dbtr></RltdPties>
            <RmtInf><Ustrd>UNIDENTIFIED INWARD REMITTANCE JUST UNDER 10K THRESHOLD AML COMPLIANCE REVIEW</Ustrd></RmtInf>
          </TxDtls>
        </NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

export const SAMPLE_INVOICES: BusinessRecord[] = [
  {
    id: 'inv-1',
    recordType: 'INVOICE',
    documentId: 'INV-2026-001',
    payerName: 'Alpha Retail Corp',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'GSTIN27AAACA1234A1Z5',
    amount: 145000.0,
    currency: 'INR',
    transactionDate: '2026-09-01',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Apex Commercial Bank',
    designatedAccount: 'APEX9912000000001111222233',
    network: 'UPI',
    referenceNumber: '426091002931',
    poNumber: 'PO-ALP-9012',
    contractId: 'CNT-2026-042',
    status: 'PAID',
    description: 'Retail software license and enterprise cloud gateway deployment',
    createdBy: 'billing.analyst@enterprise.com',
    approvedBy: 'treasury.manager@enterprise.com'
  },
  {
    id: 'inv-2',
    recordType: 'INVOICE',
    documentId: 'INV-2026-002',
    payerName: 'Beta Enterprises Pvt Ltd',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'GSTIN29BBBCE5678B2Z1',
    amount: 420000.0,
    currency: 'INR',
    transactionDate: '2026-09-01',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Horizon Trust Bank',
    designatedAccount: 'HORZ7721000000004444555566',
    network: 'NEFT',
    referenceNumber: 'NEFT20260902B04',
    poNumber: 'PO-BET-4401',
    contractId: 'CNT-2026-088',
    status: 'PAID',
    description: 'Hardware supply and datacenter rack deployment batch B04',
    createdBy: 'billing.analyst@enterprise.com',
    approvedBy: 'treasury.manager@enterprise.com'
  },
  {
    id: 'inv-3',
    recordType: 'INVOICE',
    documentId: 'INV-2026-003',
    payerName: 'Gamma Infrastructure Holdings',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'GSTIN07CCCDG9012C3Z7',
    amount: 2500000.0,
    currency: 'INR',
    transactionDate: '2026-09-01',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Vanguard International Bank',
    designatedAccount: 'IN64VANG000000008888999900',
    network: 'RTGS',
    referenceNumber: 'RTGS-VNG-20260902-003',
    poNumber: 'PO-GAM-7729',
    contractId: 'CNT-2026-104',
    status: 'PAID',
    description: 'High-capacity turbine backup power system and substation installation',
    createdBy: 'senior.treasurer@enterprise.com',
    approvedBy: 'chief.financial.officer@enterprise.com'
  },
  {
    id: 'inv-4',
    recordType: 'INVOICE',
    documentId: 'INV-2026-004',
    payerName: 'Delta E-Commerce Retailers',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'US-EIN-94-3829102',
    amount: 24500.0,
    currency: 'USD',
    transactionDate: '2026-09-01',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Meridian Capital Bank',
    designatedAccount: 'GB33MRDN40001122334455',
    network: 'CARD',
    referenceNumber: 'CRD-BATCH-INV-2026-004',
    poNumber: 'PO-DEL-1048',
    contractId: 'CNT-2026-199',
    status: 'PARTIAL_SETTLED',
    description: 'Visa merchant e-commerce daily settlement batch (gross $24,500.00)',
    feeBreakdown: {
      gross: 24500.0,
      mdr_fee: 490.0,
      net_expected: 24010.0
    },
    createdBy: 'merchant.ops@enterprise.com',
    approvedBy: 'treasury.manager@enterprise.com'
  },
  {
    id: 'inv-5',
    recordType: 'INVOICE',
    documentId: 'INV-2026-005',
    payerName: 'Omega Global Logistics',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'GSTIN33EEEFO3456E5Z9',
    amount: 350000.0,
    currency: 'INR',
    transactionDate: '2026-09-02',
    expectedSettlementDate: '2026-09-03',
    designatedBank: 'Apex Commercial Bank',
    designatedAccount: 'APEX9912000000001111222233',
    network: 'UPI',
    referenceNumber: 'INV-2026-005',
    poNumber: 'PO-OMG-8819',
    contractId: 'CNT-2026-250',
    status: 'PAID',
    description: 'Freight forwarding and container customs clearance services',
    splitPayments: [
      { ref: '426093110294', amount: 200000.0 },
      { ref: '426093110295', amount: 150000.0 }
    ],
    createdBy: 'billing.analyst@enterprise.com',
    approvedBy: 'treasury.manager@enterprise.com'
  },
  {
    id: 'inv-6',
    recordType: 'INVOICE',
    documentId: 'INV-2026-006',
    payerName: 'Delta Synergy Ltd',
    payeeName: 'ENTERPRISE TREASURY CORP',
    taxId: 'GSTIN19DDDDE7890D4Z3',
    amount: 910000.0,
    currency: 'INR',
    transactionDate: '2026-09-02',
    expectedSettlementDate: '2026-09-03',
    designatedBank: 'Horizon Trust Bank',
    designatedAccount: 'HORZ7721000000004444555566',
    network: 'NEFT',
    referenceNumber: 'NEFT20260903B09',
    poNumber: 'PO-DSY-6520',
    contractId: 'CNT-2026-302',
    status: 'FLAGGED',
    description: 'Consulting and cybersecurity audit services - Q3 engagement',
    notes: 'Bank statement reflects ₹190,000.00. Data entry transposed digits error on remitter end.',
    createdBy: 'billing.analyst@enterprise.com',
    approvedBy: 'treasury.manager@enterprise.com'
  }
];

export const SAMPLE_RECEIPTS: BusinessRecord[] = [
  {
    id: 'rcp-1',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-001',
    payerName: 'Alpha Retail Corp',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 145000.0,
    currency: 'INR',
    transactionDate: '2026-09-02',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Apex Commercial Bank',
    designatedAccount: 'APEX9912000000001111222233',
    network: 'UPI',
    referenceNumber: '426091002931',
    status: 'CLEARED',
    description: 'Automated receipt acknowledgement for INV-2026-001 UPI settlement'
  },
  {
    id: 'rcp-2',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-002',
    payerName: 'Beta Enterprises Pvt Ltd',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 420000.0,
    currency: 'INR',
    transactionDate: '2026-09-02',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Horizon Trust Bank',
    designatedAccount: 'HORZ7721000000004444555566',
    network: 'NEFT',
    referenceNumber: 'NEFT20260902B04',
    status: 'CLEARED',
    description: 'NEFT batch B04 receipt acknowledgement for INV-2026-002'
  },
  {
    id: 'rcp-3',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-003',
    payerName: 'Gamma Infrastructure Holdings',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 2500000.0,
    currency: 'INR',
    transactionDate: '2026-09-02',
    expectedSettlementDate: '2026-09-02',
    designatedBank: 'Vanguard International Bank',
    designatedAccount: 'IN64VANG000000008888999900',
    network: 'RTGS',
    referenceNumber: 'RTGS-VNG-20260902-003',
    status: 'CLEARED',
    description: 'High-value gross RTGS settlement receipt for INV-2026-003'
  },
  {
    id: 'rcp-4',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-004',
    payerName: 'Sigma Maritime Ventures',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 380000.0,
    currency: 'INR',
    transactionDate: '2026-09-03',
    expectedSettlementDate: '2026-09-04',
    designatedBank: 'Vanguard International Bank',
    designatedAccount: 'IN64VANG000000008888999900',
    network: 'RTGS',
    referenceNumber: 'RTGS-VNG-20260904-004',
    status: 'PENDING_CLEARING',
    description: 'Timing lag: receipt posted in ERP on Sep 3 after cutoff, cleared by bank on Sep 4 (T+1 settlement)'
  },
  {
    id: 'rcp-5',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-005',
    payerName: 'Helios Logistics Corp',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 75000.0,
    currency: 'INR',
    transactionDate: '2026-09-01',
    expectedSettlementDate: '2026-09-01',
    designatedBank: 'Horizon Trust Bank',
    designatedAccount: 'HORZ7721000000004444555566',
    network: 'NEFT',
    referenceNumber: 'NEFT-UNPOSTED-771',
    status: 'VOIDING_IN_PROGRESS',
    description: 'Ledger-only record: Internal receipt posted but payment stopped/voided before bank transmission'
  },
  {
    id: 'rcp-6',
    recordType: 'RECEIPT',
    documentId: 'RCP-2026-006',
    payerName: 'Apex Vendor Rebates',
    payeeName: 'ENTERPRISE TREASURY CORP',
    amount: 120000.0,
    currency: 'INR',
    transactionDate: '2026-09-03',
    expectedSettlementDate: '2026-09-03',
    designatedBank: 'Horizon Trust Bank',
    designatedAccount: 'HORZ7721000000004444555566',
    network: 'UPI',
    referenceNumber: 'UPI-WRONG-ROUTED-12',
    status: 'MISROUTED',
    description: 'Cross-bank wrong account routing: Ledger expected deposit in Horizon Trust, but customer paid into Apex Commercial Bank'
  }
];
