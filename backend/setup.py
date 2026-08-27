"""
TerraLens First-Time Setup
===========================
Run this ONCE after cloning / extracting the project to a new machine.

What it does:
  1. Sets PADDLE_PDX_MODEL_HOME so models land in backend/models/ (not ~/.paddlex)
  2. Creates backend/models/, backend/uploads/, backend/bin/ directories
  3. Downloads PaddleOCR models for Tamil, English, and Hindi
  4. On Windows: downloads Poppler binaries into backend/bin/poppler/
  5. On macOS:   checks that Poppler is installed via Homebrew

Run:
  cd backend
  python setup.py
"""

from __future__ import annotations

import os
import platform
import shutil
import subprocess
import sys
import urllib.request
import zipfile
from pathlib import Path

BASE_DIR    = Path(__file__).resolve().parent
MODELS_DIR  = BASE_DIR / "models"
UPLOADS_DIR = BASE_DIR / "uploads"
BIN_DIR     = BASE_DIR / "bin"
POPPLER_DIR = BIN_DIR / "poppler"

SYSTEM = platform.system()

# Set BEFORE any paddle import (critical for correct model download location)
os.environ["PADDLE_PDX_MODEL_HOME"] = str(MODELS_DIR)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def header(msg: str) -> None:
    print(f"\n{'=' * 60}")
    print(f"  {msg}")
    print(f"{'=' * 60}")


def ok(msg: str) -> None:
    print(f"  [OK] {msg}")


def info(msg: str) -> None:
    print(f"  [..] {msg}")


