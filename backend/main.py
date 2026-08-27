from __future__ import annotations

import os
import time
import shutil
import uuid
from pathlib import Path

# Load .env from project root automatically (works with or without the bat file)
try:
    from dotenv import load_dotenv  # type: ignore
    _env_path = Path(__file__).resolve().parent.parent / ".env"
    load_dotenv(_env_path, override=False)
except ImportError:
    pass  # python-dotenv not installed; env vars must be set manually

from fastapi import FastAPI, File, Form, HTTPException, UploadFile, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ocr_service import run_ocr, UPLOADS_DIR, SUPPORTED_LANGS
from database import init_db, get_db
from db_models import LandRecordDB
from preprocessing_service import run_pipeline as run_preprocessing_pipeline, SUPPORTED_EXTENSIONS as PREPROCESS_EXTENSIONS
from validation_service import validate_record
from schemas import ValidateRecordRequest
import api_records


# ---------------------------------------------------------------------------
# App Initialization
# ---------------------------------------------------------------------------

init_db()  # Creates DB tables on startup (PostgreSQL/PostGIS or SQLite)

app = FastAPI(
    title="TerraLens API",
    description="TerraLens Backend — Multilingual OCR, Spatial GIS, Land Record Intelligence, and Govt Integration REST APIs.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded document images statically
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Mount Government & GIS REST API Router
app.include_router(api_records.router)



# ---------------------------------------------------------------------------
# Allowed file extensions
# ---------------------------------------------------------------------------

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".tiff", ".tif",
    ".webp", ".bmp", ".pdf", ".docx", ".doc",
}

MAX_BYTES = 40 * 1024 * 1024  # 40 MB

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "service": "terralens-api", "version": "0.3.0"}


# ---------------------------------------------------------------------------
# Available OCR languages
# ---------------------------------------------------------------------------


@app.get("/api/ocr/languages")
def list_languages() -> list[dict]:
    """Return the list of supported OCR languages for the frontend selector."""
    langs = [{"code": "auto", "label": "Auto Detect"}]
    for code, cfg in SUPPORTED_LANGS.items():
        langs.append({"code": code, "label": cfg["label"]})
    return langs


# ---------------------------------------------------------------------------
# OCR endpoint
# ---------------------------------------------------------------------------


