"""
TerraLens — Gemini-powered land-record OCR + field extractor
=============================================================
PRIMARY PATH:  Image → Gemini Vision → raw_text + parsed_fields
FALLBACK PATH: PaddleOCR text → Gemini text parsing → parsed_fields
LAST RESORT:   Regex parsers in ocr_service.py

Required env var: GEMINI_API_KEY
"""

from __future__ import annotations

import base64
import json
import os
import re
from pathlib import Path
from typing import Any

# ---------------------------------------------------------------------------
# SDK detection — prefers new `google.genai`, falls back to legacy
# ---------------------------------------------------------------------------

_NEW_SDK    = False
_LEGACY_SDK = False
genai: Any  = None
types: Any  = None
legacy_genai: Any = None

try:
    from google import genai as _g          # type: ignore
    from google.genai import types as _t   # type: ignore
    genai  = _g
    types  = _t
    _NEW_SDK = True
except ImportError:
    try:
        import warnings, google.generativeai as _lg  # type: ignore
        legacy_genai = _lg
        _LEGACY_SDK  = True
    except ImportError:
        pass


def gemini_available() -> bool:
    return (_NEW_SDK or _LEGACY_SDK) and bool(os.environ.get("GEMINI_API_KEY"))


# ---------------------------------------------------------------------------
# Shared prompt pieces
# ---------------------------------------------------------------------------

_SCHEMA = """{
  "raw_text": "<full verbatim text from the document>",
  "document_type": null,
  "patta_no": null,
  "survey_no": null,
  "owner_name": null,
  "owner_father_or_son_name": null,
  "district": null,
  "taluk": null,
  "village": null,
  "land_type": null,
  "land_area_hectare": null,
  "land_area_acres": null,
  "land_amount_or_value": null
}"""

_RULES = """\
Field extraction rules:
- document_type: "Patta", "Chitta", "Sale Deed", "Khasra", "Khatauni", "A-Register", etc.
- patta_no: patta / record number (பட்டா எண், Patta No., पट्टा नंबर). Preserve as written.
- survey_no: survey / field / khasra number. Preserve slashes, hyphens, letters exactly.
- owner_name: land owner / pattadar / khatedar full name, including spaces and hyphens.
- owner_father_or_son_name: father or husband name (தந்தை, पिता, S/O, D/O, W/O).
- district: district name only.
- taluk: taluk / tehsil / mandal name.
- village: revenue village / gram panchayat name.
- land_type: e.g. "நஞ்சை (Wet)", "புஞ்சை (Dry)", "Irrigated", "Agricultural".
- land_area_hectare: number only, e.g. "0.91".
- land_area_acres: number only, e.g. "2.40".
- land_amount_or_value: digits only, no currency symbol, e.g. "150000".
- Use null for any field not found. Return ONLY the JSON — no markdown, no explanation."""

_VISION_SYSTEM = f"""\
You are an expert at reading Indian government land record documents (Patta, Chitta, Khasra, etc.).
The document may be in Tamil, English, Hindi or mixed. It may be a photo or scan and may be skewed,
low-resolution, or partially damaged.

Your tasks:
1. Transcribe ALL visible text from the image into "raw_text", preserving line breaks.
2. Extract the structured fields listed below.

Return ONLY a single valid JSON object matching this schema:
{_SCHEMA}

{_RULES}"""

_TEXT_SYSTEM = f"""\
You are an expert at extracting structured data from Indian land record documents.
The text below is raw OCR output and may contain noise and mis-recognitions.
Use context and your knowledge of Tamil Nadu / India land records to correct obvious errors.

Return ONLY a single valid JSON object matching this schema (omit "raw_text" key — leave it out):
{{
  "document_type": null,
  "patta_no": null,
  "survey_no": null,
  "owner_name": null,
  "owner_father_or_son_name": null,
  "district": null,
  "taluk": null,
  "village": null,
  "land_type": null,
  "land_area_hectare": null,
  "land_area_acres": null,
  "land_amount_or_value": null
}}

{_RULES}"""

_EMPTY_FIELDS: dict[str, str | None] = {
    "document_type":            None,
    "patta_no":                 None,
    "survey_no":                None,
    "owner_name":               None,
    "owner_father_or_son_name": None,
    "district":                 None,
    "taluk":                    None,
    "village":                  None,
    "land_type":                None,
    "land_area_hectare":        None,
    "land_area_acres":          None,
    "land_amount_or_value":     None,
}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _sanitise(val: Any) -> str | None:
    if val is None:
        return None
    s = str(val).strip()
    return s if s and s.lower() not in {"null", "none", "n/a", "-", "—", ""} else None


