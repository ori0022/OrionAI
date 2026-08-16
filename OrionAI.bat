@echo off
title Orion AI // Autonomous Intelligence Core
cd /d "%~dp0"

echo ================================================================
echo               ORION AI - AUTONOMOUS INTELLIGENCE CORE
echo               100%% Local, Private, Multi-Model Engine
echo ================================================================
echo.

:: 1. Ensure Local Ollama Service is Running
echo [1/3] Verifying Local Ollama Engine...
tasklist /FI "IMAGENAME eq ollama.exe" 2>NUL | find /I /N "ollama.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo       Ollama Engine is active.
) else (
    echo       Starting Local Ollama Service in background...
    if exist "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" (
        start "" "%LOCALAPPDATA%\Programs\Ollama\ollama.exe" serve
    ) else (
        start "" ollama serve
    )
    timeout /t 2 /nobreak >nul
)

:: 2. Launch Orion Browser Interface
echo [2/3] Opening Orion Tactical HUD...
start "" "http://127.0.0.1:8000"

:: 3. Run Orion Server
echo [3/3] Launching Orion Local Core Server on http://127.0.0.1:8000...
echo.

if exist "venv\Scripts\python.exe" (
    venv\Scripts\python.exe orion\server.py
) else if exist "..\venv\Scripts\python.exe" (
    ..\venv\Scripts\python.exe server.py
) else (
    python orion\server.py
)

pause
