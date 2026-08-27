"""
TerraLens OCR Service
=====================
Handles images (JPG/PNG/TIFF/WEBP/BMP), PDF, and DOCX.
All paths are relative to this file — no hardcoded machine paths.

Supported languages: Tamil (ta), English (en), Hindi (hi), Auto-detect (auto)

Model download directory: backend/models/
Upload temp directory:    backend/uploads/
"""

from __future__ import annotations

import os
import re
import platform
import tempfile
from pathlib import Path
from typing import Any

try:
    import cv2          # type: ignore
    import numpy as np  # type: ignore
    _CV2_AVAILABLE = True
except ImportError:
    _CV2_AVAILABLE = False

# ---------------------------------------------------------------------------
# Portable base paths  — set env var BEFORE any paddle import
# ---------------------------------------------------------------------------

BASE_DIR    = Path(__file__).resolve().parent   # backend/
MODELS_DIR  = BASE_DIR / "models"               # backend/models/
UPLOADS_DIR = BASE_DIR / "uploads"              # backend/uploads/

# Tell PaddleX to store models here instead of ~/.paddlex
os.environ.setdefault("PADDLE_PDX_MODEL_HOME", str(MODELS_DIR))

MODELS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

# ---------------------------------------------------------------------------
# Model registry
# ---------------------------------------------------------------------------

DET_MODEL_NAME = "PP-OCRv5_server_det"
DET_MODEL_DIR  = MODELS_DIR / DET_MODEL_NAME

SUPPORTED_LANGS: dict[str, dict[str, str]] = {
    "ta": {"label": "Tamil",   "rec_model_name": "ta_PP-OCRv3_mobile_rec"},
    "en": {"label": "English", "rec_model_name": "en_PP-OCRv4_mobile_rec"},
    "hi": {"label": "Hindi",   "rec_model_name": "devanagari_PP-OCRv3_mobile_rec"},
}

# ---------------------------------------------------------------------------
# Poppler path (Windows bundled; Mac/Linux rely on system install)
# ---------------------------------------------------------------------------

def _get_poppler_path() -> str | None:
    if platform.system() == "Windows":
        bundled = BASE_DIR / "bin" / "poppler" / "bin"
        if bundled.exists():
            return str(bundled)
    return None


# ---------------------------------------------------------------------------
# Lazy per-language OCR loader
# ---------------------------------------------------------------------------

_ocr_instances: dict[str, Any] = {}


def _model_dir_ready(path: Path) -> bool:
    """Return True only if directory exists and contains at least one file."""
    return path.is_dir() and any(path.iterdir())


def _get_ocr(lang: str = "ta") -> Any:
    """
    Return (and cache) the PaddleOCR instance for the given language.

    IMPORTANT: Do NOT pass lang= to PaddleOCR().
    When lang= is supplied, PaddleX internally maps the detection model to
    'PP-OCRv5_mobile_det', then validates the provided model_dir name against
    that alias — causing a name-mismatch error when our dir is named
    'PP-OCRv5_server_det'. By specifying model names explicitly and letting
    PADDLE_PDX_MODEL_HOME resolve the local directory, we bypass this check.
    """
    if lang in _ocr_instances:
        return _ocr_instances[lang]

    from paddleocr import PaddleOCR  # type: ignore

    cfg      = SUPPORTED_LANGS.get(lang, SUPPORTED_LANGS["ta"])
    rec_name = cfg["rec_model_name"]

    # Always specify models by name — PADDLE_PDX_MODEL_HOME points PaddleX
    # to backend/models/ so local dirs are found automatically without
    # triggering a download.
    kwargs: dict[str, Any] = {
        "use_doc_orientation_classify": False,
        "use_doc_unwarping":            False,
        "use_textline_orientation":     False,
        "text_detection_model_name":    DET_MODEL_NAME,
        "text_recognition_model_name":  rec_name,
    }

    print(
        f"[ocr_service] Loading PaddleOCR: det={DET_MODEL_NAME}, rec={rec_name}",
        flush=True,
    )
    _ocr_instances[lang] = PaddleOCR(**kwargs)
    print(f"[ocr_service] PaddleOCR ready for lang={lang!r}.", flush=True)
    return _ocr_instances[lang]


# ---------------------------------------------------------------------------
# Language auto-detection from extracted text
# ---------------------------------------------------------------------------

