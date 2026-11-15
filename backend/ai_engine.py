"""
ASTRO-GUARD Multivariate ML Anomaly Detector & Offline Edge Flight Surgeon
2026 NASA Space Apps Challenge: Autonomous Astronaut Health Monitoring System
"""

import asyncio
import datetime
import json
import logging
import os
import re
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import httpx
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest

logger = logging.getLogger("astro_guard.ai")
BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

OLLAMA_BASE_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")

# ============================================================================
# AEROSPACE MEDICAL THRESHOLDS & CLINICAL BASELINES (NASA STD-3001)
# ============================================================================
CLINICAL_THRESHOLDS = {
    "heart_rate": {
        "nominal": (55.0, 95.0),
        "watch_low": (48.0, 55.0),
        "watch_high": (95.0, 115.0),
        "critical_low": 48.0,
        "critical_high": 115.0,
    },
    "systolic_bp": {
        "nominal": (105.0, 130.0),
        "watch_low": (90.0, 105.0),
        "watch_high": (130.0, 145.0),
        "critical_low": 90.0,
        "critical_high": 145.0,
    },
    "diastolic_bp": {
        "nominal": (65.0, 85.0),
        "watch_low": (55.0, 65.0),
        "watch_high": (85.0, 95.0),
        "critical_low": 55.0,
        "critical_high": 95.0,
    },
    "blood_sugar": {
        "nominal": (75.0, 115.0),
        "watch_low": (65.0, 75.0),
        "watch_high": (115.0, 140.0),
        "critical_low": 65.0,
        "critical_high": 140.0,
    },
    "body_temp": {
        "nominal": (36.4, 37.3),
        "watch_low": (35.8, 36.4),
        "watch_high": (37.3, 37.8),
        "critical_low": 35.8,
        "critical_high": 37.8,
    },
    "sleep_hours": {
        "nominal": (6.5, 9.0),
        "watch_low": (5.0, 6.5),
        "critical_low": 5.0,
    },
    "mood_score": {
        "nominal": (6.5, 10.0),
        "watch_low": (4.5, 6.5),
        "critical_low": 4.5,
    },
}

