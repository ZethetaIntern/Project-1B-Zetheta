"""
MT940 Statement Parser supporting both Variant 1 (Millennium SWIFT format with :86: <xx subfields and comma decimals)
and Variant 2 (Standard SWIFT format with slash delimiters and period decimals).
Compliant with File_format_description_of_MT940 specifications.
"""

import re
from decimal import Decimal
from typing import Dict, List, Any, Optional

class MT940Parser:
    def __init__(self, content: str, bank_name: str = "Apex Commercial Bank"):
        self.content = content
        self.bank_name = bank_name
        self.lines = [line.strip("\r") for line in content.split("\n") if line.strip("\r")]

    def parse(self) -> Dict[str, Any]:
        result = {
            "bank_name": self.bank_name,
            "format": "MT940",
            "statement_reference": "",
            "account_number": "",
            "statement_number": "",
            "account_owner": "",
            "account_name": "",
            "opening_balance": {},
            "closing_balance": {},
            "available_balance": {},
            "transactions": []
        }

        i = 0
        current_tx: Optional[Dict[str, Any]] = None

        while i < len(self.lines):
            line = self.lines[i].strip()
            if not line:
                i += 1
                continue

            # Tag :20: Reference
            if line.startswith(":20:"):
                result["statement_reference"] = line[4:].strip()

            # Tag :25: Account Number
            elif line.startswith(":25:"):
                result["account_number"] = line[4:].strip()

            # Tag :28C: Statement Number
            elif line.startswith(":28C:"):
                result["statement_number"] = line[5:].strip()

            # Tag :NS:22 Account owner name
            elif line.startswith(":NS:22"):
                result["account_owner"] = line[6:].strip()

            # Tag :NS:23 Account name
            elif line.startswith(":NS:23"):
                result["account_name"] = line[6:].strip()

            # Tag :60F: Opening Balance (:60F:C260901INR1450000,00 or .00)
            elif line.startswith(":60F:"):
                raw = line[5:]
                d_c = raw[0]
                date_str = raw[1:7]
                curr = raw[7:10]
                amt_str = raw[10:].replace(",", ".")
                result["opening_balance"] = {
                    "indicator": "CREDIT" if d_c == "C" else "DEBIT",
                    "date": f"20{date_str[0:2]}-{date_str[2:4]}-{date_str[4:6]}",
                    "currency": curr,
                    "amount": float(Decimal(amt_str))
                }

            # Tag :61: Transaction Line
            elif line.startswith(":61:"):
                if current_tx:
                    result["transactions"].append(current_tx)
                current_tx = self._parse_tag_61(line[4:])
                # Check for line under :61: (Transaction code description)
                if i + 1 < len(self.lines) and not self.lines[i + 1].startswith(":") and not self.lines[i + 1].startswith("<"):
                    i += 1
                    current_tx["code_description"] = self.lines[i].strip()

            # Tag :86: Transaction details
            elif line.startswith(":86:"):
                tag86_lines = [line[4:].strip()]
                # Collect continuation lines for :86: until next tag starts with :XX:
                while i + 1 < len(self.lines):
                    nxt = self.lines[i + 1].strip()
                    if nxt.startswith(":") and re.match(r"^:[0-9A-Z]{2,4}:", nxt):
                        break
                    tag86_lines.append(nxt)
                    i += 1

                raw_tag86 = "\n".join(tag86_lines)
                if current_tx:
                    current_tx["details"] = self._parse_tag_86(raw_tag86)
                    # Sync common fields
                    self._enrich_transaction_from_details(current_tx)

            # Tag :62F: Closing Balance
            elif line.startswith(":62F:"):
                raw = line[5:]
                d_c = raw[0]
                date_str = raw[1:7]
                curr = raw[7:10]
                amt_str = raw[10:].replace(",", ".")
                result["closing_balance"] = {
                    "indicator": "CREDIT" if d_c == "C" else "DEBIT",
                    "date": f"20{date_str[0:2]}-{date_str[2:4]}-{date_str[4:6]}",
                    "currency": curr,
                    "amount": float(Decimal(amt_str))
                }

            # Tag :64: Available Balance
            elif line.startswith(":64:"):
                raw = line[4:]
                d_c = raw[0]
                date_str = raw[1:7]
                curr = raw[7:10]
                amt_str = raw[10:].replace(",", ".")
                result["available_balance"] = {
                    "indicator": "CREDIT" if d_c == "C" else "DEBIT",
                    "date": f"20{date_str[0:2]}-{date_str[2:4]}-{date_str[4:6]}",
                    "currency": curr,
                    "amount": float(Decimal(amt_str))
                }

            i += 1

        if current_tx:
            result["transactions"].append(current_tx)

        return result

    def _parse_tag_61(self, raw: str) -> Dict[str, Any]:
        """
        Parses Tag 61:
        Format: YYMMDD[MMDD]C/D/RC/RD[letter]Amount[NTRF//ref]
        e.g.: 2609020902CR145000,00NTRFNONREF//UPI145000001
        """
        val_date = raw[0:6]
        booking_date = raw[6:10]
        rest = raw[10:]

        d_c = "C"
        if rest.startswith("CR") or rest.startswith("RC"):
            d_c = "C"
            rest = rest[2:]
        elif rest.startswith("DR") or rest.startswith("RD"):
            d_c = "D"
            rest = rest[2:]
        elif rest.startswith("C"):
            d_c = "C"
            rest = rest[1:]
        elif rest.startswith("D"):
            d_c = "D"
            rest = rest[1:]

        # Currency 3rd char or amount
        curr_3rd = ""
        if rest and rest[0].isalpha():
            curr_3rd = rest[0]
            rest = rest[1:]

        # Split amount from transaction code / reference
        amt_match = re.match(r"^([0-9]+[,\.][0-9]{2})(.*)$", rest)
        amount = 0.0
        tx_type_ref = ""
        ref = ""

        if amt_match:
            amount = float(Decimal(amt_match.group(1).replace(",", ".")))
            tx_type_ref = amt_match.group(2)
        else:
            digits_match = re.match(r"^([0-9]+)(.*)$", rest)
            if digits_match:
                amount = float(digits_match.group(1))
                tx_type_ref = digits_match.group(2)

        if "//" in tx_type_ref:
            parts = tx_type_ref.split("//")
            ref = parts[1].strip()
        else:
            ref = tx_type_ref.strip()

        return {
            "value_date": f"20{val_date[0:2]}-{val_date[2:4]}-{val_date[4:6]}",
            "booking_date": f"20{val_date[0:2]}-{booking_date[0:2]}-{booking_date[2:4]}",
            "direction": "CREDIT" if d_c == "C" else "DEBIT",
            "amount": amount,
            "currency_code_char": curr_3rd,
            "reference": ref,
            "raw_line_61": raw,
            "details": {}
        }

    def _parse_tag_86(self, raw: str) -> Dict[str, Any]:
        """
        Parses Tag 86 supporting subfields with <XX (Variant 1) and slash-delimiters /TAG/ (Variant 2)
        """
        details = {
            "raw": raw,
            "transaction_code": "",
            "title": "",
            "counterparty_name": "",
            "counterparty_account": "",
            "bank_identifier": "",
            "reference_number": "",
            "subfields": {}
        }

        # Check for Variant 1 (<00, <10, <20, etc.)
        if "<" in raw:
            # Extract optional numerical transaction code at start (e.g. 010<00...)
            code_match = re.match(r"^([0-9]{3})?<", raw)
            if code_match and code_match.group(1):
                details["transaction_code"] = code_match.group(1)

            # Split by <
            chunks = raw.split("<")
            for chunk in chunks[1:]:
                if len(chunk) >= 2:
                    sub_id = chunk[0:2]
                    sub_val = chunk[2:].strip()
                    details["subfields"][sub_id] = sub_val
                    if sub_id == "00":
                        details["title"] = sub_val
                    elif sub_id == "20" and not details["title"]:
                        details["title"] = sub_val
                    elif sub_id == "27" or sub_id == "32":
                        if not details["counterparty_name"]:
                            details["counterparty_name"] = sub_val
                    elif sub_id == "38" or sub_id == "31":
                        if not details["counterparty_account"]:
                            details["counterparty_account"] = sub_val
                    elif sub_id == "30":
                        details["bank_identifier"] = sub_val
                    elif sub_id == "63":
                        details["reference_number"] = sub_val

        # Variant 2 (SWIFT /REFR/ /BNF/ /AC/ /IFSC/ /REMI/)
        elif "/" in raw:
            tokens = re.findall(r"/([A-Z]{2,6})/([^/]+)", raw)
            for key, val in tokens:
                details["subfields"][key] = val.strip()
                if key == "BNF":
                    details["counterparty_name"] = val.strip()
                elif key == "AC":
                    details["counterparty_account"] = val.strip()
                elif key == "REFR":
                    details["reference_number"] = val.strip()
                elif key == "IFSC":
                    details["bank_identifier"] = val.strip()
                elif key == "REMI" or key == "TRF":
                    details["title"] = val.strip()

        return details

    def _enrich_transaction_from_details(self, tx: Dict[str, Any]) -> None:
        details = tx.get("details", {})
        tx["counterparty_name"] = details.get("counterparty_name", "")
        tx["counterparty_account"] = details.get("counterparty_account", "")
        tx["bank_identifier"] = details.get("bank_identifier", "")
        tx["title"] = details.get("title", "")

        ref_no = details.get("reference_number", "")
        if ref_no:
            tx["transaction_reference"] = ref_no
        else:
            tx["transaction_reference"] = tx.get("reference", "")

        # Detect payment channel / network
        raw_full = (tx.get("raw_line_61", "") + " " + details.get("raw", "")).upper()
        if "UPI" in raw_full or "VPA:" in raw_full or "RRN:" in raw_full:
            tx["network"] = "UPI"
        elif "NEFT" in raw_full or "IFSC" in raw_full:
            tx["network"] = "NEFT"
        elif "RTGS" in raw_full:
            tx["network"] = "RTGS"
        elif "CARD" in raw_full or "VISA" in raw_full or "MASTERCARD" in raw_full:
            tx["network"] = "CARD"
        else:
            tx["network"] = "INTERNAL"
