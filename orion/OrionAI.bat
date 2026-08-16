@echo off
title Orion AI // Autonomous Intelligence Core
cd /d "%~dp0"

echo ================================================================
echo               ORION AI - AUTONOMOUS INTELLIGENCE CORE
echo               100%% Local, Private, Multi-Model Engine
echo ================================================================
echo.
echo [1/2] Launching Orion Local Core Server on http://127.0.0.1:8000...
echo.

start "" "http://127.0.0.1:8000"

if exist "..\venv\Scripts\python.exe" (
    ..\venv\Scripts\python.exe server.py
) else (
    python server.py
)

pause