def _detect_lang_from_text(text: str) -> str:
    """
    Heuristic language detection via Unicode block counts.
    Tamil block: U+0B80–U+0BFF
    Devanagari (Hindi) block: U+0900–U+097F
    Falls back to English if neither is dominant.
    """
    total = max(len(text), 1)
    tamil_count = sum(1 for c in text if "\u0B80" <= c <= "\u0BFF")
    hindi_count = sum(1 for c in text if "\u0900" <= c <= "\u097F")

    if tamil_count / total > 0.04:
        return "ta"
    if hindi_count / total > 0.04:
        return "hi"
    return "en"


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_ocr(file_path: str | Path, lang: str = "ta") -> dict:
    """
    Run OCR on a file and return:
        {
            "raw_text":     str,
            "parsed_fields": dict,
            "detected_lang": str,   # actual lang used / detected
        }

    Supported inputs: images (JPG/PNG/TIFF/WEBP/BMP), PDF, DOCX
    Supported lang values: "ta", "en", "hi", "auto"
    """
    path = Path(file_path)
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    auto           = lang == "auto"
    effective_lang = "ta" if auto else lang  # first pass for auto

    suffix = path.suffix.lower()

    result = _dispatch_ocr(path, suffix, effective_lang)

    if auto:
        detected = _detect_lang_from_text(result["raw_text"])
        # Re-run with detected lang only if it differs and isn't DOCX
        if detected != effective_lang and suffix not in {".docx", ".doc"}:
            result = _dispatch_ocr(path, suffix, detected)
            effective_lang = detected
        result["detected_lang"] = detected
    else:
        result["detected_lang"] = lang

    return result


def _dispatch_ocr(path: Path, suffix: str, lang: str) -> dict:
    if suffix in {".jpg", ".jpeg", ".png", ".tiff", ".tif", ".webp", ".bmp"}:
        return _ocr_image(path, lang)
    if suffix == ".pdf":
        return _ocr_pdf(path, lang)
    if suffix in {".docx", ".doc"}:
        return _extract_docx(path)
    raise ValueError(f"Unsupported file type: {suffix}")


# ---------------------------------------------------------------------------
# Image OCR
# ---------------------------------------------------------------------------

def _preprocess_image(path: Path) -> Path:
    """
    Enhance image quality for OCR:
    - Upscale if too small (min 800px on shortest side)
    - CLAHE contrast enhancement
    - Bilateral denoising (preserves edges)
    Always saves a .preprocessed.png so the frontend always has a URL to show.
    Returns the preprocessed path (always different from the input path).
    """
    out_path = path.with_suffix(".preprocessed.png")

    if not _CV2_AVAILABLE:
        # Still make a copy so the frontend can show *something*
        import shutil
        shutil.copy2(str(path), str(out_path))
        return out_path

    try:
        img = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError(f"cv2 could not decode image: {path}")

        h, w = img.shape[:2]
        # Upscale if shortest side < 800 px
        min_side = min(h, w)
        if min_side < 800:
            scale = 800 / min_side
            img = cv2.resize(img, (int(w * scale), int(h * scale)),
                             interpolation=cv2.INTER_CUBIC)

        # Convert to grayscale for enhancement
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # ── Document Scanner Enhancement (Illumination Normalization) ──
        # 1. Extract the background illumination map using morphological closing
        # A 15x15 rectangle kernel is large enough to blur out text but retain paper lighting
        rect_kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
        bg = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, rect_kernel)

        # 2. Divide original gray by background to normalize lighting across the page
        # This makes the background uniformly bright white and text dark
        norm = cv2.divide(gray, bg, scale=255)

        # 3. Apply slight unsharp masking to make text edges crisp
        blur = cv2.GaussianBlur(norm, (0, 0), 2.0)
        sharpened = cv2.addWeighted(norm, 1.5, blur, -0.5, 0)

        # Back to BGR (PaddleOCR expects colour image)
        enhanced = cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)

        cv2.imencode(".png", enhanced)[1].tofile(str(out_path))
        print(f"[ocr_service] Preprocessed image saved: {out_path.name}", flush=True)
        return out_path
    except Exception as exc:
        print(f"[ocr_service] Preprocessing failed ({exc}), copying original as PNG.", flush=True)
        try:
            import shutil
            shutil.copy2(str(path), str(out_path))
        except Exception:
            return path
        return out_path


