#!/usr/bin/env bash
# ==============================================================================
# ASTRO-GUARD: 2026 NASA Space Apps Challenge Autonomous Health System
# One-Click Launch Script (Linux / macOS)
# Starts FastAPI Telemetry Backend (Port 8000) & Next.js Frontend (Port 3000)
# ==============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "\033[1;36m==================================================================\033[0m"
echo -e "\033[1;37m     ASTRO-GUARD: Autonomous Deep-Space Health Monitoring System\033[0m"
echo -e "\033[1;36m        NASA Space Apps Challenge 2026 (Mission Control Engine)\033[0m"
echo -e "\033[1;36m==================================================================\033[0m"
echo ""

# 1. Check Ollama Status
echo -e "\033[1;33m[1/4] Checking Offline Edge AI Engine (Ollama)...\033[0m"
if curl -s http://localhost:11434/api/tags > /dev/null; then
    echo -e "\033[1;32m  -> Ollama is ONLINE\033[0m"
else
    echo -e "\033[0;33m  -> Notice: Local Ollama offline. Deterministic aerospace fallback active.\033[0m"
fi

# 2. Start FastAPI Backend
echo -e "\033[1;33m[2/4] Starting ASTRO-GUARD Telemetry & AI Backend (Port 8000)...\033[0m"
PYTHON_BIN="$SCRIPT_DIR/backend/.venv/bin/python"
if [ ! -f "$PYTHON_BIN" ]; then
    PYTHON_BIN="python3"
fi

cd "$SCRIPT_DIR/backend"
"$PYTHON_BIN" -m uvicorn stream_engine:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo -e "\033[1;32m  -> FastAPI Backend started (PID: $BACKEND_PID) on http://localhost:8000\033[0m"

# 3. Start Next.js Frontend
echo -e "\033[1;33m[3/4] Starting Next.js Mission Control Frontend (Port 3000)...\033[0m"
cd "$SCRIPT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!
echo -e "\033[1;32m  -> Next.js Frontend started (PID: $FRONTEND_PID) on http://localhost:3000\033[0m"

# Trap exit signals to kill background processes cleanly
cleanup() {
    echo -e "\n\033[1;33mShutting down ASTRO-GUARD processes...\033[0m"
    kill "$BACKEND_PID" 2>/dev/null || true
    kill "$FRONTEND_PID" 2>/dev/null || true
    echo -e "\033[0;37mASTRO-GUARD successfully terminated.\033[0m"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# 4. Open in browser
echo -e "\033[1;33m[4/4] Launching ASTRO-GUARD in Browser...\033[0m"
sleep 3
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:3000" &
elif command -v open > /dev/null; then
    open "http://localhost:3000" &
fi

echo ""
echo -e "\033[1;32m==================================================================\033[0m"
echo -e "\033[1;37m  ASTRO-GUARD IS ONLINE AND STREAMING LIVE TELEMETRY (1Hz)\033[0m"
echo -e "\033[1;36m  - Mission Control Dashboard:  http://localhost:3000\033[0m"
echo -e "\033[1;36m  - Telemetry API & Swagger:     http://localhost:8000/docs\033[0m"
echo -e "\033[1;36m  - WebSocket Vitals Stream:     ws://localhost:8000/ws/vitals\033[0m"
echo -e "\033[1;32m==================================================================\033[0m"
echo -e "\033[0;37mPress [CTRL + C] to stop all servers.\033[0m"
echo ""

wait

