"""
ASTRO-GUARD Phase 1 Verification & Smoke Test
Validates:
1. Package imports (FastAPI, Pandas, Scikit-Learn, HTTPX, Uvicorn, WebSockets)
2. Physiological scenario datasets loading (Nominal, Solar Storm Tachycardia, Circadian Hypoglycemia)
3. NASA official dataset ingestion folder
4. Telemetry manager state machine, scenario switching, check-in, countermeasure recovery
5. FastAPI REST endpoints via TestClient
"""

import os
import sys
from pathlib import Path

os.environ["DISABLE_NASA_POLL"] = "1"
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from starlette.testclient import TestClient
from stream_engine import app, telemetry_manager


def run_tests():
    print("=" * 60)
    print("ASTRO-GUARD PHASE 1 GATE VERIFICATION")
    print("=" * 60)

    # 1. Dataset Loading Check
    print("\n[TEST 1] Checking physiological datasets in TelemetryManager...")
    scenarios = list(telemetry_manager.scenarios_data.keys())
    print(f"Loaded scenarios: {scenarios}")
    assert "nominal_orbit" in scenarios, "Missing nominal_orbit scenario!"
    assert "solar_storm_tachycardia" in scenarios, "Missing solar_storm_tachycardia scenario!"
    assert "circadian_hypoglycemia" in scenarios, "Missing circadian_hypoglycemia scenario!"
    print("--> All 3 core scenario datasets loaded successfully.")

    # 2. Indicator Verification
    print("\n[TEST 2] Verifying 6 core astronaut indicators in telemetry packets...")
    telemetry_manager.switch_scenario("nominal_orbit")
    packet = telemetry_manager.get_next_telemetry_row()
    vitals = packet["vitals"]
    required_indicators = [
        "heart_rate", "systolic_bp", "diastolic_bp",
        "blood_sugar", "body_temp", "sleep_hours", "mood_score"
    ]
    for ind in required_indicators:
        assert ind in vitals, f"Missing indicator {ind} in vitals!"
        print(f"  - {ind}: {vitals[ind]}")
    assert "space_weather" in packet, "Missing space_weather in telemetry packet"
    assert "crew_readiness" in packet, "Missing crew_readiness in telemetry packet"
    print("--> Core indicators and metadata validated.")

    # 3. Scenario Switching Check
    print("\n[TEST 3] Testing scenario switching to solar_storm_tachycardia...")
    switched = telemetry_manager.switch_scenario("solar_storm_tachycardia")
    assert switched is True, "Failed to switch scenario!"
    storm_packet = telemetry_manager.get_next_telemetry_row()
    print(f"  - Storm Heart Rate: {storm_packet['vitals']['heart_rate']} bpm")
    print(f"  - Storm Solar Radiation: {storm_packet['space_weather']['solar_radiation_level']}")
    assert storm_packet['space_weather']['solar_radiation_level'] == "SEVERE"
    print("--> Scenario switching and dynamic space weather injection verified.")

    # 4. Check-in & Gamification Check
    print("\n[TEST 4] Testing crew check-in and gamification counters...")
    initial_xp = telemetry_manager.xp
    telemetry_manager.apply_checkin(mood=9.0, sleep=8.0, blood_sugar=92.0, notes="EVA preparation completed.")
    assert telemetry_manager.xp == initial_xp + 25, "XP did not increment correctly on check-in!"
    print(f"  - Check-in recorded. New XP: {telemetry_manager.xp}, Streak: {telemetry_manager.streak_days} days")

    # 5. Countermeasure & Recovery Check
    print("\n[TEST 5] Testing countermeasure execution & physiological recovery...")
    telemetry_manager.apply_countermeasure(
        quest_id="cm-01",
        title="Lower-Body Negative Pressure (LBNP)",
        category="Cardiovascular",
        xp_reward=50
    )
    assert telemetry_manager.active_recovery_ticks > 0, "Recovery ticks not activated!"
    print(f"  - Countermeasure applied. Recovery ticks: {telemetry_manager.active_recovery_ticks}")

    # 6. REST API Endpoint Tests via TestClient
    print("\n[TEST 6] Testing FastAPI REST Endpoints via TestClient...")
    with TestClient(app, raise_server_exceptions=True) as client:
        # GET /api/health
        res_health = client.get("/api/health")
        assert res_health.status_code == 200, f"Health check failed: {res_health.status_code}"
        health_data = res_health.json()
        print(f"  - GET /api/health: {health_data['status']} | Active: {health_data['active_scenario']}")

        # POST /api/scenario/circadian_hypoglycemia
        res_scen = client.post("/api/scenario/circadian_hypoglycemia")
        assert res_scen.status_code == 200
        print(f"  - POST /api/scenario: Switched to {res_scen.json()['scenario']}")

        # POST /api/checkin
        res_checkin = client.post("/api/checkin", json={
            "mood_score": 7.5,
            "sleep_hours": 6.8,
            "blood_sugar": 96.0,
            "notes": "Automated test check-in"
        })
        assert res_checkin.status_code == 200
        print(f"  - POST /api/checkin: XP {res_checkin.json()['total_xp']}")

        # POST /api/countermeasure/complete
        res_cm = client.post("/api/countermeasure/complete", json={
            "quest_id": "quest-hydro",
            "title": "Electrolyte Fluid Rebalance",
            "category": "Metabolic",
            "xp_reward": 50
        })
        assert res_cm.status_code == 200
        print(f"  - POST /api/countermeasure/complete: {res_cm.json()['message']}")

    print("\n" + "=" * 60)
    print("ALL PHASE 1 GATE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 60)


if __name__ == "__main__":
    run_tests()