def _ocr_image(path: Path, lang: str) -> dict:
    # Always resolve to absolute path first — PaddleOCR requires it
    path = path.resolve()
    preprocessed = _preprocess_image(path)
    # preprocessed is always a different .preprocessed.png file now
    preprocessed_filename = preprocessed.name

    # ── PRIMARY: Gemini Vision reads image directly (most accurate) ──────────
    from gemini_parser import parse_image_with_gemini, gemini_available
    if gemini_available():
        vision_result = parse_image_with_gemini(path, lang)
        if vision_result:
            raw = vision_result.get("raw_text", "")
            return {
                "raw_text":         raw,
                "parsed_fields":    vision_result["parsed_fields"],
                "preprocessed_path": preprocessed_filename,
            }
        print("[ocr_service] Gemini Vision failed — falling back to PaddleOCR.", flush=True)

    # ── FALLBACK: PaddleOCR ────────────────────────────────────────────────
    try:
        ocr     = _get_ocr(lang)
        # Use the preprocessed absolute path — PaddleOCR needs absolute paths on Windows
        results = ocr.predict(str(preprocessed.resolve()))
        lines   = _collect_lines(results)
        full_text = "\n".join(lines)
        return {
            "raw_text":         full_text,
            "parsed_fields":    parse_land_text(lines, full_text, lang),
            "preprocessed_path": preprocessed_filename,
        }
    except Exception as ocr_err:
        print(f"[ocr_service] PaddleOCR inference error: {ocr_err}", flush=True)
        # Return the preprocessed image URL but note OCR failed
        return {
            "raw_text": f"[OCR offline] {path.name}",
            "parsed_fields": {
                "document_type": None, "patta_no": None, "survey_no": None,
                "owner_name": None, "owner_father_or_son_name": None,
                "district": None, "taluk": None, "village": None,
                "land_type": None, "land_area_hectare": None,
                "land_area_acres": None, "land_amount_or_value": None,
            },
            "preprocessed_path": preprocessed_filename,
        }


# ---------------------------------------------------------------------------
# PDF OCR — convert each page to an image first
# ---------------------------------------------------------------------------

def _ocr_pdf(path: Path, lang: str) -> dict:
    try:
        from pdf2image import convert_from_path  # type: ignore
    except ImportError:
        raise ImportError(
            "pdf2image is not installed. Run: pip install pdf2image\n"
            "Also ensure Poppler is installed:\n"
            "  Windows: bundled at backend/bin/poppler/  OR  add to PATH\n"
            "  macOS:   brew install poppler"
        )

    poppler_path    = _get_poppler_path()
    convert_kwargs: dict[str, Any] = {"dpi": 300}
    if poppler_path:
        convert_kwargs["poppler_path"] = poppler_path

    pages = convert_from_path(str(path), **convert_kwargs)

    all_lines: list[str] = []
    ocr = _get_ocr(lang)

    with tempfile.TemporaryDirectory() as tmp:
        for i, page in enumerate(pages):
            tmp_img = Path(tmp) / f"page_{i:04d}.png"
            page.save(str(tmp_img), "PNG")
            preprocessed = _preprocess_image(tmp_img)
            try:
                results = ocr.predict(str(preprocessed))
                all_lines.extend(_collect_lines(results))
            finally:
                if preprocessed != tmp_img and preprocessed.exists():
                    preprocessed.unlink(missing_ok=True)

    full_text = "\n".join(all_lines)
    return {
        "raw_text":      full_text,
        "parsed_fields": parse_land_text(all_lines, full_text, lang),
    }


# ---------------------------------------------------------------------------
# DOCX — extract text directly (no OCR needed)
# ---------------------------------------------------------------------------

def _extract_docx(path: Path) -> dict:
    try:
        from docx import Document  # type: ignore
    except ImportError:
        raise ImportError(
            "python-docx is not installed. Run: pip install python-docx"
        )

    doc   = Document(str(path))
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    full_text = "\n".join(lines)
    # Detect language from content for DOCX
    detected = _detect_lang_from_text(full_text)
    return {
        "raw_text":      full_text,
        "parsed_fields": parse_land_text(lines, full_text, detected),
    }


# ---------------------------------------------------------------------------
# Collect text lines from PaddleOCR result objects
# ---------------------------------------------------------------------------

# Minimum confidence score to accept a text detection (0–1).
# Anything below this is likely garbled noise.
_CONF_THRESHOLD = 0.6


