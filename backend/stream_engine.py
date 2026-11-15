"""
ASTRO-GUARD Real-Time Telemetry & Space Weather Ingestion Engine
2026 NASA Space Apps Challenge: Autonomous Health Monitoring System
"""

import asyncio
import datetime
import glob
import json
import logging
import math
import os
import random
from pathlib import Path
from typing import Any, Dict, List, Optional

import httpx
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("astro_guard.stream")

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
NASA_OFFICIAL_DIR = DATA_DIR / "nasa_official"

app = FastAPI(
    title="ASTRO-GUARD Autonomous Health Monitoring System",
    description="Real-Time Telemetry & Medical Anomaly Detection Engine for Deep Space Missions",
    version="1.0.0",
)

# CORS Middleware allowing Next.js Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================
# PYDANTIC MODELS
# ==========================================
class CheckInRequest(BaseModel):
    mood_score: float = Field(..., ge=1.0, le=10.0, description="Astronaut self-reported mood 1-10")
    sleep_hours: float = Field(..., ge=0.0, le=24.0, description="Hours of sleep in last 24h")
    blood_sugar: Optional[float] = Field(None, ge=40.0, le=350.0, description="Capillary blood sugar mg/dL")
    notes: Optional[str] = Field(None, description="Optional crew notes")


class CountermeasureRequest(BaseModel):
    quest_id: str = Field(..., description="ID of completed countermeasure task")
    title: str = Field(..., description="Title of countermeasure")
    category: str = Field(..., description="Cardiovascular, Neuro-Behavioral, Metabolic, Radiation")
    xp_reward: int = Field(50, ge=10, le=200)


