"use client";

import React from "react";
import { OrganSystem, Severity } from "@/types/telemetry";

interface AnatomyVisualizerProps {
  organStatus: Record<OrganSystem, Severity>;
  selectedOrgan: OrganSystem;
  onSelectOrgan: (organ: OrganSystem) => void;
  anomalyScore?: number;
}

interface SystemInfo {
  id: OrganSystem;
  code: string;
  name: string;
  metricLabel: string;
}

const SYSTEMS: SystemInfo[] = [
  { id: "cardiovascular", code: "SYS.01", name: "Cardiovascular", metricLabel: "Pulse & Arterial Pressure" },
  { id: "neuro_behavioral", code: "SYS.02", name: "Neuro-Behavioral", metricLabel: "Circadian Phase & Cognition" },
  { id: "metabolic_endocrine", code: "SYS.03", name: "Metabolic / Endocrine", metricLabel: "Blood Glucose & Core Temp" },
  { id: "immune_radiation", code: "SYS.04", name: "Immune / Radiation", metricLabel: "SPE Proton Flux & Marrow" },
];

export const AnatomyVisualizer: React.FC<AnatomyVisualizerProps> = ({
  organStatus,
  selectedOrgan,
  onSelectOrgan,
  anomalyScore = 0.08,
}) => {
  const getDescriptor = (sev: Severity) => {
    switch (sev) {
      case "CRITICAL":
        return {
          code: "CRITICAL",
          className: "bg-pink-950/60 border border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,42,133,0.35)]",
          dot: "#FF2A85",
        };
      case "WATCH":
        return {
          code: "CAUTION",
          className: "bg-amber-950/60 border border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(251,191,36,0.35)]",
          dot: "#FFB800",
        };
      case "NOMINAL":
      default:
        return {
          code: "NOMINAL",
          className: "bg-cyan-950/60 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.35)]",
          dot: "#00F0FF",
        };
    }
  };

  return (
    <div className="w-[280px] h-full flex flex-col justify-between p-4 select-none vc-glass-panel border-r border-pink-500/30 z-10">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-pink-500/30">
          <div>
            <div className="font-display-vc text-[13px] text-pink-400 tracking-wider">
              SYSTEM TELEMETRY
            </div>
            <div className="font-telemetry-mono text-[9px] text-cyan-300/80">
              BIO_BUS: ACTIVE // 1Hz
            </div>
          </div>
          <div className="font-telemetry-mono text-[10px] px-2 py-0.5 bg-pink-950/40 border border-pink-500/50 text-pink-300 rounded-[2px] shadow-[0_0_8px_rgba(255,42,133,0.2)]">
            ANOM: {Math.round(anomalyScore * 100)}%
          </div>
        </div>

        {/* Tactical Anatomical Vector Node Map */}
        <div className="relative w-full h-[180px] bg-[#120824]/70 border border-purple-500/40 rounded-[2px] flex items-center justify-center my-2 p-2 overflow-hidden shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          {/* Subtle grid background */}
          <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
            backgroundImage: "linear-gradient(to right, rgba(0,240,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,42,133,0.15) 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

          <svg viewBox="0 0 160 210" className="w-full h-full max-h-[175px]" fill="none">
            {/* Minimal technical silhouette lines */}
            <circle cx="80" cy="24" r="14" stroke="rgba(255,42,133,0.4)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="38" x2="80" y2="105" stroke="rgba(0,240,255,0.3)" strokeWidth="1" />
            <path d="M 80,48 L 44,82 L 34,124" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
            <path d="M 80,48 L 116,82 L 126,124" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
            <path d="M 80,105 L 56,155 L 52,200" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />
            <path d="M 80,105 L 104,155 L 108,200" stroke="rgba(168,85,247,0.3)" strokeWidth="1" />

            {/* Thoracic rib cage brackets */}
            <path d="M 64,64 Q 80,70 96,64" stroke="rgba(0,240,255,0.3)" strokeWidth="1" />
            <path d="M 66,76 Q 80,82 94,76" stroke="rgba(0,240,255,0.3)" strokeWidth="1" />

            {/* 1. Neuro (Cranial) */}
            <g className="cursor-pointer" onClick={() => onSelectOrgan("neuro_behavioral")}>
              <circle
                cx="80"
                cy="24"
                r={selectedOrgan === "neuro_behavioral" ? 6 : 4}
                fill={getDescriptor(organStatus.neuro_behavioral).dot}
              />
              {selectedOrgan === "neuro_behavioral" && (
                <rect x="71" y="15" width="18" height="18" stroke={getDescriptor(organStatus.neuro_behavioral).dot} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
              )}
            </g>

            {/* 2. Cardiovascular (Thoracic) */}
            <g className="cursor-pointer" onClick={() => onSelectOrgan("cardiovascular")}>
              <circle
                cx="84"
                cy="66"
                r={selectedOrgan === "cardiovascular" ? 7 : 5}
                fill={getDescriptor(organStatus.cardiovascular).dot}
              />
              {selectedOrgan === "cardiovascular" && (
                <rect x="74" y="56" width="20" height="20" stroke={getDescriptor(organStatus.cardiovascular).dot} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
              )}
            </g>

            {/* 3. Metabolic (Abdominal) */}
            <g className="cursor-pointer" onClick={() => onSelectOrgan("metabolic_endocrine")}>
              <circle
                cx="80"
                cy="90"
                r={selectedOrgan === "metabolic_endocrine" ? 6 : 4}
                fill={getDescriptor(organStatus.metabolic_endocrine).dot}
              />
              {selectedOrgan === "metabolic_endocrine" && (
                <rect x="71" y="81" width="18" height="18" stroke={getDescriptor(organStatus.metabolic_endocrine).dot} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
              )}
            </g>

            {/* 4. Immune (Sternal/Marrow) */}
            <g className="cursor-pointer" onClick={() => onSelectOrgan("immune_radiation")}>
              <circle
                cx="74"
                cy="52"
                r={selectedOrgan === "immune_radiation" ? 6 : 4}
                fill={getDescriptor(organStatus.immune_radiation).dot}
              />
              {selectedOrgan === "immune_radiation" && (
                <rect x="65" y="43" width="18" height="18" stroke={getDescriptor(organStatus.immune_radiation).dot} strokeWidth="1.5" fill="none" strokeDasharray="2 2" />
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* 4 Organ Systems Tactical List with Vice City Outlines */}
      <div className="space-y-2 mt-2">
        {SYSTEMS.map((sys) => {
          const sev = organStatus[sys.id] || "NOMINAL";
          const desc = getDescriptor(sev);
          const isSelected = selectedOrgan === sys.id;

          return (
            <button
              key={sys.id}
              onClick={() => onSelectOrgan(sys.id)}
              className={`w-full text-left p-2.5 rounded-[2px] transition-all flex items-center justify-between border ${
                isSelected
                  ? "bg-[#1E0C38] border-cyan-400 shadow-[0_0_14px_rgba(0,240,255,0.35)]"
                  : "bg-[#130824]/70 hover:bg-[#1D0C36] border-pink-500/30 hover:border-pink-500/60 shadow-[0_0_8px_rgba(255,42,133,0.1)]"
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-telemetry-mono text-[9px] text-pink-400 font-bold">
                    {sys.code}
                  </span>
                  <span className="font-display-vc text-[13px] text-white tracking-wide truncate">
                    {sys.name}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-300 font-body-vc truncate mt-0.5">
                  {sys.metricLabel}
                </div>
              </div>

              {/* Crisp Outlined Status Tag */}
              <div className="flex-shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-[2px] text-[10px] font-telemetry-mono font-bold tracking-wider ${desc.className}`}
                >
                  {desc.code}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="pt-3 mt-2 border-t border-pink-500/30 flex items-center justify-between text-[9px] font-telemetry-mono text-cyan-300/80">
        <span>SENSOR PROTOCOL: NASA-3001</span>
        <span>CH: 04/04</span>
      </div>
    </div>
  );
};
