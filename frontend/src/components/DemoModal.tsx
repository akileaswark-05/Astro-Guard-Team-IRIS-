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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-fadeIn">
      <div className="bg-[#0D1015] max-w-lg w-full p-6 relative rounded-[2px] border border-tactical shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-[2px] border border-tactical hover:bg-[#161B26]"
          aria-label="Close demo modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-1.5">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-akira text-[12px] text-white tracking-widest">
            SIMULATION SCENARIO CONTROLLER
          </h3>
        </div>
        <p className="text-[12px] text-neutral-400 mb-4 font-ui-sans">
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
                className="w-full flex items-start justify-between p-3 rounded-[2px] bg-[#12151D] hover:bg-[#161B26] border border-tactical hover:border-cyan-500/40 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-[2px] bg-[#090A0D] border border-tactical flex items-center justify-center shrink-0 mt-0.5 group-hover:border-cyan-500/60">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <div className="font-telemetry-mono font-bold text-[12px] text-white group-hover:text-cyan-300 tracking-wider">
                      {p.name}
                    </div>
                    <div className="text-[12px] text-neutral-400 leading-snug mt-1 font-ui-sans">
                      {p.desc}
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-[2px] text-[10px] font-telemetry-mono font-bold tracking-wider border ${p.tagColor} shrink-0`}
                >
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-tactical flex items-center justify-between text-[11px] font-telemetry-mono text-neutral-500">
          <span>HARDWARE KEY: PRESS &apos;D&apos; ANYTIME</span>
          <span>PRESS &apos;ESC&apos; TO DISMISS</span>
        </div>
      </div>
    </div>
  );
};
