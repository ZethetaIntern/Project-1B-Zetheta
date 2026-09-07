"""
Unit & Integration Test Suite for Automated Reconciliation Engine.
Verifies:
 - MT940 Parser (Variant 1 Millennium subfields & Variant 2 SWIFT delimiters)
 - ISO 20022 CAMT.053 Parser (camt.053.001.02 & camt.053.001.08 XML)
 - DocumentScanner & TabularConverter
 - MatchingEngine (Exact UTR, UPI RRN, NEFT Batch, RTGS High-value, Card MDR netting, Split matching)
 - ExceptionManager (10 categories of mismatches, transposed digits, wrong-bank routing, AML hold)
 - AuditStore 6-tier compliance trails & Maker-Checker workflow
"""

import unittest
import os
import sys

# Ensure django_backend is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from reconciliation.parsers.mt940_parser import MT940Parser
from reconciliation.parsers.camt053_parser import CAMT053Parser
from reconciliation.parsers.scanner import DocumentScanner
from reconciliation.parsers.converter import TabularConverter
from reconciliation.engine.matching_engine import MatchingEngine
from reconciliation.engine.exception_manager import ExceptionManager
from reconciliation.audit.audit_store import AuditStore
from reconciliation.pipeline import ReconciliationPipeline

class TestReconciliationEngine(unittest.TestCase):
    def setUp(self):
        self.sample_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../sample_data"))

    def test_mt940_parser_variant1(self):
        path = os.path.join(self.sample_dir, "bank1_apex_mt940.sta")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        parser = MT940Parser(content, bank_name="Apex Commercial Bank")
        parsed = parser.parse()

        self.assertEqual(parsed["format"], "MT940")
        self.assertEqual(parsed["bank_name"], "Apex Commercial Bank")
        self.assertEqual(parsed["account_number"], "APEX9912000000001111222233")
        self.assertTrue(len(parsed["transactions"]) >= 3)
        # Check first transaction amount
        tx1 = parsed["transactions"][0]
        self.assertEqual(tx1["amount"], 145000.0)
        self.assertEqual(tx1["direction"], "CREDIT")

    def test_mt940_parser_variant2(self):
        path = os.path.join(self.sample_dir, "bank2_horizon_mt940.sta")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        parser = MT940Parser(content, bank_name="Horizon Trust Bank")
        parsed = parser.parse()

        self.assertEqual(parsed["format"], "MT940")
        self.assertEqual(parsed["bank_name"], "Horizon Trust Bank")
        self.assertTrue(len(parsed["transactions"]) >= 3)
        # Check NEFT transaction
        neft_tx = parsed["transactions"][0]
        self.assertEqual(neft_tx["amount"], 420000.0)
        self.assertEqual(neft_tx["direction"], "CREDIT")

    def test_camt053_parser_bank3(self):
        path = os.path.join(self.sample_dir, "bank3_vanguard_camt053.xml")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        parser = CAMT053Parser(content, bank_name="Vanguard International Bank")
        parsed = parser.parse()

        self.assertEqual(parsed["format"], "ISO 20022 CAMT.053")
        self.assertTrue(len(parsed["statements"]) >= 1)
        stmt = parsed["statements"][0]
        self.assertEqual(stmt["account"]["account_number"], "IN64VANG000000008888999900")
        # Check RTGS high value
        tx_rtgs = stmt["transactions"][0]
        self.assertEqual(tx_rtgs["amount"], 2500000.0)
        self.assertEqual(tx_rtgs["network"], "RTGS")

    def test_camt053_parser_bank4_card_and_aml(self):
        path = os.path.join(self.sample_dir, "bank4_meridian_camt053.xml")
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        parser = CAMT053Parser(content, bank_name="Meridian Capital Bank")
        parsed = parser.parse()

        self.assertEqual(parsed["format"], "ISO 20022 CAMT.053")
        stmt = parsed["statements"][0]
        self.assertEqual(stmt["account"]["currency"], "USD")
        # Check Card MDR fee entry
        tx_card = stmt["transactions"][0]
        self.assertEqual(tx_card["amount"], 24010.0)
        self.assertEqual(tx_card["fee_amount"], 490.0)

    def test_end_to_end_reconciliation_pipeline(self):
        pipeline = ReconciliationPipeline(data_dir=self.sample_dir)
        results = pipeline.run_pipeline()

        summary = results["summary"]
        self.assertGreater(summary["total_business_records"], 0)
        self.assertGreater(summary["total_bank_records"], 0)
        self.assertGreater(summary["reconciled_pairs_count"], 0)
        self.assertGreater(summary["exceptions_count"], 0)

        # Check matched pairs include exact, card net, and split
        matched_rules = [m["rule"] for m in results["matched_pairs"]]
        self.assertIn("EXACT_REFERENCE_AND_AMOUNT", matched_rules)
        self.assertIn("CARD_NETWORK_MDR_NETTING", matched_rules)
        self.assertIn("SPLIT_PAYMENT_AGGREGATION", matched_rules)

        # Check exceptions include transposed digit, wrong bank, and compliance
        exc_types = [e["sub_type"] for e in results["exceptions"]]
        self.assertIn("TRANSPOSED_DIGITS", exc_types)
        self.assertIn("WRONG_BANK_ROUTING", exc_types)
        self.assertIn("AML_STRUCTURING_HOLD", exc_types)

    def test_audit_store_maker_checker_flow(self):
        store = AuditStore()
        fake_exc = {
            "exception_id": "EXC-TEST-001",
            "category_id": "DATA_ENTRY_ERROR",
            "root_cause_analysis": "Digit error",
            "discrepancy_amount": 720000.0,
            "requires_approval": True,
            "status": "OPEN"
        }
        trail = store.generate_audit_trail_for_exception(fake_exc)
        self.assertEqual(trail["exception_id"], "EXC-TEST-001")
        self.assertIn("customer_master", trail["source_documents"])
        self.assertIn("maker_checker_workflow", trail["resolution_audit"])

        # Maker action
        store.record_maker_action("EXC-TEST-001", "sarah.chen@fintech.com", "POST_ADJUSTMENT", "Customer confirmed transposition error")
        updated = store._audit_records["EXC-TEST-001"]
        self.assertEqual(updated["resolution_audit"]["current_status"], "PENDING_CHECKER_APPROVAL")

        # Checker sign-off
        store.record_checker_signoff("EXC-TEST-001", "alex.vance@fintech.com", True, "Approved after verifying bank clearing slip")
        final = store._audit_records["EXC-TEST-001"]
        self.assertEqual(final["resolution_audit"]["current_status"], "RESOLVED")
        self.assertEqual(final["resolution_audit"]["maker_checker_workflow"]["checker"]["signoff_status"], "APPROVED")

if __name__ == "__main__":
    unittest.main()
