# 🚀 ASTRO-GUARD
### Autonomous Astronaut Health Monitoring & Deep-Space Medical Decision Support System
**2026 NASA Space Apps Challenge** — *"Create Health Monitoring Software for Astronauts on Space Missions"*

---

## 🌌 Overview
During deep-space transit to the Moon and Mars (Artemis & Deep Space Gateway missions), astronauts face communication delays of **up to 22 minutes each way** to Earth Ground Control. In critical medical emergencies—such as solar particle events, cephalic fluid shift arrhythmias, and circadian disruption—the crew cannot wait for Houston Mission Control.

**ASTRO-GUARD** is a 100% pure-software, autonomous biomedical monitoring platform that runs entirely offline on crew edge hardware. It processes live high-frequency physiological telemetry, correlates solar radiation storms via NASA's DONKI space weather system, detects multivariate anomalies in real-time, and provides non-expert plain-English clinical guidance powered by local LLMs and aerospace medicine knowledge bases.

---

## 🎯 6 Core Indicators & NASA Spaceflight Hazards
ASTRO-GUARD continuously correlates and tracks the 6 core physiological and behavioral indicators specified by NASA challenge guidelines:

| Indicator | Nominal Astronaut Range | Microgravity & Spaceflight Hazard Impact | Organ System |
| :--- | :--- | :--- | :--- |
| **Heart Rate** | 60 – 95 bpm | Upward thoracic fluid shift, orthostatic deconditioning, stress-induced tachycardia (>115 bpm) | **Cardiovascular** |
| **Blood Pressure (Sys/Dia)** | 110–125 / 70–82 mmHg | Cephalad venous engorgement, baroreceptor reset, arterial remodeling | **Cardiovascular** |
| **Blood Glucose** | 75 – 115 mg/dL | Altered insulin sensitivity, EVA metabolic surges, acute space motion hypoglycemia (<65 mg/dL) | **Metabolic / Endocrine** |
| **Core Body Temp** | 36.5 – 37.3 °C | "Spaceflight Fever" (elevated core temp due to impaired convective cooling in zero-G) | **Metabolic & Immune** |
| **Sleep Hours** | 7.0 – 8.5 hrs | 16 orbital sunrises/day disrupting melatonin synthesis; cumulative sleep deficit (<5 hrs) | **Neuro-Behavioral** |
| **Subjective Mood** | 6.5 – 10.0 (Scale) | Prolonged acoustic noise, sensory deprivation, isolation, cognitive fatigue | **Neuro-Behavioral** |
| **Solar Radiation** | < 25 $\mu\text{Sv/h}$ (Nominal) | Coronal Mass Ejections (CME), Solar Particle Events (SPE) triggering acute radiation damage | **Immune / Radiation** |

---

## 🛠️ System Architecture

```
                                 +-------------------------------------+
                                 | NASA DONKI Real-Time Space Weather  |
                                 | (Solar Flares FLR & Geomagnetic GST)|
                                 +------------------+------------------+
                                                    | (Async Polling & Caching)
+-------------------------------+                   v
| Realistic Telemetry Replay    |       +-----------------------------+
| • nominal_orbit.csv           +------>|                             |
| • solar_storm_tachycardia.csv |       |   ASTRO-GUARD Fast-API      |<====> [ws://localhost:8000/ws/vitals]
| • circadian_hypoglycemia.csv  |       |   Telemetry Engine          |        (1Hz Real-Time JSON Stream)
| • /nasa_official/*.csv (auto) |       |   (/backend/stream_engine)  |
+-------------------------------+       +--------------+--------------+
                                                       |
                        +------------------------------+-------------------------------+
                        |                                                              |
                        v                                                              v
+-----------------------------------------------+             +-----------------------------------------------+
| Multivariate ML Anomaly Detector             |             | Offline Edge Flight Surgeon                   |
| • scikit-learn IsolationForest                |             | • Local Ollama Engine (qwen2.5-coder:7b)      |
| • Multidimensional Outlier Scoring (0.0-1.0)  |             | • Instant Deterministic Aerospace Fallback    |
| • Organ System Classification (Green/Amber/Red)|            | • Structured JSON Diagnosis & Quests          |
+-----------------------------------------------+             +-----------------------------------------------+
                                                                                       |
                                                                                       v
                                                              +-----------------------------------------------+
                                                              | Mission Control Dashboard (Next.js 14)        |
                                                              | • Centerpiece Interactive Glowing Human SVG   |
                                                              | • Dynamic Scrolling Recharts Graphs           |
                                                              | • Plain-English Guidance ("Why & What to do")|
                                                              | • Crew Readiness XP, Streaks & Countermeasures|
                                                              +-----------------------------------------------+
```

---

## 💻 Tech Stack
- **Backend:** Python 3.12, FastAPI, Uvicorn, WebSockets, Pandas, Scikit-Learn (`IsolationForest`), HTTPX, NumPy.
- **Offline AI Flight Surgeon:** Local Ollama (`http://localhost:11434`) running `qwen2.5-coder:7b` with GPU acceleration on NVIDIA RTX 5060 + instant deterministic aerospace fallback dictionary.
- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, Recharts.
- **Space Weather Telemetry:** Live NASA DONKI API (`https://api.nasa.gov/DONKI/`) with offline caching and scenario injection.

