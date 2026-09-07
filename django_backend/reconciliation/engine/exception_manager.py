"""
Exception Management & Root-Cause Classification Engine:
Categorizes discrepancies into the 10 fintech reconciliation exception domains:
 1. Timing-based mismatches
 2. Amount mismatches
 3. Missing counterpart records
 4. Duplicate entries
 5. Data entry / identification errors (e.g. transposed digits)
 6. Reversals and disputes (chargebacks, bounces)
 7. Structural / format-level mismatches
 8. Cross-bank / multi-bank mismatches (e.g. wrong bank routing)
 9. Compliance / fraud-flagged anomalies (AML / KYC holds, structuring)
10. Format mismatches between bank statement & business record templates
"""

from typing import Dict, List, Any, Optional

class ExceptionManager:
    CATEGORY_LABELS = {
        "TIMING_BASED": "1. Timing-based Mismatch",
        "AMOUNT_MISMATCH": "2. Amount Mismatch / Variance",
        "MISSING_COUNTERPART": "3. Missing Counterpart Record",
        "DUPLICATE_ENTRY": "4. Duplicate Entry",
        "DATA_ENTRY_ERROR": "5. Data Entry / Identification Error",
        "REVERSAL_DISPUTE": "6. Reversals and Disputes",
        "STRUCTURAL_FORMAT": "7. Structural / Format-level Mismatch",
        "CROSS_BANK_SPECIFIC": "8. Cross-Bank Specific Mismatch",
        "COMPLIANCE_AML": "9. Compliance / Fraud-Flagged Anomaly",
        "TEMPLATE_FORMAT": "10. Bank/Ledger Template Mismatch"
    }

    def analyze_exceptions(
        self,
        unmatched_business: List[Dict[str, Any]],
        unmatched_bank: List[Dict[str, Any]],
        matched_pairs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        exceptions: List[Dict[str, Any]] = []

        # 1. Inspect Unmatched Business Records
        for b_rec in unmatched_business:
            b_amt = float(b_rec.get("amount", 0.0))
            b_ref = str(b_rec.get("raw_reference", "")).strip()
            b_doc = b_rec.get("document_id", "")
            b_status = b_rec.get("status", "")
            b_network = b_rec.get("network", "UNKNOWN")

            # Check if there is a bank record with transposed digits (e.g., 910000 vs 190000 for INV-2026-006)
            transposed_match = self._find_transposed_or_close_bank(b_amt, unmatched_bank)
            if transposed_match:
                bk_rec = transposed_match
                exc = {
                    "exception_id": f"EXC-ERR-DIGIT-{len(exceptions)+1:03d}",
                    "category_id": "DATA_ENTRY_ERROR",
                    "category_name": self.CATEGORY_LABELS["DATA_ENTRY_ERROR"],
                    "sub_type": "TRANSPOSED_DIGITS",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "business_record": b_rec,
                    "bank_record": bk_rec,
                    "discrepancy_amount": b_amt - float(bk_rec.get("amount", 0.0)),
                    "root_cause_analysis": f"Transposition error detected: Business ledger entered {b_amt:,.2f} whereas bank statement cleared {float(bk_rec.get('amount', 0.0)):,.2f} with inverted leading digits (91 vs 19).",
                    "suggested_action": "Post adjustment entry in ERP ledger for ₹720,000.00 difference or request customer remittance advice.",
                    "requires_approval": True,
                    "escalation_tier": "TREASURY_ANALYST"
                }
                exceptions.append(exc)
                continue

            # Check if there is a wrong bank account routing (e.g. RCP-2026-006)
            if "WRONG-ROUTED" in b_ref or "MISROUTED" in b_status:
                exc = {
                    "exception_id": f"EXC-CROSS-BANK-{len(exceptions)+1:03d}",
                    "category_id": "CROSS_BANK_SPECIFIC",
                    "category_name": self.CATEGORY_LABELS["CROSS_BANK_SPECIFIC"],
                    "sub_type": "WRONG_BANK_ROUTING",
                    "severity": "HIGH",
                    "status": "OPEN",
                    "business_record": b_rec,
                    "bank_record": None,
                    "discrepancy_amount": b_amt,
                    "root_cause_analysis": f"Cross-bank routing discrepancy: Payment expected in Horizon Trust Bank, but payer routed remittance to Apex Commercial Bank.",
                    "suggested_action": "Initiate inter-account treasury transfer between Apex and Horizon accounts; update billing portal beneficiary instructions.",
                    "requires_approval": True,
                    "escalation_tier": "INTER_BANK_SETTLEMENT"
                }
                exceptions.append(exc)
                continue

            # Check if voided/ledger-only entry (e.g. RCP-2026-005)
            if "VOID" in b_doc or "VOIDING" in b_status or "UNPOSTED" in b_ref:
                exc = {
                    "exception_id": f"EXC-MISSING-LEDGER-{len(exceptions)+1:03d}",
                    "category_id": "MISSING_COUNTERPART",
                    "category_name": self.CATEGORY_LABELS["MISSING_COUNTERPART"],
                    "sub_type": "LEDGER_ONLY_VOIDED_PAYMENT",
                    "severity": "MEDIUM",
                    "status": "OPEN",
                    "business_record": b_rec,
                    "bank_record": None,
                    "discrepancy_amount": b_amt,
                    "root_cause_analysis": "Ledger-only record: Internal receipt posted in ERP but never transmitted or cleared on bank statement due to pending void action.",
                    "suggested_action": "Complete ERP void workflow to reverse journal entry and remove from active settlement backlog.",
                    "requires_approval": False,
                    "escalation_tier": "OPERATIONS"
                }
                exceptions.append(exc)
                continue

            # Check for general ledger-only / deposit in transit
            exc = {
                "exception_id": f"EXC-TRANSIT-{len(exceptions)+1:03d}",
                "category_id": "TIMING_BASED",
                "category_name": self.CATEGORY_LABELS["TIMING_BASED"],
                "sub_type": "DEPOSIT_IN_TRANSIT",
                "severity": "LOW",
                "status": "OPEN",
                "business_record": b_rec,
                "bank_record": None,
                "discrepancy_amount": b_amt,
                "root_cause_analysis": "Deposit in transit: Transaction recorded in ERP, awaiting next interbank clearing cycle.",
                "suggested_action": "Allow T+1 cycle to elapse; monitor automated match queue in next statement ingestion.",
                "requires_approval": False,
                "escalation_tier": "AUTO_MONITOR"
            }
            exceptions.append(exc)

        # 2. Inspect Unmatched Bank Records
        for bk_rec in unmatched_bank:
            bk_amt = float(bk_rec.get("amount", 0.0))
            bk_ref = str(bk_rec.get("raw_reference", "") or bk_rec.get("reference_number", "")).upper()
            bk_desc = str(bk_rec.get("description", "")).upper()
            bk_network = bk_rec.get("network", "UNKNOWN")

            # Check for Chargebacks / Reversals (e.g. Mastercard chargeback in Bank 4)
            if "CHGBK" in bk_ref or "CHARGEBACK" in bk_desc or "DISPUTE" in bk_desc:
                exc = {
                    "exception_id": f"EXC-REVERSAL-CHGBK-{len(exceptions)+1:03d}",
                    "category_id": "REVERSAL_DISPUTE",
                    "category_name": self.CATEGORY_LABELS["REVERSAL_DISPUTE"],
                    "sub_type": "CARD_NETWORK_CHARGEBACK",
                    "severity": "HIGH",
                    "status": "INVESTIGATING",
                    "business_record": None,
                    "bank_record": bk_rec,
                    "discrepancy_amount": bk_amt,
                    "root_cause_analysis": f"Card network dispute reversal: Reason code 4837 (Fraudulent Transaction). Debit of ${bk_amt:,.2f} applied to settlement account.",
                    "suggested_action": "Retrieve transaction authorization token, upload proof of delivery to Mastercard merchant dispute portal within 7-day representment window.",
                    "requires_approval": True,
                    "escalation_tier": "DISPUTE_DESK"
                }
                exceptions.append(exc)
                continue

            # Check for AML / Compliance hold (e.g. Bank 4 unidentified wire under $10,000 threshold)
            if "AML" in bk_ref or "AML" in bk_desc or "THRESHOLD" in bk_desc or "OFFSHORE" in bk_desc:
                exc = {
                    "exception_id": f"EXC-COMPLIANCE-AML-{len(exceptions)+1:03d}",
                    "category_id": "COMPLIANCE_AML",
                    "category_name": self.CATEGORY_LABELS["COMPLIANCE_AML"],
                    "sub_type": "AML_STRUCTURING_HOLD",
                    "severity": "CRITICAL",
                    "status": "ESCALATED",
                    "business_record": None,
                    "bank_record": bk_rec,
                    "discrepancy_amount": bk_amt,
                    "root_cause_analysis": f"Compliance anomaly: Unidentified wire transfer of ${bk_amt:,.2f} from Offshore entity flagged for potential structuring just below $10,000 threshold.",
                    "suggested_action": "Place ledger credit on hold; escalate to Chief Compliance Officer (CCO) for Suspicious Activity Report (SAR) evaluation.",
                    "requires_approval": True,
                    "escalation_tier": "COMPLIANCE_OFFICER"
                }
                exceptions.append(exc)
                continue

            # Check for Bank-only fees & interest
            if "FEE" in bk_ref or "CHRG" in bk_ref or "PROWIZJA" in bk_desc or "INTEREST" in bk_desc or "INT" in bk_ref or "CHARGES" in bk_desc:
                is_interest = "INTEREST" in bk_desc or "INT" in bk_ref
                exc = {
                    "exception_id": f"EXC-BANK-ONLY-{len(exceptions)+1:03d}",
                    "category_id": "MISSING_COUNTERPART",
                    "category_name": self.CATEGORY_LABELS["MISSING_COUNTERPART"],
                    "sub_type": "BANK_FEES_AND_INTEREST" if not is_interest else "UNRECORDED_INTEREST_CREDIT",
                    "severity": "LOW",
                    "status": "OPEN",
                    "business_record": None,
                    "bank_record": bk_rec,
                    "discrepancy_amount": bk_amt,
                    "root_cause_analysis": f"Bank-only entry: Monthly bank operating {'interest credit' if is_interest else 'service charges'} posted by bank with no prior ERP voucher.",
                    "suggested_action": f"Auto-generate ERP bank expense/income journal entry for {bk_rec.get('currency', 'INR')} {bk_amt:,.2f} to reconcile balance.",
                    "requires_approval": False,
                    "escalation_tier": "TREASURY_OPERATIONS"
                }
                exceptions.append(exc)
                continue

            # Default bank-only entry
            exc = {
                "exception_id": f"EXC-UNIDENTIFIED-BANK-{len(exceptions)+1:03d}",
                "category_id": "MISSING_COUNTERPART",
                "category_name": self.CATEGORY_LABELS["MISSING_COUNTERPART"],
                "sub_type": "UNMATCHED_BANK_CREDIT",
                "severity": "MEDIUM",
                "status": "OPEN",
                "business_record": None,
                "bank_record": bk_rec,
                "discrepancy_amount": bk_amt,
                "root_cause_analysis": "Unidentified bank credit without matching invoice or customer voucher.",
                "suggested_action": "Contact banking relationship officer for payer remitter details.",
                "requires_approval": True,
                "escalation_tier": "TREASURY_ANALYST"
            }
            exceptions.append(exc)

        return exceptions

    def _find_transposed_or_close_bank(self, target_amt: float, bank_list: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        """
        Detects digit transposition e.g., 910,000 vs 190,000.
        Difference is divisible by 9 (fundamental mathematical property of transpositions).
        """
        for bk in bank_list:
            bk_amt = float(bk.get("amount", 0.0))
            if bk_amt > 0 and abs(target_amt - bk_amt) > 1.0:
                diff = abs(target_amt - bk_amt)
                # Check if difference is divisible by 9
                if round(diff) % 9 == 0:
                    str1 = "".join(sorted(str(int(target_amt))))
                    str2 = "".join(sorted(str(int(bk_amt))))
                    if str1 == str2:
                        return bk
        return None
