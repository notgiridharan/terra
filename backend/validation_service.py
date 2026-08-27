"""
TerraLens Land Records Validation Engine
=========================================
Automatic rule-based validation of extracted land-record data against
standard Indian land administration conventions (RoR, Patta, Chitta,
A-Register, Sale Deed, Mutation) and existing records already stored in
the TerraLens `land_records` database.

Each rule returns:
    rule_id      unique identifier, e.g. "RULE_AREA_ARITHMETIC"
    status       "PASSED" | "WARNING" | "CONFLICT"
    severity     "LOW" | "MEDIUM" | "HIGH"
    description  plain-English summary of the finding
    evidence     the concrete numbers/values behind the finding
    fields       record fields the finding relates to
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Any, Optional

from sqlalchemy.orm import Session

from db_models import LandRecordDB

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

STATUS_PASSED = "PASSED"
STATUS_WARNING = "WARNING"
STATUS_CONFLICT = "CONFLICT"

SEVERITY_LOW = "LOW"
SEVERITY_MEDIUM = "MEDIUM"
SEVERITY_HIGH = "HIGH"

ACRES_PER_HECTARE = 2.47105

_SURVEY_RE = re.compile(r"^\d{1,6}(?:/\d{1,4}[A-Za-z]{0,2})?[A-Za-z]{0,2}$")
_KHATA_RE = re.compile(r"^[A-Za-z\-]{0,10}\s*\d{1,8}$")
_PATTA_RE = re.compile(r"^[A-Za-z\-]{0,10}\s*\d{1,8}$")
_DATE_FORMATS = ["%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y"]


def _outcome(
    rule_id: str,
    status: str,
    severity: str,
    description: str,
    evidence: str,
    fields: list[str],
) -> dict[str, Any]:
    return {
        "rule_id": rule_id,
        "status": status,
        "severity": severity,
        "description": description,
        "evidence": evidence,
        "fields": fields,
    }


# ---------------------------------------------------------------------------
# Parsing helpers
# ---------------------------------------------------------------------------


def _num(raw: Any) -> Optional[float]:
    if raw is None:
        return None
    if isinstance(raw, (int, float)):
        return float(raw)
    match = re.search(r"[-+]?\d*\.?\d+", str(raw).replace(",", ""))
    if not match:
        return None
    try:
        return float(match.group(0))
    except ValueError:
        return None


def _parse_date(raw: Any) -> Optional[date]:
    if not raw:
        return None
    if isinstance(raw, datetime):
        return raw.date()
    if isinstance(raw, date):
        return raw
    text = str(raw).strip()
    for fmt in _DATE_FORMATS:
        try:
            return datetime.strptime(text, fmt).date()
        except ValueError:
            continue
    return None


def _norm_name(name: str) -> str:
    return re.sub(r"[^a-z]", "", (name or "").lower())


# ---------------------------------------------------------------------------
# Rule 1 — Area & division arithmetic
# ---------------------------------------------------------------------------


def rule_area_arithmetic(record: dict) -> dict:
    """
    RULE_AREA_ARITHMETIC
    Total plot area must equal the sum of sub-divided areas (when supplied),
    a transaction area may never exceed the registered parent plot area, and
    the hectare/acre figures on a single record must be mutually consistent
    (1 hectare = 2.47105 acres).
    """
    rid = "RULE_AREA_ARITHMETIC"
    hectares = _num(record.get("land_area_hectare"))
    acres = _num(record.get("land_area_acres"))
    sub_divisions = record.get("sub_divisions") or []
    parent_area = _num(record.get("parent_area_hectare"))

    # 1. Parent-plot vs sub-division sum check (when sub-division data supplied)
    if sub_divisions:
        total = sum((_num(s.get("area")) or 0.0) for s in sub_divisions)
        base = parent_area if parent_area is not None else hectares
        if base is not None:
            if total > base + 1e-6:
                return _outcome(
                    rid, STATUS_CONFLICT, SEVERITY_HIGH,
                    "Sum of sub-divided parcel areas exceeds the registered parent plot area.",
                    f"Parent plot {base} ha vs sub-divisions totalling {total:.4f} ha.",
                    ["land_area_hectare", "sub_divisions"],
                )
            drift = abs(total - base)
            if drift > 0.01:
                return _outcome(
                    rid, STATUS_WARNING, SEVERITY_MEDIUM,
                    "Sub-divided parcel areas do not fully add up to the parent plot area.",
                    f"Parent plot {base} ha vs sub-divisions totalling {total:.4f} ha (difference {drift:.4f} ha).",
                    ["land_area_hectare", "sub_divisions"],
                )

    # 2. Cross-unit consistency check (available on any single record)
    if hectares is not None and acres is not None and hectares > 0:
        expected_acres = hectares * ACRES_PER_HECTARE
        drift_ratio = abs(expected_acres - acres) / expected_acres
        if drift_ratio > 0.15:
            return _outcome(
                rid, STATUS_CONFLICT, SEVERITY_HIGH,
                "Hectare and acre figures on the same record are mutually inconsistent.",
                f"{hectares} ha converts to {expected_acres:.2f} ac, but {acres} ac is recorded ({drift_ratio * 100:.0f}% drift).",
                ["land_area_hectare", "land_area_acres"],
            )
        if drift_ratio > 0.05:
            return _outcome(
                rid, STATUS_WARNING, SEVERITY_MEDIUM,
                "Hectare and acre figures differ more than expected rounding tolerance.",
                f"{hectares} ha ≈ {expected_acres:.2f} ac vs recorded {acres} ac ({drift_ratio * 100:.1f}% drift).",
                ["land_area_hectare", "land_area_acres"],
            )

    if hectares is None and acres is None:
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "No usable land area figure was extracted.",
            "Both land_area_hectare and land_area_acres are missing or unparsable.",
            ["land_area_hectare", "land_area_acres"],
        )

    return _outcome(
        rid, STATUS_PASSED, SEVERITY_LOW,
        "Recorded area figures are internally consistent.",
        "Hectare/acre conversion and sub-division totals (where present) match within tolerance.",
        ["land_area_hectare", "land_area_acres"],
    )


# ---------------------------------------------------------------------------
# Rule 2 — Survey number format
# ---------------------------------------------------------------------------


def rule_survey_format(record: dict) -> dict:
    """
    RULE_SURVEY_FORMAT
    Validates survey/khata/patta number notation (e.g. "142/1A", "Khata No.
    302", "Patta No. 891") and that sub-division suffixes are legally shaped.
    """
    rid = "RULE_SURVEY_FORMAT"
    survey_no = (record.get("survey_no") or "").strip()
    patta_no = (record.get("patta_no") or "").strip()
    khata_no = (record.get("khata_no") or "").strip()

    if not survey_no:
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "Survey number is missing.",
            "survey_no field is empty.",
            ["survey_no"],
        )

    cleaned = survey_no.replace(" ", "")
    if not _SURVEY_RE.match(cleaned):
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "Survey number does not match standard notation (e.g. 142, 142/1, 142/1A).",
            f"“{survey_no}” failed pattern {_SURVEY_RE.pattern}.",
            ["survey_no"],
        )

    problems: list[str] = []
    if khata_no and not _KHATA_RE.match(khata_no.replace(" ", "")):
        problems.append(f"Khata No. “{khata_no}” looks malformed")
    if patta_no and not _PATTA_RE.match(patta_no.replace(" ", "")):
        problems.append(f"Patta No. “{patta_no}” looks malformed")

    if problems:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Survey number is valid, but a related identifier looks malformed.",
            "; ".join(problems) + ".",
            ["survey_no", "khata_no", "patta_no"],
        )

    return _outcome(
        rid, STATUS_PASSED, SEVERITY_LOW,
        "Survey / khata / patta numbers follow expected notation.",
        f"Survey No. {survey_no} matches standard sub-division format.",
        ["survey_no", "khata_no", "patta_no"],
    )


# ---------------------------------------------------------------------------
# Rule 3 — Ownership & chain of title
# ---------------------------------------------------------------------------


def rule_owner_chain(record: dict, db: Optional[Session]) -> dict:
    """
    RULE_OWNER_CHAIN
    The seller named on a Sale Deed or Mutation must match the owner
    recorded on the prior RoR/Patta for the same parcel; flags missing
    intermediate links in the ownership timeline.
    """
    rid = "RULE_OWNER_CHAIN"
    doc_type = (record.get("document_type") or "").lower()
    survey_no = (record.get("survey_no") or "").strip()
    village = (record.get("village") or "").strip()
    prev_owner = (record.get("prev_owner") or record.get("seller_name") or "").strip()
    self_id = record.get("record_id")

    is_transfer = any(k in doc_type for k in ["sale", "mutation", "deed"])

    if not is_transfer:
        return _outcome(
            rid, STATUS_PASSED, SEVERITY_LOW,
            "Not a transfer instrument — ownership chain check does not apply.",
            f"Document type “{record.get('document_type') or 'unknown'}” is a primary record, not a transfer.",
            ["document_type"],
        )

    if not prev_owner:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Transfer document does not state the seller / previous owner — chain of title cannot be verified.",
            "prev_owner / seller_name is empty on a Sale Deed or Mutation record.",
            ["prev_owner", "owner_name"],
        )

    if not survey_no or db is None:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Insufficient parcel identification to look up the prior title record.",
            "survey_no is missing, so the ownership chain cannot be cross-checked against the database.",
            ["survey_no"],
        )

    query = db.query(LandRecordDB).filter(LandRecordDB.survey_no == survey_no)
    if village:
        query = query.filter(LandRecordDB.village == village)
    if self_id:
        query = query.filter(LandRecordDB.id != self_id)
    prior_records = query.order_by(LandRecordDB.created_at.asc()).all()

    if not prior_records:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "No prior RoR/Patta record found for this parcel — cannot confirm the seller was the recorded owner.",
            f"No existing land_records rows match survey_no {survey_no}"
            + (f" in {village}" if village else "") + ".",
            ["survey_no", "village", "prev_owner"],
        )

    latest_prior = prior_records[-1]
    matches = bool(prev_owner) and _norm_name(prev_owner) == _norm_name(latest_prior.owner_name or "")

    if not matches:
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "Seller named on this transfer does not match the recorded owner on the prior title record.",
            f"Prior record #{latest_prior.id} lists owner “{latest_prior.owner_name}”, "
            f"but this document names the seller as “{prev_owner}”.",
            ["prev_owner", "owner_name"],
        )

    if len(prior_records) > 1:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Seller matches the latest prior owner, but multiple historical records exist for this parcel — verify no intermediate transfer is missing.",
            f"{len(prior_records)} prior records found for survey {survey_no}; "
            f"latest owner “{latest_prior.owner_name}” matches seller “{prev_owner}”.",
            ["prev_owner", "owner_name", "survey_no"],
        )

    return _outcome(
        rid, STATUS_PASSED, SEVERITY_LOW,
        "Seller matches the owner recorded on the immediately prior title record.",
        f"Prior record #{latest_prior.id} owner “{latest_prior.owner_name}” matches seller “{prev_owner}”.",
        ["prev_owner", "owner_name"],
    )


# ---------------------------------------------------------------------------
# Rule 4 — Date & chronology consistency
# ---------------------------------------------------------------------------


def rule_date_chronology(record: dict) -> dict:
    """
    RULE_DATE_CHRONOLOGY
    Mutation date cannot be earlier than the sale deed's registration date,
    and no document date may fall in the future.
    """
    rid = "RULE_DATE_CHRONOLOGY"
    reg_date = _parse_date(record.get("reg_date"))
    mutation_date = _parse_date(record.get("mutation_date") or record.get("order_date"))
    issue_date = _parse_date(record.get("issue_date") or record.get("reg_date"))
    today = date.today()

    future_dates = []
    for label, d in [
        ("Registration date", reg_date),
        ("Mutation date", mutation_date),
        ("Issue date", issue_date),
    ]:
        if d and d > today:
            future_dates.append(f"{label} {d.isoformat()}")

    if future_dates:
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "A document date is set in the future.",
            "; ".join(future_dates) + f" — later than today ({today.isoformat()}).",
            ["reg_date", "mutation_date", "issue_date"],
        )

    if reg_date and mutation_date:
        if mutation_date < reg_date:
            return _outcome(
                rid, STATUS_CONFLICT, SEVERITY_HIGH,
                "Mutation date is earlier than the sale deed's registration date.",
                f"Mutation {mutation_date.isoformat()} precedes registration {reg_date.isoformat()}.",
                ["reg_date", "mutation_date"],
            )
        gap_years = (mutation_date - reg_date).days / 365.25
        if gap_years > 15:
            return _outcome(
                rid, STATUS_WARNING, SEVERITY_MEDIUM,
                "Mutation was recorded unusually long after registration.",
                f"{gap_years:.1f} years between registration ({reg_date.isoformat()}) and mutation ({mutation_date.isoformat()}).",
                ["reg_date", "mutation_date"],
            )
        return _outcome(
            rid, STATUS_PASSED, SEVERITY_LOW,
            "Mutation date follows the registration date in correct chronological order.",
            f"Registration {reg_date.isoformat()} precedes mutation {mutation_date.isoformat()}.",
            ["reg_date", "mutation_date"],
        )

    if not reg_date and not mutation_date and not issue_date:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "No usable dates were extracted to verify chronology.",
            "reg_date, mutation_date/order_date, and issue_date are all missing or unparsable.",
            ["reg_date", "mutation_date", "issue_date"],
        )

    return _outcome(
        rid, STATUS_PASSED, SEVERITY_LOW,
        "Available document dates are chronologically valid.",
        "No future dates and no mutation-before-registration conflict detected.",
        ["reg_date", "mutation_date", "issue_date"],
    )


# ---------------------------------------------------------------------------
# Rule 5 — Duplicate document / record check
# ---------------------------------------------------------------------------


def rule_duplicate_record(record: dict, db: Optional[Session]) -> dict:
    """
    RULE_DUPLICATE_RECORD
    Flags an identical Survey No. + Patta No. + Owner Name combination that
    is already validated or pending elsewhere in the system.
    """
    rid = "RULE_DUPLICATE_RECORD"
    survey_no = (record.get("survey_no") or "").strip()
    patta_no = (record.get("patta_no") or "").strip()
    owner_name = (record.get("owner_name") or "").strip()
    self_id = record.get("record_id")

    if not (survey_no and owner_name):
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Insufficient identifying fields to run a duplicate check.",
            "survey_no and/or owner_name are missing.",
            ["survey_no", "patta_no", "owner_name"],
        )

    if db is None:
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "No database session available to check for duplicates.",
            "Validation was run without a database connection.",
            ["survey_no", "patta_no", "owner_name"],
        )

    query = db.query(LandRecordDB).filter(LandRecordDB.survey_no == survey_no)
    if patta_no:
        query = query.filter(LandRecordDB.patta_no == patta_no)
    if self_id:
        query = query.filter(LandRecordDB.id != self_id)
    candidates = query.all()

    exact_hits = [c for c in candidates if _norm_name(c.owner_name or "") == _norm_name(owner_name)]

    if exact_hits:
        ids = ", ".join(f"#{c.id}" for c in exact_hits)
        return _outcome(
            rid, STATUS_CONFLICT, SEVERITY_HIGH,
            "An identical Survey No. + Patta No. + Owner combination already exists in the system.",
            f"Matches existing record(s) {ids} for survey {survey_no}, patta {patta_no or 'n/a'}, owner {owner_name}.",
            ["survey_no", "patta_no", "owner_name"],
        )

    if candidates:
        ids = ", ".join(f"#{c.id}" for c in candidates)
        return _outcome(
            rid, STATUS_WARNING, SEVERITY_MEDIUM,
            "Other records exist for the same survey/patta number under a different owner name — verify this is not a duplicate with a mis-OCR'd name.",
            f"Records {ids} share survey {survey_no} / patta {patta_no or 'n/a'} but list a different owner.",
            ["survey_no", "patta_no", "owner_name"],
        )

    return _outcome(
        rid, STATUS_PASSED, SEVERITY_LOW,
        "No duplicate Survey No. + Patta No. + Owner combination found.",
        f"No other record in the database matches survey {survey_no}, patta {patta_no or 'n/a'}, owner {owner_name}.",
        ["survey_no", "patta_no", "owner_name"],
    )


# ---------------------------------------------------------------------------
# Public entrypoint
# ---------------------------------------------------------------------------


def validate_record(record: dict, db: Optional[Session] = None) -> dict:
    """
    Run all Indian land-record validation rules against `record` (a flat
    dict of extracted / officer-edited field values) and return a summary
    plus the individual per-rule outcomes.
    """
    results = [
        rule_area_arithmetic(record),
        rule_survey_format(record),
        rule_owner_chain(record, db),
        rule_date_chronology(record),
        rule_duplicate_record(record, db),
    ]

    passed = sum(1 for r in results if r["status"] == STATUS_PASSED)
    warning = sum(1 for r in results if r["status"] == STATUS_WARNING)
    conflict = sum(1 for r in results if r["status"] == STATUS_CONFLICT)

    if conflict > 0:
        overall = STATUS_CONFLICT
    elif warning > 0:
        overall = STATUS_WARNING
    else:
        overall = STATUS_PASSED

    return {
        "overall": overall,
        "total_checks": len(results),
        "passed": passed,
        "warning": warning,
        "conflict": conflict,
        "results": results,
    }
