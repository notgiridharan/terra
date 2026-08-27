# TerraLens — Full Feature Specification

TerraLens is an AI-powered Land Record Intelligence, Multilingual OCR, Document Forensics, and Spatial GIS Platform tailored for Indian land records (Patta, Chitta, Khasra, Khatauni, Sale Deeds).

---

## 1. Multilingual AI OCR & Field Extraction Engine
* **Direct Gemini Vision Primary Pipeline**: Processes document image pixels directly via Gemini multimodal vision models for maximum accuracy on faded, skewed, or low-resolution historical land records.
* **PaddleOCR Local Fallback Pipeline**: Includes automatic OpenCV image preprocessing:
  * **CLAHE Contrast Enhancement**: Boosts contrast on faded ink without over-brightening.
  * **Bilateral Denoising**: Smooths out paper background noise while preserving sharp text edges.
  * **Bicubic Upscaling**: Automatically resizes low-resolution phone scans.
* **Multilingual Recognition**: Supports Tamil (தமிழ்), Hindi (हिन्दी), and English.
* **Structured 12-Field Extraction**:
  1. Document Type (Patta, Chitta, Sale Deed, etc.)
  2. Patta / Record Number
  3. Survey / Khasra / Plot Number
  4. Land Owner Full Name
  5. Father / Husband Name
  6. District
  7. Taluk / Tehsil / Mandal
  8. Revenue Village
  9. Land Type (Wet / Dry / Irrigated / Commercial)
  10. Area in Hectares
  11. Area in Acres
  12. Land Valuation / Amount
* **Verbatim Raw Text Transcription**: Preserves exact Tamil/Hindi characters, numbers, hyphens, and line breaks.
* **Self-Healing Model Resolution**: Dynamic discovery loop that queries the Gemini API for available model versions if hardcoded endpoints change.

---

## 2. Advanced Document Forensics & Fraud Detection
* **Digital Splice Detection (Error Level Analysis - ELA)**: Analyzes compression differential grids using PIL and NumPy to spot spliced text (e.g. fraudsters pasting new names or numbers onto old deeds).
* **Wet-Ink Stamp & Signature Detection**: OpenCV HSV color space analysis (blue, red, purple ink filtering) + morphological contour extraction to locate, count, and bound official government seals and signatures.
* **Pre-2018 Dead Owner Loophole Protection**: Cross-references extracted owner names against a mock Civil Death Registry (Jeevan Pramaan).
* **Hard-Stop Transfer Block**: Automatically flags transfers on deceased owner property as `HIGH_RISK` and mandates a verified Legal Heir Certificate (*Varisu Sannidhi*) before the transaction can proceed.

---

## 3. PostgreSQL + PostGIS Spatial Database Integration
* **Dual Database Engine (SQLAlchemy + GeoAlchemy2)**:
  * **Zero-Config Local Fallback**: Automatically creates and uses a local SQLite database (`terralens.db`) out-of-the-box.
  * **PostgreSQL + PostGIS Ready**: Connects to enterprise PostgreSQL via `DATABASE_URL` in `.env` for spatial GIS queries (`ST_Contains`, `ST_Intersects`).
* **Complete Record Storage**:
  * **Input Images**: Stores original filenames, local/cloud static image URLs (`/uploads/...`), and optional inline Base64 data.
  * **Extracted Information**: Indexed SQL columns for instant querying + full JSON dictionary dumps.
  * **GIS Spatial Features**: GeoJSON Polygon boundaries, Point coordinates (`latitude`, `longitude`), and spatial SRID metadata.
  * **Forensic Audits**: ELA anomaly scores, stamp counts, signature counts, and life-state registry flags.

---

## 4. Government REST APIs & GIS Interoperability
* **Full RESTful CRUD API (`/api/v1/records`)**: Allows external government land registry systems to create, search, update, and delete land records programmatically.
* **Multilingual Query API**: Search records by Patta No, Survey No, Owner Name, District, Taluk, Village, or Government ID.
* **Bulk Batch Ingest Endpoint (`/api/v1/records/batch`)**: Enables mass synchronization of land records from existing state databases.
* **Standard GeoJSON Export API (`/api/v1/gis/geojson`)**: Serves spatial layers directly to QGIS, ArcGIS, Mapbox, Leaflet, and OpenLayers.

---

## 5. Modern Next.js Frontend Dashboard & Officer Workspace
* **Dark-Mode Glassmorphism Interface**: Sleek UI designed with Tailwind CSS and Next.js App Router.
* **Interactive Forensic Compliance Panel**: Real-time visual risk badges (`CLEAN DOCUMENT` vs `HIGH RISK DETECTED`), ELA score meters, physical asset checks, and deceased owner hard-stop UI.
* **Drag-and-Drop Uploader**: Live image preview with file size validation.
* **One-Click Export**: Copy individual fields to clipboard or download the full JSON extraction payload.