def _collect_lines(results: Any) -> list[str]:
    """
    Collect recognised text from PaddleOCR result objects.
    Filters out detections whose confidence score is below _CONF_THRESHOLD.
    """
    lines: list[str] = []
    if not results:
        return lines
    for result in results:
        if result is None:
            continue
        try:
            texts  = result.get("rec_texts",  []) or []
            scores = result.get("rec_scores", []) or []
        except Exception:
            continue
        for idx, text in enumerate(texts):
            if not text or not str(text).strip():
                continue
            # Accept if score is available and above threshold
            score = scores[idx] if idx < len(scores) else 1.0
            try:
                if float(score) < _CONF_THRESHOLD:
                    continue
            except (TypeError, ValueError):
                pass
            lines.append(str(text).strip())
    return lines


# ---------------------------------------------------------------------------
# Parser dispatcher  (Gemini → regex fallback)
# ---------------------------------------------------------------------------

def parse_land_text(lines: list[str], full_text: str, lang: str = "ta") -> dict:
    """
    Extract structured fields from OCR text.
    Gemini text-mode → regex fallback.
    """
    from gemini_parser import parse_with_gemini, gemini_available  # lazy import

    if gemini_available():
        result = parse_with_gemini(full_text, lang)
        if result is not None:
            return result
        print("[ocr_service] Gemini text-mode returned None — using regex fallback.", flush=True)
    else:
        print("[ocr_service] Gemini unavailable — using regex parser.", flush=True)

    if lang == "hi":
        return _parse_hindi(lines, full_text)
    if lang == "en":
        return _parse_english(lines, full_text)
    return _parse_tamil(lines, full_text)


# ---------------------------------------------------------------------------
# Tamil parser
# ---------------------------------------------------------------------------

