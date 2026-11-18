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
          className: "bg-red-500/10 border border-red-500/30 border-l-2 border-l-red-500 text-red-400",
          dot: "#EF4444",
        };
      case "WATCH":
        return {
          code: "CAUTION",
          className: "bg-amber-500/10 border border-amber-500/30 border-l-2 border-l-amber-500 text-amber-400",
          dot: "#F59E0B",
        };
      case "NOMINAL":
      default:
        return {
          code: "NOMINAL",
          className: "bg-emerald-500/10 border border-emerald-500/30 border-l-2 border-l-emerald-500 text-emerald-400",
          dot: "#10B981",
        };
    }
  };

  return (
    <div className="w-[280px] h-full flex flex-col justify-between p-4 select-none bg-[#0D1015] border-r border-tactical z-10">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-tactical">
          <div>
            <div className="font-akira text-[11px] text-white tracking-widest">
              SYSTEM TELEMETRY
            </div>
            <div className="font-telemetry-mono text-[10px] text-neutral-400">
              BIO_BUS: ACTIVE // 1Hz
            </div>
          </div>
          <div className="font-telemetry-mono text-[11px] px-2 py-0.5 bg-[#12151D] border border-tactical text-neutral-300 rounded-[2px]">
            ANOM: {Math.round(anomalyScore * 100)}%
          </div>
        </div>

        {/* Tactical Anatomical Vector Node Map */}
        <div className="relative w-full h-[180px] bg-[#12151D]/60 border border-tactical rounded-[2px] flex items-center justify-center my-2 p-2 overflow-hidden">
          {/* Subtle grid background */}
          <div className="absolute inset-0 tactical-grid-bg opacity-30 pointer-events-none" />

          <svg viewBox="0 0 160 210" className="w-full h-full max-h-[175px]" fill="none">
            {/* Minimal technical silhouette lines */}
            <circle cx="80" cy="24" r="14" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="3 2" />
            <line x1="80" y1="38" x2="80" y2="105" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 80,48 L 44,82 L 34,124" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <path d="M 80,48 L 116,82 L 126,124" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <path d="M 80,105 L 56,155 L 52,200" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
            <path d="M 80,105 L 104,155 L 108,200" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

            {/* Thoracic rib cage brackets */}
            <path d="M 64,64 Q 80,70 96,64" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <path d="M 66,76 Q 80,82 94,76" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* 1. Neuro (Cranial) */}
            <g className="cursor-pointer" onClick={() => onSelectOrgan("neuro_behavioral")}>
              <circle
                cx="80"
                cy="24"
                r={selectedOrgan === "neuro_behavioral" ? 6 : 4}
                fill={getDescriptor(organStatus.neuro_behavioral).dot}
              />
              {selectedOrgan === "neuro_behavioral" && (
                <rect x="71" y="15" width="18" height="18" stroke={getDescriptor(organStatus.neuro_behavioral).dot} strokeWidth="1" fill="none" strokeDasharray="2 2" />
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
                <rect x="74" y="56" width="20" height="20" stroke={getDescriptor(organStatus.cardiovascular).dot} strokeWidth="1" fill="none" strokeDasharray="2 2" />
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
                <rect x="71" y="81" width="18" height="18" stroke={getDescriptor(organStatus.metabolic_endocrine).dot} strokeWidth="1" fill="none" strokeDasharray="2 2" />
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
                <rect x="65" y="43" width="18" height="18" stroke={getDescriptor(organStatus.immune_radiation).dot} strokeWidth="1" fill="none" strokeDasharray="2 2" />
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* 4 Organ Systems Tactical List */}
      <div className="space-y-1.5 mt-2">
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
                  ? "bg-[#161B26] border-white/20 shadow-md"
                  : "bg-[#12151D]/60 hover:bg-[#161B26]/80 border-tactical"
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="font-telemetry-mono text-[10px] text-neutral-400">
                    {sys.code}
                  </span>
                  <span className="font-ui-medium text-[13px] text-neutral-200 truncate">
                    {sys.name}
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-telemetry-mono truncate mt-0.5">
                  {sys.metricLabel}
                </div>
              </div>

              {/* Crisp 2px-radius rectangular status tag without drop shadow or glow */}
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
      <div className="pt-3 mt-2 border-t border-tactical flex items-center justify-between text-[10px] font-telemetry-mono text-neutral-400">
        <span>SENSOR PROTOCOL: NASA-3001</span>
        <span>CH: 04/04</span>
      </div>
    </div>
  );
};