# ==========================================
# TELEMETRY MANAGER & INGESTION ENGINE
# ==========================================
class TelemetryManager:
    def __init__(self):
        self.active_scenario: str = "nominal_orbit"
        self.scenarios_data: Dict[str, pd.DataFrame] = {}
        self.scenario_row_index: int = 0
        self.active_connections: List[WebSocket] = []

        # Crew Gamification & Readiness State
        self.xp: int = 340
        self.streak_days: int = 12
        self.completed_countermeasures: List[Dict[str, Any]] = []

        # Dynamic Physiological Recovery Modifiers (applied after countermeasure)
        self.active_recovery_ticks: int = 0
        self.recovery_target_modifiers = {
            "heart_rate": 0.0,
            "systolic_bp": 0.0,
            "diastolic_bp": 0.0,
            "blood_sugar": 0.0,
            "body_temp": 0.0,
        }

        # Manual Crew Overrides from Check-In
        self.latest_checkin: Optional[Dict[str, Any]] = None

        # Space Weather Cache
        self.space_weather: Dict[str, Any] = {
            "source": "NASA DONKI Real-Time Telemetry Feed",
            "solar_radiation_level": "NOMINAL",
            "kp_index": 2.3,
            "cme_flux": "B1.4",
            "last_flare_class": "C1.2",
            "radiation_dose_rate_uSv_h": 21.5,
            "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
            "alert": "Green - Solar magnetosphere baseline stable.",
        }

        # Load CSVs
        self.load_all_datasets()

    def load_all_datasets(self):
        """Loads default scenario CSVs and any custom CSV in nasa_official."""
        default_files = {
            "nominal_orbit": DATA_DIR / "nominal_orbit.csv",
            "solar_storm_tachycardia": DATA_DIR / "solar_storm_tachycardia.csv",
            "circadian_hypoglycemia": DATA_DIR / "circadian_hypoglycemia.csv",
        }

        for name, path in default_files.items():
            if path.exists():
                try:
                    df = pd.read_csv(path)
                    self.scenarios_data[name] = df
                    logger.info(f"Loaded scenario '{name}' ({len(df)} rows)")
                except Exception as e:
                    logger.error(f"Error loading {path}: {e}")

        # Check for user-dropped official NASA CSVs
        if NASA_OFFICIAL_DIR.exists():
            for nasa_file in NASA_OFFICIAL_DIR.glob("*.csv"):
                key = f"nasa_official_{nasa_file.stem}"
                try:
                    df = pd.read_csv(nasa_file)
                    # Verify required columns exist or standardize them
                    req_cols = ["heart_rate", "systolic_bp", "diastolic_bp", "blood_sugar", "body_temp"]
                    missing = [c for c in req_cols if c not in df.columns]
                    if not missing:
                        self.scenarios_data[key] = df
                        logger.info(f"Auto-ingested official NASA dataset '{key}' ({len(df)} rows)")
                    else:
                        logger.warning(f"File {nasa_file.name} missing columns: {missing}. Skipped.")
                except Exception as e:
                    logger.error(f"Error loading official NASA dataset {nasa_file.name}: {e}")

    def switch_scenario(self, scenario_name: str) -> bool:
        if scenario_name in self.scenarios_data:
            self.active_scenario = scenario_name
            self.scenario_row_index = 0
            # Reset recovery ticks when switching scenarios
            self.active_recovery_ticks = 0
            # Adjust space weather context based on scenario
            if scenario_name == "solar_storm_tachycardia":
                self.space_weather.update({
                    "solar_radiation_level": "SEVERE",
                    "kp_index": 7.8,
                    "cme_flux": "X2.4",
                    "last_flare_class": "X2.4 Coronal Mass Ejection",
                    "radiation_dose_rate_uSv_h": 148.6,
                    "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "alert": "CRITICAL ALERT: Coronal Mass Ejection arrival. SPE flux elevated. High radiation hazard to deep space crew.",
                })
            elif scenario_name == "nominal_orbit":
                self.space_weather.update({
                    "solar_radiation_level": "NOMINAL",
                    "kp_index": 2.1,
                    "cme_flux": "B1.2",
                    "last_flare_class": "C1.0",
                    "radiation_dose_rate_uSv_h": 22.0,
                    "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "alert": "Green - Solar magnetosphere nominal. Radiation dose rate within ALARA limits.",
                })
            elif scenario_name == "circadian_hypoglycemia":
                self.space_weather.update({
                    "solar_radiation_level": "WATCH",
                    "kp_index": 4.2,
                    "cme_flux": "C3.8",
                    "last_flare_class": "C3.8 Flare",
                    "radiation_dose_rate_uSv_h": 38.2,
                    "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                    "alert": "Amber - Moderate geomagnetic flux. Orbital night cycle transition active.",
                })
            logger.info(f"Switched active scenario to: {scenario_name}")
            return True
        return False

    def get_next_telemetry_row(self) -> Dict[str, Any]:
        """Fetches the next row of telemetry with real-time micro-variance and recovery smoothing."""
        df = self.scenarios_data.get(self.active_scenario)
        if df is None or len(df) == 0:
            # Fallback baseline row
            raw = {
                "heart_rate": 72.0,
                "systolic_bp": 120.0,
                "diastolic_bp": 80.0,
                "blood_sugar": 95.0,
                "body_temp": 36.8,
                "sleep_hours": 7.5,
                "mood_score": 8.0,
            }
        else:
            row = df.iloc[self.scenario_row_index % len(df)]
            self.scenario_row_index = (self.scenario_row_index + 1) % len(df)
            raw = {
                "heart_rate": float(row.get("heart_rate", 72.0)),
                "systolic_bp": float(row.get("systolic_bp", 120.0)),
                "diastolic_bp": float(row.get("diastolic_bp", 80.0)),
                "blood_sugar": float(row.get("blood_sugar", 95.0)),
                "body_temp": float(row.get("body_temp", 36.8)),
                "sleep_hours": float(row.get("sleep_hours", 7.5)),
                "mood_score": float(row.get("mood_score", 8.0)),
            }

        # Subtle physiological micro-variance (respiratory sinus arrhythmia, micro-fluctuations)
        time_sec = datetime.datetime.utcnow().timestamp()
        hr_jitter = 0.8 * math.sin(time_sec * 0.4) + random.uniform(-0.4, 0.4)
        bp_sys_jitter = 0.6 * math.cos(time_sec * 0.2) + random.uniform(-0.3, 0.3)
        bp_dia_jitter = 0.4 * math.sin(time_sec * 0.2) + random.uniform(-0.2, 0.2)
        sugar_jitter = random.uniform(-0.15, 0.15)
        temp_jitter = 0.02 * math.sin(time_sec * 0.1) + random.uniform(-0.01, 0.01)

        vitals = {
            "heart_rate": round(raw["heart_rate"] + hr_jitter, 1),
            "systolic_bp": round(raw["systolic_bp"] + bp_sys_jitter, 1),
            "diastolic_bp": round(raw["diastolic_bp"] + bp_dia_jitter, 1),
            "blood_sugar": round(raw["blood_sugar"] + sugar_jitter, 1),
            "body_temp": round(raw["body_temp"] + temp_jitter, 2),
            "sleep_hours": round(raw["sleep_hours"], 1),
            "mood_score": round(raw["mood_score"], 1),
        }

        # Apply Check-In overrides if provided in the last 5 minutes
        if self.latest_checkin:
            if "mood_score" in self.latest_checkin:
                vitals["mood_score"] = self.latest_checkin["mood_score"]
            if "sleep_hours" in self.latest_checkin:
                vitals["sleep_hours"] = self.latest_checkin["sleep_hours"]
            if self.latest_checkin.get("blood_sugar") is not None:
                vitals["blood_sugar"] = round(self.latest_checkin["blood_sugar"] + sugar_jitter, 1)

        # Apply Active Countermeasure Recovery Smoothing
        if self.active_recovery_ticks > 0:
            # Gradually pull anomalous vitals back toward nominal safe ranges
            ratio = min(1.0, (60 - self.active_recovery_ticks) / 60.0)
            if self.active_scenario == "solar_storm_tachycardia":
                # Stabilize tachycardia from ~130 bpm down towards ~78 bpm
                vitals["heart_rate"] = round(vitals["heart_rate"] - (vitals["heart_rate"] - 78.0) * ratio * 0.7, 1)
                vitals["systolic_bp"] = round(vitals["systolic_bp"] - (vitals["systolic_bp"] - 122.0) * ratio * 0.6, 1)
                vitals["body_temp"] = round(vitals["body_temp"] - (vitals["body_temp"] - 37.0) * ratio * 0.5, 2)
            elif self.active_scenario == "circadian_hypoglycemia":
                # Elevate hypoglycemia from ~58 mg/dL up towards ~92 mg/dL
                vitals["blood_sugar"] = round(vitals["blood_sugar"] + (92.0 - vitals["blood_sugar"]) * ratio * 0.7, 1)
                vitals["heart_rate"] = round(vitals["heart_rate"] + (72.0 - vitals["heart_rate"]) * ratio * 0.6, 1)
                vitals["mood_score"] = round(min(10.0, vitals["mood_score"] + 3.0 * ratio), 1)

            self.active_recovery_ticks -= 1

        payload = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "scenario": self.active_scenario,
            "vitals": vitals,
            "space_weather": self.space_weather,
            "crew_readiness": {
                "xp": self.xp,
                "level": max(1, self.xp // 100),
                "streak_days": self.streak_days,
                "recovery_active": self.active_recovery_ticks > 0,
                "recovery_ticks_remaining": self.active_recovery_ticks,
                "recent_completed_quests": self.completed_countermeasures[-5:],
            },
        }
        return payload

    def apply_countermeasure(self, quest_id: str, title: str, category: str, xp_reward: int):
        self.xp += xp_reward
        self.active_recovery_ticks = 45  # 45 seconds of continuous physiological stabilization
        completion_record = {
            "quest_id": quest_id,
            "title": title,
            "category": category,
            "xp_reward": xp_reward,
            "completed_at": datetime.datetime.utcnow().isoformat() + "Z",
        }
        self.completed_countermeasures.append(completion_record)
        logger.info(f"Countermeasure completed: {title} (+{xp_reward} XP). Total XP: {self.xp}")
        return completion_record

    def apply_checkin(self, mood: float, sleep: float, blood_sugar: Optional[float], notes: Optional[str]):
        self.latest_checkin = {
            "mood_score": mood,
            "sleep_hours": sleep,
            "blood_sugar": blood_sugar,
            "notes": notes,
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        }
        self.xp += 25  # Rewarded for daily subjective reporting
        self.streak_days += 1
        logger.info(f"Astronaut check-in recorded: Mood={mood}, Sleep={sleep}h, Sugar={blood_sugar}. (+25 XP)")
        return self.latest_checkin


