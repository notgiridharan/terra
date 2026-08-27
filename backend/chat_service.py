"""
TerraLens — RAG Chat Service
=============================
Retrieves relevant land records from the database, builds context,
and uses Gemini to answer land-record-related questions ONLY.
"""

from __future__ import annotations

import json
import os
import re
from typing import Any

from sqlalchemy import or_, func
from sqlalchemy.orm import Session

from db_models import LandRecordDB
from gemini_parser import (
    gemini_available,
    _try_models,
    _call_new_sdk,
    _call_legacy_sdk,
    _NEW_SDK,
    _LEGACY_SDK,
    genai,
    types,
    legacy_genai,
    _get_api_key,
)

# ---------------------------------------------------------------------------
# System prompt — strictly scoped to land record data
# ---------------------------------------------------------------------------

_SYSTEM_PROMPT = """\
You are TerraLens Assistant, an AI chatbot embedded in the TerraLens land-record
digitisation platform used by Indian Revenue Administration officers.

STRICT RULES:
1. You may ONLY answer questions about land records, land ownership, land
   documents, survey details, property details, and related Indian revenue
   administration topics that can be answered from the provided database context.
2. If the user asks something unrelated to land records or the data in the
   system, politely decline: "I can only help with questions about land records
   and property data stored in TerraLens."
3. Never fabricate data. If the answer is not in the provided context, say
   "I don't have that information in the current records."
4. Cite specific record details (Patta No, Survey No, owner name, etc.) when
   answering so the officer can cross-reference.
5. Be concise but thorough. Use bullet points for multiple results.
6. Respond in the same language the user writes in (Tamil, Hindi, or English).
7. When listing owners or records, include all relevant fields: owner name,
   father/son name, survey number, patta number, village, taluk, district,
   land type, area, and document type when available.
"""

# ---------------------------------------------------------------------------
# Retrieval — keyword-based search over the land_records table
# ---------------------------------------------------------------------------

_SEARCH_FIELDS = [
    "owner_name",
    "owner_father_or_son_name",
    "survey_no",
    "patta_no",
    "district",
    "taluk",
    "village",
    "document_type",
    "land_type",
    "raw_text",
]


def _extract_keywords(question: str) -> list[str]:
    """Pull meaningful words from the question for DB search."""
    stop = {
        "the", "a", "an", "is", "are", "was", "were", "what", "who", "whom",
        "which", "where", "when", "how", "do", "does", "did", "has", "have",
        "had", "can", "could", "will", "would", "should", "may", "might",
        "shall", "of", "in", "on", "at", "to", "for", "with", "by", "from",
        "and", "or", "not", "this", "that", "these", "those", "it", "its",
        "be", "been", "being", "about", "me", "my", "i", "tell", "show",
        "give", "find", "get", "list", "all", "any", "some", "please",
        "thank", "thanks", "hi", "hello", "hey", "name", "owner", "land",
        "record", "records", "document", "documents", "details", "information",
        "info", "data", "previous", "current", "heir", "property",
    }
    words = re.findall(r"[A-Za-z0-9஀-௿ऀ-ॿ./\-]+", question)
    keywords = [w for w in words if w.lower() not in stop and len(w) > 1]
    return keywords if keywords else words[:5]


def retrieve_records(db: Session, question: str, limit: int = 20) -> list[dict]:
    """Search DB for records matching keywords in the question."""
    keywords = _extract_keywords(question)

    if not keywords:
        rows = db.query(LandRecordDB).order_by(
            LandRecordDB.updated_at.desc()
        ).limit(limit).all()
        return [r.to_dict() for r in rows]

    conditions = []
    for kw in keywords:
        pattern = f"%{kw}%"
        field_conditions = []
        for field_name in _SEARCH_FIELDS:
            col = getattr(LandRecordDB, field_name, None)
            if col is not None:
                field_conditions.append(col.ilike(pattern))
        if field_conditions:
            conditions.append(or_(*field_conditions))

    if not conditions:
        rows = db.query(LandRecordDB).limit(limit).all()
        return [r.to_dict() for r in rows]

    query = db.query(LandRecordDB).filter(or_(*conditions))
    rows = query.limit(limit).all()

    if not rows:
        rows = db.query(LandRecordDB).order_by(
            LandRecordDB.updated_at.desc()
        ).limit(limit).all()

    return [r.to_dict() for r in rows]


