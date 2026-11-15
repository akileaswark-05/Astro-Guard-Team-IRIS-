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

const DEFAULT_VITALS: Vitals = {
  heart_rate: 72,
  systolic_bp: 118,
  diastolic_bp: 76,
  blood_sugar: 94,
  body_temp: 36.8,
  sleep_hours: 7.6,
  mood_score: 7,
};

const DEFAULT_STATUS: Record<OrganSystem, Severity> = {
  cardiovascular: "NOMINAL",
  neuro_behavioral: "NOMINAL",
  metabolic_endocrine: "NOMINAL",
  immune_radiation: "NOMINAL",
};

// ─── helpers ──────────────────────────────────────────────────────────────────
function relativeLabel(idx: number, total: number): string {
  const secAgo = (total - 1 - idx);
  if (secAgo === 0) return "now";
  if (secAgo % 15 === 0) return `-${secAgo}s`;
  return "";
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function AstroGuardDashboard() {
  // telemetry state
  const [currentVitals, setCurrentVitals] = useState<Vitals>(DEFAULT_VITALS);
  const [history, setHistory] = useState<VitalsHistoryPoint[]>([]);
  const [organStatus, setOrganStatus] = useState<Record<OrganSystem, Severity>>(DEFAULT_STATUS);
  const [anomalyScore, setAnomalyScore] = useState(0.08);
  const [spaceWeather, setSpaceWeather] = useState<SpaceWeather | undefined>();
  const [explanation, setExplanation] = useState<FlightSurgeonExplanation | undefined>();
  const [readiness, setReadiness] = useState<CrewReadiness | undefined>();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoadingExplanation, setIsLoadingExplanation] = useState(false);

  // ui state
  const [selectedOrgan, setSelectedOrgan] = useState<OrganSystem>("cardiovascular");
  const [scenario, setScenario] = useState("nominal_orbit");
  const [availableScenarios] = useState(["nominal_orbit", "solar_storm_tachycardia", "circadian_hypoglycemia"]);
  const [calmMode, setCalmMode] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const historyCountRef = useRef(0);

  // ── WebSocket ──────────────────────────────────────────────────────────────
  const connectWs = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setIsConnected(true);
    ws.onclose = () => {
      setIsConnected(false);
      reconnectRef.current = setTimeout(connectWs, 3000);
    };
    ws.onerror = () => ws.close();

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string);

        if (msg.type === "telemetry") {
          const v: Vitals = msg.vitals;
          setCurrentVitals(v);
          setOrganStatus(msg.organ_status || DEFAULT_STATUS);
          setAnomalyScore(typeof msg.anomaly_index === "number" ? msg.anomaly_index / 100 : 0.08);
          if (msg.space_weather) setSpaceWeather(msg.space_weather);

          historyCountRef.current += 1;
          const count = historyCountRef.current;
          setHistory((prev) => {
            const point: VitalsHistoryPoint = {
              ...v,
              timeStr: relativeLabel(
                Math.min(prev.length, HISTORY_MAX - 1),
                Math.min(prev.length + 1, HISTORY_MAX)
              ),
            };
            const next = [...prev, point].slice(-HISTORY_MAX);
            // re-label all points with correct relative offset
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
        // ignore parse errors
      }
    };
  }, []);

  useEffect(() => {
    connectWs();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, [connectWs]);

  // ── Scenario change ────────────────────────────────────────────────────────
  const handleScenarioChange = useCallback(async (sc: string) => {
    setScenario(sc);
    try {
      await fetch(`${API_BASE}/scenario/${sc}`, { method: "POST" });
    } catch {
      // offline fallback — telemetry stream handles scenario internally
    }
  }, []);

  // ── Explanation fetch ──────────────────────────────────────────────────────
  const fetchExplanation = useCallback(async (organ: OrganSystem) => {
    setIsLoadingExplanation(true);
    try {
      const res = await fetch(
        `${API_BASE}/explain/${organ}?scenario=${scenario}`
      );
      if (res.ok) {
        const data = await res.json();
        setExplanation(data);
      }
    } catch {
      // offline: explanation panel uses clinical dossier fallback
    } finally {
      setIsLoadingExplanation(false);
    }
  }, [scenario]);

  const handleSelectOrgan = useCallback((organ: OrganSystem) => {
    setSelectedOrgan(organ);
    fetchExplanation(organ);
  }, [fetchExplanation]);

  // ── Countermeasure complete ────────────────────────────────────────────────
  const handleCompleteCountermeasure = useCallback(
    async (questId: string, title: string, category: string, xp: number) => {
      try {
        const res = await fetch(`${API_BASE}/complete-quest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quest_id: questId, title, category, xp_reward: xp }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.readiness) setReadiness(data.readiness);
        }
      } catch {
        // offline: optimistic XP update
        setReadiness((prev) => ({
          xp: (prev?.xp || 0) + xp,
          level: Math.floor(((prev?.xp || 0) + xp) / 100) + 1,
          streak_days: prev?.streak_days || 1,
          recovery_active: false,
          recovery_ticks_remaining: 0,
          recent_completed_quests: prev?.recent_completed_quests || [],
        }));
      }
    },
    []
  );

  // ── Calm mode keyboard shortcut (C) ───────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "d" || e.key === "D") setShowDemoModal(true);
      if (e.key === "c" || e.key === "C") setCalmMode((p) => !p);
      if (e.key === "Escape") { setShowDemoModal(false); setShowCheckIn(false); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const organSeverity = organStatus[selectedOrgan] || "NOMINAL";
  const bpm = Math.round(currentVitals.heart_rate);
  // shiftX: positive value shifts black hole RIGHT so horizon sits at ~62% width
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
      <BlackHole
        anomaly={anomalyScore}
        bpm={bpm}
        shiftX={shiftX}
      />

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
          top: "56px",         // below top bar
          left: 0,
          bottom: "24vh",      // above bottom strip
          width: "280px",
          zIndex: 15,
          // scrim: opaque at left edge, transparent to the right
          background: "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
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
          // scrim: opaque at right edge, transparent to the left
          background: "linear-gradient(to left, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
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
          // scrim: opaque at bottom, transparent up
          background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.60) 60%, transparent 100%)",
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
          try {
            await fetch(`${API_BASE}/checkin`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(data),
            });
          } catch { /* offline */ }
          setShowCheckIn(false);
        }}
      />
    </div>
  );
}