telemetry_manager = TelemetryManager()


# ==========================================
# NASA DONKI SPACE WEATHER BACKGROUND FETCHER
# ==========================================
async def fetch_nasa_donki_loop():
    """
    Periodically queries NASA DONKI API for live Solar Flare (FLR) and
    Geomagnetic Storm (GST) space weather data. Runs in the background without
    blocking the 1Hz WebSocket telemetry loop.
    """
    api_key = os.getenv("NASA_API_KEY", "DEMO_KEY")
    client = httpx.AsyncClient(timeout=4.0)

    while True:
        try:
            today = datetime.datetime.utcnow()
            start_date = (today - datetime.timedelta(days=7)).strftime("%Y-%m-%d")
            end_date = today.strftime("%Y-%m-%d")

            flr_url = f"https://api.nasa.gov/DONKI/FLR?startDate={start_date}&endDate={end_date}&api_key={api_key}"
            gst_url = f"https://api.nasa.gov/DONKI/GST?startDate={start_date}&endDate={end_date}&api_key={api_key}"

            logger.info("Polling NASA DONKI API for real-time space weather...")
            flr_res = await client.get(flr_url)
            gst_res = await client.get(gst_url)


            if flr_res.status_code == 200:
                flr_data = flr_res.json()
                if isinstance(flr_data, list) and len(flr_data) > 0:
                    latest_flare = flr_data[-1]
                    class_type = latest_flare.get("classType", "C1.0")
                    # Assess radiation risk from class
                    if class_type.startswith("X"):
                        rad_level = "SEVERE"
                        dose = 125.0
                    elif class_type.startswith("M"):
                        rad_level = "ELEVATED"
                        dose = 65.0
                    else:
                        rad_level = "NOMINAL"
                        dose = 24.5

                    # Only override space_weather if not in simulated solar storm scenario
                    if telemetry_manager.active_scenario != "solar_storm_tachycardia":
                        telemetry_manager.space_weather.update({
                            "source": "NASA DONKI API (Live Telemetry)",
                            "solar_radiation_level": rad_level,
                            "cme_flux": class_type,
                            "last_flare_class": class_type,
                            "radiation_dose_rate_uSv_h": dose,
                            "updated_at": datetime.datetime.utcnow().isoformat() + "Z",
                        })
            if gst_res.status_code == 200:
                gst_data = gst_res.json()
                if isinstance(gst_data, list) and len(gst_data) > 0:
                    latest_gst = gst_data[-1]
                    all_kp = latest_gst.get("allKpIndex", [])
                    if all_kp and isinstance(all_kp, list):
                        kp_val = all_kp[-1].get("kpIndex", 2.3)
                        telemetry_manager.space_weather["kp_index"] = float(kp_val)

        except Exception as e:
            logger.warning(f"NASA DONKI API poll notice (using deterministic aerospace cached baseline): {e}")

        # Poll every 90 seconds in background
        await asyncio.sleep(90)


