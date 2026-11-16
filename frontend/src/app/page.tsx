"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { BlackHole } from "@/blackhole/BlackHole";
import { AnatomyVisualizer } from "@/components/AnatomyVisualizer";
import { FlightSurgeonPanel } from "@/components/FlightSurgeonPanel";
import { VitalsCharts, VitalsHistoryPoint } from "@/components/VitalsCharts";
import { CommandBar } from "@/components/CommandBar";
import { DemoModal } from "@/components/DemoModal";
import { CheckInModal } from "@/components/CheckInModal";
import {
  CrewReadiness,
  FlightSurgeonExplanation,
  OrganSystem,
  Severity,
  SpaceWeather,
  Vitals,
} from "@/types/telemetry";

// ─── constants ────────────────────────────────────────────────────────────────
const WS_URL =
  process.env.NEXT_PUBLIC_WS_URL || "ws://127.0.0.1:8000/ws/telemetry";
const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";
const HISTORY_MAX = 60;

interface ScenarioPreset {
  vitals: Vitals;
  organStatus: Record<OrganSystem, Severity>;
  anomalyScore: number;
  spaceWeather: SpaceWeather;
}

const SCENARIO_PRESETS: Record<string, ScenarioPreset> = {
  nominal_orbit: {
    vitals: {
      heart_rate: 72,
      systolic_bp: 118,
      diastolic_bp: 76,
      blood_sugar: 94,
      body_temp: 36.8,
      sleep_hours: 7.6,
      mood_score: 7.8,
    },
    organStatus: {
      cardiovascular: "NOMINAL",
      neuro_behavioral: "NOMINAL",
      metabolic_endocrine: "NOMINAL",
      immune_radiation: "NOMINAL",
    },
    anomalyScore: 0.08,
    spaceWeather: {
      source: "NASA DONKI API (Nominal Baseline)",
      solar_radiation_level: "NOMINAL",
      kp_index: 2.1,
      cme_flux: "Quiet background flux",
      last_flare_class: "B2.4",
      radiation_dose_rate_uSv_h: 22.0,
      updated_at: new Date().toISOString(),
    },
  },
  solar_storm_tachycardia: {
    vitals: {
      heart_rate: 135,
      systolic_bp: 158,
      diastolic_bp: 98,
      blood_sugar: 140,
      body_temp: 38.3,
      sleep_hours: 5.1,
      mood_score: 3.1,
    },
    organStatus: {
      cardiovascular: "CRITICAL",
      neuro_behavioral: "WATCH",
      metabolic_endocrine: "WATCH",
      immune_radiation: "CRITICAL",
    },
    anomalyScore: 0.88,
    spaceWeather: {
      source: "NASA DONKI API (LIVE ALERT: SPE Proton Event)",
      solar_radiation_level: "SEVERE",
      kp_index: 7.8,
      cme_flux: "High-energy solar proton event >100 MeV",
      last_flare_class: "X3.8",
      radiation_dose_rate_uSv_h: 148.6,
      updated_at: new Date().toISOString(),
      alert: "STORM SHELTER DIRECTIVE ACTIVE",
    },
  },
  circadian_hypoglycemia: {
    vitals: {
      heart_rate: 56,
      systolic_bp: 98,
      diastolic_bp: 62,
      blood_sugar: 54,
      body_temp: 36.2,
      sleep_hours: 3.8,
      mood_score: 3.5,
    },
    organStatus: {
      cardiovascular: "WATCH",
      neuro_behavioral: "WATCH",
      metabolic_endocrine: "CRITICAL",
      immune_radiation: "NOMINAL",
    },
    anomalyScore: 0.74,
    spaceWeather: {
      source: "NASA DONKI API (Nominal)",
      solar_radiation_level: "NOMINAL",
      kp_index: 2.3,
      cme_flux: "Quiet background flux",
      last_flare_class: "C1.1",
      radiation_dose_rate_uSv_h: 24.5,
      updated_at: new Date().toISOString(),
    },
  },
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function relativeLabel(idx: number, total: number): string {
  const secAgo = total - 1 - idx;
  if (secAgo === 0) return "now";
  if (secAgo % 15 === 0) return `-${secAgo}s`;
  return "";
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AstroGuardDashboard() {
  // telemetry state
  const [currentVitals, setCurrentVitals] = useState<Vitals>(
    SCENARIO_PRESETS.nominal_orbit.vitals
  );
  const [history, setHistory] = useState<VitalsHistoryPoint[]>([]);
  const [organStatus, setOrganStatus] = useState<Record<OrganSystem, Severity>>(
    SCENARIO_PRESETS.nominal_orbit.organStatus
  );
  const [anomalyScore, setAnomalyScore] = useState(
    SCENARIO_PRESETS.nominal_orbit.anomalyScore
  );
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | undefined>(
    SCENARIO_PRESETS.nominal_orbit.spaceWeather
  );
  const [explanation, setExplanation] = useState<
    FlightSurgeonExplanation | undefined
  >();
  const [readiness, setReadiness] = useState<CrewReadiness>({
    xp: 365,
    level: 3,
    streak_days: 14,
    recovery_active: false,
    recovery_ticks_remaining: 0,
    recent_completed_quests: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // ui state
  const [selectedOrgan, setSelectedOrgan] =
    useState<OrganSystem>("cardiovascular");
  const [scenario, setScenario] = useState("nominal_orbit");
  const [availableScenarios] = useState([
    "nominal_orbit",
    "solar_storm_tachycardia",
    "circadian_hypoglycemia",
  ]);
  const [calmMode, setCalmMode] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const recoveryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Explanation fetch ──────────────────────────────────────────────────────
  const fetchExplanation = useCallback(
    async (organ: OrganSystem, targetScenario?: string) => {
      setIsLoadingExplanation(true);
      const sc = targetScenario || scenario;
      try {
        const res = await fetch(`${API_BASE}/explain/${organ}?scenario=${sc}`);
        if (res.ok) {
          const data = await res.json();
          setExplanation(data);
        }
      } catch {
        // offline fallback: FlightSurgeonPanel uses clinical dossier automatically
      } finally {
        setIsLoadingExplanation(false);
      }
    },
    [scenario]
  );

  // ── Scenario change: INSTANT reactive state update + backend notify ────────
  const handleScenarioChange = useCallback(
    async (sc: string) => {
      setScenario(sc);
      const preset = SCENARIO_PRESETS[sc];
      if (preset) {
        setCurrentVitals(preset.vitals);
        setOrganStatus(preset.organStatus);
        setAnomalyScore(preset.anomalyScore);
        setSpaceWeather(preset.spaceWeather);
      }

      fetchExplanation(selectedOrgan, sc);

      // Notify backend if available
      try {
        await fetch(`${API_BASE}/scenario/${sc}`, { method: "POST" });
      } catch {
        // offline / sleeping backend
      }
    },
    [fetchExplanation, selectedOrgan]
  );

  // ── WebSocket with automatic fallback ──────────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => {
        setIsConnected(false);
        reconnectRef.current = setTimeout(connectWs, 5000);
      };
      ws.onerror = () => {
        setIsConnected(false);
        ws.close();
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          const v: Vitals | undefined =
            msg.vitals || (msg.type === "telemetry" ? msg.vitals : undefined);

          if (v) {
            setCurrentVitals(v);
            if (msg.organ_status) setOrganStatus(msg.organ_status);
            if (typeof msg.anomaly_score === "number") {
              setAnomalyScore(msg.anomaly_score);
            } else if (typeof msg.anomaly_index === "number") {
              setAnomalyScore(msg.anomaly_index / 100);
            }
            if (msg.space_weather) setSpaceWeather(msg.space_weather);
            if (msg.crew_readiness) setReadiness(msg.crew_readiness);

            setHistory((prev) => {
              const point: VitalsHistoryPoint = {
                ...v,
                timeStr: "",
              };
              const next = [...prev, point].slice(-HISTORY_MAX);
              return next.map((p, i) => ({
                ...p,
                timeStr: relativeLabel(i, next.length),
              }));
            });
          }

          if (msg.type === "explanation") {
            setExplanation(msg.explanation);
            setIsLoadingExplanation(false);
          }
        } catch {
          // ignore parse error
        }
      };
    } catch {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  // ── 1Hz Live Telemetry Waveform Generator ─────────────────────────────────
  // Guarantees continuous live sweeping charts even if cloud backend is sleeping
  useEffect(() => {
    const timer = setInterval(() => {
      const t = Date.now() / 1000;
      const jitter =
        Math.sin(t * 0.8) * 0.8 + (Math.random() - 0.5) * 0.4;

      setCurrentVitals((prev) => {
        const hr = Math.max(45, Math.min(180, prev.heart_rate + jitter));
        const updatedPoint: Vitals = { ...prev, heart_rate: hr };

        setHistory((hist) => {
          const next = [
            ...hist,
            { ...updatedPoint, timeStr: "" } as VitalsHistoryPoint,
          ].slice(-HISTORY_MAX);
          return next.map((p, i) => ({
            ...p,
            timeStr: relativeLabel(i, next.length),
          }));
        });

        return updatedPoint;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSelectOrgan = useCallback(
    (organ: OrganSystem) => {
      setSelectedOrgan(organ);
      fetchExplanation(organ);
    },
    [fetchExplanation]
  );

  // ── Countermeasure complete: Active Closed-Loop Recovery Vector ───────────
  const handleCompleteCountermeasure = useCallback(
    async (questId: string, title: string, category: string, xp: number) => {
      // 1. Optimistic XP and level bump
      setReadiness((prev) => {
        const nextXp = (prev?.xp || 0) + xp;
        return {
          xp: nextXp,
          level: Math.floor(nextXp / 100) + 1,
          streak_days: prev?.streak_days || 1,
          recovery_active: true,
          recovery_ticks_remaining: 30,
          recent_completed_quests: [
            {
              quest_id: questId,
              title,
              category,
              xp_reward: xp,
              completed_at: new Date().toISOString(),
            },
            ...(prev?.recent_completed_quests || []),
          ].slice(0, 5),
        };
      });

      // 2. Active client-side recovery smoothing: pulls tachycardia/hypoglycemia back to nominal
      if (recoveryTimerRef.current) clearInterval(recoveryTimerRef.current);
      let ticks = 30;
      recoveryTimerRef.current = setInterval(() => {
        ticks -= 1;
        setCurrentVitals((prev) => ({
          ...prev,
          heart_rate:
            prev.heart_rate > 80
              ? Math.max(74, prev.heart_rate - 2)
              : Math.min(74, prev.heart_rate + 1),
          systolic_bp:
            prev.systolic_bp > 125
              ? Math.max(120, prev.systolic_bp - 1.5)
              : Math.min(120, prev.systolic_bp + 1),
          blood_sugar:
            prev.blood_sugar < 85
              ? Math.min(94, prev.blood_sugar + 1.5)
              : Math.max(94, prev.blood_sugar - 1.5),
        }));

        setAnomalyScore((prev) => Math.max(0.08, prev - 0.025));

        if (ticks <= 0) {
          if (recoveryTimerRef.current) clearInterval(recoveryTimerRef.current);
          setOrganStatus(SCENARIO_PRESETS.nominal_orbit.organStatus);
          setAnomalyScore(0.08);
          setReadiness((prev) => ({
            ...prev,
            recovery_active: false,
            recovery_ticks_remaining: 0,
          }));
        }
      }, 1000);

      // 3. Notify backend
      try {
        await fetch(`${API_BASE}/complete-quest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quest_id: questId,
            title,
            category,
            xp_reward: xp,
          }),
        });
      } catch {
        // offline fallback handled by client-side recovery
      }
    },
    []
  );

  // ── Calm mode keyboard shortcut (C / D) ───────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") setShowDemoModal(true);
      if (e.key === "c" || e.key === "C") setCalmMode((p) => !p);
      if (e.key === "Escape") {
        setShowDemoModal(false);
        setShowCheckIn(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const organSeverity = organStatus[selectedOrgan] || "NOMINAL";
  const bpm = Math.round(currentVitals.heart_rate);
  const shiftX = 0.22;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        background: "#000000",
      }}
    >
      {/* ── Layer 0: Black hole canvas (fullscreen, behind everything) ── */}
      <BlackHole anomaly={anomalyScore} bpm={bpm} shiftX={shiftX} />

      {/* ── Layer 1: Top command bar ── */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
        }}
      >
        <CommandBar
          scenario={scenario}
          onScenarioChange={handleScenarioChange}
          spaceWeather={spaceWeather}
          isConnected={isConnected}
          onOpenCheckIn={() => setShowCheckIn(true)}
          availableScenarios={availableScenarios}
          calmMode={calmMode}
          onToggleCalmMode={() => setCalmMode((p) => !p)}
          readiness={readiness}
          onOpenDemoModal={() => setShowDemoModal(true)}
        />
      </div>

      {/* ── Layer 2: Left rail (body figure + system list) ── */}
      <div
        style={{
          position: "fixed",
          top: "56px",
          left: 0,
          bottom: "24vh",
          width: "280px",
          zIndex: 15,
          background:
            "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
          display: "flex",
          alignItems: "stretch",
        }}
      >
        <AnatomyVisualizer
          organStatus={organStatus}
          selectedOrgan={selectedOrgan}
          onSelectOrgan={handleSelectOrgan}
          anomalyScore={anomalyScore}
        />
      </div>

      {/* ── Layer 3: Right rail (flight surgeon) ── */}
      <div
        style={{
          position: "fixed",
          top: "56px",
          right: 0,
          bottom: "24vh",
          width: "340px",
          zIndex: 15,
          background:
            "linear-gradient(to left, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
          display: "flex",
          alignItems: "stretch",
          overflowY: "auto",
        }}
      >
        <FlightSurgeonPanel
          explanation={explanation}
          readiness={readiness}
          selectedOrgan={selectedOrgan}
          organSeverity={organSeverity}
          currentVitals={currentVitals}
          radiationDoseRate={spaceWeather?.radiation_dose_rate_uSv_h}
          onCompleteCountermeasure={handleCompleteCountermeasure}
          isLoadingExplanation={isLoadingExplanation}
        />
      </div>

      {/* ── Layer 4: Bottom telemetry strip ── */}
      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "24vh",
          zIndex: 15,
          background:
            "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
        }}
      >
        <VitalsCharts
          history={history}
          currentVitals={currentVitals}
          selectedOrgan={selectedOrgan}
          organStatus={organStatus}
        />
      </div>

      {/* ── Modals ── */}
      <DemoModal
        isOpen={showDemoModal}
        onClose={() => setShowDemoModal(false)}
        onSelectPreset={(sc) => {
          handleScenarioChange(sc);
          setShowDemoModal(false);
        }}
      />
      <CheckInModal
        isOpen={showCheckIn}
        onClose={() => setShowCheckIn(false)}
        onSubmitCheckIn={async (data) => {
          setReadiness((prev) => ({
            ...prev,
            xp: (prev?.xp || 0) + 25,
            streak_days: (prev?.streak_days || 0) + 1,
          }));
          try {
            await fetch(`${API_BASE}/checkin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
          } catch {
            // offline
          }
          setShowCheckIn(false);
        }}
      />
    </div>
  );
}
