# TerraLens — Setup & Run Guide

Land document OCR + digitization system. Upload images, PDFs, or DOCX files and get structured Tamil, English, or Hindi land record fields back.

---

## Prerequisites

| Requirement | Windows | macOS |
|-------------|---------|-------|
| **Python** ≥ 3.10 | [python.org](https://www.python.org/downloads/) | `brew install python` |
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org/) | `brew install node` |
| **Git** | [git-scm.com](https://git-scm.com/) | built-in / `brew install git` |

---

## Quick Start (after cloning / extracting ZIP)

### Terminal 1 — Backend

**Windows:**
```bat
cd terralens\backend
start_backend.bat
```

**macOS / Linux:**
```bash
cd terralens/backend
bash start_backend.sh
```

What happens on first run:
1. Creates a Python virtual environment (`backend/.venv/`)
2. Installs Python dependencies
3. Downloads PaddleOCR models into `backend/models/` (~350 MB total, one-time):
   - Detection: `PP-OCRv5_server_det` (~81 MB, shared)
   - Tamil recognition: `ta_PP-OCRv5_mobile_rec` (~88 MB)
   - English recognition: `en_PP-OCRv5_mobile_rec` (~88 MB)
   - Hindi recognition: `hi_PP-OCRv5_mobile_rec` (~88 MB)
4. Downloads Poppler for PDF support:
   - **Windows**: automatically downloaded to `backend/bin/poppler/`
   - **macOS**: installs via `brew install poppler`
5. Starts API server at **http://localhost:8000**

---

### Terminal 2 — Frontend

**Windows:**
```bat
cd terralens
start_frontend.bat
```

**macOS / Linux:**
```bash
cd terralens
bash start_frontend.sh
```

Starts the Next.js dev server at **http://localhost:3000**

---

## Using the OCR Feature

1. Open **http://localhost:3000/ocr** in your browser
2. **Select the document language**: Tamil / English / Hindi / Auto Detect
3. Drag-and-drop or click to upload a land document:
   - Images: JPG, PNG, TIFF, WEBP, BMP
   - PDF: multi-page supported
   - DOCX: text extracted directly
4. Click **Run OCR**
5. View:
   - **Parsed Fields** — structured extraction (Patta No., Owner, District, Area…)
   - **OCR Text Output** — full raw text from PaddleOCR
6. **Download JSON** or **Copy** individual fields as needed

---

## Project Structure

```
terralens/
├── backend/
│   ├── main.py              ← FastAPI app (POST /api/ocr)
│   ├── ocr_service.py       ← OCR logic (images, PDF, DOCX)
│   ├── setup.py             ← First-time setup script
│   ├── requirements.txt
│   ├── start_backend.bat    ← Windows startup
│   ├── start_backend.sh     ← macOS / Linux startup
│   ├── models/              ← PaddleOCR models (downloaded on first run)
│   ├── uploads/             ← Temporary upload directory
│   └── bin/poppler/         ← Windows: Poppler binaries (downloaded on first run)
├── src/
│   ├── app/ocr/page.tsx     ← OCR upload page (/ocr route)
│   └── components/ocr/      ← OcrWorkspace component
├── start_frontend.bat       ← Windows
├── start_frontend.sh        ← macOS / Linux
└── .env.example             ← Copy to .env.local to override API URL
```

---

## Configuration

Copy `.env.example` to `.env.local` if you need to change the backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Portability Notes

- **No hardcoded paths** — all paths use `Path(__file__).resolve().parent`
- **Models** are downloaded into `backend/models/` on first run (not into `~/.paddlex`)
- **Poppler** (for PDF) is bundled automatically on Windows; installed via brew on macOS
- **To share**: zip the entire `terralens/` folder (models are excluded from git, recipient runs setup)
- **With models in ZIP**: include `backend/models/` (~170 MB) for fully offline deployment

---

## Supported Languages

| Language | Code | Recognition Model | Notes |
|----------|------|-------------------|-------|
| Tamil | `ta` | `ta_PP-OCRv5_mobile_rec` | Primary target; Patta, Chitta, A-Register |
| English | `en` | `en_PP-OCRv5_mobile_rec` | English land records, RoR, Sale Deeds |
| Hindi | `hi` | `hi_PP-OCRv5_mobile_rec` | Khasra, Khatauni, northern India records |
| Auto Detect | `auto` | (Tamil first, then re-runs if needed) | Unicode block heuristic |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Connection refused` on /api/ocr | Backend not running — run `start_backend.bat` or `start_backend.sh` |
| `pdf2image` error on Windows | Poppler not installed — run `python setup.py` from `backend/` |
| `brew: command not found` on Mac | Install Homebrew: https://brew.sh |
| Models downloading every time | Ensure `backend/models/` has both model subdirectories |
| Port 8000 in use | Kill the process or change port in `start_backend.*` |
