#!/usr/bin/env bash
set -euo pipefail

# Navigate to the backend directory (wherever this script is)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo " TerraLens Backend  (macOS / Linux)"
echo "============================================================"

# Create venv if missing
if [ ! -d ".venv" ]; then
    echo "[..] Creating Python virtual environment..."
    python3 -m venv .venv
fi

# Activate
source .venv/bin/activate

# Install / upgrade dependencies
echo "[..] Installing dependencies..."
pip install -r requirements.txt --quiet

# Run first-time setup if any model is missing
if [ ! -d "models/PP-OCRv5_server_det" ] || [ ! -d "models/ta_PP-OCRv3_mobile_rec" ]; then
    echo "[..] Running first-time setup (downloading models + Poppler check)..."
    python setup.py
fi

echo ""
echo "[OK] Starting TerraLens API on http://localhost:8000"
echo "     Press Ctrl+C to stop."
echo ""
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
