"""
Scanner Module:
Scans business documents (Invoices, Receipts) and bank statements (MT940, ISO 20022 CAMT.053).
Extracts: Transaction Dates, Payee/Payer name, transaction type, currency, description,
reference identifiers, and transaction amounts.
"""

from typing import Dict, List, Any, Optional
import json
from .mt940_parser import MT940Parser
from .camt053_parser import CAMT053Parser

class DocumentScanner:
    def __init__(self):
        pass

    def scan_business_invoice(self, invoice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scans an invoice record from ERP/Billing system.
        """
        return {
            "source_type": "BUSINESS_INVOICE",
            "document_id": invoice_data.get("invoice_number", ""),
            "transaction_date": invoice_data.get("issue_date", ""),
            "expected_settlement_date": invoice_data.get("expected_payment_date", ""),
            "payer_name": invoice_data.get("customer_name", ""),
            "payee_name": "ENTERPRISE TREASURY CORP",
            "tax_id": invoice_data.get("customer_tax_id", ""),
            "transaction_type": invoice_data.get("payment_method", "UNKNOWN"),
            "currency": invoice_data.get("currency", "INR"),
            "amount": float(invoice_data.get("amount", 0.0)),
            "description": invoice_data.get("description", ""),
            "reference_number": invoice_data.get("reference_identifier", ""),
            "designated_bank": invoice_data.get("designated_bank", ""),
            "designated_account": invoice_data.get("designated_account", ""),
            "po_number": invoice_data.get("po_number", ""),
            "contract_id": invoice_data.get("contract_id", ""),
            "status": invoice_data.get("status", "PENDING"),
            "split_payments": invoice_data.get("split_payments", []),
            "fee_breakdown": invoice_data.get("fee_breakdown", {})
        }

    def scan_business_receipt(self, receipt_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Scans a payment receipt record from Treasury/Cash ledger.
        """
        return {
            "source_type": "BUSINESS_RECEIPT",
            "document_id": receipt_data.get("receipt_number", ""),
            "transaction_date": receipt_data.get("receipt_date", ""),
            "expected_settlement_date": receipt_data.get("receipt_date", ""),
            "payer_name": receipt_data.get("payer_name", ""),
            "payee_name": "ENTERPRISE TREASURY CORP",
            "transaction_type": receipt_data.get("payment_channel", "UNKNOWN"),
            "currency": receipt_data.get("currency", "INR"),
            "amount": float(receipt_data.get("amount", 0.0)),
            "description": receipt_data.get("remarks", ""),
            "reference_number": receipt_data.get("transaction_reference", ""),
            "designated_bank": receipt_data.get("bank_name", ""),
            "designated_account": receipt_data.get("account_number", ""),
            "invoice_ref": receipt_data.get("invoice_ref", ""),
            "status": receipt_data.get("status", "CLEARED")
        }

    def scan_mt940_file(self, content: str, bank_name: str) -> List[Dict[str, Any]]:
        """
        Scans an MT940 bank statement and extracts standardized bank records.
        """
        parser = MT940Parser(content, bank_name=bank_name)
        parsed = parser.parse()
        records = []
        acct = parsed.get("account_number", "")

        for tx in parsed.get("transactions", []):
            rec = {
                "source_type": "BANK_STATEMENT_MT940",
                "bank_name": bank_name,
                "document_id": f"{parsed.get('statement_reference', 'MT940')}-{tx.get('reference', '')}",
                "account_number": acct,
                "transaction_date": tx.get("booking_date", tx.get("value_date", "")),
                "value_date": tx.get("value_date", ""),
                "booking_date": tx.get("booking_date", ""),
                "payer_name": tx.get("counterparty_name", "") if tx.get("direction") == "CREDIT" else "ENTERPRISE TREASURY CORP",
                "payee_name": "ENTERPRISE TREASURY CORP" if tx.get("direction") == "CREDIT" else tx.get("counterparty_name", ""),
                "direction": tx.get("direction", "CREDIT"),
                "transaction_type": tx.get("network", "MT940"),
                "currency": parsed.get("opening_balance", {}).get("currency", "INR"),
                "amount": tx.get("amount", 0.0),
                "description": tx.get("title", "") or tx.get("raw_line_61", ""),
                "reference_number": tx.get("transaction_reference", "") or tx.get("reference", ""),
                "counterparty_account": tx.get("counterparty_account", ""),
                "bank_identifier": tx.get("bank_identifier", ""),
                "raw_metadata": tx
            }
            records.append(rec)
        return records

    def scan_camt053_file(self, content: str, bank_name: str) -> List[Dict[str, Any]]:
        """
        Scans an ISO 20022 CAMT.053 XML statement and extracts standardized bank records.
        """
        parser = CAMT053Parser(content, bank_name=bank_name)
        parsed = parser.parse()
        records = []

        for stmt in parsed.get("statements", []):
            acct_info = stmt.get("account", {})
            acct_num = acct_info.get("account_number", "")
            acct_ccy = acct_info.get("currency", "INR")

            for tx in stmt.get("transactions", []):
                rec = {
                    "source_type": "BANK_STATEMENT_CAMT053",
                    "bank_name": bank_name,
                    "document_id": f"{stmt.get('statement_id', 'CAMT')}-{tx.get('reference', '')}",
                    "account_number": acct_num,
                    "transaction_date": tx.get("booking_date", tx.get("value_date", "")),
                    "value_date": tx.get("value_date", ""),
                    "booking_date": tx.get("booking_date", ""),
                    "payer_name": tx.get("counterparty_name", "") if tx.get("direction") == "CREDIT" else "ENTERPRISE TREASURY CORP",
                    "payee_name": "ENTERPRISE TREASURY CORP" if tx.get("direction") == "CREDIT" else tx.get("counterparty_name", ""),
                    "direction": tx.get("direction", "CREDIT"),
                    "transaction_type": tx.get("network", "CAMT053"),
                    "currency": tx.get("currency", acct_ccy),
                    "amount": tx.get("amount", 0.0),
                    "fee_amount": tx.get("fee_amount", 0.0),
                    "batch_id": tx.get("batch_id", ""),
                    "description": tx.get("title", "") or tx.get("remittance_info", ""),
                    "reference_number": tx.get("reference", ""),
                    "end_to_end_id": tx.get("end_to_end_id", ""),
                    "raw_metadata": tx
                }
                records.append(rec)
        return records