# ============================================================================
# DETERMINISTIC AEROSPACE MEDICAL FALLBACK KNOWLEDGE BASE
# ============================================================================
DETERMINISTIC_MEDICAL_FALLBACK: Dict[str, Dict[str, Dict[str, Any]]] = {
    "cardiovascular": {
        "CRITICAL": {
            "organ_system": "cardiovascular",
            "severity": "CRITICAL",
            "plain_english_summary": "Acute tachycardia and Stage 2 hypertension detected. Astronaut is experiencing elevated cardiac workload and autonomic sympathetic overdrive.",
            "why_measured": "Microgravity removes hydrostatic blood pressure gradients, causing cephalad fluid shift (puffy face syndrome) and reduced stroke volume. Under acute physical or radiation stress, cardiac reserve can become severely compromised.",
            "spaceflight_hazard_link": "Microgravity cephalic fluid redistribution, vascular deconditioning, and acute spaceflight autonomic strain.",
            "actionable_steps": [
                "Immediately cease high-exertion EVA or resistance workout.",
                "Don Lower Body Negative Pressure (LBNP) garment or leg compression cuffs to draw blood back into lower extremities.",
                "Ingest 750 mL isotonic electrolyte hydration solution.",
                "Perform 5-minute paced diaphragmatic resonance breathing (4s inhale, 6s exhale)."
            ],
            "recommended_quest": {
                "quest_id": "quest-cardio-lbnp",
                "title": "Perform 15-min LBNP Countermeasure Protocol",
                "category": "Cardiovascular",
                "xp_reward": 75,
                "duration_seconds": 900
            }
        },
        "WATCH": {
            "organ_system": "cardiovascular",
            "severity": "WATCH",
            "plain_english_summary": "Mild hemodynamic fluctuation observed. Heart rate or arterial pressure is trending outside optimal orbital baseline.",
            "why_measured": "Monitors orthostatic intolerance and early vascular remodeling in microgravity.",
            "spaceflight_hazard_link": "Decreased effective circulating blood volume and baroreceptor desensitization in weightlessness.",
            "actionable_steps": [
                "Rehydrate with 500 mL water with electrolyte tablet.",
                "Check fit of orbital compression garments.",
                "Log scheduled ARED cycle ergometer session."
            ],
            "recommended_quest": {
                "quest_id": "quest-cardio-hydration",
                "title": "Orbital Electrolyte Hydration Rebalance",
                "category": "Cardiovascular",
                "xp_reward": 40,
                "duration_seconds": 300
            }
        },
        "NOMINAL": {
            "organ_system": "cardiovascular",
            "severity": "NOMINAL",
            "plain_english_summary": "Cardiovascular system operating at optimal spaceflight baseline. Heart rate and blood pressure exhibit normal sinus rhythm and healthy vagal tone.",
            "why_measured": "Continuous tracking prevents unheralded arrhythmias and maintains aerobic fitness during long-duration flight.",
            "spaceflight_hazard_link": "Cardiovascular adaptation to zero-G is stable; no orthostatic crisis detected.",
            "actionable_steps": [
                "Maintain scheduled daily 2.5h aerobic and resistance exercise regimen on T2 treadmill / ARED.",
                "Continue standard sodium/potassium dietary intake."
            ],
            "recommended_quest": {
                "quest_id": "quest-cardio-maintain",
                "title": "Log Daily Cardio Aerobic Interval",
                "category": "Cardiovascular",
                "xp_reward": 30,
                "duration_seconds": 600
            }
        }
    },
    "neuro_behavioral": {
        "CRITICAL": {
            "organ_system": "neuro_behavioral",
            "severity": "CRITICAL",
            "plain_english_summary": "Severe circadian disruption and cognitive exhaustion detected. Cumulative sleep deficit (<5 hrs) with declining mood score impairs executive decision-making.",
            "why_measured": "The ISS experiences 16 sunrises and sunsets every 24 hours, disrupting melatonin secretion and natural circadian rhythmicity. Prolonged confinement elevates mission failure risk.",
            "spaceflight_hazard_link": "Disrupted solar cues in orbit, acoustic noise in crew quarters, and prolonged isolation stressors.",
            "actionable_steps": [
                "Activate 480nm blue-depleted dim red sleep lighting in crew quarters immediately.",
                "Administer physician-approved 0.5mg sublingual melatonin 30 minutes before sleep window.",
                "Enforce mandatory 8-hour uninterrupted sleep lock in acoustic-isolated sleeping pod.",
                "Engage in Earth-comm voice check-in with mission psychologist or family liaison."
            ],
            "recommended_quest": {
                "quest_id": "quest-neuro-sleep-lock",
                "title": "Execute Deep-Space Circadian Sleep Lock Protocol",
                "category": "Neuro-Behavioral",
                "xp_reward": 80,
                "duration_seconds": 1800
            }
        },
        "WATCH": {
            "organ_system": "neuro_behavioral",
            "severity": "WATCH",
            "plain_english_summary": "Mild cognitive fatigue and sub-optimal sleep duration logged. Early signs of stress or circadian drift.",
            "why_measured": "Early detection of mental fatigue prevents operational errors during payload docking or robotic arm maneuvers.",
            "spaceflight_hazard_link": "Sleep fragmentation from orbital ambient noise and microgravity sleep posture displacement.",
            "actionable_steps": [
                "Complete a 10-minute mindfulness or VR Earth-immersion relaxation session.",
                "Limit caffeine consumption within 6 hours of scheduled sleep window.",
                "Verify ventilation airflow in crew sleeping cabin."
            ],
            "recommended_quest": {
                "quest_id": "quest-neuro-relaxation",
                "title": "Earth-VR Sensory Immersion & Stress Decompression",
                "category": "Neuro-Behavioral",
                "xp_reward": 45,
                "duration_seconds": 600
            }
        },
        "NOMINAL": {
            "organ_system": "neuro_behavioral",
            "severity": "NOMINAL",
            "plain_english_summary": "Neurological and psychological indicators are optimal. Sleep architecture is restorative and subjective mood indicates strong resilience.",
            "why_measured": "Ensures peak situational awareness and psychological cohesion for deep-space transit.",
            "spaceflight_hazard_link": "Circadian synchronization maintained successfully through dynamic cabin spectrum lighting.",
            "actionable_steps": [
                "Continue 24-hour synchronized crew circadian schedule.",
                "Log daily subjective journal entry."
            ],
            "recommended_quest": {
                "quest_id": "quest-neuro-journal",
                "title": "Record Daily Mission Psychological Log",
                "category": "Neuro-Behavioral",
                "xp_reward": 25,
                "duration_seconds": 300
            }
        }
    },
    "metabolic_endocrine": {
        "CRITICAL": {
            "organ_system": "metabolic_endocrine",
            "severity": "CRITICAL",
            "plain_english_summary": "Severe hypoglycemia (<65 mg/dL) or metabolic exhaustion detected. Reduced glycemic reserve compromises motor function and cerebral glucose supply.",
            "why_measured": "In space, altered gut microbiome absorption, insulin sensitivity shifts, and elevated basal metabolic rates during EVA can cause sudden glycemic drops.",
            "spaceflight_hazard_link": "Microgravity space motion sickness (SMS) reducing appetite, and altered carbohydrate metabolism.",
            "actionable_steps": [
                "Immediately consume 15-20g of rapid-acting carbohydrates (e.g., standard NASA dextrose fruit pouch).",
                "Recheck capillary blood glucose in 15 minutes to confirm rise above 80 mg/dL.",
                "Follow with a complex protein-carbohydrate nutrient bar for sustained glycogen restoration.",
                "Rest in passive restraint belt to minimize peripheral glucose consumption."
            ],
            "recommended_quest": {
                "quest_id": "quest-metabolic-dextrose",
                "title": "Rapid Dextrose & Glycogen Replenishment",
                "category": "Metabolic",
                "xp_reward": 70,
                "duration_seconds": 900
            }
        },
        "WATCH": {
            "organ_system": "metabolic_endocrine",
            "severity": "WATCH",
            "plain_english_summary": "Borderline glycemic or core thermal shift detected. Energy balance requires dietary adjustment.",
            "why_measured": "Spaceflight space fever (core temperature ~1°C higher due to impaired convective heat dissipation in zero-G).",
            "spaceflight_hazard_link": "Impaired sweat evaporation and altered metabolic thermoregulation in microgravity.",
            "actionable_steps": [
                "Hydrate with cold nutrient-fortified electrolyte beverage.",
                "Check caloric intake logs against daily 2,800 kcal target.",
                "Increase cabin ventilation fan speed to enhance convective cooling."
            ],
            "recommended_quest": {
                "quest_id": "quest-metabolic-caloric",
                "title": "Caloric Target Re-balance & Thermal Cool-Down",
                "category": "Metabolic",
                "xp_reward": 40,
                "duration_seconds": 600
            }
        },
        "NOMINAL": {
            "organ_system": "metabolic_endocrine",
            "severity": "NOMINAL",
            "plain_english_summary": "Metabolic, endocrine, and thermoregulatory status is stable. Glycemic indices and core body temperature remain in nominal homeostasis.",
            "why_measured": "Guarantees sustained ATP cellular energy supply for strenuous mission tasks.",
            "spaceflight_hazard_link": "Nutritional intake and metabolic heat dissipation are balanced.",
            "actionable_steps": [
                "Follow standard 3-meal orbital menu plan.",
                "Log water intake via dispenser metering."
            ],
            "recommended_quest": {
                "quest_id": "quest-metabolic-log",
                "title": "Log Daily Nutrient & Water Intake",
                "category": "Metabolic",
                "xp_reward": 25,
                "duration_seconds": 300
            }
        }
    },
    "immune_radiation": {
        "CRITICAL": {
            "organ_system": "immune_radiation",
            "severity": "CRITICAL",
            "plain_english_summary": "SEVERE Solar Particle Event (SPE) or high radiation dose rate (>100 uSv/h) detected. High risk of acute radiation syndrome (ARS), DNA double-strand breaks, and hematopoietic suppression.",
            "why_measured": "Deep space lacks Earth's protective magnetosphere and atmosphere. Coronal Mass Ejections (CMEs) flood the spacecraft with high-energy relativistic solar protons.",
            "spaceflight_hazard_link": "Galactic Cosmic Rays (GCR) and Solar Particle Events (SPE) penetrating spacecraft hull.",
            "actionable_steps": [
                "Sound crew alarm and retreat immediately to the high-density Storm Shelter (water wall shielded module / BEAM).",
                "Orient spacecraft engine or propellant tanks toward the Sun to maximize shielding mass.",
                "Don personal radiation dosimetry badges and monitor cumulative mSv dose rate.",
                "Administer preventative radioprotective antioxidant / free-radical scavenger cocktail."
            ],
            "recommended_quest": {
                "quest_id": "quest-rad-storm-shelter",
                "title": "Execute Deep-Space Solar Storm Shelter Retreat",
                "category": "Radiation",
                "xp_reward": 100,
                "duration_seconds": 1200
            }
        },
        "WATCH": {
            "organ_system": "immune_radiation",
            "severity": "WATCH",
            "plain_english_summary": "Elevated solar radiation flux or secondary neutron emission detected by spacecraft dosimeters. Immune markers warrant active monitoring.",
            "why_measured": "Microgravity suppresses T-cell activation and reactivates latent herpes viruses (EBV, VZV).",
            "spaceflight_hazard_link": "Combined microgravity immune dysregulation and elevated low-dose ionizing space radiation.",
            "actionable_steps": [
                "Limit extravehicular activities (EVA) until solar flux subsides.",
                "Deploy supplemental polyethylene water-shield bricks around crew sleep compartments.",
                "Log cumulative radiation dose from active crew dosimeters."
            ],
            "recommended_quest": {
                "quest_id": "quest-rad-poly-shield",
                "title": "Deploy Polyethylene Sleep Shielding",
                "category": "Radiation",
                "xp_reward": 50,
                "duration_seconds": 900
            }
        },
        "NOMINAL": {
            "organ_system": "immune_radiation",
            "severity": "NOMINAL",
            "plain_english_summary": "Solar radiation levels and cosmic ray flux are at quiet baseline (<25 uSv/h). Immune system biomarkers and core inflammatory markers remain nominal.",
            "why_measured": "Ensures chronic cumulative lifetime dose remains well below NASA Career Astronaut Radiation Exposure limits (600 mSv).",
            "spaceflight_hazard_link": "Current space weather quiet; spacecraft shielding is providing adequate GCR attenuation.",
            "actionable_steps": [
                "Continue standard passive and active dosimeter telemetry recording.",
                "Maintain dietary Vitamin D, Omega-3, and polyphenol antioxidant intake."
            ],
            "recommended_quest": {
                "quest_id": "quest-rad-dosimeter-check",
                "title": "Verify Daily Bio-Dosimeter Alignment",
                "category": "Radiation",
                "xp_reward": 25,
                "duration_seconds": 300
            }
        }
    }
}

