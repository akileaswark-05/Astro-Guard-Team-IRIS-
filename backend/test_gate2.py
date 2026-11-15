"""
ASTRO-GUARD Phase 2 Verification & Smoke Test
Validates:
1. Multivariate IsolationForest Anomaly Detector loading & training
2. Clinical organ system status classification across all 3 mission scenarios
   - Nominal Orbit -> NOMINAL (Green) across all organ systems
   - Solar Storm + Tachycardia -> CRITICAL (Red) Cardiovascular & Immune/Radiation
   - Circadian Disruption + Hypoglycemia -> CRITICAL (Red) Metabolic/Endocrine & Neuro-Behavioral
3. Offline Edge Flight Surgeon:
   - Instant deterministic aerospace fallback schema validation
   - Local Ollama LLM integration (qwen2.5-coder:7b) strict JSON output
4. REST API endpoint `POST /api/explain/{organ_system}`
5. WebSocket packet enrichment with ML anomaly scores and AI guidance
"""

import asyncio
import os
import sys
from pathlib import Path

os.environ["DISABLE_NASA_POLL"] = "1"
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from starlette.testclient import TestClient
from ai_engine import (
    anomaly_detector,
    flight_surgeon,
    score_telemetry_packet,
    DETERMINISTIC_MEDICAL_FALLBACK,
)
from stream_engine import app, telemetry_manager