def _parse_tamil(lines: list[str], full_text: str) -> dict:
    cleaned = [l.strip() for l in lines if l.strip()]
    lower   = full_text.lower()

    # Document type
    doc_type = "Land Record"
    if "patta" in lower or "பட்டா" in full_text:
        doc_type = "Patta"
    elif "sale deed" in lower:
        doc_type = "Sale Deed"
    elif "chitta" in lower:
        doc_type = "Chitta"
    elif "registry" in lower:
        doc_type = "Registry"

    patta_no = owner_name = father_name = district = taluk = village = None
    land_type = survey_no = land_area_ha = land_area_ac = land_value = None

    # Patta number
    for i, line in enumerate(cleaned):
        if "பட்டா" in line and "எண்" in line:
            patta_no = _grab(cleaned, i)
            break

    # Owner name
    for i, line in enumerate(cleaned):
        if "உரிமையாளர்" in line or "பெயர்" in line:
            v = _grab(cleaned, i)
            if v and not any(kw in v for kw in ["எண்", "வட்டம்", "கிராமம்", "மாவட்டம்"]):
                owner_name = _clean_name(v)
                break

    # Father/son name
    for i, line in enumerate(cleaned):
        if "தந்தை" in line or ("மகன்" in line and "பெயர்" in line):
            v = _grab(cleaned, i)
            if v:
                father_name = _clean_name(v)
                break

    # District
    for i, line in enumerate(cleaned):
        if "மாவட்டம்" in line:
            v = _grab(cleaned, i)
            if v:
                district = v
            break

    # Taluk
    for i, line in enumerate(cleaned):
        if "வட்டம்" in line or "தாலுக்கா" in line:
            v = _grab(cleaned, i)
            if v:
                taluk = v
            break

    # Revenue village
    for i, line in enumerate(cleaned):
        if "கிராமம்" in line or "ஊர்" in line:
            v = _grab(cleaned, i)
            if v:
                village = v
            break

    # Survey number — match patterns like 142/3, 142/3A, 12-4B, "142 / 3 A"
    for i, line in enumerate(cleaned):
        if any(kw in line for kw in ["புல", "survey", "field no", "s.no"]):
            # 1. Try inline after colon
            m_inline = re.search(r"[:\-]\s*([\d/\-\s A-Za-z]{2,15})$", line)
            if m_inline:
                cand = m_inline.group(1).strip()
                if re.search(r"\d", cand):
                    survey_no = cand
                    break
            # 2. Scan next few lines
            for j in range(i + 1, min(i + 8, len(cleaned))):
                cand = cleaned[j]
                if _SEP_RE.fullmatch(cand):
                    continue
                if _SV_RE.search(cand) or re.fullmatch(r"\d{1,6}", cand):
                    survey_no = cand
                    break
            if survey_no:
                break
    # Final fallback — scan full text for survey-number pattern
    if not survey_no:
        m = _SV_RE.search(full_text)
        if m:
            survey_no = m.group(0).strip()

    # Land type
    for line in cleaned:
        if "நஞ்சை" in line:
            land_type = "நஞ்சை (Wet)"
            break
        if "புஞ்சை" in line:
            land_type = "புஞ்சை (Dry)"
            break

    # Land area — search full text for ha/acres units, then fall back to decimal numbers
    area_num_re = re.compile(r"\b(\d+\.\d+)\b")
    ha_m = re.search(r"(\d+\.?\d*)\s*(?:hectares?|ha\.?|ஹெக்டேர்|ஹெக்)\b", full_text, re.IGNORECASE)
    ac_m = re.search(r"(\d+\.?\d*)\s*(?:acres?|ac\.?|ஏக்கர்)\b", full_text, re.IGNORECASE)
    if ha_m:
        land_area_ha = ha_m.group(1)
    if ac_m:
        land_area_ac = ac_m.group(1)
    # Keyword-based area line
    for i, line in enumerate(cleaned):
        if any(kw in line for kw in ["மொத்த பரப்பு", "பரப்பளவு", "நிலப்பரப்பு", "area"]):
            nums = area_num_re.findall(line)
            if not nums:
                nxt = _next_value(cleaned, i)
                if nxt:
                    nums = area_num_re.findall(nxt)
            if nums and not land_area_ha:
                land_area_ha = nums[0]
            if len(nums) > 1 and not land_area_ac:
                land_area_ac = nums[1]
            break
    # Last-resort: standalone decimal on its own line
    if land_area_ha is None:
        for line in cleaned:
            if re.fullmatch(r"\d+\.\d{2,4}", line):
                n = float(line)
                if 0 < n < 10_000:
                    land_area_ha = line
                    break

    # Land value — multiple currency patterns
    for pat in [
        r"(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)",
        r"(?:தொகை|மதிப்பு|விலை|value|amount)\s*[:\-]?\s*(?:₹|Rs\.?|INR)?\s*([0-9,]+(?:\.[0-9]+)?)",
        r"(?:market value|guideline value|stamp duty value)\s*[:\-]?\s*(?:₹|Rs\.?)?\s*([0-9,]+(?:\.[0-9]+)?)",
    ]:
        m = re.search(pat, full_text, re.IGNORECASE)
        if m:
            land_value = m.group(1).replace(",", "")
            break

    return _build_result(doc_type, patta_no, survey_no, owner_name,
                         father_name, district, taluk, village,
                         land_type, land_area_ha, land_area_ac, land_value)


# ---------------------------------------------------------------------------
# English parser
# ---------------------------------------------------------------------------

