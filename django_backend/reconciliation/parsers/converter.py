"""
Converter Module:
Converts scanned records (from business documents and multiple bank statements)
into canonical tabular formats suitable for side-by-side comparison, sorting,
and algorithmic matching in the reconciliation engine.
"""

from typing import Dict, List, Any, Optional

class TabularConverter:
    @staticmethod
    def to_canonical_row(record: Dict[str, Any], origin: str = "BUSINESS") -> Dict[str, Any]:
        """
        Transforms heterogeneous scanned document into a normalized tabular row.
        """
        ref = (
            record.get("reference_number") or 
            record.get("end_to_end_id") or 
            record.get("document_id") or 
            ""
        ).strip()

        # Clean reference: remove common prefixes
        cleaned_ref = ref
        for prefix in ["REF", "UTR-", "TX-", "RRN:"]:
            if cleaned_ref.startswith(prefix):
                cleaned_ref = cleaned_ref.replace(prefix, "").strip()

        row = {
            "origin": origin,
            "document_id": record.get("document_id", ""),
            "source_type": record.get("source_type", ""),
            "bank_name": record.get("bank_name") or record.get("designated_bank", "N/A"),
            "account_number": record.get("account_number") or record.get("designated_account", ""),
            "transaction_date": record.get("transaction_date", ""),
            "settlement_date": record.get("value_date") or record.get("expected_settlement_date", ""),
            "payer_name": record.get("payer_name", ""),
            "payee_name": record.get("payee_name", ""),
            "network": record.get("transaction_type", "INTERNAL"),
            "currency": record.get("currency", "INR"),
            "amount": float(record.get("amount", 0.0)),
            "fee_amount": float(record.get("fee_amount", 0.0)),
            "net_amount": float(record.get("amount", 0.0)) - float(record.get("fee_amount", 0.0)),
            "direction": record.get("direction", "CREDIT"),
            "raw_reference": ref,
            "normalized_reference": cleaned_ref,
            "description": record.get("description", ""),
            "status": record.get("status", "UNMATCHED"),
            "raw_payload": record
        }
        return row

    @staticmethod
    def create_comparison_matrix(business_rows: List[Dict[str, Any]], bank_rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Generates aligned tabular comparison view of business ledger entries against bank statement rows.
        """
        matrix = []
        matched_bank_ids = set()

        for b_row in business_rows:
            best_bank_match = None
            b_ref = b_row.get("normalized_reference", "")
            b_amt = b_row.get("amount", 0.0)

            # Check direct ref match or amount match
            for bk in bank_rows:
                if bk["document_id"] in matched_bank_ids:
                    continue
                bk_ref = bk.get("normalized_reference", "")
                if (b_ref and b_ref in bk_ref) or (bk_ref and bk_ref in b_ref):
                    best_bank_match = bk
                    matched_bank_ids.add(bk["document_id"])
                    break
                elif abs(b_amt - bk.get("amount", 0.0)) < 0.01:
                    best_bank_match = bk
                    matched_bank_ids.add(bk["document_id"])
                    break

            matrix.append({
                "pair_id": f"PAIR-{len(matrix)+1:03d}",
                "business_record": b_row,
                "bank_record": best_bank_match,
                "amount_delta": (b_amt - best_bank_match.get("amount", 0.0)) if best_bank_match else b_amt,
                "date_delta_days": 0, # computed during matching
                "status": "ALIGNED" if (best_bank_match and abs(b_amt - best_bank_match.get("amount", 0.0)) < 0.01) else "DISCREPANCY"
            })

        # Add remaining unmatched bank records
        for bk in bank_rows:
            if bk["document_id"] not in matched_bank_ids:
                matrix.append({
                    "pair_id": f"PAIR-{len(matrix)+1:03d}",
                    "business_record": None,
                    "bank_record": bk,
                    "amount_delta": -bk.get("amount", 0.0),
                    "date_delta_days": None,
                    "status": "BANK_ONLY"
                })

        return matrix
