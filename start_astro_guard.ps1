# ==============================================================================
# ASTRO-GUARD: 2026 NASA Space Apps Challenge Autonomous Health System
# One-Click Launch Script (Windows PowerShell)
# Starts FastAPI Telemetry Backend (Port 8000) & Next.js Frontend (Port 3000)
# ==============================================================================

Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host "     ASTRO-GUARD: Autonomous Deep-Space Health Monitoring System" -ForegroundColor White
Write-Host "        NASA Space Apps Challenge 2026 (Mission Control Engine)" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Cyan
Write-Host ""

$ScriptDir = if ($PSScriptRoot) { $PSScriptRoot } elseif ($MyInvocation.MyCommand.Definition) { Split-Path -Parent $MyInvocation.MyCommand.Definition } else { "C:\Users\Ak\Downloads\AG-PROJECT" }
Set-Location $ScriptDir

# 1. Check Ollama Status
Write-Host "[1/4] Checking Offline Edge AI Engine (Ollama)..." -ForegroundColor Yellow
try {
    $ollamaCheck = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $modelNames = $ollamaCheck.models | ForEach-Object { $_.name }
    Write-Host "  -> Ollama is ONLINE with models: $($modelNames -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "  -> Notice: Local Ollama is offline or busy. Deterministic aerospace fallback will be used." -ForegroundColor DarkYellow
}

# 2. Start FastAPI Backend (Port 8000)
Write-Host "[2/4] Starting ASTRO-GUARD Telemetry & AI Backend (Port 8000)..." -ForegroundColor Yellow
$BackendPython = Join-Path $ScriptDir "backend\.venv\Scripts\python.exe"
if (-not (Test-Path $BackendPython)) {
    Write-Host "Virtual environment not found! Please ensure backend\.venv is initialized." -ForegroundColor Red
    exit 1
}

$backendProcess = Start-Process -FilePath $BackendPython `
    -ArgumentList "-m", "uvicorn", "stream_engine:app", "--host", "0.0.0.0", "--port", "8000", "--reload" `
    -WorkingDirectory (Join-Path $ScriptDir "backend") `
    -PassThru

Write-Host "  -> FastAPI Backend started (PID: $($backendProcess.Id)) on http://localhost:8000" -ForegroundColor Green

# 3. Start Next.js Frontend (Port 3000)
Write-Host "[3/4] Starting Next.js Mission Control Frontend (Port 3000)..." -ForegroundColor Yellow
$frontendProcess = Start-Process -FilePath "npm.cmd" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory (Join-Path $ScriptDir "frontend") `
    -PassThru

Write-Host "  -> Next.js Frontend started (PID: $($frontendProcess.Id)) on http://localhost:3000" -ForegroundColor Green

# 4. Open Mission Control in Browser
Write-Host "[4/4] Launching ASTRO-GUARD Mission Control Dashboard..." -ForegroundColor Yellow
Start-Sleep -Seconds 3
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "  ASTRO-GUARD IS ONLINE AND STREAMING LIVE TELEMETRY (1Hz)" -ForegroundColor White
Write-Host "  - Mission Control Dashboard:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "  - Telemetry API & Swagger:     http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host "  - WebSocket Vitals Stream:     ws://localhost:8000/ws/vitals" -ForegroundColor Cyan
Write-Host "==================================================================" -ForegroundColor Green
Write-Host "Press [CTRL + C] or close this terminal to stop both servers." -ForegroundColor Gray
Write-Host ""

try {
    # Keep script open and monitor processes
    while (-not $backendProcess.HasExited -and -not $frontendProcess.HasExited) {
        Start-Sleep -Seconds 2
    }
} finally {
    Write-Host "Shutting down ASTRO-GUARD processes..." -ForegroundColor Yellow
    if ($backendProcess -and -not $backendProcess.HasExited) {
        Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    if ($frontendProcess -and -not $frontendProcess.HasExited) {
        Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
    }
    Write-Host "ASTRO-GUARD successfully terminated." -ForegroundColor Gray
}

