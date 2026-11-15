"use client";

import React, { useEffect } from "react";
import { Sparkles, X, Sun, Heart, Moon, Wind } from "lucide-react";

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
      name: "Nominal orbit",
      desc: "All indicators balanced. Black hole glows with calm golden Keplerian rotation.",
      icon: Moon,
      tag: "Normal",
      tagColor: "text-emerald-400 bg-emerald-950/40 border-emerald-500/30",
    },
    {
      id: "solar_storm_tachycardia",
      name: "Solar storm & tachycardia",
      desc: "CME proton flare. Heart rate spikes to 134 bpm; disk shifts to hot red-white turbulence.",
      icon: Sun,
      tag: "Critical",
      tagColor: "text-red-400 bg-red-950/40 border-red-500/30",
    },
    {
      id: "circadian_hypoglycemia",
      name: "Circadian disruption & hypoglycemia",
      desc: "Sleep debt and blood glucose crash to 58 mg/dL. Metabolic crisis protocol.",
      icon: Heart,
      tag: "Critical",
      tagColor: "text-amber-400 bg-amber-950/40 border-amber-500/30",
    },
    {
      id: "co2_spike",
      name: "Cabin environmental CO2 surge",
      desc: "ECLSS scrubber anomaly. Rapid respiratory hypercapnia and elevated pulse pressure.",
      icon: Wind,
      tag: "Simulated",
      tagColor: "text-sky-400 bg-sky-950/40 border-sky-500/30",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-950/95 max-w-lg w-full p-6 relative rounded-lg border border-white/15 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded"
          aria-label="Close demo modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h3 className="font-ui-medium text-[16px] text-white">
            Presentation scenario presets
          </h3>
        </div>
        <p className="text-[13px] text-neutral-400 mb-4 font-ui-sans">
          Select an emergency scenario to drive the live black hole, ML anomaly scoring, and offline flight surgeon on cue.
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
                className="w-full flex items-start justify-between p-3 rounded bg-neutral-900/60 hover:bg-neutral-800/80 border border-white/10 hover:border-amber-400/40 text-left transition-colors cursor-pointer group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded bg-neutral-950 border border-white/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:border-amber-400">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <div className="font-ui-medium text-[14px] text-white group-hover:text-amber-300">
                      {p.name}
                    </div>
                    <div className="text-[13px] text-neutral-400 leading-snug mt-0.5 font-ui-sans">
                      {p.desc}
                    </div>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded text-[11px] font-telemetry-mono border ${p.tagColor} shrink-0`}>
                  {p.tag}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 pt-3 hairline-t flex items-center justify-between text-[12px] font-telemetry-mono text-neutral-500">
          <span>Keyboard shortcut: Press 'D' anytime</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
