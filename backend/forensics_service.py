"""
TerraLens Document Forensics Service
======================================
Provides advanced image forensics to detect digital manipulation and forgery.
Currently implements Error Level Analysis (ELA) to detect image splicing (e.g., a fraudster
pasting a new name over an old document).
"""

from __future__ import annotations

import os
import io
import cv2
import numpy as np
from PIL import Image, ImageChops, ImageEnhance
from pathlib import Path


def perform_ela(image_path: str | Path, quality: int = 90) -> dict:
    """
    Perform Error Level Analysis (ELA) on an image to detect splicing.
    
    How it works:
    1. The original image is re-saved at a known JPEG quality (e.g., 90%).
    2. The difference between the original and the re-saved image is calculated.
    3. Areas that have been digitally altered/spliced will typically show higher 
       error levels (brighter pixels in the ELA image) because they haven't been 
       subjected to the same compression history as the rest of the document.
       
    Returns a dictionary with the ELA score and an anomaly flag.
    """
    path = Path(image_path)
    if not path.exists():
        return {"error": "Image not found"}

    try:
        # Load original image
        original = Image.open(path).convert('RGB')
        
        # Save to memory at specified quality
        resaved_buffer = io.BytesIO()
        original.save(resaved_buffer, 'JPEG', quality=quality)
        resaved_buffer.seek(0)
        
        # Load the re-saved image
        resaved = Image.open(resaved_buffer).convert('RGB')
        
        # Calculate the absolute difference
        ela_image = ImageChops.difference(original, resaved)
        
        # Enhance the difference to make it visible/measurable
        extrema = ela_image.getextrema()
        max_diff = max([ex[1] for ex in extrema])
        
        if max_diff == 0:
            max_diff = 1 # Avoid division by zero
            
        scale = 255.0 / max_diff
        ela_image = ImageEnhance.Brightness(ela_image).enhance(scale)
        
        # Convert to numpy array for statistical analysis
        ela_array = np.array(ela_image)
        
        # Calculate average error and max error regions
        # Convert to grayscale for simpler thresholding
        gray_ela = cv2.cvtColor(ela_array, cv2.COLOR_RGB2GRAY)
        
        mean_error = np.mean(gray_ela)
        std_error = np.std(gray_ela)
        
        # High error regions (potential splices)
        threshold = mean_error + (2 * std_error)
        high_error_pixels = np.sum(gray_ela > threshold)
        total_pixels = gray_ela.size
        
        anomaly_ratio = high_error_pixels / total_pixels
        
        # Heuristic scoring (0-100)
        # Normal documents usually have a uniform noise distribution.
        # Spliced documents will have concentrated areas of high error.
        score = min(100, int((anomaly_ratio * 100) * 5)) # Multiply to scale up for sensitivity
        
        is_suspicious = score > 60

        return {
            "ela_score": score,
            "is_suspicious": is_suspicious,
            "mean_error": float(mean_error),
            "anomaly_ratio": float(anomaly_ratio),
            "status": "HIGH_RISK" if is_suspicious else "CLEAN"
        }

    except Exception as e:
        print(f"[forensics_service] ELA Analysis failed: {e}", flush=True)
        return {"error": str(e), "is_suspicious": False, "ela_score": 0}


def detect_stamps_and_signatures(image_path: str | Path) -> dict:
    """
    Detects wet-ink official stamps and extracts potential signature regions.
    
    Uses OpenCV HSV color thresholding to detect blue, red, and purple inks 
    which are typically used for official government stamps and wet signatures,
    distinguishing them from the black/grayscale printed text of the document.
    """
    path = Path(image_path)
    if not path.exists():
        return {"error": "Image not found"}

    try:
        # Load image via OpenCV
        img = cv2.imread(str(path))
        if img is None:
            return {"error": "Could not read image with OpenCV"}

        # Convert to HSV color space for robust ink detection
        hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

        # 1. Detect Blue Ink (Common for stamps & signatures)
        lower_blue = np.array([100, 50, 50])
        upper_blue = np.array([130, 255, 255])
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

        # 2. Detect Red/Purple Ink (Common for official Govt seals)
        # Red wraps around the HSV spectrum
        lower_red1 = np.array([0, 50, 50])
        upper_red1 = np.array([10, 255, 255])
        mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
        
        lower_red2 = np.array([160, 50, 50])
        upper_red2 = np.array([180, 255, 255])
        mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
        
        mask_red = cv2.bitwise_or(mask_red1, mask_red2)
        
        # Combine masks
        ink_mask = cv2.bitwise_or(mask_blue, mask_red)
        
        # Apply morphological operations to clean up noise
        kernel = np.ones((5,5), np.uint8)
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_OPEN, kernel)
        ink_mask = cv2.morphologyEx(ink_mask, cv2.MORPH_CLOSE, kernel)

        # Find contours (blobs of ink)
        contours, _ = cv2.findContours(ink_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        stamps = []
        signatures = []
        
        for cnt in contours:
            area = cv2.contourArea(cnt)
            # Filter out tiny specks of noise
            if area > 500:
                x, y, w, h = cv2.boundingRect(cnt)
                aspect_ratio = float(w)/h
                
                # Stamps are usually roughly circular/square (aspect ratio close to 1)
                # and fairly large.
                if 0.5 < aspect_ratio < 2.0 and area > 2000:
                    stamps.append({
                        "bounding_box": [x, y, w, h],
                        "area": float(area),
                        "type": "official_stamp"
                    })
                # Signatures are usually wide and short (aspect ratio > 2.0)
                elif aspect_ratio >= 2.0 and area > 1000:
                    signatures.append({
                        "bounding_box": [x, y, w, h],
                        "area": float(area),
                        "type": "signature"
                    })

        return {
            "stamps_detected": len(stamps) > 0,
            "stamp_count": len(stamps),
            "signature_count": len(signatures),
            "stamps": stamps,
            "signatures": signatures,
            "status": "VERIFIED" if len(stamps) > 0 else "WARNING_NO_STAMP"
        }

    except Exception as e:
        print(f"[forensics_service] Stamp detection failed: {e}", flush=True)
        return {"error": str(e), "stamps_detected": False, "stamp_count": 0}

