@echo off
setlocal
cd /d "%~dp0"
title OSPAT Clinical Control Center
color 0B

echo =========================================================================
echo    OSPAT - Open Source Psychedelic-Assisted Therapy
echo    Clinical Control Center for Therapist and Facilitator
echo =========================================================================
echo.
echo Starting local server and opening web browser...
echo.

set PYTHONIOENCODING=utf-8
set PYTHONUTF8=1

where python >nul 2>nul
if %errorlevel% equ 0 (
    python run_app.py
    goto end
)

where py >nul 2>nul
if %errorlevel% equ 0 (
    py run_app.py
    goto end
)

echo.
echo [ERROR] Python not found in PATH!
echo Please install Python 3.10+ and add it to your system PATH.
pause

:end
endlocal