def _parse_english(lines: list[str], full_text: str) -> dict:
    cleaned = [l.strip() for l in lines if l.strip()]
    lower   = full_text.lower()

    # Document type
    doc_type = "Land Record"
    if "patta" in lower:
        doc_type = "Patta"
    elif "sale deed" in lower:
        doc_type = "Sale Deed"
    elif "chitta" in lower:
        doc_type = "Chitta"
    elif "record of rights" in lower or "ror" in lower:
        doc_type = "Record of Rights"
    elif "mutation" in lower:
        doc_type = "Mutation Record"
    elif "registry" in lower or "registration" in lower:
        doc_type = "Registration Document"
    elif "a-register" in lower:
        doc_type = "A-Register"

    patta_no = owner_name = father_name = district = taluk = village = None
    land_type = survey_no = land_area_ha = land_area_ac = land_value = None

    # English label: value patterns (handles "Label : value" and "Label\nvalue")
    def _find_after(keywords: list[str]) -> str | None:
        for i, line in enumerate(cleaned):
            ll = line.lower()
            for kw in keywords:
                if kw in ll:
                    # Try inline value first
                    v = _inline_value(line)
                    if v:
                        return v
                    # Then next non-empty line
                    v = _next_value(cleaned, i)
                    if v:
                        return v
        return None

    patta_no  = _find_after(["patta no", "patta number", "pattadhar no"])
    survey_no = _find_after(["survey no", "s.no", "survey number", "field no", "khata no"])
    if not survey_no:
        m = re.search(r"\b(\d{1,6}\s*[/\-]\s*\d{1,6}\s*[A-Za-z]?)\b", full_text)
        if m:
            survey_no = m.group(1).strip()

    owner_name  = _find_after(["owner name", "owner :", "name of owner", "pattadar", "ryot"])
    father_name = _find_after(["father name", "son of", "d/o", "w/o", "father/husband", "s/o", "husband"])
    district    = _find_after(["district"])
    taluk       = _find_after(["taluk", "tehsil", "taluka", "mandal", "block"])
    village     = _find_after(["village", "revenue village", "gram", "hamlet"])

    # Land type
    for kw, label in [
        ("wet", "Wet Land"), ("dry", "Dry Land"),
        ("irrigated", "Irrigated"), ("unirrigated", "Unirrigated"),
        ("garden", "Garden Land"), ("waste", "Waste Land"),
    ]:
        if kw in lower:
            land_type = label
            break

    # Area — hectares and acres
    ha_m = re.search(r"(\d+\.?\d*)\s*(?:hectares?|ha\.?)\b", full_text, re.IGNORECASE)
    ac_m = re.search(r"(\d+\.?\d*)\s*(?:acres?|ac\.?)\b",    full_text, re.IGNORECASE)
    if ha_m:
        land_area_ha = ha_m.group(1)
    if ac_m:
        land_area_ac = ac_m.group(1)

    # Land value
    m = re.search(r"(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)", full_text, re.IGNORECASE)
    if m:
        land_value = m.group(1).replace(",", "")

    return _build_result(doc_type, patta_no, survey_no, owner_name,
                         father_name, district, taluk, village,
                         land_type, land_area_ha, land_area_ac, land_value)


# ---------------------------------------------------------------------------
# Hindi parser
# ---------------------------------------------------------------------------

def _parse_hindi(lines: list[str], full_text: str) -> dict:
    cleaned = [l.strip() for l in lines if l.strip()]
    lower   = full_text.lower()

    # Document type
    doc_type = "Land Record"
    if "खसरा" in full_text:
        doc_type = "Khasra"
    elif "खतौनी" in full_text:
        doc_type = "Khatauni"
    elif "पट्टा" in full_text:
        doc_type = "Patta"
    elif "बिक्री" in full_text or "sale deed" in lower:
        doc_type = "Sale Deed"
    elif "म्युटेशन" in full_text or "दाखिल खारिज" in full_text:
        doc_type = "Mutation Record"

    patta_no = owner_name = father_name = district = taluk = village = None
    land_type = survey_no = land_area_ha = land_area_ac = land_value = None

    # Survey / Khasra number
    for i, line in enumerate(cleaned):
        if any(k in line for k in ["खसरा", "खाता संख्या", "खाता नंबर", "प्लॉट"]):
            v = _grab(cleaned, i)
            if not v:
                m = re.search(r"[:\-]\s*(\S+)", line)
                if m:
                    v = m.group(1)
            if v and re.search(r"\d", v):
                survey_no = v
                break

    # Owner (खातेदार / मालिक)
    for i, line in enumerate(cleaned):
        if any(k in line for k in ["खातेदार", "मालिक", "स्वामी", "नाम"]):
            v = _next_value(cleaned, i)
            if v:
                owner_name = _clean_name(v)
                break

    # Father name (पिता)
    for i, line in enumerate(cleaned):
        if "पिता" in line or "पिता का नाम" in line:
            v = _grab(cleaned, i)
            if v:
                father_name = _clean_name(v)
                break

    # District (जिला)
    for i, line in enumerate(cleaned):
        if "जिला" in line or "जनपद" in line:
            v = _grab(cleaned, i)
            if v:
                district = v
            break

    # Tehsil / Taluk (तहसील)
    for i, line in enumerate(cleaned):
        if "तहसील" in line or "तालुका" in line:
            v = _grab(cleaned, i)
            if v:
                taluk = v
            break

    # Village (ग्राम / गाँव)
    for i, line in enumerate(cleaned):
        if any(k in line for k in ["ग्राम", "गाँव", "गांव"]):
            v = _grab(cleaned, i)
            if v:
                village = v
            break

    # Land type (भूमि का प्रकार)
    for kw, label in [
        ("सिंचित",    "सिंचित (Irrigated)"),
        ("असिंचित",   "असिंचित (Unirrigated)"),
        ("कृषि",      "कृषि भूमि (Agricultural)"),
        ("बंजर",      "बंजर (Barren)"),
        ("वन",        "वन भूमि (Forest)"),
    ]:
        if kw in full_text:
            land_type = label
            break

    # Area (क्षेत्रफल / रकबा)
    area_re = re.compile(r"\b\d+\.?\d*\b")
    for i, line in enumerate(cleaned):
        if any(k in line for k in ["क्षेत्रफल", "रकबा", "भूमि का क्षेत्र"]):
            nums = area_re.findall(line)
            if nums:
                land_area_ha = nums[0]
            else:
                v = _next_value(cleaned, i)
                if v:
                    nums = area_re.findall(v)
                    if nums:
                        land_area_ha = nums[0]
            break

    ha_m = re.search(r"(\d+\.?\d*)\s*(?:हेक्टेयर|ha\.?)\b", full_text, re.IGNORECASE)
    ac_m = re.search(r"(\d+\.?\d*)\s*(?:एकड़|एकड|acres?)\b", full_text, re.IGNORECASE)
    if ha_m and not land_area_ha:
        land_area_ha = ha_m.group(1)
    if ac_m:
        land_area_ac = ac_m.group(1)

    # Land value
    m = re.search(r"(?:₹|Rs\.?|INR)\s*([0-9,]+(?:\.[0-9]+)?)", full_text, re.IGNORECASE)
    if m:
        land_value = m.group(1).replace(",", "")

    return _build_result(doc_type, patta_no, survey_no, owner_name,
                         father_name, district, taluk, village,
                         land_type, land_area_ha, land_area_ac, land_value)


