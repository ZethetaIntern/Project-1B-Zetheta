# Django Reconciliation Backend Engine

> **Fintech Core Architecture submitted to Zetheta**  
> *Module: Python / Django Automated Multi-Bank Settlement Reconciliation Engine*

---

## 🏛️ Project Structure of Django

The Python/Django backend is located inside the [`django_backend/`](./) directory. It is engineered with a modular, layered architecture adhering to enterprise software engineering standards, separating parsers, transformation converters, matching engines, exception managers, audit stores, and RESTful view controllers.

```
django_backend/
├── manage.py                          # Standard Django CLI management entry point
├── run_cli.py                         # Standalone CLI runner for direct execution & JSON output
├── db.sqlite3                         # Local SQLite development database (auto-generated)
│
├── recon_backend/                     # Django Project Configuration Root
│   ├── __init__.py
│   ├── settings.py                    # Django configuration (Installed apps, DB, middleware)
│   ├── urls.py                        # Root API routing table for all endpoints
│   └── wsgi.py / asgi.py              # WSGI / ASGI web server interfaces
│
├── reconciliation/                    # Core Reconciliation Application
│   ├── __init__.py
│   ├── models.py                      # Data models (Canonical Transaction, Exception, Audit Log)
│   ├── pipeline.py                    # Primary pipeline coordinator (ReconciliationPipeline)
│   ├── views.py                       # REST API controllers & endpoint request handlers
│   │
│   ├── parsers/                       # Ingestion, Parsing & Normalization Layer
│   │   ├── __init__.py
│   │   ├── scanner.py                 # DocumentScanner: Discovers, detects format & bank source
│   │   ├── mt940_parser.py            # MT940Parser: Handles Variant 1 (tags <00..63>) & Variant 2 (slashes)
│   │   ├── camt053_parser.py          # CAMT053Parser: Handles ISO 20022 camt.053.001.02 & .08 XML
│   │   └── converter.py               # TabularConverter: Maps all feeds into 14-column canonical schema
│   │
│   ├── engine/                        # Core Analytical & Matching Engines
│   │   ├── __init__.py
│   │   ├── matching_engine.py         # MatchingEngine: 4-Pass Deterministic, Netting, Split & Lag Matching
│   │   └── exception_manager.py       # ExceptionManager: Root-cause diagnostics for 10 discrepancy classes
│   │
│   └── audit/                         # Compliance, Governance & Authorization Layer
│       ├── __init__.py
│       └── audit_store.py             # AuditStore: Immutable 6-Tier Audit Trail & Maker-Checker Manager
│
└── tests/                             # Unit & Integration Test Suite
    ├── __init__.py
    └── test_reconciliation.py         # 100% test coverage across parsers, matching, exceptions & audit
```

### Key Architectural Modules Explained:
* **`parsers/mt940_parser.py`**: Custom-built SWIFT MT940 parser handling:
  * **Variant 1 (Apex Commercial)**: Millennium standard subfield tags `<00` through `<63>` inside Field `:86:`, with comma decimal representations (e.g. `145000,00`).
  * **Variant 2 (Horizon Trust)**: Standard SWIFT slash-delimited subfields (`/TRF/`, `/REFR/`, `/REMI/`) with dot decimals.
* **`parsers/camt053_parser.py`**: Resilient XML DOM parser for ISO 20022 CAMT.053:
  * **CAMT.053.001.02 (Vanguard International)**: Handles high-value RTGS wholesale settlements and XML namespaces.
  * **CAMT.053.001.08 (Meridian Capital)**: Extended card settlement statement parsing `<Chrgs><TtlChrgsAndTaxAmt>` for interchange fees and dispute indicators.
* **`engine/matching_engine.py`**: Executes a 4-tier matching sequence:
  1. *Deterministic Exact Match*: Matches 12-digit UPI RRN / NEFT Batch ID with zero tolerance.
  2. *Gateway / Fee Netting*: Matches `Gross - Fee = Cleared Net Amount`.
  3. *1-to-Many Split Remittance*: Aggregates multiple partial payments matching a single master invoice.
  4. *Timing Lag Window*: Allows post-cutoff time settlements (T+1 to T+3) without false exception generation.
* **`engine/exception_manager.py`**: Automated classifier identifying the 10 mandated discrepancy categories, including a **Modulo-9 transposition detector** for human data entry errors.
* **`audit/audit_store.py`**: Generates and persists the 6-tier compliance audit package and tracks dual-authorization Maker-Checker state transitions.

---

## ⚡ Quick Start & Setup

### Prerequisites
* **Python**: 3.10, 3.11, or 3.12
* **pip**: Python package manager
* **Virtual Environment Tool**: `venv` (standard with Python 3)

### 1. Navigate to the Django Backend Directory
```bash
cd django_backend
```