# ============================================================================
# MULTIVARIATE ML ANOMALY DETECTOR (IsolationForest + Aerospace Clinical Rules)
# ============================================================================
class MultivariateAnomalyDetector:
    def __init__(self):
        self.model: Optional[IsolationForest] = None
        self.features = ["heart_rate", "systolic_bp", "diastolic_bp", "blood_sugar", "body_temp", "sleep_hours", "mood_score"]
        self.train_on_nominal_baseline()

    def train_on_nominal_baseline(self):
        """Trains IsolationForest on the nominal Low Earth Orbit baseline dataset."""
        nominal_csv = DATA_DIR / "nominal_orbit.csv"
        if nominal_csv.exists():
            try:
                df = pd.read_csv(nominal_csv)
                X = df[self.features].values
                # Add synthetic nominal perturbations to provide robust variance baseline
                np.random.seed(42)
                perturbations = np.random.normal(0, 0.02, size=(len(X) * 5, len(self.features)))
                X_augmented = np.vstack([X] + [X + perturbations[i*len(X):(i+1)*len(X)] for i in range(4)])
                self.model = IsolationForest(contamination=0.04, random_state=42)
                self.model.fit(X_augmented)
                logger.info("Multivariate IsolationForest trained on nominal baseline with %d samples.", len(X_augmented))
            except Exception as e:
                logger.error("Failed to train IsolationForest on nominal CSV: %s", e)
                self.model = None

    def evaluate_indicator_severity(self, key: str, value: float) -> str:
        """Evaluates single indicator against clinical aerospace aerospace thresholds."""
        rule = CLINICAL_THRESHOLDS.get(key)
        if not rule:
            return "NOMINAL"

        # Check Critical
        if "critical_high" in rule and value >= rule["critical_high"]:
            return "CRITICAL"
        if "critical_low" in rule and value <= rule["critical_low"]:
            return "CRITICAL"

        # Check Watch
        if "watch_high" in rule:
            w_low, w_high = rule["watch_high"]
            if w_low <= value <= w_high:
                return "WATCH"
        if "watch_low" in rule:
            w_low, w_high = rule["watch_low"]
            if w_low <= value <= w_high:
                return "WATCH"

        return "NOMINAL"

    def score(self, vitals: Dict[str, float], space_weather: Dict[str, Any]) -> Dict[str, Any]:
        """
        Multivariate anomaly scoring combining scikit-learn IsolationForest
        with aerospace clinical organ system classification.
        """
        vec = [vitals.get(f, 70.0) for f in self.features]

        # 1. Isolation Forest Unsupervised Anomaly Score
        ml_score = 0.1
        if self.model:
            try:
                # decision_function gives negative score for outliers, positive for inliers
                decision = self.model.decision_function([vec])[0]
                # Normalize decision function to [0.0 (nominal) -> 1.0 (highly anomalous)]
                ml_score = float(np.clip(0.5 - decision * 1.5, 0.02, 0.99))
            except Exception as e:
                logger.warning("IsolationForest scoring fallback: %s", e)
                ml_score = 0.15

        # 2. Organ-Specific Aerospace Clinical Evaluation
        # Cardiovascular (Heart Rate, Systolic BP, Diastolic BP)
        hr_sev = self.evaluate_indicator_severity("heart_rate", vitals.get("heart_rate", 70.0))
        sys_sev = self.evaluate_indicator_severity("systolic_bp", vitals.get("systolic_bp", 120.0))
        dia_sev = self.evaluate_indicator_severity("diastolic_bp", vitals.get("diastolic_bp", 80.0))
        if "CRITICAL" in (hr_sev, sys_sev, dia_sev):
            cardio_status = "CRITICAL"
        elif "WATCH" in (hr_sev, sys_sev, dia_sev):
            cardio_status = "WATCH"
        else:
            cardio_status = "NOMINAL"

        # Neuro-Behavioral (Sleep Hours, Mood Score)
        sleep_sev = self.evaluate_indicator_severity("sleep_hours", vitals.get("sleep_hours", 7.5))
        mood_sev = self.evaluate_indicator_severity("mood_score", vitals.get("mood_score", 8.0))
        if "CRITICAL" in (sleep_sev, mood_sev):
            neuro_status = "CRITICAL"
        elif "WATCH" in (sleep_sev, mood_sev):
            neuro_status = "WATCH"
        else:
            neuro_status = "NOMINAL"

        # Metabolic & Endocrine (Blood Sugar, Body Temperature)
        sugar_sev = self.evaluate_indicator_severity("blood_sugar", vitals.get("blood_sugar", 90.0))
        temp_sev = self.evaluate_indicator_severity("body_temp", vitals.get("body_temp", 36.8))
        if "CRITICAL" in (sugar_sev, temp_sev):
            metabolic_status = "CRITICAL"
        elif "WATCH" in (sugar_sev, temp_sev):
            metabolic_status = "WATCH"
        else:
            metabolic_status = "NOMINAL"

        # Immune & Radiation (Space Weather Solar Level & Radiation Dose Rate)
        rad_level = space_weather.get("solar_radiation_level", "NOMINAL")
        dose_rate = space_weather.get("radiation_dose_rate_uSv_h", 20.0)
        if rad_level == "SEVERE" or dose_rate > 90.0:
            immune_status = "CRITICAL"
        elif rad_level == "WATCH" or rad_level == "ELEVATED" or dose_rate > 50.0:
            immune_status = "WATCH"
        else:
            immune_status = "NOMINAL"

        # If any organ is critical, boost the multivariate score
        organ_statuses = {
            "cardiovascular": cardio_status,
            "neuro_behavioral": neuro_status,
            "metabolic_endocrine": metabolic_status,
            "immune_radiation": immune_status,
        }

        has_critical = any(s == "CRITICAL" for s in organ_statuses.values())
        has_watch = any(s == "WATCH" for s in organ_statuses.values())

        if has_critical:
            ml_score = max(ml_score, 0.85)
            is_anomaly = True
        elif has_watch:
            ml_score = max(ml_score, 0.45)
            is_anomaly = True
        else:
            is_anomaly = ml_score > 0.55

        return {
            "anomaly_score": round(ml_score, 3),
            "is_anomaly": is_anomaly,
            "organ_status": organ_statuses,
        }


