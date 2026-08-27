@echo off
setlocal
cd /d "%~dp0"

echo ============================================================
echo  TerraLens Frontend  (Windows)
echo ============================================================

if not exist "node_modules" (
    echo Installing Node dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed. Is Node.js installed?
        pause & exit /b 1
    )
)

echo.
echo Starting TerraLens frontend on http://localhost:3000
echo Press Ctrl+C to stop.
echo.
npm run dev
