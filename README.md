# Multi-Bank Automated Settlement & Reconciliation Engine

> **Fintech Enterprise Solution submitted to Zetheta**  
> *Full-Stack Architecture: React 18 TypeScript Dashboard + Python Django Core Engine*

---

## 📌 What is the Web Interface About?

The **Multi-Bank Automated Settlement & Reconciliation Engine** is an enterprise-grade financial technology interface designed to solve complex multi-party clearing, netting, and balance verification anomalies. 

In high-volume treasury operations, enterprises handle thousands of payments every second across disparate banking partners (Apex Commercial, Horizon Trust, Vanguard International, and Meridian Capital) across divergent messaging standards (SWIFT MT940 and ISO 20022 CAMT.053 XML) and payment clearing networks (UPI, NEFT, RTGS, and Card Networks). 

This web interface serves as the **central operational cockpit** for treasury officers, settlement analysts, compliance auditors, and system administrators to:
1. Ingest, parse, and normalize bank feeds and ERP internal ledgers into a canonical schema.
2. Execute multi-pass automated matching algorithms (deterministic exact, fee netting, 1-to-many remittance aggregations, timing tolerance).
3. Monitor exception lifecycles across 10 specialized discrepancy categories with automated root-cause diagnostics.
4. Enforce strict Maker-Checker dual-authorization compliance with immutable 6-tier audit trails.
5. Simulate complex multi-bank edge-case scenarios and export formal audit packages directly for Zetheta submission.

---

## 🖥️ Description of the Whole Web Interface

The web interface is structured as an integrated, single-page command dashboard organized into 5 core operational modules accessible via the top navigation bar (with parsing, document scanning, and canonical conversion handled autonomously by the backend engine):

### 1. Executive Overview Dashboard
* **KPI Metrics Strip**: Real-time summary cards displaying Total Ledger Volume, Total Cleared Volume, Auto-Match Rate (e.g. 96.2%), Net Variance, Total Open Exceptions, and Critical Exceptions requiring immediate remediation.
* **Settlement Network Throughput**: Visual distribution cards breaking down transaction velocity, volume, and match rates across UPI, NEFT, RTGS, and Card payment channels.
* **4-Bank Balance & Reconciliation Health**: Dedicated bank status widgets tracking ledger balance vs. statement balance, MT940 / CAMT.053 ingestion status, and unresolved discrepancy count.
* **Match Rate Trendline**: Interactive 7-day visual trend showcasing the efficiency gain of the matching engine.

### 2. Exception Management & Root-Cause Queue
* **Filter & Search Controls**: Multivariable filtering by bank, clearing network, severity level (Critical, High, Medium, Low), status (Open, Investigating, Pending Checker, Resolved), and discrepancy type.
* **Exception Diagnostic Grid**: Detailed record table displaying Exception IDs, parent transaction IDs, bank references, discrepancy amounts, age in hours, and automated root-cause classifications.
* **Resolution Trigger**: Direct action buttons opening the comprehensive deep-investigation modal for any selected transaction.

### 3. Multi-Bank Settlement Pipelines
* **Network-Specific Workflows**: Dedicated tabs detailing specific business logic for:
  * **UPI Pipeline**: Instant retail settlements, 12-digit RRN matching, NPCI reversal logs.
  * **NEFT Pipeline**: Hourly batch clearing, sender-to-receiver remittance identification.
  * **RTGS Pipeline**: High-value real-time gross settlement (> ₹200,000) with RBI transaction identifiers.
  * **Card Clearing Pipeline**: Merchant Discount Rate (MDR) netting, gross-to-net deposit reconciliation, and interchange breakdown.

