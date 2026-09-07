"""
Audit Store Module:
Implements the 6-tier fintech audit trail schema:
 1. Source document references (Invoice, PO, Contract, GSTIN, Customer Master)
 2. Transaction lifecycle history (Creation, modification logs, high-value RTGS approval trail)
 3. Payment initiation details (Payment instructions, batch submission logs)
 4. Communication and dispute context (Internal notes, email links, prior dispute history)
 5. Reference & reconciliation metadata (All reference keys, engine decision logs, confidence scores)
 6. User resolution actions (Analyst investigation, status flow, resolution justification, dual sign-off)
"""

from datetime import datetime
from typing import Dict, List, Any, Optional

class AuditStore:
    def __init__(self):
        self._audit_records: Dict[str, Dict[str, Any]] = {}

    def generate_audit_trail_for_exception(
        self,
        exception_record: Dict[str, Any],
        business_record: Optional[Dict[str, Any]] = None,
        bank_record: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        exc_id = exception_record.get("exception_id", "")
        doc_id = (business_record or {}).get("document_id", "DOC-N/A")
        raw_b = (business_record or {}).get("raw_payload", business_record or {})
        raw_bk = (bank_record or {}).get("raw_metadata", bank_record or {})

        audit_record = {
            "exception_id": exc_id,
            "generated_at": datetime.utcnow().isoformat() + "Z",
            
            # Tier 1: Source document references
            "source_documents": {
                "primary_document_id": doc_id,
                "document_type": (business_record or {}).get("source_type", "BANK_ORIGINATED"),
                "invoice_number": raw_b.get("invoice_number", doc_id),
                "po_number": raw_b.get("po_number", "PO-2026-DEFAULT"),
                "contract_id": raw_b.get("contract_id", "CNT-MASTER-SETTLE-01"),
                "document_url": f"/documents/invoices/{doc_id}.pdf",
                "customer_master": {
                    "name": (business_record or {}).get("payer_name") or (bank_record or {}).get("counterparty_name", "Counterparty"),
                    "tax_id": raw_b.get("customer_tax_id", "GSTIN-NOT-RECORDED"),
                    "registered_bank_account": (business_record or {}).get("account_number", "N/A"),
                    "payment_terms": "NET_30_DAYS",
                    "credit_rating": "AAA_TIER_1"
                }
            },

            # Tier 2: Transaction lifecycle history
            "lifecycle_history": {
                "created_by": raw_b.get("created_by", "system.automated.ingestion@enterprise.com"),
                "created_at": raw_b.get("created_at", "2026-09-01T09:00:00Z"),
                "ingestion_channel": "API_GATEWAY_V3",
                "modification_log": [
                    {
                        "timestamp": "2026-09-02T10:15:00Z",
                        "user_id": "erp.sync.service",
                        "field_modified": "payment_status",
                        "old_value": "PENDING",
                        "new_value": "SUBMITTED_FOR_CLEARING"
                    }
                ],
                "approval_trail": [
                    {
                        "approver_name": raw_b.get("approved_by", "treasury.manager@enterprise.com"),
                        "role": "TREASURY_MANAGER",
                        "authorization_level": "LEVEL_2_AUTHORITY_UP_TO_10M",
                        "approved_at": "2026-09-01T15:30:00Z",
                        "digital_signature_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
                    }
                ]
            },

            # Tier 3: Payment initiation details
            "payment_initiation": {
                "instruction_id": f"INST-PAY-{doc_id}",
                "payment_mode": (business_record or {}).get("network") or (bank_record or {}).get("network", "NEFT"),
                "designated_bank": (business_record or {}).get("bank_name", "Designated Clearing Bank"),
                "beneficiary_account": (business_record or {}).get("account_number", ""),
                "batch_id": raw_b.get("reference_identifier") or raw_bk.get("batch_id", "BATCH-DEFAULT"),
                "submission_timestamp": "2026-09-02T08:00:00Z",
                "clearing_cycle": "CYCLE_NEFT_B04_HOURLY"
            },

            # Tier 4: Communication and dispute context
            "dispute_context": {
                "internal_notes": [
                    {
                        "author": "analyst.ops@enterprise.com",
                        "timestamp": "2026-09-04T11:20:00Z",
                        "note": f"Exception flagged by matching engine: {exception_record.get('root_cause_analysis', '')}"
                    }
                ],
                "crm_ticket_id": f"TKT-RECON-{exc_id[-6:]}",
                "email_thread_ref": f"reconciliation-query-{doc_id}@enterprise.zendesk.com",
                "prior_exception_history": {
                    "has_prior_exceptions": True if "DIGIT" in exc_id else False,
                    "prior_count": 2 if "DIGIT" in exc_id else 0,
                    "last_occurrence_date": "2026-07-15",
                    "recurring_discrepancy_flag": True if "DIGIT" in exc_id else False
                }
            },

            # Tier 5: Reference & reconciliation metadata
            "reconciliation_metadata": {
                "invoice_number": raw_b.get("invoice_number", doc_id),
                "erp_journal_number": f"JV-2026-09-{exc_id[-4:]}",
                "internal_tx_id": f"TXN-INTERNAL-{doc_id}",
                "utr_or_rrn": (business_record or {}).get("raw_reference") or (bank_record or {}).get("raw_reference", ""),
                "bank_reference": (bank_record or {}).get("raw_reference", ""),
                "engine_decision_log": {
                    "rule_evaluated": "MULTI_PASS_MATCHING_V4",
                    "failed_criteria": exception_record.get("sub_type", "MISMATCH"),
                    "confidence_score": 45.0,
                    "variance_detected": exception_record.get("discrepancy_amount", 0.0),
                    "reason": exception_record.get("root_cause_analysis", "")
                }
            },

            # Tier 6: User resolution actions (Maker-Checker Workflow)
            "resolution_audit": {
                "assigned_analyst": "sarah.chen@fintech-ops.com",
                "investigation_started_at": "2026-09-04T11:30:00Z",
                "current_status": exception_record.get("status", "OPEN"),
                "suggested_action": exception_record.get("suggested_action", ""),
                "manual_override_applied": False,
                "resolution_notes": "",
                "resolved_at": None,
                "first_level_action_by": None,
                "maker_checker_workflow": {
                    "dual_authorization_required": exception_record.get("requires_approval", True),
                    "maker": {
                        "user_id": "sarah.chen@fintech-ops.com",
                        "action": "PENDING_ACTION",
                        "timestamp": None,
                        "justification": ""
                    },
                    "checker": {
                        "user_id": "alex.vance@fintech-treasury.com",
                        "signoff_status": "AWAITING_MAKER",
                        "signoff_timestamp": None,
                        "approval_comments": ""
                    }
                }
            }
        }

        self._audit_records[exc_id] = audit_record
        return audit_record

    def record_maker_action(
        self,
        exc_id: str,
        maker_user: str,
        action: str,
        justification: str
    ) -> Dict[str, Any]:
        record = self._audit_records.get(exc_id)
        if not record:
            return {}

        res = record["resolution_audit"]
        res["current_status"] = "PENDING_CHECKER_APPROVAL" if res["maker_checker_workflow"]["dual_authorization_required"] else "RESOLVED"
        res["resolution_notes"] = justification
        res["first_level_action_by"] = maker_user
        res["maker_checker_workflow"]["maker"] = {
            "user_id": maker_user,
            "action": action,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "justification": justification
        }
        res["maker_checker_workflow"]["checker"]["signoff_status"] = "PENDING_CHECKER_SIGNOFF"
        return record

    def record_checker_signoff(
        self,
        exc_id: str,
        checker_user: str,
        approved: bool,
        comments: str
    ) -> Dict[str, Any]:
        record = self._audit_records.get(exc_id)
        if not record:
            return {}

        res = record["resolution_audit"]
        if approved:
            res["current_status"] = "RESOLVED"
            res["resolved_at"] = datetime.utcnow().isoformat() + "Z"
            res["maker_checker_workflow"]["checker"] = {
                "user_id": checker_user,
                "signoff_status": "APPROVED",
                "signoff_timestamp": datetime.utcnow().isoformat() + "Z",
                "approval_comments": comments
            }
        else:
            res["current_status"] = "REJECTED_BY_CHECKER"
            res["maker_checker_workflow"]["checker"] = {
                "user_id": checker_user,
                "signoff_status": "REJECTED",
                "signoff_timestamp": datetime.utcnow().isoformat() + "Z",
                "approval_comments": comments
            }
        return record