def _format_record_context(records: list[dict]) -> str:
    """Format retrieved records into a concise text block for the LLM."""
    if not records:
        return "No land records found in the database."

    lines = [f"=== {len(records)} Land Record(s) Found ===\n"]
    for i, rec in enumerate(records, 1):
        info = rec.get("output_information", {})
        gis = rec.get("gis_spatial_data", {})
        gov = rec.get("government_integration", {})
        lines.append(f"--- Record #{rec.get('id', i)} ---")
        fields = [
            ("Document Type", info.get("document_type")),
            ("Patta No", info.get("patta_no")),
            ("Survey No", info.get("survey_no")),
            ("Owner Name", info.get("owner_name")),
            ("Father/Son Name", info.get("owner_father_or_son_name")),
            ("District", info.get("district")),
            ("Taluk", info.get("taluk")),
            ("Village", info.get("village")),
            ("Land Type", info.get("land_type")),
            ("Area (Hectares)", info.get("land_area_hectare")),
            ("Area (Acres)", info.get("land_area_acres")),
            ("Value/Amount", info.get("land_amount_or_value")),
            ("Latitude", gis.get("latitude")),
            ("Longitude", gis.get("longitude")),
            ("Gov ID", gov.get("external_gov_id")),
            ("Sync Status", gov.get("sync_status")),
            ("Created", rec.get("created_at")),
            ("Updated", rec.get("updated_at")),
        ]
        for label, val in fields:
            if val:
                lines.append(f"  {label}: {val}")

        raw = info.get("raw_text")
        if raw:
            snippet = raw[:500].replace("\n", " ")
            lines.append(f"  Raw OCR Text: {snippet}...")

        parsed = info.get("parsed_fields")
        if parsed and isinstance(parsed, dict):
            extra = {k: v for k, v in parsed.items()
                     if v and k not in {
                         "document_type", "patta_no", "survey_no",
                         "owner_name", "owner_father_or_son_name",
                         "district", "taluk", "village", "land_type",
                         "land_area_hectare", "land_area_acres",
                         "land_amount_or_value", "raw_text",
                     }}
            if extra:
                lines.append(f"  Extra Parsed Fields: {json.dumps(extra, ensure_ascii=False)}")

        lines.append("")

    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Topic guard — reject off-topic questions before hitting Gemini
# ---------------------------------------------------------------------------

_LAND_KEYWORDS = {
    "land", "owner", "patta", "chitta", "survey", "khasra", "khatauni",
    "property", "acre", "hectare", "village", "taluk", "district",
    "record", "document", "deed", "sale", "mutation", "heir", "father",
    "son", "daughter", "wife", "husband", "area", "wet", "dry",
    "agricultural", "commercial", "residential", "revenue", "field",
    "boundary", "registration", "pattadar", "khatedar", "tenant",
    "occupancy", "extent", "subdivision", "block", "gram", "panchayat",
    "verification", "validation", "reconciliation", "conflict",
    "forensic", "stamp", "signature", "certificate",
    # Tamil
    "நிலம்", "உரிமையாளர்", "பட்டா", "சிட்டா", "கிராமம்", "வட்டம்",
    "மாவட்டம்", "ஏக்கர்", "ஹெக்டேர்",
    # Hindi
    "भूमि", "मालिक", "पट्टा", "खसरा", "खतौनी", "गाँव", "तहसील", "जिला",
    # Common question words that are fine in context
    "who", "whose", "how", "many", "much", "what", "where", "which",
    "previous", "current", "name", "number", "type", "value", "amount",
    "detail", "details", "information", "total", "all", "list", "show",
    "tell", "find", "search", "data", "database",
}


def _is_land_related(question: str) -> bool:
    """Quick check: does the question touch land-record topics?"""
    words = set(re.findall(r"[A-Za-z஀-௿ऀ-ॿ]+", question.lower()))
    overlap = words & _LAND_KEYWORDS
    return len(overlap) >= 1


# ---------------------------------------------------------------------------
# Generate answer via Gemini
# ---------------------------------------------------------------------------