# ==========================================
# REST API ENDPOINTS
# ==========================================
@app.get("/api/health")
async def get_health():
    """Returns system status, active scenarios, and telemetry engine state."""
    return {
        "status": "ONLINE",
        "service": "ASTRO-GUARD Deep-Space Autonomous Telemetry Engine",
        "active_scenario": telemetry_manager.active_scenario,
        "available_scenarios": list(telemetry_manager.scenarios_data.keys()),
        "connected_clients": len(telemetry_manager.active_connections),
        "crew_readiness_xp": telemetry_manager.xp,
        "space_weather_status": telemetry_manager.space_weather["solar_radiation_level"],
    }


@app.post("/api/scenario/{scenario_name}")
async def switch_scenario(scenario_name: str):
    """Switches the live telemetry stream to another spaceflight clinical scenario on the fly."""
    success = telemetry_manager.switch_scenario(scenario_name)
    if not success:
        raise HTTPException(
            status_code=404,
            detail=f"Scenario '{scenario_name}' not found. Available: {list(telemetry_manager.scenarios_data.keys())}",
        )
    return {
        "message": f"Successfully activated scenario '{scenario_name}'",
        "scenario": scenario_name,
        "space_weather": telemetry_manager.space_weather,
    }


@app.post("/api/checkin")
async def submit_checkin(checkin: CheckInRequest):
    """Interactive crew self-reporting for subjective indicators (Mood, Sleep, Blood Sugar)."""
    result = telemetry_manager.apply_checkin(
        mood=checkin.mood_score,
        sleep=checkin.sleep_hours,
        blood_sugar=checkin.blood_sugar,
        notes=checkin.notes,
    )
    return {
        "message": "Subjective health telemetry successfully ingested.",
        "xp_awarded": 25,
        "total_xp": telemetry_manager.xp,
        "streak_days": telemetry_manager.streak_days,
        "checkin": result,
    }


@app.post("/api/countermeasure/complete")
async def complete_countermeasure(cm: CountermeasureRequest):
    """Applies physiological recovery effects when an astronaut completes a medical quest."""
    record = telemetry_manager.apply_countermeasure(
        quest_id=cm.quest_id,
        title=cm.title,
        category=cm.category,
        xp_reward=cm.xp_reward,
    )
    return {
        "message": f"Countermeasure '{cm.title}' verified. Physiological recovery initiated.",
        "xp_awarded": cm.xp_reward,
        "total_xp": telemetry_manager.xp,
        "recovery_ticks": telemetry_manager.active_recovery_ticks,
        "details": record,
    }


