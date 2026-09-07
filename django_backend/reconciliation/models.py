"""
Django Models for Multi-Bank Reconciliation Engine & Audit Store.
"""

from django.db import models
import uuid

class Bank(models.Model):
    FORMAT_CHOICES = (
        ("MT940_V1", "MT940 Variant 1 (Millennium SWIFT)"),
        ("MT940_V2", "MT940 Variant 2 (Standard SWIFT)"),
        ("CAMT053_V1", "ISO 20022 CAMT.053.001.02"),
        ("CAMT053_V2", "ISO 20022 CAMT.053.001.08"),
    )

    name = models.CharField(max_length=128, unique=True)
    bic_code = models.CharField(max_length=16, blank=True)
    account_number = models.CharField(max_length=64)
    format_type = models.CharField(max_length=32, choices=FORMAT_CHOICES)
    settlement_currency = models.CharField(max_length=3, default="INR")
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.format_type})"


class BankStatement(models.Model):
    statement_id = models.CharField(max_length=64, unique=True)
    bank = models.ForeignKey(Bank, on_delete=models.CASCADE, related_name="statements")
    sequence_number = models.CharField(max_length=32, blank=True)
    opening_balance = models.DecimalField(max_digits=18, decimal_places=2)
    closing_balance = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    statement_date = models.DateField()
    raw_payload = models.TextField(help_text="Raw MT940 or CAMT.053 payload")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.statement_id} - {self.bank.name}"


class TransactionEntry(models.Model):
    DIRECTION_CHOICES = (("CREDIT", "Credit"), ("DEBIT", "Debit"))
    NETWORK_CHOICES = (
        ("UPI", "Unified Payments Interface"),
        ("NEFT", "National Electronic Funds Transfer"),
        ("RTGS", "Real Time Gross Settlement"),
        ("CARD", "Card Network Settlement"),
        ("SWIFT", "SWIFT Cross-border Wire"),
        ("INTERNAL", "Internal Treasury Sweep"),
    )

    statement = models.ForeignKey(BankStatement, on_delete=models.CASCADE, related_name="entries")
    entry_ref = models.CharField(max_length=128)
    booking_date = models.DateField()
    value_date = models.DateField()
    direction = models.CharField(max_length=8, choices=DIRECTION_CHOICES)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    fee_amount = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    network = models.CharField(max_length=16, choices=NETWORK_CHOICES)
    counterparty_name = models.CharField(max_length=256, blank=True)
    counterparty_account = models.CharField(max_length=64, blank=True)
    narration = models.TextField(blank=True)
    is_reconciled = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.entry_ref} | {self.direction} {self.amount}"


class BusinessRecord(models.Model):
    RECORD_TYPE_CHOICES = (("INVOICE", "Invoice"), ("RECEIPT", "Receipt"))
    record_type = models.CharField(max_length=16, choices=RECORD_TYPE_CHOICES)
    document_id = models.CharField(max_length=64, unique=True)
    payer_or_payee = models.CharField(max_length=256)
    tax_id = models.CharField(max_length=64, blank=True)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=3, default="INR")
    transaction_date = models.DateField()
    designated_bank = models.ForeignKey(Bank, on_delete=models.SET_NULL, null=True, blank=True)
    reference_identifier = models.CharField(max_length=128, blank=True)
    status = models.CharField(max_length=32, default="PENDING")
    created_by = models.EmailField(default="billing.analyst@enterprise.com")
    created_at = models.DateTimeField(auto_now_add=True)


class ReconciliationJob(models.Model):
    job_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    executed_at = models.DateTimeField(auto_now_add=True)
    total_business_records = models.IntegerField(default=0)
    total_bank_records = models.IntegerField(default=0)
    reconciled_count = models.IntegerField(default=0)
    exception_count = models.IntegerField(default=0)
    match_rate = models.FloatField(default=0.0)


class MatchResult(models.Model):
    job = models.ForeignKey(ReconciliationJob, on_delete=models.CASCADE, related_name="matches")
    match_rule = models.CharField(max_length=64)
    confidence_score = models.FloatField()
    business_record = models.ForeignKey(BusinessRecord, on_delete=models.CASCADE)
    bank_entry = models.ForeignKey(TransactionEntry, on_delete=models.CASCADE)
    variance = models.DecimalField(max_digits=18, decimal_places=2, default=0.00)
    matched_at = models.DateTimeField(auto_now_add=True)


class ExceptionRecord(models.Model):
    SEVERITY_CHOICES = (
        ("CRITICAL", "Critical"),
        ("HIGH", "High"),
        ("MEDIUM", "Medium"),
        ("LOW", "Low"),
    )
    STATUS_CHOICES = (
        ("OPEN", "Open"),
        ("INVESTIGATING", "Investigating"),
        ("PENDING_CHECKER_APPROVAL", "Pending Checker Approval"),
        ("RESOLVED", "Resolved"),
        ("WRITTEN_OFF", "Written Off"),
    )

    exception_id = models.CharField(max_length=64, unique=True)
    category_id = models.CharField(max_length=64)
    sub_type = models.CharField(max_length=64)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES, default="MEDIUM")
    status = models.CharField(max_length=32, choices=STATUS_CHOICES, default="OPEN")
    discrepancy_amount = models.DecimalField(max_digits=18, decimal_places=2)
    root_cause_analysis = models.TextField()
    suggested_action = models.TextField()
    requires_approval = models.BooleanField(default=True)
    assigned_analyst = models.EmailField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    resolved_at = models.DateTimeField(null=True, blank=True)


class ResolutionSignoff(models.Model):
    exception = models.OneToOneField(ExceptionRecord, on_delete=models.CASCADE, related_name="signoff")
    maker_user = models.EmailField()
    maker_action = models.CharField(max_length=64)
    maker_justification = models.TextField()
    maker_timestamp = models.DateTimeField(auto_now_add=True)
    checker_user = models.EmailField(blank=True, null=True)
    checker_approved = models.BooleanField(default=False)
    checker_comments = models.TextField(blank=True)
    checker_timestamp = models.DateTimeField(null=True, blank=True)
