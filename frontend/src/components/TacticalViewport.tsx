"use client";

import React, { useState, useEffect, useRef } from "react";
import { OrganSystem, Severity, Vitals, SpaceWeather } from "@/types/telemetry";

interface TacticalViewportProps {
  selectedOrgan: OrganSystem;
  organStatus: Record<OrganSystem, Severity>;
  anomalyScore: number;
  bpm: number;
  currentVitals?: Vitals;
  spaceWeather?: SpaceWeather;
  onSelectOrgan?: (organ: OrganSystem) => void;
  className?: string;
}

export const TacticalViewport: React.FC<TacticalViewportProps> = ({
  selectedOrgan,
  organStatus,
  anomalyScore,
  bpm,
  currentVitals,
  spaceWeather,
  onSelectOrgan,
  className = "",
}) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [azimuth, setAzimuth] = useState(42.8);
  const [elevation, setElevation] = useState(-14.2);
  const containerRef = useRef<HTMLDivElement>(null);

  // Gentle idle coordinate drift + mouse parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
      setMousePos({ x, y });
      setAzimuth(parseFloat((42.8 + x * 4.5).toFixed(1)));
      setElevation(parseFloat((-14.2 - y * 3.5).toFixed(1)));
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const isAlert = anomalyScore > 0.4;
  const isCritical = anomalyScore > 0.75;

  const primaryColor = isCritical
    ? "#EF4444"
    : isAlert
    ? "#F59E0B"
    : "#00F0FF";

  const getStatusColor = (sev: Severity) => {
    switch (sev) {
      case "CRITICAL":
        return "#EF4444";
      case "WATCH":
        return "#F59E0B";
      case "NOMINAL":
      default:
        return "#10B981";
    }
  };

  const hr = currentVitals?.heart_rate ? Math.round(currentVitals.heart_rate) : bpm;
  const sbp = currentVitals?.systolic_bp ? Math.round(currentVitals.systolic_bp) : 118;
  const dbp = currentVitals?.diastolic_bp ? Math.round(currentVitals.diastolic_bp) : 76;
  const bg = currentVitals?.blood_sugar ? Math.round(currentVitals.blood_sugar) : 94;
  const temp = currentVitals?.body_temp ? currentVitals.body_temp.toFixed(1) : "36.8";
  const sleep = currentVitals?.sleep_hours ? currentVitals.sleep_hours.toFixed(1) : "7.6";
  const dose = spaceWeather?.radiation_dose_rate_uSv_h
    ? spaceWeather.radiation_dose_rate_uSv_h.toFixed(1)
    : "22.0";

  return (
    <div
      ref={containerRef}
      className={`fixed top-[56px] left-0 lg:left-[280px] right-0 lg:right-[340px] bottom-[24vh] tactical-grid-bg select-none overflow-hidden z-0 ${className}`}
      style={{ backgroundColor: "#090A0D" }}
    >
      {/* ── Background Tactical Coordinate HUD & Crosshairs ── */}
      <div className="absolute inset-0 pointer-events-none opacity-40">
        {/* Subtle center crosshairs */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/20 rounded-full" />
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border border-white/10 rounded-full" />
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/[0.04]" />
        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/[0.04]" />

        {/* Tactical Corner Tick Markers */}
        <div className="absolute top-3 left-4 font-telemetry-mono text-[9px] text-neutral-400 tracking-wider">
          + LAT: 04°12&apos;38&quot;N // LONG: 128°44&apos;09&quot;E
        </div>
        <div className="absolute top-3 right-4 font-telemetry-mono text-[9px] text-neutral-400 tracking-wider text-right">
          ORBITAL ELEVATION: 412.6 KM // INC: 51.6°
        </div>
        <div className="absolute bottom-3 left-4 font-telemetry-mono text-[9px] text-neutral-400 tracking-wider">
          RANGE_SCALE: 1:1 BIO-TELEMETRY // VECTOR: LOCAL_HORIZON
        </div>
        <div className="absolute bottom-3 right-4 font-telemetry-mono text-[9px] text-neutral-400 tracking-wider text-right">
          TGT_AZ: {azimuth}° // TGT_EL: {elevation}°
        </div>
      </div>

      {/* ── Precision Orbital Concentric Telemetry Rings ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <svg
          viewBox="0 0 1000 1000"
          className="w-[75vh] h-[75vh] max-w-[620px] max-h-[620px] opacity-45"
          style={{
            transform: `rotate(${mousePos.x * 2.5}deg) scale(${1 + mousePos.y * 0.015})`,
            transition: "transform 0.15s ease-out",
          }}
        >
          {/* Outer ring with azimuth degree ticks */}
          <circle
            cx="500"
            cy="500"
            r="440"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <circle
            cx="500"
            cy="500"
            r="440"
            fill="none"
            stroke={primaryColor}
            strokeWidth="1.5"
            strokeDasharray="4 28"
            opacity="0.6"
          />

          {/* Intermediate telemetry rings */}
          <circle
            cx="500"
            cy="500"
            r="350"
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
            strokeDasharray="2 6"
          />
          <circle
            cx="500"
            cy="500"
            r="240"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1"
          />
          <circle
            cx="500"
            cy="500"
            r="120"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="1"
          />

          {/* Azimuth tick marks */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 500 500)`}>
              <line
                x1="500"
                y1="55"
                x2="500"
                y2="72"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.5"
              />
              <text
                x="500"
                y="50"
                fill="rgba(255,255,255,0.3)"
                fontSize="10"
                fontFamily="var(--font-mono)"
                textAnchor="middle"
              >
                {String(deg).padStart(3, "0")}°
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* ── Center Holographic Biometric Digital Twin & Active Nodes ── */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[340px] h-[520px] max-h-[62vh] flex items-center justify-center">
          {/* Wireframe Astronaut Digital Twin SVG */}
          <svg
            viewBox="0 0 280 460"
            className="w-full h-full"
            fill="none"
            style={{
              filter: isCritical
                ? "drop-shadow(0 0 16px rgba(239,68,68,0.2))"
                : isAlert
                ? "drop-shadow(0 0 16px rgba(245,158,11,0.2))"
                : "drop-shadow(0 0 16px rgba(0,240,255,0.15))",
            }}
          >
            {/* Holographic grid scan lines behind figure */}
            <g stroke="rgba(255,255,255,0.03)" strokeWidth="0.75">
              {[80, 140, 200, 260, 320, 380].map((y) => (
                <line key={y} x1="40" y1={y} x2="240" y2={y} strokeDasharray="3 3" />
              ))}
            </g>

            {/* Astronaut Anatomical Vector Silhouette */}
            {/* Cranium / Helmet contour */}
            <circle
              cx="140"
              cy="58"
              r="34"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="1.2"
              strokeDasharray="4 2"
            />
            <path
              d="M 120,44 Q 140,36 160,44"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />
            <path
              d="M 116,66 Q 140,78 164,66"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
            />

            {/* Neck / Cervical Spine */}
            <line x1="140" y1="92" x2="140" y2="114" stroke="rgba(255,255,255,0.3)" strokeWidth="1.2" />

            {/* Clavicles & Shoulders */}
            <path
              d="M 88,124 L 140,114 L 192,124"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="1.2"
            />

            {/* Thoracic ribcage cage arcs */}
            <path d="M 112,136 Q 140,146 168,136" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 110,154 Q 140,166 170,154" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 112,172 Q 140,184 168,172" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 118,190 Q 140,200 162,190" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />

            {/* Central vertebral axis */}
            <line
              x1="140"
              y1="114"
              x2="140"
              y2="246"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1"
              strokeDasharray="2 2"
            />

            {/* Arms */}
            <path
              d="M 88,124 L 62,190 L 46,268"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            <path
              d="M 192,124 L 218,190 L 234,268"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />

            {/* Pelvic girdle */}
            <path
              d="M 108,230 L 140,246 L 172,230 L 164,258 L 116,258 Z"
              stroke="rgba(255,255,255,0.2)"
              strokeWidth="1"
            />

            {/* Lower Extremities */}
            <path
              d="M 120,258 L 106,346 L 98,436"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            <path
              d="M 160,258 L 174,346 L 182,436"
              stroke="rgba(255,255,255,0.22)"
              strokeWidth="1.2"
            />
            {/* Boots / feet vectors */}
            <line x1="98" y1="436" x2="80" y2="442" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />
            <line x1="182" y1="436" x2="200" y2="442" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" />

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ── 4 INTERACTIVE BIOMETRIC NODES & TACTICAL TARGETING ── */}
            {/* ══════════════════════════════════════════════════════════════ */}

            {/* 1. NEURO-BEHAVIORAL (Cranial Node: 140, 58) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan?.("neuro_behavioral")}
            >
              <circle
                cx="140"
                cy="58"
                r={selectedOrgan === "neuro_behavioral" ? 8 : 5}
                fill={getStatusColor(organStatus.neuro_behavioral)}
                opacity="0.9"
              />
              {selectedOrgan === "neuro_behavioral" && (
                <g>
                  {/* Targeting Reticle Brackets */}
                  <path
                    d="M 122,46 L 118,46 L 118,50"
                    stroke={getStatusColor(organStatus.neuro_behavioral)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 158,46 L 162,46 L 162,50"
                    stroke={getStatusColor(organStatus.neuro_behavioral)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 122,70 L 118,70 L 118,66"
                    stroke={getStatusColor(organStatus.neuro_behavioral)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 158,70 L 162,70 L 162,66"
                    stroke={getStatusColor(organStatus.neuro_behavioral)}
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </g>

            {/* 2. CARDIOVASCULAR (Thoracic / Heart Node: 148, 148) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan?.("cardiovascular")}
            >
              <circle
                cx="148"
                cy="148"
                r={selectedOrgan === "cardiovascular" ? 9 : 6}
                fill={getStatusColor(organStatus.cardiovascular)}
                opacity="0.95"
              />
              {selectedOrgan === "cardiovascular" && (
                <g>
                  {/* Pulsing Target Bracket */}
                  <path
                    d="M 128,134 L 124,134 L 124,138"
                    stroke={getStatusColor(organStatus.cardiovascular)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 168,134 L 172,134 L 172,138"
                    stroke={getStatusColor(organStatus.cardiovascular)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 128,162 L 124,162 L 124,158"
                    stroke={getStatusColor(organStatus.cardiovascular)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 168,162 L 172,162 L 172,158"
                    stroke={getStatusColor(organStatus.cardiovascular)}
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </g>

            {/* 3. METABOLIC & ENDOCRINE (Abdominal Node: 140, 204) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan?.("metabolic_endocrine")}
            >
              <circle
                cx="140"
                cy="204"
                r={selectedOrgan === "metabolic_endocrine" ? 8 : 5}
                fill={getStatusColor(organStatus.metabolic_endocrine)}
                opacity="0.9"
              />
              {selectedOrgan === "metabolic_endocrine" && (
                <g>
                  <path
                    d="M 122,192 L 118,192 L 118,196"
                    stroke={getStatusColor(organStatus.metabolic_endocrine)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 158,192 L 162,192 L 162,196"
                    stroke={getStatusColor(organStatus.metabolic_endocrine)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 122,216 L 118,216 L 118,212"
                    stroke={getStatusColor(organStatus.metabolic_endocrine)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 158,216 L 162,216 L 162,212"
                    stroke={getStatusColor(organStatus.metabolic_endocrine)}
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </g>

            {/* 4. IMMUNE & RADIATION (Spinal / Sternal Node: 130, 118) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan?.("immune_radiation")}
            >
              <circle
                cx="130"
                cy="118"
                r={selectedOrgan === "immune_radiation" ? 8 : 5}
                fill={getStatusColor(organStatus.immune_radiation)}
                opacity="0.9"
              />
              {selectedOrgan === "immune_radiation" && (
                <g>
                  <path
                    d="M 114,106 L 110,106 L 110,110"
                    stroke={getStatusColor(organStatus.immune_radiation)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 146,106 L 150,106 L 150,110"
                    stroke={getStatusColor(organStatus.immune_radiation)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 114,130 L 110,130 L 110,126"
                    stroke={getStatusColor(organStatus.immune_radiation)}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 146,130 L 150,130 L 150,126"
                    stroke={getStatusColor(organStatus.immune_radiation)}
                    strokeWidth="1.5"
                  />
                </g>
              )}
            </g>
          </svg>

          {/* ── Active Target Telemetry HUD Callouts (Floating Leader Lines) ── */}
          {selectedOrgan === "cardiovascular" && (
            <div className="absolute right-[-45px] top-[26%] bg-[#0D1015]/90 border border-white/10 px-2.5 py-1.5 rounded-[2px] font-telemetry-mono text-[11px] text-neutral-200 pointer-events-none shadow-xl border-l-2 border-l-cyan-400">
              <div className="text-[9px] text-neutral-400 tracking-wider">
                SYS.CARDIO // ARTERIAL
              </div>
              <div className="text-white font-bold">
                PULSE: {hr} BPM
              </div>
              <div className="text-neutral-400 text-[10px]">
                PRESS: {sbp}/{dbp} mmHg
              </div>
            </div>
          )}

          {selectedOrgan === "neuro_behavioral" && (
            <div className="absolute right-[-45px] top-[7%] bg-[#0D1015]/90 border border-white/10 px-2.5 py-1.5 rounded-[2px] font-telemetry-mono text-[11px] text-neutral-200 pointer-events-none shadow-xl border-l-2 border-l-purple-400">
              <div className="text-[9px] text-neutral-400 tracking-wider">
                SYS.NEURO // CIRCADIAN
              </div>
              <div className="text-white font-bold">
                SLEEP: {sleep}h / 8.0h
              </div>
              <div className="text-neutral-400 text-[10px]">
                PHASE: 24h ENT_OK
              </div>
            </div>
          )}

          {selectedOrgan === "metabolic_endocrine" && (
            <div className="absolute right-[-45px] top-[40%] bg-[#0D1015]/90 border border-white/10 px-2.5 py-1.5 rounded-[2px] font-telemetry-mono text-[11px] text-neutral-200 pointer-events-none shadow-xl border-l-2 border-l-amber-400">
              <div className="text-[9px] text-neutral-400 tracking-wider">
                SYS.METAB // GLYCEMIC
              </div>
              <div className="text-white font-bold">
                GLUCOSE: {bg} mg/dL
              </div>
              <div className="text-neutral-400 text-[10px]">
                CORE TEMP: {temp}°C
              </div>
            </div>
          )}

          {selectedOrgan === "immune_radiation" && (
            <div className="absolute left-[-55px] top-[19%] bg-[#0D1015]/90 border border-white/10 px-2.5 py-1.5 rounded-[2px] font-telemetry-mono text-[11px] text-neutral-200 pointer-events-none shadow-xl border-r-2 border-r-rose-400 text-right">
              <div className="text-[9px] text-neutral-400 tracking-wider">
                SYS.IMMUNE // SPE FLUX
              </div>
              <div className="text-white font-bold">
                DOSE: {dose} µSv/h
              </div>
              <div className="text-neutral-400 text-[10px]">
                MARROW: {organStatus.immune_radiation}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom Center Telemetry System Status Banner ── */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-[#0D1015]/90 border border-white/10 rounded-[2px] font-telemetry-mono text-[11px] pointer-events-none">
        <span
          className="w-2 h-2 rounded-full"
          style={{
            backgroundColor: primaryColor,
            boxShadow: `0 0 8px ${primaryColor}`,
          }}
        />
        <span className="text-neutral-300 tracking-wider">
          TACTICAL BIO-TELEMETRY VIEWPORT
        </span>
        <span className="text-neutral-500">|</span>
        <span className="text-neutral-400">
          INDEX:{" "}
          <strong
            style={{
              color: isCritical
                ? "#EF4444"
                : isAlert
                ? "#F59E0B"
                : "#34D399",
            }}
          >
            {Math.round(anomalyScore * 100)}%
          </strong>
        </span>
        <span className="text-neutral-500">|</span>
        <span className="text-neutral-400">
          STATE:{" "}
          <span className="text-neutral-200 font-bold">
            {isCritical
              ? "CRITICAL // MITIGATION_ACTIVE"
              : isAlert
              ? "CAUTION // ELEVATED_VARIANCE"
              : "NOMINAL // EQUILIBRIUM"}
          </span>
        </span>
      </div>
    </div>
  );
};
