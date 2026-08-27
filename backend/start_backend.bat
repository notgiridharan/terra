@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"

echo ============================================================
echo  TerraLens Backend  (Windows)
echo ============================================================

:: Load .env from project root (one level up) if it exists
set "ENV_FILE=%~dp0..\.env"
if exist "%ENV_FILE%" (
    echo Loading environment from .env ...
    for /f "usebackq tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
        set "line=%%A"
        if not "!line:~0,1!"=="#" if not "!line!"=="" (
            set "%%A=%%B"
        )
    )
)

:: Create venv if missing
if not exist ".venv" (
    echo Creating Python virtual environment...
    python -m venv .venv
    if errorlevel 1 (
        echo ERROR: Could not create virtual environment. Is Python installed?
        pause & exit /b 1
    )
)

:: Activate
call .venv\Scripts\activate.bat

:: Install / upgrade dependencies
echo Installing dependencies...
pip install -r requirements.txt 
:: Run first-time setup if ANY model is missing
if not exist "models\PP-OCRv5_server_det" (
    echo Running first-time setup (downloading models and Poppler^)...
    python setup.py
) else if not exist "models\ta_PP-OCRv3_mobile_rec" (
    echo Running first-time setup (missing recognition model^)...
    python setup.py
)

:: Report Gemini status
if defined GEMINI_API_KEY (
    echo [AI] Gemini API key found — AI-powered field extraction ENABLED.
) else (
    echo [AI] No GEMINI_API_KEY found — using regex parser. Add key to .env for best accuracy.
)

:: Seed database with mock/default master records
echo Seeding database...
python seed_db.py

:: Start server
echo.
echo Starting TerraLens API on http://localhost:8000
echo Press Ctrl+C to stop.
echo.
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