def _parse_json(text: str) -> dict | None:
    text = text.strip()
    text = re.sub(r"^```(?:json)?\s*", "", text, flags=re.IGNORECASE)
    text = re.sub(r"\s*```$", "",        text)
    try:
        return json.loads(text)
    except Exception:
        # Try extracting just the JSON object
        m = re.search(r"\{[\s\S]+\}", text)
        if m:
            try:
                return json.loads(m.group(0))
            except Exception:
                pass
    return None


def _build_fields(raw_json: dict, include_raw: bool = False) -> dict:
    fields: dict[str, str | None] = {}
    for key in _EMPTY_FIELDS:
        fields[key] = _sanitise(raw_json.get(key))
    result = {"parsed_fields": fields}
    if include_raw:
        result["raw_text"] = str(raw_json.get("raw_text", "")).strip()
    return result


def _get_api_key() -> str | None:
    return os.environ.get("GEMINI_API_KEY") or None


# ---------------------------------------------------------------------------
# Model resolution — tries hardcoded list then discovers from API
# ---------------------------------------------------------------------------

_CANDIDATE_MODELS = [
    "gemini-3.5-flash-lite",    # fastest / lowest quota usage
    "gemini-3.5-flash",         # good balance
    "gemini-2.5-flash",         # confirmed available
    "gemini-2.5-flash-lite",    # confirmed available
    "gemini-flash-lite-latest", # generic alias
    "gemini-flash-latest",      # generic alias
]

_resolved_model: str | None = None  # cached after first successful call


def _discover_model(api_key: str) -> str | None:
    """Ask the API which models are actually available."""
    global _resolved_model
    if _resolved_model:
        return _resolved_model
    try:
        if _NEW_SDK:
            client = genai.Client(api_key=api_key)
            for m in client.models.list():
                name  = getattr(m, "name", "") or ""
                short = name.replace("models/", "")
                if "flash" in short and "gemini" in short:
                    print(f"[gemini_parser] Discovered model: {short}", flush=True)
                    _resolved_model = short
                    return short
        elif _LEGACY_SDK:
            import warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                legacy_genai.configure(api_key=api_key)
                for m in legacy_genai.list_models():
                    name  = getattr(m, "name", "") or ""
                    short = name.replace("models/", "")
                    sup   = getattr(m, "supported_generation_methods", [])
                    if "generateContent" in sup and "flash" in short:
                        _resolved_model = short
                        return short
    except Exception as exc:
        print(f"[gemini_parser] Discovery failed: {exc}", flush=True)
    return None


def _try_models(call_fn) -> str | None:
    """Try each candidate model until one succeeds; cache the winner."""
    global _resolved_model
    api_key = _get_api_key()
    if not api_key:
        return None

    candidates = ([_resolved_model] if _resolved_model else []) + _CANDIDATE_MODELS
    seen: set[str] = set()

    for model in candidates:
        if not model or model in seen:
            continue
        seen.add(model)
        result = call_fn(model)
        if result is not None:
            _resolved_model = model   # cache winner
            return result
        # model 404 — try next

    # Last resort: discover
    discovered = _discover_model(api_key)
    if discovered and discovered not in seen:
        result = call_fn(discovered)
        if result is not None:
            return result

    return None


# ---------------------------------------------------------------------------
# Low-level callers
# ---------------------------------------------------------------------------

def _call_new_sdk(model: str, contents: Any, system: str) -> str | None:
    if not _NEW_SDK:
        return None
    api_key = _get_api_key()
    try:
        client   = genai.Client(api_key=api_key)
        response = client.models.generate_content(
            model=model,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system,
                temperature=0,
                response_mime_type="application/json",
            ),
        )
        return response.text if response and response.text else None
    except Exception as exc:
        err_str = str(exc).lower()
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
            print(f"[gemini_parser] Quota limit reached (429) for {model}. Falling back to local OCR.", flush=True)
        elif "404" in err_str or "not found" in err_str:
            print(f"[gemini_parser] {model} 404, trying next candidate.", flush=True)
        else:
            print(f"[gemini_parser] {model} error: {exc}", flush=True)
        return None