# ---------------------------------------------------------------------------
# Shared result builder
# ---------------------------------------------------------------------------

def _build_result(
    document_type: str | None,
    patta_no: str | None,
    survey_no: str | None,
    owner_name: str | None,
    owner_father_or_son_name: str | None,
    district: str | None,
    taluk: str | None,
    village: str | None,
    land_type: str | None,
    land_area_hectare: str | None,
    land_area_acres: str | None,
    land_amount_or_value: str | None,
) -> dict:
    return {
        "document_type":            document_type,
        "patta_no":                 patta_no,
        "survey_no":                survey_no,
        "owner_name":               owner_name,
        "owner_father_or_son_name": owner_father_or_son_name,
        "district":                 district,
        "taluk":                    taluk,
        "village":                  village,
        "land_type":                land_type,
        "land_area_hectare":        land_area_hectare,
        "land_area_acres":          land_area_acres,
        "land_amount_or_value":     land_amount_or_value,
    }


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

# Separator-only lines that should be skipped when looking for a value
_SEP_RE = re.compile(r"^[\s:.\-–—…|/\\]{0,6}$")

# Survey/field number pattern: 142/3, 142/3A, 142-3A, "142 / 3 A"
_SV_RE = re.compile(
    r"\b(\d{1,6}\s*[/\-]\s*\d{1,6}\s*[A-Za-z]?|\d{1,6}\s*[A-Za-z]{1,2})\b"
)


def _next_value(lines: list[str], label_idx: int, window: int = 10) -> str | None:
    """Return first meaningful value line after a label line.
    Skips blank lines and pure-separator lines. Looks up to `window` lines ahead.
    """
    for j in range(label_idx + 1, min(label_idx + 1 + window, len(lines))):
        v = lines[j].strip()
        if not v:
            continue
        if _SEP_RE.fullmatch(v):
            continue
        return v
    return None


def _inline_value(line: str) -> str | None:
    """Extract the value portion after the first colon or dash separator on a line.
    Returns None if nothing meaningful follows the separator.
    """
    m = re.search(r"[:\-]\s*(.{2,})$", line)
    if m:
        val = m.group(1).strip()
        # reject if the value looks like another label (all caps / Tamil keywords only)
        if val and not _SEP_RE.fullmatch(val):
            return val
    return None


def _clean_name(name: str) -> str:
    """Strip leading punctuation but preserve inner spaces, hyphens, and special chars."""
    return re.sub(r"^[.:,\-/\\]+\s*", "", name.strip())


def _grab(lines: list[str], idx: int) -> str | None:
    """Try inline value first, then next-line value."""
    v = _inline_value(lines[idx])
    if v:
        return v
    return _next_value(lines, idx)
