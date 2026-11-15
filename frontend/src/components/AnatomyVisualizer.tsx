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
  name: string;
  metricLabel: string;
}

const SYSTEMS: SystemInfo[] = [
  { id: "cardiovascular", name: "Cardiovascular", metricLabel: "Pulse & blood pressure" },
  { id: "neuro_behavioral", name: "Neuro-behavioral", metricLabel: "Circadian sleep & cognition" },
  { id: "metabolic_endocrine", name: "Metabolic / endocrine", metricLabel: "Blood glucose & core temp" },
  { id: "immune_radiation", name: "Immune / radiation", metricLabel: "SPE flux & bone marrow" },
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
        return { word: "Act", shape: "■", color: "text-red-400 bg-red-950/60 border-red-500/40", dot: "#EF4444" };
      case "WATCH":
        return { word: "Watch", shape: "▲", color: "text-amber-400 bg-amber-950/60 border-amber-500/40", dot: "#F59E0B" };
      case "NOMINAL":
      default:
        return { word: "Normal", shape: "●", color: "text-emerald-400 bg-emerald-950/60 border-emerald-500/40", dot: "#10B981" };
    }
  };

  return (
    <div className="w-[280px] h-full flex flex-col justify-between py-3 pl-5 pr-2 select-none rail-left-scrim z-10">
      {/* Top title */}
      <div>
        <div className="flex items-center justify-between pb-2 mb-2 hairline-b">
          <span className="font-ui-medium text-[13px] text-neutral-300">Organ systems</span>
          <span className="font-telemetry-mono text-[12px] text-neutral-400">
            ML index: {Math.round(anomalyScore * 100)}%
          </span>
        </div>

        {/* Minimal anatomical wireframe silhouette with interactive nodes */}
        <div className="relative w-full h-[190px] flex items-center justify-center my-1">
          <svg viewBox="0 0 160 220" className="w-full h-full max-h-[190px] opacity-80" fill="none">
            {/* Luminous line & particle astronaut figure */}
            <circle cx="80" cy="24" r="14" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeDasharray="2 2" />
            <path d="M 80,38 L 80,110" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
            <path d="M 80,50 L 44,88 L 32,130" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 80,50 L 116,88 L 128,130" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 80,110 L 56,165 L 52,212" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            <path d="M 80,110 L 104,165 L 108,212" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
            
            {/* Subtle rib cage arc */}
            <path d="M 64,68 Q 80,74 96,68" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
            <path d="M 66,80 Q 80,86 94,80" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />

            {/* Organ Nodes */}
            {/* 1. Neuro (Cranial) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan("neuro_behavioral")}
            >
              <circle
                cx="80"
                cy="24"
                r={selectedOrgan === "neuro_behavioral" ? 8 : 5}
                fill={getDescriptor(organStatus.neuro_behavioral).dot}
                className="transition-all"
              />
              {selectedOrgan === "neuro_behavioral" && (
                <circle cx="80" cy="24" r="12" stroke={getDescriptor(organStatus.neuro_behavioral).dot} strokeWidth="1" strokeDasharray="3 3" />
              )}
            </g>

            {/* 2. Cardiovascular (Thoracic) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan("cardiovascular")}
            >
              <circle
                cx="84"
                cy="68"
                r={selectedOrgan === "cardiovascular" ? 9 : 6}
                fill={getDescriptor(organStatus.cardiovascular).dot}
                className="transition-all"
              />
              {selectedOrgan === "cardiovascular" && (
                <circle cx="84" cy="68" r="14" stroke={getDescriptor(organStatus.cardiovascular).dot} strokeWidth="1" strokeDasharray="3 3" />
              )}
            </g>

            {/* 3. Metabolic / Endocrine (Abdominal) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan("metabolic_endocrine")}
            >
              <circle
                cx="80"
                cy="92"
                r={selectedOrgan === "metabolic_endocrine" ? 8 : 5}
                fill={getDescriptor(organStatus.metabolic_endocrine).dot}
                className="transition-all"
              />
              {selectedOrgan === "metabolic_endocrine" && (
                <circle cx="80" cy="92" r="13" stroke={getDescriptor(organStatus.metabolic_endocrine).dot} strokeWidth="1" strokeDasharray="3 3" />
              )}
            </g>

            {/* 4. Immune / Radiation (Thymus / Bone Marrow / Spine) */}
            <g
              className="cursor-pointer"
              onClick={() => onSelectOrgan("immune_radiation")}
            >
              <circle
                cx="74"
                cy="54"
                r={selectedOrgan === "immune_radiation" ? 8 : 5}
                fill={getDescriptor(organStatus.immune_radiation).dot}
                className="transition-all"
              />
              {selectedOrgan === "immune_radiation" && (
                <circle cx="74" cy="54" r="13" stroke={getDescriptor(organStatus.immune_radiation).dot} strokeWidth="1" strokeDasharray="3 3" />
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* 4 Organ Systems List */}
      <div className="space-y-1.5 mt-2">
        {SYSTEMS.map((sys) => {
          const sev = organStatus[sys.id] || "NOMINAL";
          const desc = getDescriptor(sev);
          const isSelected = selectedOrgan === sys.id;

          return (
            <button
              key={sys.id}
              onClick={() => onSelectOrgan(sys.id)}
              className={`w-full text-left p-2 rounded transition-all flex items-center justify-between ${
                isSelected
                  ? "bg-white/10 border border-white/20"
                  : "bg-transparent hover:bg-white/5 border border-transparent"
              }`}
            >
              <div className="min-w-0 pr-2">
                <div className="font-ui-medium text-[13px] text-neutral-200 truncate">
                  {sys.name}
                </div>
                <div className="text-[12px] text-neutral-400 font-ui-sans truncate">
                  {sys.metricLabel}
                </div>
              </div>

              <div className="flex-shrink-0 flex items-center gap-1 font-telemetry-mono text-[12px]">
                <span className={`px-1.5 py-0.5 rounded border text-[11px] font-ui-medium flex items-center gap-1 ${desc.color}`}>
                  <span>{desc.shape}</span>
                  <span>{desc.word}</span>
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