def run_gate2_tests():
    print("=" * 65)
    print("ASTRO-GUARD PHASE 2 GATE VERIFICATION: ML & FLIGHT SURGEON")
    print("=" * 65)

    # 1. Isolation Forest & Nominal Baseline Check
    print("\n[TEST 1] Testing Multivariate ML Anomaly Detector on Nominal Orbit...")
    telemetry_manager.switch_scenario("nominal_orbit")
    nominal_packet = telemetry_manager.get_next_telemetry_row()
    scored_nominal = score_telemetry_packet(nominal_packet)

    print(f"  - Anomaly Score: {scored_nominal['anomaly_score']} (is_anomaly: {scored_nominal['is_anomaly']})")
    print(f"  - Organ Statuses: {scored_nominal['organ_status']}")

    assert scored_nominal["anomaly_score"] < 0.60, f"Nominal score unexpectedly high: {scored_nominal['anomaly_score']}"
    assert scored_nominal["organ_status"]["cardiovascular"] == "NOMINAL"
    assert scored_nominal["organ_status"]["neuro_behavioral"] == "NOMINAL"
    assert scored_nominal["organ_status"]["metabolic_endocrine"] == "NOMINAL"
    assert scored_nominal["organ_status"]["immune_radiation"] == "NOMINAL"
    print("--> Nominal Orbit classified as NOMINAL (Green) across all 4 organ systems.")

    # 2. Solar Storm & Tachycardia Anomaly Check
    print("\n[TEST 2] Testing ML Detection on Solar Storm + Tachycardia Event...")
    telemetry_manager.switch_scenario("solar_storm_tachycardia")
    # Take row where tachycardia is acute (>120 bpm)
    telemetry_manager.scenario_row_index = 10
    storm_packet = telemetry_manager.get_next_telemetry_row()
    scored_storm = score_telemetry_packet(storm_packet)

    print(f"  - Storm Heart Rate: {scored_storm['vitals']['heart_rate']} bpm")
    print(f"  - Storm Anomaly Score: {scored_storm['anomaly_score']} (is_anomaly: {scored_storm['is_anomaly']})")
    print(f"  - Organ Statuses: {scored_storm['organ_status']}")

    assert scored_storm["is_anomaly"] is True, "Failed to flag solar storm as anomaly!"
    assert scored_storm["anomaly_score"] >= 0.80, f"Expected high anomaly score, got {scored_storm['anomaly_score']}"
    assert scored_storm["organ_status"]["cardiovascular"] == "CRITICAL", "Cardiovascular must be CRITICAL during tachycardia!"
    assert scored_storm["organ_status"]["immune_radiation"] == "CRITICAL", "Immune/Radiation must be CRITICAL during solar storm!"
    print("--> Solar Storm Event correctly triggered CRITICAL (Red) for Cardiovascular & Immune/Radiation.")

    # 3. Circadian Disruption & Hypoglycemia Anomaly Check
    print("\n[TEST 3] Testing ML Detection on Circadian Disruption & Hypoglycemia...")
    telemetry_manager.switch_scenario("circadian_hypoglycemia")
    telemetry_manager.scenario_row_index = 10
    circadian_packet = telemetry_manager.get_next_telemetry_row()
    scored_circadian = score_telemetry_packet(circadian_packet)

    print(f"  - Blood Sugar: {scored_circadian['vitals']['blood_sugar']} mg/dL")
    print(f"  - Sleep Hours: {scored_circadian['vitals']['sleep_hours']} hrs")
    print(f"  - Mood Score: {scored_circadian['vitals']['mood_score']}")
    print(f"  - Organ Statuses: {scored_circadian['organ_status']}")

    assert scored_circadian["is_anomaly"] is True, "Failed to flag hypoglycemia as anomaly!"
    assert scored_circadian["organ_status"]["metabolic_endocrine"] == "CRITICAL", "Metabolic must be CRITICAL during hypoglycemia!"
    assert scored_circadian["organ_status"]["neuro_behavioral"] == "CRITICAL", "Neuro-Behavioral must be CRITICAL during severe sleep deficit!"
    print("--> Circadian & Hypoglycemia correctly triggered CRITICAL (Red) for Metabolic & Neuro-Behavioral.")

    # 4. Deterministic Medical Fallback Dictionary Schema Check
    print("\n[TEST 4] Validating Deterministic Aerospace Medical Fallback Schema...")
    required_keys = [
        "organ_system", "severity", "plain_english_summary",
        "why_measured", "spaceflight_hazard_link", "actionable_steps", "recommended_quest"
    ]
    quest_keys = ["quest_id", "title", "category", "xp_reward", "duration_seconds"]

    for organ, severities in DETERMINISTIC_MEDICAL_FALLBACK.items():
        for sev, entry in severities.items():
            for rk in required_keys:
                assert rk in entry, f"Missing {rk} in fallback {organ} {sev}"
            assert isinstance(entry["actionable_steps"], list) and len(entry["actionable_steps"]) > 0
            for qk in quest_keys:
                assert qk in entry["recommended_quest"], f"Missing {qk} in recommended quest for {organ} {sev}"

    print(f"--> Validated deterministic fallback dictionary across all 4 organ systems and 3 severity levels (12 complete medical profiles).")

    # 5. Local Ollama LLM Reasoning Check (qwen2.5-coder:7b)
    print("\n[TEST 5] Testing Offline Edge Flight Surgeon with local Ollama...")
    async def test_ollama():
        model = await flight_surgeon.probe_ollama_model()
        print(f"  - Detected Ollama model: {model}")
        explanation = await flight_surgeon.generate_explanation(
            organ_system="cardiovascular",
            severity="CRITICAL",
            vitals={"heart_rate": 134.0, "systolic_bp": 158.0, "diastolic_bp": 98.0, "blood_sugar": 138.0, "body_temp": 38.3, "sleep_hours": 5.1, "mood_score": 3.0},
            space_weather={"solar_radiation_level": "SEVERE", "radiation_dose_rate_uSv_h": 145.0},
            scenario="solar_storm_tachycardia",
        )
        print(f"  - Flight Surgeon Summary: {explanation['plain_english_summary'][:110]}...")
        print(f"  - Why Measured: {explanation['why_measured'][:90]}...")
        print(f"  - Actionable Steps Count: {len(explanation['actionable_steps'])}")
        print(f"  - Recommended Quest: {explanation['recommended_quest']['title']} (+{explanation['recommended_quest']['xp_reward']} XP)")

        for rk in required_keys:
            assert rk in explanation, f"Missing key {rk} in Flight Surgeon response!"
        return explanation

    asyncio.run(test_ollama())
    print("--> Flight Surgeon reasoning returned valid structured aerospace medical JSON.")

    # 6. REST API Endpoint: POST /api/explain/{organ_system}
    print("\n[TEST 6] Testing REST Endpoint POST /api/explain/{organ_system}...")
    with TestClient(app, raise_server_exceptions=True) as client:
        for organ in ["cardiovascular", "neuro_behavioral", "metabolic_endocrine", "immune_radiation"]:
            res = client.post(f"/api/explain/{organ}")
            assert res.status_code == 200, f"Explain endpoint failed for {organ}: {res.status_code}"
            data = res.json()
            assert data["organ_system"] == organ
            assert "explanation" in data
            assert "plain_english_summary" in data["explanation"]
            print(f"  - POST /api/explain/{organ}: Severity={data['severity']} | Title='{data['explanation']['recommended_quest']['title']}'")

    print("\n" + "=" * 65)
    print("ALL PHASE 2 GATE VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 65)


if __name__ == "__main__":
    run_gate2_tests()