@app.post("/api/ocr")
async def ocr_endpoint(
    file: UploadFile = File(...),
    lang: str = Form("ta"),
    db: Session = Depends(get_db),
) -> dict:
    """
    Upload a land-document file (image / PDF / DOCX) and receive:
      - raw_text       : full OCR text
      - parsed_fields  : structured extraction
      - detected_lang  : language used / detected
      - processing_ms  : wall-clock time in milliseconds
      - record_id      : database record ID for government system query
    """
    # ── Validate language ─────────────────────────────────────────────────────
    valid_langs = list(SUPPORTED_LANGS.keys()) + ["auto"]
    if lang not in valid_langs:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported lang {lang!r}. Choose from: {', '.join(valid_langs)}",
        )

    # ── Extension check ───────────────────────────────────────────────────────
    original_name = file.filename or "upload"
    suffix = Path(original_name).suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{suffix}'. "
                f"Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
            ),
        )

    # ── Size check ────────────────────────────────────────────────────────────
    content = await file.read()
    if len(content) > MAX_BYTES:
        raise HTTPException(
            status_code=413,
            detail="File exceeds maximum size of 40 MB.",
        )

    # ── Save upload file ─────────────────────────────────────────────────────
    unique_name = f"{uuid.uuid4().hex}{suffix}"
    save_path   = UPLOADS_DIR / unique_name
    save_path.write_bytes(content)
    image_url = f"/uploads/{unique_name}"

    # ── Run OCR ───────────────────────────────────────────────────────────────
    t0 = time.monotonic()
    try:
        result = run_ocr(save_path, lang=lang)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=str(exc))

    # ── Run Forensics (ELA, Stamps, Identity/Lineage) ─────────────────────────
    from forensics_service import perform_ela, detect_stamps_and_signatures
    from identity_verification import verify_life_state
    
    pf = result.get("parsed_fields") or {}
    
    ela_result = perform_ela(save_path)
    stamp_result = detect_stamps_and_signatures(save_path)
    lineage_result = verify_life_state(pf.get("owner_name"))
    
    is_suspicious = ela_result.get("is_suspicious", False) or lineage_result.get("requires_legal_heir_certificate", False)
    
    forensics_result = {
        "ela": ela_result,
        "assets": stamp_result,
        "lineage": lineage_result,
        "is_suspicious": is_suspicious,
        "status": "HIGH_RISK" if is_suspicious else stamp_result.get("status", "CLEAN")
    }

    print(f"[main] Forensics: ELA Score {ela_result.get('ela_score')}% | Lineage: {lineage_result.get('status')} | Stamps: {stamp_result.get('stamp_count')}", flush=True)
    
    elapsed_ms = int((time.monotonic() - t0) * 1000)

    # ── Auto-save Input Image + Output Information + Metadata to Database ─────
    record_id = None
    try:
        db_obj = LandRecordDB(
            source_filename=original_name,
            image_url=image_url,
            document_type=pf.get("document_type"),
            patta_no=pf.get("patta_no"),
            survey_no=pf.get("survey_no"),
            owner_name=pf.get("owner_name"),
            owner_father_or_son_name=pf.get("owner_father_or_son_name"),
            district=pf.get("district"),
            taluk=pf.get("taluk"),
            village=pf.get("village"),
            land_type=pf.get("land_type"),
            land_area_hectare=pf.get("land_area_hectare"),
            land_area_acres=pf.get("land_area_acres"),
            land_amount_or_value=pf.get("land_amount_or_value"),
            raw_text=result.get("raw_text"),
            parsed_fields_json=pf,
            ocr_language=lang,
            detected_lang=result.get("detected_lang", lang),
            processing_ms=elapsed_ms,
            ocr_metadata={
                "forensics": forensics_result,
                "preprocessed_url": f"/uploads/{result['preprocessed_path']}" if result.get("preprocessed_path") else None
            },
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        record_id = db_obj.id
    except Exception as db_exc:
        print(f"[main] Auto-save DB error: {db_exc}", flush=True)

    return {
        "success":       True,
        "record_id":     record_id,
        "filename":      original_name,
        "image_url":     image_url,
        "lang":          lang,
        "detected_lang": result.get("detected_lang", lang),
        "raw_text":      result["raw_text"],
        "parsed_fields": result["parsed_fields"],
        "processing_ms": elapsed_ms,
        "forensics":     forensics_result,
    }


# ---------------------------------------------------------------------------
# Real OpenCV preprocessing endpoint
# ---------------------------------------------------------------------------


@app.post("/api/preprocess/{record_id}")
def preprocess_endpoint(record_id: int, db: Session = Depends(get_db)) -> dict:
    """
    Run the real OpenCV pipeline (deskew, denoise, CLAHE enhancement, unsharp
    restoration) on the image already stored for `record_id` and persist the
    resulting stage image URLs + quality metrics onto the record.
    """
    record = db.query(LandRecordDB).filter(LandRecordDB.id == record_id).first()
    if not record or not record.image_url:
        raise HTTPException(status_code=404, detail=f"Record {record_id} or its source image not found")

    suffix = Path(record.image_url).suffix.lower()
    if suffix not in PREPROCESS_EXTENSIONS:
        raise HTTPException(
            status_code=415,
            detail=f"Real OpenCV preprocessing only supports raster images ({', '.join(sorted(PREPROCESS_EXTENSIONS))}), not '{suffix}'.",
        )

    source_path = UPLOADS_DIR / Path(record.image_url).name
    if not source_path.exists():
        raise HTTPException(status_code=404, detail="Source image file missing on disk.")

    try:
        result = run_preprocessing_pipeline(source_path, record_id)
    except Exception as exc:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Preprocessing failed: {exc}")

    meta = dict(record.ocr_metadata or {})
    meta["preprocessing_pipeline"] = result
    record.ocr_metadata = meta
    db.commit()

    return {"success": True, "record_id": record_id, **result}


# ---------------------------------------------------------------------------
# Land Records Validation Engine endpoint
# ---------------------------------------------------------------------------


@app.post("/api/validate-record")
def validate_record_endpoint(
    payload: ValidateRecordRequest, db: Session = Depends(get_db)
) -> dict:
    """
    Run the Indian land-record business-rule validation engine
    (area arithmetic, survey-number format, ownership chain of title,
    date chronology, duplicate record) against a structured record and
    return a PASSED/WARNING/CONFLICT outcome per rule plus a summary.
    """
    record = payload.model_dump()
    return validate_record(record, db)


# ---------------------------------------------------------------------------
# Legacy item endpoints (keep for backwards compat)
# ---------------------------------------------------------------------------


class ItemIn(BaseModel):
    title: str
    village: str = "Sirkazhi"


class Item(ItemIn):
    id: int


items: list[Item] = [
    Item(id=1, title="Survey 142/3 remainder", village="Sirkazhi"),
    Item(id=2, title="Sale deed 2009",         village="Sirkazhi"),
]


@app.get("/items")
def list_items() -> list[Item]:
    return items


@app.post("/items")
def create_item(body: ItemIn) -> Item:
    item = Item(id=len(items) + 1, title=body.title, village=body.village)
    items.append(item)
    return item
