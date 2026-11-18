"use client";

import React, { useEffect } from "react";
import { Activity, X, Sun, Heart, Moon, Wind } from "lucide-react";

interface DemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string) => void;
}

export const DemoModal: React.FC<DemoModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!isOpen) return null;

  const presets = [
    {
      id: "nominal_orbit",
      name: "NOMINAL ORBIT // BASELINE EQUILIBRIUM",
      desc: "All physiological indicators in homeostasis. Baseline 1Hz telemetry and orbital telemetry.",
      icon: Moon,
      tag: "NOMINAL",
      tagColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30 border-l-2 border-l-emerald-500",
    },
    {
      id: "solar_storm_tachycardia",
      name: "SOLAR PARTICLE STORM & TACHYCARDIA",
      desc: "Coronal Mass Ejection proton storm. Acute sinus tachycardia (135 BPM) and stage 2 arterial hypertension.",
      icon: Sun,
      tag: "CRITICAL",
      tagColor: "text-red-400 bg-red-500/10 border-red-500/30 border-l-2 border-l-red-500",
    },
    {
      id: "circadian_hypoglycemia",
      name: "CIRCADIAN COLLAPSE & HYPOGLYCEMIA",
      desc: "Circadian sleep deficit (<4h) and acute plasma glucose deficit (54 mg/dL). Metabolic emergency protocol.",
      icon: Heart,
      tag: "CAUTION",
      tagColor: "text-amber-400 bg-amber-500/10 border-amber-500/30 border-l-2 border-l-amber-500",
    },
    {
      id: "co2_spike",
      name: "CABIN ENVIRONMENTAL CO2 SURGE",
      desc: "ECLSS scrubber anomaly. Respiratory acidosis, elevated pulse pressure, and cognitive vigilance latency.",
      icon: Wind,
      tag: "SIMULATED",
      tagColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30 border-l-2 border-l-cyan-500",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-fadeIn backdrop-blur-sm">
      <div className="bg-[#0D061A]/95 max-w-lg w-full p-6 relative rounded-[2px] border border-pink-500/50 shadow-[0_0_30px_rgba(255,42,133,0.3)] backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-pink-400 hover:text-white p-1 rounded-[2px] border border-pink-500/30 hover:bg-[#1C0D34]"
          aria-label="Close demo modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <Activity className="w-4 h-4 text-pink-400" />
          <h3 className="font-display-vc text-[14px] text-pink-400 tracking-wider">
            SIMULATION SCENARIO CONTROLLER
          </h3>
        </div>
        <p className="text-[12px] text-neutral-300 mb-4 font-body-vc">
          Select an emergency physiological profile to drive live multi-organ telemetry, ML anomaly scoring, and clinical directives.
        </p>

        <div className="flex flex-col gap-2">
          {presets.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => {
                  onSelectPreset(p.id);
                  onClose();
                }}
                className="w-full flex items-start justify-between p-3 rounded-[2px] bg-[#140824]/85 hover:bg-[#1F0C38] border border-purple-500/40 hover:border-cyan-400/80 text-left transition-all cursor-pointer group shadow-[0_0_10px_rgba(168,85,247,0.12)]"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[2px] bg-[#0A0414] border border-pink-500/40 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-400/80 shadow-[0_0_8px_rgba(255,42,133,0.2)]">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-display-vc font-bold text-[13px] text-white group-hover:text-cyan-300 tracking-wider">
                      {p.name}
                    </div>
                    <div className="text-[12px] text-neutral-300 leading-snug mt-1 font-body-vc">
                      {p.desc}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-[2px] font-telemetry-mono text-[9px] font-bold tracking-wider shrink-0 mt-0.5 border ${
                    p.tag === "CRITICAL"
                      ? "bg-pink-950/60 border-pink-500 text-pink-300 shadow-[0_0_8px_rgba(255,42,133,0.3)]"
                      : p.tag === "CAUTION"
                      ? "bg-amber-950/60 border-amber-400 text-amber-300 shadow-[0_0_8px_rgba(251,191,36,0.3)]"
                      : "bg-cyan-950/60 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]"
                  }`}
                >
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-pink-500/30 flex items-center justify-between text-[11px] font-telemetry-mono text-cyan-300/70">
          <span>HARDWARE KEY: PRESS &apos;D&apos; ANYTIME</span>
          <span>PRESS &apos;ESC&apos; TO DISMISS</span>
        </div>
      </div>
    </div>
  );
};