def _generate_answer(question: str, context: str) -> str | None:
    """Send question + context to Gemini and get a text answer."""
    prompt = (
        f"DATABASE CONTEXT:\n{context}\n\n"
        f"OFFICER'S QUESTION:\n{question}\n\n"
        "Answer the question using ONLY the database context above. "
        "If the answer is not in the context, say so clearly."
    )

    def call_fn(model: str) -> str | None:
        if _NEW_SDK:
            api_key = _get_api_key()
            try:
                client = genai.Client(api_key=api_key)
                response = client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        system_instruction=_SYSTEM_PROMPT,
                        temperature=0.3,
                        max_output_tokens=1024,
                    ),
                )
                return response.text if response and response.text else None
            except Exception as exc:
                err = str(exc).lower()
                if "404" in err or "not found" in err:
                    return None
                if "429" in err or "quota" in err or "resource_exhausted" in err:
                    print(f"[chat] Quota hit for {model}", flush=True)
                    return None
                print(f"[chat] {model} error: {exc}", flush=True)
                return None
        elif _LEGACY_SDK:
            import warnings
            try:
                with warnings.catch_warnings():
                    warnings.simplefilter("ignore")
                    legacy_genai.configure(api_key=_get_api_key())
                    m = legacy_genai.GenerativeModel(
                        model_name=model,
                        system_instruction=_SYSTEM_PROMPT,
                    )
                    r = m.generate_content(
                        prompt,
                        generation_config={
                            "temperature": 0.3,
                            "max_output_tokens": 1024,
                        },
                    )
                    return r.text if r and r.text else None
            except Exception as exc:
                err = str(exc).lower()
                if "404" in err or "not found" in err:
                    return None
                print(f"[chat] {model} error: {exc}", flush=True)
                return None
        return None

    return _try_models(call_fn)


# ---------------------------------------------------------------------------
# Public entry point
# ---------------------------------------------------------------------------

def chat(question: str, db: Session) -> dict[str, Any]:
    """
    RAG chat: retrieve relevant records, build context, generate answer.
    Returns { answer, records_used, is_land_related }.
    """
    if not question.strip():
        return {
            "answer": "Please ask a question about land records.",
            "records_used": 0,
            "is_land_related": False,
        }

    if not _is_land_related(question):
        return {
            "answer": (
                "I can only help with questions about land records and "
                "property data stored in TerraLens. Please ask about land "
                "ownership, survey details, patta numbers, or other "
                "revenue-administration topics."
            ),
            "records_used": 0,
            "is_land_related": False,
        }

    records = retrieve_records(db, question)
    context = _format_record_context(records)

    if not gemini_available():
        return {
            "answer": (
                "The AI service (Gemini) is not configured. Please set the "
                "GEMINI_API_KEY environment variable to enable the chatbot.\n\n"
                f"However, I found {len(records)} matching record(s) in the "
                "database. Here is the raw data:\n\n" + context
            ),
            "records_used": len(records),
            "is_land_related": True,
        }

    answer = _generate_answer(question, context)
    if not answer:
        return {
            "answer": (
                f"I found {len(records)} matching record(s) but could not "
                "generate an AI response. Here is the raw data:\n\n" + context
            ),
            "records_used": len(records),
            "is_land_related": True,
        }

    return {
        "answer": answer,
        "records_used": len(records),
        "is_land_related": True,
    }


def get_db_summary(db: Session) -> dict[str, Any]:
    """Return a high-level summary of what's in the database."""
    total = db.query(func.count(LandRecordDB.id)).scalar() or 0
    districts = (
        db.query(LandRecordDB.district)
        .filter(LandRecordDB.district.isnot(None))
        .distinct()
        .all()
    )
    villages = (
        db.query(LandRecordDB.village)
        .filter(LandRecordDB.village.isnot(None))
        .distinct()
        .all()
    )
    owners = (
        db.query(LandRecordDB.owner_name)
        .filter(LandRecordDB.owner_name.isnot(None))
        .distinct()
        .all()
    )

    return {
        "total_records": total,
        "districts": [d[0] for d in districts],
        "villages": [v[0] for v in villages],
        "unique_owners": len(owners),
    }