def warn(msg: str) -> None:
    print(f"  [!]  {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# 1. Create directories
# ---------------------------------------------------------------------------

header("Creating directories")
for d in [MODELS_DIR, UPLOADS_DIR, BIN_DIR]:
    d.mkdir(parents=True, exist_ok=True)
    ok(str(d))


# ---------------------------------------------------------------------------
# 2. Download PaddleOCR models into backend/models/
# ---------------------------------------------------------------------------

DET_MODEL_NAME = "PP-OCRv5_server_det"
DET_DIR        = MODELS_DIR / DET_MODEL_NAME

LANG_MODELS = [
    ("ta", "ta_PP-OCRv3_mobile_rec", "Tamil"),
    ("en", "en_PP-OCRv4_mobile_rec", "English"),
    ("hi", "devanagari_PP-OCRv3_mobile_rec", "Hindi"),
]

header("Downloading PaddleOCR models -> backend/models/")

all_present = DET_DIR.is_dir() and all(
    (MODELS_DIR / rec_name).is_dir() for _, rec_name, _ in LANG_MODELS
)

if all_present:
    ok("All models already present — skipping download.")
else:
    info("Initialising PaddleOCR to trigger model downloads ...")
    info("(This may take several minutes on first run - ~350 MB total)")
    try:
        from paddleocr import PaddleOCR  # type: ignore

        # Download detection model once (shared across languages)
        if not DET_DIR.is_dir():
            info(f"Downloading detection model: {DET_MODEL_NAME} ...")
            _ocr_det = PaddleOCR(
                text_detection_model_name=DET_MODEL_NAME,
                text_recognition_model_name="ta_PP-OCRv3_mobile_rec",
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
            ok(f"{DET_MODEL_NAME} downloaded.")
        else:
            ok(f"{DET_MODEL_NAME} already in backend/models/.")

        # Download recognition model for each language
        for lang_code, rec_name, lang_label in LANG_MODELS:
            rec_dir = MODELS_DIR / rec_name
            if rec_dir.is_dir():
                ok(f"{rec_name} already in backend/models/.")
                continue
            info(f"Downloading {lang_label} recognition model: {rec_name} ...")
            _ocr_rec = PaddleOCR(
                text_detection_model_dir=str(DET_DIR) if DET_DIR.is_dir() else None,
                text_detection_model_name=DET_MODEL_NAME if not DET_DIR.is_dir() else None,
                text_recognition_model_name=rec_name,
                use_doc_orientation_classify=False,
                use_doc_unwarping=False,
                use_textline_orientation=False,
            )
            ok(f"{rec_name} downloaded.")

        # Copy any models that landed in ~/.paddlex into backend/models/
        paddle_home = Path.home() / ".paddlex" / "official_models"
        all_expected = [DET_MODEL_NAME] + [r for _, r, _ in LANG_MODELS]
        for model_name in all_expected:
            local_dir = MODELS_DIR / model_name
            src       = paddle_home / model_name
            if src.exists() and not local_dir.exists():
                info(f"Copying {model_name} -> backend/models/ ...")
                shutil.copytree(str(src), str(local_dir))
                ok(f"{model_name} copied.")
            elif local_dir.exists():
                ok(f"{model_name} already in backend/models/.")

    except Exception as exc:
        warn(f"Failed to download models: {exc}")
        warn("You can still run the server; models will be downloaded on first OCR request.")


# ---------------------------------------------------------------------------
# 3. Poppler setup
# ---------------------------------------------------------------------------

header("Setting up Poppler (required for PDF support)")

if SYSTEM == "Windows":
    POPPLER_BIN = POPPLER_DIR / "bin"
    if POPPLER_BIN.exists():
        ok("Poppler already bundled at backend/bin/poppler/")
    else:
        info("Downloading Poppler for Windows ...")
        POPPLER_URL = (
            "https://github.com/oschwartz10612/poppler-windows/"
            "releases/download/v24.08.0-0/Release-24.08.0-0.zip"
        )
        zip_path = BIN_DIR / "poppler.zip"
        try:
            info(f"URL: {POPPLER_URL}")
            urllib.request.urlretrieve(POPPLER_URL, str(zip_path))
            ok("Downloaded poppler.zip")

            info("Extracting ...")
            with zipfile.ZipFile(str(zip_path), "r") as zf:
                zf.extractall(str(BIN_DIR / "_poppler_tmp"))

            extracted_dirs = list((BIN_DIR / "_poppler_tmp").iterdir())
            if extracted_dirs:
                if POPPLER_DIR.exists():
                    import shutil
                    shutil.rmtree(POPPLER_DIR)
                extracted_dirs[0].rename(POPPLER_DIR)
                ok(f"Poppler installed at: {POPPLER_DIR}")

            zip_path.unlink(missing_ok=True)
            tmp = BIN_DIR / "_poppler_tmp"
            if tmp.exists():
                shutil.rmtree(tmp)
        except Exception as exc:
            warn(f"Could not download Poppler automatically: {exc}")
            warn("Manual install: https://github.com/oschwartz10612/poppler-windows/releases")
            warn(f"Extract into: {POPPLER_DIR}")

elif SYSTEM == "Darwin":
    result = subprocess.run(["which", "pdfinfo"], capture_output=True, text=True)
    if result.returncode == 0:
        ok(f"Poppler found at: {result.stdout.strip()}")
    else:
        warn("Poppler not found. Installing via Homebrew ...")
        brew = subprocess.run(["brew", "install", "poppler"], capture_output=False)
        if brew.returncode == 0:
            ok("Poppler installed via brew.")
        else:
            warn("brew install poppler failed. Install manually: brew install poppler")

else:
    result = subprocess.run(["which", "pdfinfo"], capture_output=True, text=True)
    if result.returncode == 0:
        ok(f"Poppler found at: {result.stdout.strip()}")
    else:
        warn("Poppler not found. Install with:")
        warn("  Ubuntu/Debian: sudo apt-get install poppler-utils")
        warn("  Fedora/RHEL:   sudo dnf install poppler-utils")


# ---------------------------------------------------------------------------
# Done
# ---------------------------------------------------------------------------

header("Setup complete")
print("""
Next steps:
  Windows:   start_backend.bat
  macOS:     bash start_backend.sh

Then open:  http://localhost:3000/ocr
""")