# ============================================================================
# OFFLINE EDGE FLIGHT SURGEON (Local Ollama LLM + Instant Fallback)
# ============================================================================
class EdgeFlightSurgeon:
    def __init__(self):
        self.cached_explanations: Dict[str, Dict[str, Any]] = {}
        self.active_model: Optional[str] = None
        self.ollama_available: bool = False
        self.last_check_time: float = 0.0

    async def probe_ollama_model(self) -> Optional[str]:
        """Auto-detects installed models on local Ollama, prioritizing qwen2.5-coder:7b."""
        now = datetime.datetime.utcnow().timestamp()
        if now - self.last_check_time < 30.0 and self.active_model:
            return self.active_model

        self.last_check_time = now
        try:
            async with httpx.AsyncClient(timeout=2.0) as client:
                res = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    if not models:
                        self.ollama_available = False
                        return None
                    # Look for qwen2.5-coder:7b or similar
                    for m in models:
                        if "qwen2.5-coder:7b" in m or "qwen2.5" in m:
                            self.active_model = m
                            self.ollama_available = True
                            return self.active_model
                    # Fallback to the first available model
                    self.active_model = models[0]
                    self.ollama_available = True
                    logger.info("Auto-detected local Ollama model: %s", self.active_model)
                    return self.active_model
        except Exception as e:
            self.ollama_available = False
            logger.debug("Local Ollama not reachable (deterministic fallback active): %s", e)
            return None
        return None

    def get_deterministic_fallback(self, organ_system: str, severity: str) -> Dict[str, Any]:
        """Provides instant aerospace clinical guidance without hanging."""
        system_dict = DETERMINISTIC_MEDICAL_FALLBACK.get(organ_system, DETERMINISTIC_MEDICAL_FALLBACK["cardiovascular"])
        return system_dict.get(severity, system_dict["NOMINAL"])

    async def generate_explanation(
        self,
        organ_system: str,
        severity: str,
        vitals: Dict[str, float],
        space_weather: Dict[str, Any],
        scenario: str,
    ) -> Dict[str, Any]:
        """
        Generates aerospace medical guidance. Tries local Ollama with strict JSON
        enforcement; if offline or slow (>4s), returns deterministic aerospace fallback.
        """
        cache_key = f"{organ_system}_{severity}_{scenario}"
        if cache_key in self.cached_explanations:
            cached_entry, timestamp = self.cached_explanations[cache_key]
            if datetime.datetime.utcnow().timestamp() - timestamp < 45.0:
                return cached_entry

        # Probe Ollama
        model = await self.probe_ollama_model()
        if not model:
            fallback = self.get_deterministic_fallback(organ_system, severity)
            self.cached_explanations[cache_key] = (fallback, datetime.datetime.utcnow().timestamp())
            return fallback

        # Construct medical prompt for Ollama
        system_prompt = (
            "You are the NASA Deep-Space Autonomous Flight Surgeon on the ASTRO-GUARD system. "
            "Respond ONLY with a valid JSON object. Do not include markdown codeblocks, thinking text, or preamble. "
            "The JSON must have the following keys: "
            "'organ_system', 'severity', 'plain_english_summary', 'why_measured', 'spaceflight_hazard_link', "
            "'actionable_steps' (array of 3-4 concise step-by-step strings), and 'recommended_quest' "
            "(object with 'quest_id', 'title', 'category', 'xp_reward', 'duration_seconds')."
        )

        user_prompt = (
            f"Analyze Astronaut Telemetry for Organ System: {organ_system.upper()}\n"
            f"Severity: {severity}\n"
            f"Active Mission Scenario: {scenario}\n"
            f"Vitals: {vitals}\n"
            f"Space Weather / Solar Radiation: {space_weather}\n\n"
            f"Generate NASA clinical aerospace diagnosis and plain-English non-expert explanation."
        )

        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                res = await client.post(
                    f"{OLLAMA_BASE_URL}/api/generate",
                    json={
                        "model": model,
                        "system": system_prompt,
                        "prompt": user_prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "temperature": 0.2,
                            "top_p": 0.9,
                            "num_predict": 450,
                        },
                    },
                )
                if res.status_code == 200:
                    data = res.json()
                    response_text = data.get("response", "").strip()
                    # Clean any leading/trailing json markdown markers if present
                    clean_text = re.sub(r"^```json\s*", "", response_text)
                    clean_text = re.sub(r"\s*```$", "", clean_text).strip()
                    parsed = json.loads(clean_text)
                    # Verify required fields
                    req_fields = ["organ_system", "severity", "plain_english_summary", "why_measured", "actionable_steps", "recommended_quest"]
                    if all(k in parsed for k in req_fields):
                        self.cached_explanations[cache_key] = (parsed, datetime.datetime.utcnow().timestamp())
                        return parsed
        except Exception as e:
            logger.info("Ollama reasoning timed out or failed (%s). Reverting to instant deterministic fallback.", e)

        # Fallback path
        fallback = self.get_deterministic_fallback(organ_system, severity)
        self.cached_explanations[cache_key] = (fallback, datetime.datetime.utcnow().timestamp())
        return fallback


