@echo off
title ASTRO-GUARD Mission Control Launcher
cd /d "%~dp0"
echo ==================================================================
echo      ASTRO-GUARD: Autonomous Deep-Space Health Monitoring System
echo         NASA Space Apps Challenge 2026 (Mission Control Engine)
echo ==================================================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_astro_guard.ps1"
pause