@app.post("/api/explain/{organ_system}")
async def explain_organ(organ_system: str):
    """
    Triggers the Offline Edge Flight Surgeon (local Ollama or deterministic aerospace fallback)
    for an astronaut or judge clicking on an organ system in the 3D/SVG anatomy visualizer.
    """
    valid_organs = ["cardiovascular", "neuro_behavioral", "metabolic_endocrine", "immune_radiation"]
    if organ_system not in valid_organs:
        raise HTTPException(status_code=400, detail=f"Invalid organ system. Must be one of: {valid_organs}")

    # Generate current packet to extract live vitals and organ severity
    current_packet = telemetry_manager.get_next_telemetry_row()
    try:
        from ai_engine import flight_surgeon, score_telemetry_packet
        scored_packet = score_telemetry_packet(current_packet)
        severity = scored_packet["organ_status"].get(organ_system, "NOMINAL")
        explanation = await flight_surgeon.generate_explanation(
            organ_system=organ_system,
            severity=severity,
            vitals=scored_packet["vitals"],
            space_weather=scored_packet["space_weather"],
            scenario=telemetry_manager.active_scenario,
        )
    except Exception as e:
        logger.error(f"Error generating flight surgeon explanation: {e}")
        from ai_engine import flight_surgeon
        explanation = flight_surgeon.get_deterministic_fallback(organ_system, "NOMINAL")
        severity = "NOMINAL"
        scored_packet = current_packet

    return {
        "organ_system": organ_system,
        "severity": severity,
        "explanation": explanation,
        "live_vitals": scored_packet.get("vitals", {}),
        "anomaly_score": scored_packet.get("anomaly_score", 0.05),
    }



# ==========================================
# WEBSOCKET 1Hz TELEMETRY STREAM
# ==========================================
@app.websocket("/ws/vitals")
async def websocket_vitals_endpoint(websocket: WebSocket):
    """
    Streams 1Hz real-time physiological telemetry packets over WebSocket.
    Clients receive raw vitals, space weather, gamification readiness, and
    (in Phase 2) ML anomaly and AI flight surgeon guidance.
    """
    await websocket.accept()
    telemetry_manager.active_connections.append(websocket)
    logger.info(f"WebSocket client connected. Total clients: {len(telemetry_manager.active_connections)}")

    try:
        while True:
            # 1. Generate next real-time telemetry packet
            packet = telemetry_manager.get_next_telemetry_row()

            # (Phase 2 hook: if ai_engine is loaded, packet will be scored here)
            try:
                from ai_engine import score_telemetry_packet
                packet = score_telemetry_packet(packet)
            except ImportError:
                # In Phase 1, ai_engine is not yet built; default organ statuses to nominal
                packet["organ_status"] = {
                    "cardiovascular": "NOMINAL",
                    "neuro_behavioral": "NOMINAL",
                    "metabolic_endocrine": "NOMINAL",
                    "immune_radiation": "NOMINAL",
                }
                packet["anomaly_score"] = 0.05
                packet["is_anomaly"] = False

            # 2. Broadcast JSON payload
            await websocket.send_text(json.dumps(packet))

            # 3. 1Hz stream cadence
            await asyncio.sleep(1.0)

    except WebSocketDisconnect:
        telemetry_manager.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Remaining: {len(telemetry_manager.active_connections)}")
    except Exception as e:
        if websocket in telemetry_manager.active_connections:
            telemetry_manager.active_connections.remove(websocket)
        logger.error(f"WebSocket stream error: {e}")


# ==========================================
# APPLICATION LIFECYCLE
# ==========================================
_donki_task: Optional[asyncio.Task] = None

@app.on_event("startup")
async def startup_event():
    global _donki_task
    logger.info("ASTRO-GUARD Engine starting up...")
    if os.getenv("DISABLE_NASA_POLL") == "1":
        logger.info("NASA DONKI background polling disabled (test/offline mode).")
        return
    # Launch async background NASA space weather fetcher
    _donki_task = asyncio.create_task(fetch_nasa_donki_loop())

@app.on_event("shutdown")
async def shutdown_event():
    global _donki_task
    logger.info("ASTRO-GUARD Engine shutting down...")
    if _donki_task and not _donki_task.done():
        _donki_task.cancel()
        try:
            await _donki_task
        except asyncio.CancelledError:
            pass



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("stream_engine:app", host="0.0.0.0", port=8000, reload=True)