---

## ⚡ Quick Start

### Prerequisites
1. **Node.js** (v18+) & **npm**
2. **Python** (v3.10–3.12)
3. *(Optional for deep-space LLM generation)* **Ollama** running at `http://localhost:11434` with model `qwen2.5-coder:7b` (Run `ollama run qwen2.5-coder:7b`). If Ollama is offline, ASTRO-GUARD automatically and instantly engages its deterministic aerospace clinical fallback knowledge base without interruption.

### One-Click Launch

#### On Windows (PowerShell):
```powershell
.\start_astro_guard.ps1
```

#### On Linux / macOS (Bash):
```bash
chmod +x start_astro_guard.sh
./start_astro_guard.sh
```

The script will launch:
- **FastAPI Telemetry Backend:** `http://localhost:8000` (Docs at `http://localhost:8000/docs`)
- **Next.js Mission Control Frontend:** `http://localhost:3000` (Opens automatically in your browser)

---

## 📁 Plugging in Official NASA Telemetry CSVs
ASTRO-GUARD features a dynamic dataset auto-loader. To replay an official NASA Space Apps dataset:
1. Drop any official `.csv` file into:
   ```
   backend/data/nasa_official/
   ```
2. Required columns in the CSV:
   ```csv
   heart_rate,systolic_bp,diastolic_bp,blood_sugar,body_temp,sleep_hours,mood_score
   ```
3. Refresh the dashboard or restart the backend. Your dataset will automatically appear in the **Mission Scenario Switcher** dropdown on the top command bar!

---

## 🏆 3-Minute Live Hackathon Demo Script for Judges

### Minute 1: Baseline Nominal Orbit & Anatomy Visualizer
1. Open the dashboard at `http://localhost:3000`. Show judges the live **1Hz real-time telemetry stream**, ticking MET mission clock, and the **Offline AI Engine badge** confirming local GPU execution.
2. Point out the **Interactive Anatomical Centerpiece SVG**:
   - All 4 organ systems are glowing **Green (NOMINAL)**.
   - Explain how the silhouette visualizes the **upward cephalic fluid shift** that astronauts experience in zero-G.
3. Click on the **Heart / Cardiovascular** system:
   - Notice how the charts highlight Heart Rate and Blood Pressure with shaded NASA reference bands.
   - The right panel shows the **Offline Edge Flight Surgeon** giving plain-English explanations of why cardiac stroke volume decreases in microgravity.

### Minute 2: Simulating Spaceflight Crises (Solar Flare & Circadian Disruption)
1. In the top command bar, switch the Mission Scenario to:
   **`🔴 Solar Flare + Tachycardia Event`**
2. Immediately observe:
   - NASA DONKI Solar Weather indicator turns **SEVERE / RED** with $148.6\ \mu\text{Sv/h}$ dose rate and Coronal Mass Ejection alert.
   - Heart Rate surges past **130 bpm**; blood pressure spikes.
   - The Anatomical Figure instantly glows **CRITICAL RED** on the Heart and Radiation Shield.
   - The Multivariate ML Anomaly index spikes to **85%+**.
   - The Offline Flight Surgeon issues an urgent protocol: retreat to the High-Density Water-Wall Storm Shelter and don Lower-Body Negative Pressure (LBNP) suits.
3. Switch scenario to:
   **`🟡 Circadian Disruption & Hypoglycemia`**
   - The Brain cortex and Metabolic core glow **AMBER/RED**.
   - Blood glucose drops to **58 mg/dL**; sleep deficit flags cognitive exhaustion.

### Minute 3: Crew Self-Reporting & Gamified Countermeasures
1. Click the **Crew Log** button on the top bar:
   - Open the daily self-check-in modal.
   - Move the Mood and Sleep sliders, click **Log Check-In**, and show judges the instant **+25 XP reward** and streak counter increment.
2. Under the active anomaly, show judges the **Gamified Countermeasure Quest**:
   - Click the green **"Execute & Restore Vitals (+75 XP)"** button.
   - Watch the **Active Countermeasure Stabilization** timer activate.
   - Over the next 45 seconds, the physiological recovery smoothing algorithm physically pulls the astronaut's erratic heart rate and blood glucose back into nominal green boundaries!
3. Conclude: *"ASTRO-GUARD provides complete medical autonomy, keeping deep-space crews healthy, resilient, and mission-ready on humanity's journey to Mars."*

---

## 🔬 Testing & Verification

ASTRO-GUARD includes rigorous automated test suites for hackathon validation:

```powershell
# Run Phase 1 Ingestion & Telemetry Test
backend\.venv\Scripts\python.exe backend\test_gate1.py

# Run Phase 2 ML Anomaly & Edge Flight Surgeon Test
backend\.venv\Scripts\python.exe backend\test_gate2.py

# Run Phase 3 Next.js Build Verification
npm run build --prefix frontend
```

---

## 📄 License
Developed for the **2026 NASA Space Apps Challenge**. Open source under the MIT License.