def _call_legacy_sdk(model: str, prompt_or_parts, system: str) -> str | None:
    if not _LEGACY_SDK:
        return None
    import warnings
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            legacy_genai.configure(api_key=_get_api_key())
            m = legacy_genai.GenerativeModel(model_name=model, system_instruction=system)
            r = m.generate_content(
                prompt_or_parts,
                generation_config={"temperature": 0, "max_output_tokens": 2048,
                                   "response_mime_type": "application/json"},
            )
            return r.text if r and r.text else None
    except Exception as exc:
        err_str = str(exc).lower()
        if "429" in err_str or "resource_exhausted" in err_str or "quota" in err_str:
            print(f"[gemini_parser] Quota limit reached (429) for {model}. Falling back to local OCR.", flush=True)
        elif "404" in err_str or "not found" in err_str:
            print(f"[gemini_parser] {model} 404, trying next candidate.", flush=True)
        else:
            safe_err = str(exc).encode("ascii", errors="replace").decode()
            print(f"[gemini_parser] {model} error: {safe_err}", flush=True)
        return None


# ---------------------------------------------------------------------------
# PUBLIC: Vision mode — image → Gemini Vision → raw_text + parsed_fields
# ---------------------------------------------------------------------------

def parse_image_with_gemini(image_path: str | Path, lang: str = "ta") -> dict | None:
    """
    Send the image directly to Gemini Vision.
    Returns {"raw_text": str, "parsed_fields": dict} or None on failure.
    """
    if not gemini_available():
        return None

    image_path = Path(image_path)
    if not image_path.exists():
        return None

    lang_hint = {
        "ta": "The document is in Tamil (or mixed Tamil/English).",
        "en": "The document is in English.",
        "hi": "The document is in Hindi (Devanagari script).",
    }.get(lang, "")

    # Read image bytes and detect mime type
    image_bytes = image_path.read_bytes()
    suffix      = image_path.suffix.lower()
    mime_map    = {".jpg": "image/jpeg", ".jpeg": "image/jpeg",
                   ".png": "image/png",  ".webp": "image/webp",
                   ".bmp": "image/bmp",  ".tiff": "image/tiff",
                   ".tif": "image/tiff"}
    mime_type   = mime_map.get(suffix, "image/jpeg")

    def _call(model: str) -> str | None:
        if _NEW_SDK:
            img_part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
            contents = [img_part, types.Part.from_text(text=lang_hint)] if lang_hint else [img_part]
            return _call_new_sdk(model, contents, _VISION_SYSTEM)
        else:
            # Legacy SDK — pass image as inline_data dict (the correct vision format)
            img_part = {"inline_data": {"mime_type": mime_type, "data": base64.b64encode(image_bytes).decode()}}
            parts = [img_part]
            if lang_hint:
                parts.append(lang_hint)
            return _call_legacy_sdk(model, parts, _VISION_SYSTEM)

    raw_response = _try_models(_call)
    if not raw_response:
        print("[gemini_parser] Vision mode failed.", flush=True)
        return None

    raw_json = _parse_json(raw_response)
    if not raw_json:
        print("[gemini_parser] Vision JSON parse failed.", flush=True)
        return None

    result = _build_fields(raw_json, include_raw=True)
    n = sum(1 for v in result["parsed_fields"].values() if v)
    print(f"[gemini_parser] Vision extracted {n}/12 fields.", flush=True)
    return result


# ---------------------------------------------------------------------------
# PUBLIC: Text mode — noisy OCR text → Gemini → parsed_fields only
# ---------------------------------------------------------------------------

def parse_with_gemini(raw_text: str, lang: str = "ta") -> dict[str, str | None] | None:
    """
    Parse already-extracted OCR text via Gemini.
    Returns parsed_fields dict or None on failure.
    """
    if not gemini_available() or not raw_text.strip():
        return None

    lang_hint = {
        "ta": "Document language: Tamil.",
        "en": "Document language: English.",
        "hi": "Document language: Hindi.",
    }.get(lang, "")

    prompt = f"{lang_hint}\n\nRaw OCR text (may contain errors):\n\n{raw_text}"

    def _call(model: str) -> str | None:
        if _NEW_SDK:
            return _call_new_sdk(model, prompt, _TEXT_SYSTEM)
        else:
            return _call_legacy_sdk(model, prompt, _TEXT_SYSTEM)

    raw_response = _try_models(_call)
    if not raw_response:
        return None

    raw_json = _parse_json(raw_response)
    if not raw_json:
        return None

    fields: dict[str, str | None] = {}
    for key in _EMPTY_FIELDS:
        fields[key] = _sanitise(raw_json.get(key))

    n = sum(1 for v in fields.values() if v)
    print(f"[gemini_parser] Text-mode extracted {n}/12 fields.", flush=True)
    return fields
