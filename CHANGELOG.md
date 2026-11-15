# ASTRO-GUARD: Presentation-Layer & Relativistic Black Hole Rewrite
**NASA Space Apps Challenge 2026 — "Create Health Monitoring Software for Astronauts on Space Missions"**

---

## FIX PASS: The Black Hole Interface Architecture

### 1. Unobstructed Clear Center Stage
- Eliminated all three-column opaque card panels.
- Fixed fullscreen WebGL2 canvas (`position: fixed, inset: 0, z-index: 0`).
- Center stage clearance: **57% viewport width × 72% viewport height** contains **zero UI elements**, ensuring the event horizon, photon ring, and lensed arcs (bending over and under the horizon) are completely unobstructed.
- Narrow side rails:
  - Left rail: exact 280px width (`w-[280px]`) with transparent soft-edge gradient (`linear-gradient(to right, rgba(3,3,4,0.88), transparent)`).
  - Right rail: exact 340px width (`w-[340px]`) with transparent soft-edge gradient (`linear-gradient(to left, rgba(3,3,4,0.88), transparent)`).
- Low telemetry strip: height constrained to 22vh (max 24vh), completely unclipped with zero page overflow.

### 2. High-Luminance Relativistic Shader & True Optics
- **Palette:** Inner edge near-white (`#FFF4E0`), mid disk Keplerian gold (`#FFB347`), outer disk burnt orange (`#C2410C`) fading cleanly to deep space. Eliminates brown mud.
- **Optics:** Pure black event horizon (`#000000`), razor-sharp photon ring ($r \approx 1.5 r_s$), and visible gravitational lensing arcs sweeping over and under the hole.
- **ACES Tone-Mapping:** Highlights roll off smoothly so brightest approaching regions reach true pure white.
- **Anomaly Heating:** Under 85% anomaly stress, disk heats to turbulent white-red while preserving crisp black hole geometry.

### 3. 100% Offline Type System
- Installed locally via npm:
  - `@fontsource-variable/geist`
  - `@fontsource-variable/geist-mono`
  - `@fontsource/instrument-serif`
- Strict typography rules:
  - `Instrument Serif` (regular 400, never bold): Only for the hero BPM readout (96px) and single Flight Surgeon hero sentence (26px).
  - `Geist` (400 and 500): All UI text, panel titles, buttons, labels. Sentence case only. No all-caps, no tracking on headings.
  - `Geist Mono` (`tabular-nums`): High-precision numeric readouts (BP, temp, glucose, MET clock).
  - Minimum font size: 12px everywhere. Zero bold serif paragraphs.

### 4. Data / Content Correctness Dispatcher
- Fixed nominal vs critical status mismatch.
- When an anomaly or scenario fires (`solar_storm_tachycardia`, `circadian_hypoglycemia`), the dashboard automatically targets the affected organ system.
- Flight Surgeon panel hero sentence and checklist strictly reflect the live status (e.g., *"Your heart rate is 130 bpm and rising. This needs attention now."* with acute vagal maneuvers and rehydration, rather than routine nominal advice).

### 5. Low Unclipped Telemetry Strip
- Continuous cardiac orbit path trace in pale ice blue (`#BCD9FF`), shifting to alert red (`#EF4444`) under tachycardia/hypertension.
- Safe-zone baseline envelope (60–100 BPM) with hairline ticks and hover scrub tooltip.
- Secondary indicators (Blood pressure, glucose, core temperature, daily sleep) formatted with units $\ge 12\text{px}$.

### 6. Minimalist 56px Command Bar
- Streamlined single row with hairline bottom border.
- Removed the NASA 2026 pill; moved Calm mode and Crew log into dedicated System/Crew popovers.

---

## Verification Screenshots
- **1440 × 900 Baseline Clear Stage:** [`c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_1440x900.png`](file:///c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_1440x900.png)
- **1920 × 1080 Telemetry Stream:** [`c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_1920x1080.png`](file:///c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_1920x1080.png)
- **Anomaly Reaction & Clinical Content Match:** [`c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_anomaly.png`](file:///c:/Users/Ak/Downloads/AG-PROJECT/screenshots/astro_guard_fix_anomaly.png)
