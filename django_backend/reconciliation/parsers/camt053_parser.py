"""
ISO 20022 CAMT.053 XML Statement Parser.
Supports camt.053.001.02 and camt.053.001.08 schemas with namespace tolerance.
Extracts statement identification, date ranges, account identity, opening/closing balances,
transaction entries, charges/fees, debtor/creditor info, and remittance details.
"""

import xml.etree.ElementTree as ET
from decimal import Decimal
from typing import Dict, List, Any, Optional

class CAMT053Parser:
    def __init__(self, content: str, bank_name: str = "Vanguard International Bank"):
        self.content = content
        self.bank_name = bank_name

    def parse(self) -> Dict[str, Any]:
        # Strip namespaces or handle with local-name
        root = ET.fromstring(self.content)
        ns_uri = ""
        if root.tag.startswith("{"):
            ns_uri = root.tag.split("}")[0] + "}"

        def find(elem, tag):
            if elem is None:
                return None
            return elem.find(f"{ns_uri}{tag}")

        def findall(elem, tag):
            if elem is None:
                return []
            return elem.findall(f"{ns_uri}{tag}")

        def findtext(elem, tag, default=""):
            if elem is None:
                return default
            node = elem.find(f"{ns_uri}{tag}")
            return node.text.strip() if (node is not None and node.text) else default

        result: Dict[str, Any] = {
            "bank_name": self.bank_name,
            "format": "ISO 20022 CAMT.053",
            "message_id": "",
            "creation_datetime": "",
            "statements": []
        }

        stmt_container = find(root, "BkToCstmrStmt") or root
        grpHdr = find(stmt_container, "GrpHdr")
        if grpHdr is not None:
            result["message_id"] = findtext(grpHdr, "MsgId")
            result["creation_datetime"] = findtext(grpHdr, "CreDtTm")

        for stmt in findall(stmt_container, "Stmt"):
            stmt_obj = {
                "statement_id": findtext(stmt, "Id"),
                "sequence_number": findtext(stmt, "ElctrncSeqNb"),
                "creation_datetime": findtext(stmt, "CreDtTm"),
                "date_range": {},
                "account": {},
                "balances": {},
                "transactions": []
            }

            frToDt = find(stmt, "FrToDt")
            if frToDt is not None:
                stmt_obj["date_range"] = {
                    "from": findtext(frToDt, "FrDtTm") or findtext(frToDt, "FrDt"),
                    "to": findtext(frToDt, "ToDtTm") or findtext(frToDt, "ToDt")
                }

            # Account
            acct = find(stmt, "Acct")
            if acct is not None:
                acct_id = find(acct, "Id")
                iban = findtext(acct_id, "IBAN") if acct_id is not None else ""
                othr_id = ""
                if not iban and acct_id is not None:
                    othr = find(acct_id, "Othr")
                    othr_id = findtext(othr, "Id") if othr is not None else ""

                stmt_obj["account"] = {
                    "account_number": iban or othr_id,
                    "currency": findtext(acct, "Ccy"),
                    "account_name": findtext(acct, "Nm")
                }

            # Balances
            for bal in findall(stmt, "Bal"):
                tp = find(bal, "Tp")
                cdOrPrtry = find(tp, "CdOrPrtry") if tp is not None else None
                bal_type = findtext(cdOrPrtry, "Cd") if cdOrPrtry is not None else "OTHER"
                
                amt_node = find(bal, "Amt")
                amt_val = float(Decimal(amt_node.text.strip())) if (amt_node is not None and amt_node.text) else 0.0
                curr = amt_node.attrib.get("Ccy", "") if amt_node is not None else ""
                cdt_dbt = findtext(bal, "CdtDbtInd")

                dt_node = find(bal, "Dt")
                dt_val = findtext(dt_node, "Dt") or findtext(dt_node, "DtTm") if dt_node is not None else ""

                stmt_obj["balances"][bal_type] = {
                    "type": bal_type,
                    "amount": amt_val,
                    "currency": curr,
                    "indicator": "CREDIT" if cdt_dbt in ["CRDT", "C"] else "DEBIT",
                    "date": dt_val
                }

            # Transactions (Entries)
            for ntry in findall(stmt, "Ntry"):
                amt_node = find(ntry, "Amt")
                amount = float(Decimal(amt_node.text.strip())) if (amt_node is not None and amt_node.text) else 0.0
                currency = amt_node.attrib.get("Ccy", "") if amt_node is not None else stmt_obj["account"].get("currency", "INR")
                cdt_dbt = findtext(ntry, "CdtDbtInd")
                status = findtext(ntry, "Sts")
                booking_dt_node = find(ntry, "BookgDt")
                booking_dt = findtext(booking_dt_node, "Dt") or findtext(booking_dt_node, "DtTm") if booking_dt_node is not None else ""
                val_dt_node = find(ntry, "ValDt")
                val_dt = findtext(val_dt_node, "Dt") or findtext(val_dt_node, "DtTm") if val_dt_node is not None else booking_dt
                acct_svcr_ref = findtext(ntry, "AcctSvcrRef")

                # Bank transaction code
                tx_family = ""
                tx_subfamily = ""
                bkTxCd = find(ntry, "BkTxCd")
                if bkTxCd is not None:
                    domn = find(bkTxCd, "Domn")
                    if domn is not None:
                        fmly = find(domn, "Fmly")
                        if fmly is not None:
                            tx_family = findtext(fmly, "Cd")
                            tx_subfamily = findtext(fmly, "SubFmlyCd")

                # Fees & Charges
                fee_amount = 0.0
                chrgs = find(ntry, "Chrgs")
                if chrgs is not None:
                    ttlChrgs = find(chrgs, "TtlChrgsAndTaxAmt")
                    if ttlChrgs is not None and ttlChrgs.text:
                        fee_amount = float(Decimal(ttlChrgs.text.strip()))

                # Entry Details -> Tx Details
                end_to_end_id = ""
                tx_id = ""
                debtor_name = ""
                creditor_name = ""
                remittance_info = ""
                batch_id = ""

                ntryDtls = find(ntry, "NtryDtls")
                if ntryDtls is not None:
                    btch = find(ntryDtls, "Btch")
                    if btch is not None:
                        batch_id = findtext(btch, "MsgId") or findtext(btch, "PmtInfId")

                    for txDtls in findall(ntryDtls, "TxDtls"):
                        refs = find(txDtls, "Refs")
                        if refs is not None:
                            end_to_end_id = findtext(refs, "EndToEndId")
                            tx_id = findtext(refs, "TxId")

                        rltdPties = find(txDtls, "RltdPties")
                        if rltdPties is not None:
                            dbtr = find(rltdPties, "Dbtr")
                            if dbtr is not None:
                                debtor_name = findtext(dbtr, "Nm")
                            cdtr = find(rltdPties, "Cdtr")
                            if cdtr is not None:
                                creditor_name = findtext(cdtr, "Nm")

                        rmtInf = find(txDtls, "RmtInf")
                        if rmtInf is not None:
                            remittance_info = findtext(rmtInf, "Ustrd")

                # Determine network
                full_narration = f"{remittance_info} {tx_family} {tx_subfamily} {acct_svcr_ref}".upper()
                if "RTGS" in full_narration:
                    network = "RTGS"
                elif "NEFT" in full_narration:
                    network = "NEFT"
                elif "UPI" in full_narration:
                    network = "UPI"
                elif "CARD" in full_narration or "VISA" in full_narration or "MASTERCARD" in full_narration or "CCRD" in full_narration:
                    network = "CARD"
                else:
                    network = "SWIFT"

                tx_item = {
                    "reference": tx_id or end_to_end_id or acct_svcr_ref,
                    "end_to_end_id": end_to_end_id,
                    "tx_id": tx_id,
                    "acct_svcr_ref": acct_svcr_ref,
                    "booking_date": booking_dt,
                    "value_date": val_dt,
                    "direction": "CREDIT" if cdt_dbt in ["CRDT", "C"] else "DEBIT",
                    "amount": amount,
                    "currency": currency,
                    "fee_amount": fee_amount,
                    "batch_id": batch_id,
                    "status": status,
                    "network": network,
                    "counterparty_name": debtor_name if cdt_dbt in ["CRDT", "C"] else creditor_name,
                    "title": remittance_info,
                    "remittance_info": remittance_info,
                    "tx_family": tx_family,
                    "tx_subfamily": tx_subfamily
                }
                stmt_obj["transactions"].append(tx_item)

            result["statements"].append(stmt_obj)

        return result