### 4. Settlement Scenario Simulator
* **7 Real-World Settlement Scenarios**: Pre-configured interactive test scenarios covering:
  1. *Scenario 1: Happy Path Exact Match* (Zero discrepancy clearing across all banks).
  2. *Scenario 2: Gateway Fee Netting* (Card payment gross ₹12,500 vs. net deposit ₹12,250 with ₹250 fee).
  3. *Scenario 3: Multi-Invoice Split Remittance* (1 bank deposit matching 3 separate vendor invoices).
  4. *Scenario 4: Cutoff Timing Lag* (T+1 / T+2 clearing after bank 18:00 cutoff without false alert).
  5. *Scenario 5: Modulo-9 Transposition Error* (Typo in ledger ₹45,900 vs bank ₹49,500 detected via digit sum).
  6. *Scenario 6: Cross-Bank Routing Error* (Wire remitted to Meridian instead of Vanguard).
  7. *Scenario 7: AML Structuring / Smurfing Alert* (Rapid sub-threshold payments triggering compliance hold).
* **Live Telemetry Console**: Step-by-step execution log demonstrating parser execution, matching engine heuristics, and diagnostic outputs.

### 5. Comprehensive Reporting & Zetheta Submission Package
* **Submission Overview**: Formal technical documentation summarizing compliance across Parts 1 through 7 of the Zetheta specification.
* **Match Rate & Aging Visualizations**: Interactive Area and Pie charts charting 7-day match trends and duration buckets (0-24h, 24-48h, 48-72h, 72h+).
* **Export Utilities**: One-click export to CSV and full Zetheta JSON package for immediate evaluation.

### 6. Deep Investigation & Maker-Checker Modal (6-Tier Audit Trail)
* **Side-by-Side Comparator**: Aligns the internal ERP ledger record against the cleared bank statement record with difference highlights.
* **6-Tier Audit Store**:
  * *Tier 1: Source Document References & Master Data*
  * *Tier 2: Transaction Lifecycle History & High-Value Approval Trail*
  * *Tier 3: Payment Initiation Details & Clearing Submission*
  * *Tier 4: Communication & Dispute Context (CRM tickets, prior exception history)*
  * *Tier 5: Reference & Matching Engine Decision Log (confidence scores, rule evaluations)*
  * *Tier 6: User Resolution Actions & Audit Trail*
* **Maker-Checker Workflow**: Dual-authorization sign-off where an Analyst (Maker) proposes action and justification, and a Supervisor (Checker) signs off with cryptographic hash recording.

> **Backend Ingestion Architecture Note**:  
> In accordance with enterprise separation-of-concerns principles, file format discovery (`DocumentScanner`), raw statement parsing (`MT940Parser`, `CAMT053Parser`), and standard 14-column canonical normalization (`TabularConverter`) execute exclusively as automated backend pipeline processes (`django_backend/reconciliation/parsers/`). The frontend cockpit focuses strictly on operational monitoring, exception remediation, scenario simulation, and audit governance.

---

## ⚡ Key Features

- **Multi-Format Ingestion Engine**: Seamlessly parses SWIFT MT940 (structured `:86:` tag formats) and ISO 20022 CAMT.053 (XML namespaces, charges, and remittance nodes).
- **Canonical Normalization**: Standardizes all banking data into a unified 14-column relational model.
- **4-Tier Matching Pipeline**:
  1. *Pass 1*: Deterministic exact matching on unique identifiers (UTR, UPI RRN, NEFT Batch ID).
  2. *Pass 2*: Netting & fee-deduction tolerance matching.
  3. *Pass 3*: 1-to-many and many-to-1 split remittance aggregation.
  4. *Pass 4*: Timing lag tolerance window (T+0 to T+3).
- **10 Discrepancy Categories**: Automated root-cause detection for Timing Lags, Amount Mismatches, Missing Records, Duplicates, Transposition Errors (Modulo-9), Chargebacks/Reversals, Encoding Errors, Cross-Bank Routing Errors, AML Structuring, and Template Mismatches.
- **Maker-Checker Governance**: Enforces separation of duties required by financial regulators (RBI, Basel III, SOX).
- **Executive Dark Canvas**: Sophisticated slate/zinc dark theme designed for extended trading desk and financial analyst operation.
- **Simulated Test Harness**: Built-in 7-scenario automated runner for zero-dependency demonstration and regression testing.

---

