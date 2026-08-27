#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "============================================================"
echo " TerraLens Frontend  (macOS / Linux)"
echo "============================================================"

if [ ! -d "node_modules" ]; then
    echo "[..] Installing Node dependencies..."
    npm install
fi

echo ""
echo "[OK] Starting TerraLens frontend on http://localhost:3000"
echo "     Press Ctrl+C to stop."
echo ""
npm run dev