# Singleton Instances
anomaly_detector = MultivariateAnomalyDetector()
flight_surgeon = EdgeFlightSurgeon()


# ============================================================================
# PUBLIC INTERFACE WIRED INTO STREAM ENGINE
# ============================================================================
def score_telemetry_packet(packet: Dict[str, Any]) -> Dict[str, Any]:
    """
    Direct synchronous scoring function called by stream_engine.py on every 1Hz WebSocket frame.
    Enriches the frame with IsolationForest anomaly score and organ statuses.
    """
    vitals = packet.get("vitals", {})
    space_weather = packet.get("space_weather", {})
    analysis = anomaly_detector.score(vitals, space_weather)

    packet["anomaly_score"] = analysis["anomaly_score"]
    packet["is_anomaly"] = analysis["is_anomaly"]
    packet["organ_status"] = analysis["organ_status"]

    # Attach primary active explanation for the highest-severity organ
    organ_statuses = analysis["organ_status"]
    primary_organ = "cardiovascular"
    primary_severity = "NOMINAL"

    for organ, sev in organ_statuses.items():
        if sev == "CRITICAL":
            primary_organ = organ
            primary_severity = "CRITICAL"
            break
        elif sev == "WATCH" and primary_severity != "CRITICAL":
            primary_organ = organ
            primary_severity = "WATCH"

    # Use cached or deterministic fallback directly in the 1Hz stream for zero latency
    scenario = packet.get("scenario", "nominal_orbit")
    explanation = flight_surgeon.get_deterministic_fallback(primary_organ, primary_severity)
    packet["active_explanation"] = explanation

    return packet

