"""
TerraLens Real OpenCV Preprocessing Service
============================================
Runs an actual OpenCV pipeline (deskew -> denoise -> contrast enhancement ->
text restoration/sharpening) on an already-uploaded document image and
reports objective before/after quality metrics. Each stage's output image is
saved to disk so the frontend can display the real intermediate results
instead of a simulated CSS filter.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import cv2
import numpy as np

from ocr_service import UPLOADS_DIR

STAGE_DIR = UPLOADS_DIR / "preprocess"
STAGE_DIR.mkdir(parents=True, exist_ok=True)

STAGES = ["deskew", "denoise", "enhancement", "restoration"]

# Extensions cv2 can reliably decode for this pipeline.
SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".bmp", ".tif", ".tiff"}


def _read_image(path: Path) -> np.ndarray:
    img = cv2.imdecode(np.fromfile(str(path), dtype=np.uint8), cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError(f"Could not decode image: {path}")
    return img


def _save_image(img: np.ndarray, path: Path) -> None:
    cv2.imencode(".png", img)[1].tofile(str(path))


# ---------------------------------------------------------------------------
# Quality metrics
# ---------------------------------------------------------------------------


def _estimate_skew(gray: np.ndarray) -> float:
    """Estimate document skew (degrees) via Hough line detection."""
    edges = cv2.Canny(gray, 50, 150, apertureSize=3)
    lines = cv2.HoughLinesP(
        edges, 1, np.pi / 180, threshold=100,
        minLineLength=max(60, gray.shape[1] // 8), maxLineGap=15,
    )
    if lines is None:
        return 0.0
    angles: list[float] = []
    for line in lines:
        x1, y1, x2, y2 = line[0]
        if x2 == x1:
            continue
        angle = np.degrees(np.arctan2(y2 - y1, x2 - x1))
        if abs(angle) < 45:
            angles.append(angle)
    if not angles:
        return 0.0
    return float(np.median(angles))


def analyze_quality(img: np.ndarray) -> dict[str, Any]:
    """Compute objective scan-quality metrics from real pixel data."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if img.ndim == 3 else img

    skew = abs(_estimate_skew(gray))

    # Sharpness proxy: variance of the Laplacian (higher = crisper edges/text)
    laplacian_var = cv2.Laplacian(gray, cv2.CV_64F).var()
    sharpness = min(100.0, laplacian_var / 8.0)

    # Contrast: normalized standard deviation of pixel intensities
    contrast = float(gray.std() / 255.0)

    # Noise: high-frequency residual left after median smoothing
    median = cv2.medianBlur(gray, 3)
    residual = cv2.absdiff(gray, median)
    noise_index = float(residual.std() / 255.0)

    readability = max(0.0, min(100.0, sharpness * 0.6 + contrast * 100 * 0.4))

    score_components = [
        max(0.0, 100 - skew * 6),           # skew penalty
        max(0.0, 100 - noise_index * 220),  # noise penalty
        min(100.0, contrast * 260),         # contrast reward
        readability,
    ]
    score = int(round(sum(score_components) / len(score_components)))
    score = max(0, min(100, score))

    if score >= 85:
        label = "Excellent"
    elif score >= 70:
        label = "Good"
    elif score >= 50:
        label = "Fair"
    else:
        label = "Poor"

    return {
        "score": score,
        "label": label,
        "skewDegrees": round(skew, 2),
        "noiseIndex": round(noise_index, 2),
        "contrast": round(contrast, 2),
        "readability": round(readability, 1),
    }


# ---------------------------------------------------------------------------
# Pipeline stages
# ---------------------------------------------------------------------------


def _deskew(img: np.ndarray) -> np.ndarray:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    angle = _estimate_skew(gray)
    if abs(angle) < 0.3:
        return img
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    matrix = cv2.getRotationMatrix2D(center, angle, 1.0)
    return cv2.warpAffine(
        img, matrix, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE
    )


def _denoise(img: np.ndarray) -> np.ndarray:
    return cv2.fastNlMeansDenoisingColored(img, None, 7, 7, 7, 21)


def _enhance(img: np.ndarray) -> np.ndarray:
    """CLAHE contrast enhancement on the L channel (preserves colour)."""
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8, 8))
    l = clahe.apply(l)
    lab = cv2.merge((l, a, b))
    return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)


def _restore(img: np.ndarray) -> np.ndarray:
    """Unsharp-mask sharpening to restore crisp text edges."""
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (0, 0), 2.0)
    sharpened = cv2.addWeighted(gray, 1.6, blur, -0.6, 0)
    return cv2.cvtColor(sharpened, cv2.COLOR_GRAY2BGR)


_STAGE_FUNCS = {
    "deskew": _deskew,
    "denoise": _denoise,
    "enhancement": _enhance,
    "restoration": _restore,
}


def run_pipeline(source_path: str | Path, record_id: int) -> dict[str, Any]:
    """
    Run the real OpenCV preprocessing pipeline on `source_path`, saving each
    intermediate stage image under backend/uploads/preprocess/<record_id>/.
    Returns before/after quality metrics plus URLs for each stage.
    """
    source_path = Path(source_path)
    img = _read_image(source_path)

    out_dir = STAGE_DIR / str(record_id)
    out_dir.mkdir(parents=True, exist_ok=True)

    quality_before = analyze_quality(img)

    stage_urls: dict[str, str] = {}
    current = img
    for stage in STAGES:
        current = _STAGE_FUNCS[stage](current)
        stage_path = out_dir / f"{stage}.png"
        _save_image(current, stage_path)
        stage_urls[stage] = f"/uploads/preprocess/{record_id}/{stage}.png"

    quality_after = analyze_quality(current)

    return {
        "qualityBefore": quality_before,
        "qualityAfter": quality_after,
        "stageUrls": stage_urls,
    }