## 🛠️ Tech Stack

### Frontend Web Interface
* **Framework**: React 18+ (SPA)
* **Language**: TypeScript 5+ (Strict Mode)
* **Styling**: Tailwind CSS (Utility-first, Dark Theme optimized)
* **Icons**: `lucide-react`
* **Charts & Visualizations**: `recharts` (Responsive Container, Area, Pie, Tooltip, Legend)
* **Build Tool & Dev Server**: Vite 6+
* **Package Manager**: npm / bun

### Backend & Core Reconciliation Engine
* **Framework**: Python 3.10+ / Django 4.2+ (located in `/django_backend`)
* **Data Processing**: Python Standard Library (`xml.etree.ElementTree`, `re`, `json`, `datetime`, `decimal`)
* **Testing**: Python `unittest` suite (100% scenario coverage)
* *(For full backend documentation, see [`DJANGO_README.md`](./DJANGO_README.md))*

---

## 🚀 Getting Started

Follow these steps to run the web interface locally on your machine:

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm** (v9+) or **bun** (v1.0+)

### 1. Clone the Repository
```bash
git clone https://github.com/<your-organization>/reconciliation-engine.git
cd reconciliation-engine
```

### 2. Install Frontend Dependencies
Using npm:
```bash
npm install
```
Or using bun:
```bash
bun install
```

### 3. Launch Development Server
```bash
npm run dev
```
The application dev server will boot and bind to `http://localhost:3000` (or `http://localhost:5173` depending on port availability).

### 4. Build for Production
To generate an optimized, static production bundle in `dist/`:
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

---

## 📂 Project Structure Overview

```
├── django_backend/           # Complete Python / Django backend engine
│   ├── manage.py             # Django CLI management entry point
│   ├── recon_backend/        # Django project root (settings.py, urls.py)
│   ├── reconciliation/       # Core reconciliation application
│   │   ├── audit/            # 6-Tier Audit Store & Maker-Checker logic
│   │   ├── engine/           # Matching engine & 10 Exception diagnostic managers
│   │   ├── parsers/          # MT940 & CAMT.053 parsers, DocumentScanner, Converter
│   │   ├── pipeline.py       # Main orchestration pipeline
│   │   └── views.py          # Django REST endpoints
│   ├── run_cli.py            # CLI script to execute reconciliation pipeline
│   └── tests/                # Automated test suite (test_reconciliation.py)
├── sample_data/              # Realistic multi-bank MT940, CAMT.053 & ERP datasets
├── src/                      # React TypeScript frontend source code
│   ├── components/           # Modular UI views & dashboards
│   │   ├── Header.tsx                # Navigation header & live system status
│   │   ├── DashboardView.tsx         # Executive KPI, Netting & Network Overview
│   │   ├── ExceptionQueueView.tsx    # Filterable Exception Queue & Diagnostician
│   │   ├── ExceptionDetailModal.tsx  # 6-Tier Audit Store & Maker-Checker Modal
│   │   ├── NetworkPipelinesView.tsx  # UPI, NEFT, RTGS & Card Settlement Workflows
│   │   ├── SimulatorView.tsx         # 7-Scenario Settlement Engine Test Runner
│   │   └── ReportingView.tsx         # Zetheta Compliance Package & Trend Charts
│   ├── types/                # TypeScript domain models & canonical schemas
│   ├── services/             # Reconciliation engine & mock data generators
│   ├── App.tsx               # Primary application state coordinator
│   └── main.tsx              # React DOM mounting entry point
├── index.html                # Entry point HTML document
├── package.json              # Frontend dependencies and scripts
├── README.md                 # Primary Web Interface Documentation (this file)
└── DJANGO_README.md          # Comprehensive Python / Django Backend Documentation
```

---

## 📄 Submission & Ownership Transfer

This repository is prepared for direct GitHub ownership transfer to **Zetheta**.  
For backend execution instructions, REST API contract specifications, and test suite execution, please consult **[`DJANGO_README.md`](./DJANGO_README.md)**.