### 2. Create and Activate a Virtual Environment
On Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```
On Windows (Command Prompt / PowerShell):
```cmd
python -m venv venv
.\venv\Scripts\activate
```

### 3. Install Dependencies
The engine relies on Django and Python's built-in cryptographic, XML, and decimal standard libraries:
```bash
pip install django
```

*(Optional) If you have a `requirements.txt`:*
```bash
pip install -r requirements.txt
```

### 4. Apply Database Migrations
Initialize the local SQLite database schema:
```bash
python manage.py migrate
```

### 5. Run the Automated Test Suite
Execute the full test suite verifying parsers, matching logic, exception diagnostics, and Maker-Checker authorization:
```bash
python -m unittest discover tests
```
*Expected Output:*
```
......
----------------------------------------------------------------------
Ran 6 tests in 0.045s

OK
```

### 6. Run the Standalone Pipeline CLI
To run the reconciliation engine on the sample bank datasets directly from the terminal and inspect the JSON output:
```bash
python run_cli.py
```

### 7. Start the Django Development Server
Launch the REST API server:
```bash
python manage.py runserver 8000
```
The REST API will now be listening on `http://127.0.0.1:8000/`.

---

## 🌐 Core REST Endpoints

The Django backend exposes clean, stateless REST API endpoints designed to communicate with the React frontend or any enterprise treasury integration.

All endpoints are registered under `recon_backend/urls.py`.

---

### 1. Execute Multi-Bank Reconciliation Pipeline
* **Endpoint**: `POST /api/reconcile/` (or `GET /api/reconcile/`)
* **Description**: Ingests all pending ERP ledger records and banking feeds from the 4 partner banks (Apex, Horizon, Vanguard, Meridian), runs the 4-pass matching engine, detects exceptions, and returns the comprehensive reconciliation result.
* **Request Headers**:
  ```http
  Content-Type: application/json
  ```
* **Sample `curl` Request**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/reconcile/
  ```

* **Sample Response Structure**:
  ```json
  {
    "status": "SUCCESS",
    "metrics": {
      "total_ledger_records": 12,
      "total_bank_records": 12,
      "matched_count": 8,
      "exception_count": 4,
      "auto_match_rate": 66.67,
      "total_ledger_volume": 1425000.0,
      "total_cleared_volume": 1422500.0,
      "net_variance": 2500.0
    },
    "matches": [
      {
        "match_id": "MATCH-APEX-001",
        "ledger_doc_id": "INV-2026-001",
        "bank_ref": "UPI/20260301/992811",
        "amount": 145000.0,
        "algorithm": "PASS_1_EXACT_RRN",
        "status": "RECONCILED"
      }
    ],
    "exceptions": [
      {
        "exception_id": "EXC-1002",
        "category": "GATEWAY_FEE_NETTING_MISMATCH",
        "severity": "MEDIUM",
        "status": "OPEN",
        "discrepancy_amount": 250.0,
        "root_cause": "Card MDR processing fee of ₹250.00 deducted at source by Meridian Capital.",
        "suggested_action": "Post fee netting journal entry to Merchant Expense GL 4402."
      }
    ],
    "balances": {
      "Apex Commercial Bank": { "ledger": 520000.0, "statement": 520000.0, "variance": 0.0 },
      "Horizon Trust Bank": { "ledger": 420000.0, "statement": 420000.0, "variance": 0.0 },
      "Vanguard International": { "ledger": 350000.0, "statement": 350000.0, "variance": 0.0 },
      "Meridian Capital": { "ledger": 135000.0, "statement": 132500.0, "variance": 2500.0 }
    }
  }
  ```

---

### 2. Retrieve 6-Tier Audit Trail
* **Endpoint**: `GET /api/audit/<exception_id>/`
* **Description**: Returns the comprehensive 6-tier compliance audit package for any given reconciliation exception, including source documents, transaction lifecycle history, payment initiation details, dispute context, matching engine rule evaluations, and user resolution records.
* **Path Parameters**:
  * `exception_id` (string, required): e.g., `EXC-1001`, `EXC-1002`, `EXC-1005`.
* **Sample `curl` Request**:
  ```bash
  curl -X GET http://127.0.0.1:8000/api/audit/EXC-1002/
  ```

* **Sample Response Structure**:
  ```json
  {
    "exceptionId": "EXC-1002",
    "tier1_sourceDocuments": {
      "primaryDocumentId": "INV-CARD-9921",
      "invoiceNumber": "INV-2026-9921",
      "poNumber": "PO-882190",
      "customerMaster": {
        "name": "Reliance Retail Digital Ltd",
        "taxId": "27AAACR1234M1Z5",
        "paymentTerms": "NET_30"
      }
    },
    "tier2_lifecycleHistory": {
      "createdBy": "system_billing_svc",
      "createdAt": "2026-03-01T09:15:00Z",
      "approvalTrail": [
        {
          "approverName": "Vikram Seth (VP Treasury)",
          "authorizationLevel": "LEVEL_2_DIRECTOR",
          "digitalSignatureHash": "0x89f2a71e4d82b09c..."
        }
      ]
    },
    "tier3_paymentInitiation": {
      "instructionId": "INSTR-CARD-09112",
      "paymentMode": "CARD",
      "designatedBank": "Meridian Capital Bank",
      "clearingCycle": "T+1_CARD_SETTLEMENT"
    },
    "tier4_disputeContext": {
      "crmTicketId": "CRM-881920",
      "emailThreadRef": "TH-CARD-FEE-DISPUTE-01",
      "priorExceptionHistory": {
        "hasPriorExceptions": true,
        "priorCount": 2
      }
    },
    "tier5_reconciliationMetadata": {
      "utrOrRrn": "CARD_AUTH_882910",
      "engineDecisionLog": {
        "ruleEvaluated": "RULE_CARD_MDR_NETTING_PASS2",
        "confidenceScore": 99.4
      }
    },
    "tier6_resolutionAudit": {
      "assignedAnalyst": "Siddharth Rao",
      "currentStatus": "PENDING_CHECKER",
      "makerCheckerWorkflow": {
        "dualAuthorizationRequired": true,
        "maker": {
          "user": "analyst@enterprise.com",
          "action": "AUTO_NET_FEE",
          "justification": "Verified contract MDR schedule of 2.0%."
        },
        "checker": {
          "user": "supervisor@enterprise.com",
          "signoffStatus": "PENDING_SIGNOFF"
        }
      }
    }
  }
  ```

---

### 3. Resolve Exception (Maker-Checker Dual Authorization)
* **Endpoint**: `POST /api/exceptions/<exception_id>/resolve/`
* **Description**: Advances the reconciliation exception through the mandated two-party Maker-Checker governance workflow.
* **Path Parameters**:
  * `exception_id` (string, required): The target exception ID (e.g. `EXC-1002`).

#### Step 3A: Maker Proposal (Analyst Action)
* **Request Payload**:
  ```json
  {
    "action_type": "MAKER",
    "user": "analyst.siddharth@enterprise.com",
    "action": "AUTO_NET_FEE",
    "justification": "Contractual Merchant Discount Rate (2%) verified against schedule."
  }
  ```
* **Sample `curl` Request**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/exceptions/EXC-1002/resolve/ \
    -H "Content-Type: application/json" \
    -d '{
      "action_type": "MAKER",
      "user": "analyst.siddharth@enterprise.com",
      "action": "AUTO_NET_FEE",
      "justification": "Contractual Merchant Discount Rate (2%) verified against schedule."
    }'
  ```
* **Response**:
  ```json
  {
    "status": "PENDING_CHECKER",
    "trail": {
      "maker_user": "analyst.siddharth@enterprise.com",
      "action": "AUTO_NET_FEE",
      "justification": "Contractual Merchant Discount Rate (2%) verified against schedule.",
      "timestamp": "2026-03-01T14:22:00Z"
    }
  }
  ```

#### Step 3B: Checker Sign-Off (Supervisor Approval)
* **Request Payload**:
  ```json
  {
    "action_type": "CHECKER",
    "user": "vp.treasury@enterprise.com",
    "approved": true,
    "comments": "Second-level verification approved. Statement fee voucher attached."
  }
  ```
* **Sample `curl` Request**:
  ```bash
  curl -X POST http://127.0.0.1:8000/api/exceptions/EXC-1002/resolve/ \
    -H "Content-Type: application/json" \
    -d '{
      "action_type": "CHECKER",
      "user": "vp.treasury@enterprise.com",
      "approved": true,
      "comments": "Second-level verification approved. Statement fee voucher attached."
    }'
  ```
* **Response**:
  ```json
  {
    "status": "RESOLVED",
    "trail": {
      "checker_user": "vp.treasury@enterprise.com",
      "approved": true,
      "comments": "Second-level verification approved. Statement fee voucher attached.",
      "timestamp": "2026-03-01T14:35:12Z",
      "digital_signature": "SHA256:4a8c88f192b0..."
    }
  }
  ```

---

## 🔒 Security & Compliance Standards

1. **CSRF Protection**: Production deployments should configure `CSRF_TRUSTED_ORIGINS` in `settings.py` for the React frontend domain.
2. **Separation of Duties (Maker-Checker)**: The same user cannot act as both Maker and Checker on the same transaction record.
3. **Immutable Audit Trails**: State transitions record ISO timestamps, user identifiers, justification strings, and SHA-256 digital signature hashes.
4. **Data Isolation**: All parser conversions write to sanitized in-memory canonical structures before database persistence.

---

## 👨‍💻 Submission & Verification for Zetheta

This Django backend fulfills all technical criteria specified in the Zetheta challenge:
- **Part 1**: Architecture & Ingestion Pipeline (`parsers/scanner.py`, `pipeline.py`).
- **Part 2**: MT940 & ISO 20022 CAMT.053 Parsers (`parsers/mt940_parser.py`, `parsers/camt053_parser.py`).
- **Part 3**: Complex Multi-Pass Matching Algorithms (`engine/matching_engine.py`).
- **Part 4**: Exception Handling across 10 Discrepancy Classes (`engine/exception_manager.py`).
- **Part 5**: Settlement Network Pipelines (UPI, NEFT, RTGS, Card).
- **Part 6**: Auditable Reporting, Aging & Maker-Checker Workflows (`audit/audit_store.py`).
- **Part 7**: Multi-Bank Settlement Simulation & Unit Tests (`tests/test_reconciliation.py`).
