"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  Cpu,
  Moon,
  Radio,
  Sun,
  User,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import { CrewReadiness, SpaceWeather } from "@/types/telemetry";

interface CommandBarProps {
  scenario: string;
  onScenarioChange: (scenario: string) => void;
  spaceWeather?: SpaceWeather;
  isConnected: boolean;
  onOpenCheckIn: () => void;
  availableScenarios: string[];
  calmMode: boolean;
  onToggleCalmMode: () => void;
  readiness?: CrewReadiness;
  onOpenDemoModal: () => void;
}

export const CommandBar: React.FC<CommandBarProps> = ({
  scenario,
  onScenarioChange,
  spaceWeather,
  isConnected,
  onOpenCheckIn,
  availableScenarios,
  calmMode,
  onToggleCalmMode,
  readiness,
  onOpenDemoModal,
}) => {
  const [metSeconds, setMetSeconds] = useState(364120);
  const [systemPopoverOpen, setSystemPopoverOpen] = useState(false);
  const [crewPopoverOpen, setCrewPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const crewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMetSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setSystemPopoverOpen(false);
      }
      if (crewRef.current && !crewRef.current.contains(e.target as Node)) {
        setCrewPopoverOpen(false);
      }
    };
    window.addEventListener("mousedown", handleClickOutside);
    return () => window.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const formatMet = (totalSec: number) => {
    const days = Math.floor(totalSec / 86400);
    const rem1 = totalSec % 86400;
    const hours = Math.floor(rem1 / 3600);
    const rem2 = rem1 % 3600;
    const minutes = Math.floor(rem2 / 60);
    const seconds = rem2 % 60;
    return `MET ${String(days).padStart(3, "0")} : ${String(hours).padStart(2, "0")} : ${String(minutes).padStart(2, "0")} : ${String(seconds).padStart(2, "0")}`;
  };

  const scenarioLabels: Record<string, string> = {
    nominal_orbit: "NOMINAL ORBIT // BASELINE",
    solar_storm_tachycardia: "SOLAR FLARE & TACHYCARDIA",
    circadian_hypoglycemia: "CIRCADIAN & HYPOGLYCEMIA",
  };

  return (
    <header className="h-13 w-full px-5 py-2 flex items-center justify-between border-b border-[var(--vc-border-pink)] vc-glass-panel select-none z-30 shadow-[0_2px_15px_rgba(255,42,133,0.15)]">
      {/* Left: Wordmark in Rajdhani Display + Mission Clock */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-[1px] bg-[#FF2A85] shadow-[0_0_8px_#FF2A85]" />
          <span className="font-display-vc text-[15px] font-bold tracking-widest vc-text-pink">
            ASTRO-GUARD
          </span>
          <span className="font-telemetry-mono text-[9px] px-1.5 py-0.5 rounded-[2px] border border-cyan-400/50 bg-cyan-950/40 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            VICE-ORBIT
          </span>
        </div>

        <div className="h-4 w-[1px] bg-pink-500/30" />

        <div className="font-telemetry-mono text-[11px] text-cyan-200 tracking-wider px-2 py-0.5 rounded-[2px] border border-cyan-500/30 bg-cyan-950/20">
          {formatMet(metSeconds)}
        </div>
      </div>

      {/* Center: Aerospace Scenario Controller + Simulation Trigger */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="appearance-none bg-[#130822] hover:bg-[#1E0C36] text-white text-[12px] font-display-vc font-semibold py-1.5 pl-3 pr-8 rounded-[2px] border border-pink-500/40 hover:border-pink-400 transition-colors cursor-pointer outline-none uppercase tracking-wider shadow-[0_0_10px_rgba(255,42,133,0.15)]"
          >
            {availableScenarios.map((sc) => (
              <option key={sc} value={sc} className="bg-[#0D0618] text-neutral-200 font-display-vc">
                {scenarioLabels[sc] || sc.toUpperCase()}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-pink-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Technical Play/Activity icon with Vice City outline */}
        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#140824] hover:bg-[#200D3A] text-cyan-300 text-[12px] font-display-vc font-semibold rounded-[2px] border border-cyan-400/50 hover:border-cyan-300 transition-all shadow-[0_0_10px_rgba(0,240,255,0.2)]"
          title="Open Simulation Scenario Presets (Key: D)"
        >
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span>SIMULATE</span>
          <kbd className="font-telemetry-mono text-[9px] px-1 py-0.2 bg-black/60 rounded-[2px] border border-cyan-400/30 text-cyan-200">
            D
          </kbd>
        </button>
      </div>

      {/* Right: Technical Telemetry & Crew Status */}
      <div className="flex items-center gap-2.5">
        {/* System telemetry status button */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setSystemPopoverOpen(!systemPopoverOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[11px] font-telemetry-mono bg-[#130822] hover:bg-[#1E0C36] text-neutral-200 border border-purple-500/40 hover:border-purple-400 transition-colors shadow-[0_0_8px_rgba(168,85,247,0.15)]"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isConnected ? "bg-cyan-400 shadow-[0_0_6px_#00F0FF]" : "bg-amber-400"
              }`}
            />
            <span>{isConnected ? "BUS: CONNECTED" : "BUS: LOCAL_SIM"}</span>
          </button>

          {systemPopoverOpen && (
            <div className="absolute right-0 mt-2 w-72 p-3 bg-[#0E061A]/95 border border-pink-500/50 rounded-[2px] shadow-[0_0_20px_rgba(255,42,133,0.25)] z-50 text-[12px] backdrop-blur-md">
              <div className="text-[11px] font-display-vc text-pink-400 pb-2 mb-2 border-b border-pink-500/30 tracking-wider">
                HARDWARE & ENGINE SPEC
              </div>
              <div className="space-y-2 font-telemetry-mono">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Edge AI Engine
                  </span>
                  <span className="text-neutral-200 text-[11px]">
                    qwen2.5-coder:7b
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-cyan-400" /> Space Weather
                  </span>
                  <span className="text-cyan-200 text-[11px]">
                    NASA DONKI
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-pink-400" /> Radiation Flux
                  </span>
                  <span className="text-pink-300 text-[11px]">
                    {spaceWeather?.radiation_dose_rate_uSv_h?.toFixed(1) || "22.0"} µSv/h
                  </span>
                </div>

                <div className="pt-2 mt-2 border-t border-purple-500/30 flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-1.5 text-[11px]">
                    {calmMode ? <Moon className="w-3.5 h-3.5 text-cyan-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
                    Circadian Night Filter
                  </span>
                  <button
                    onClick={onToggleCalmMode}
                    className={`w-8 h-4 rounded-[2px] p-0.5 transition-colors ${
                      calmMode ? "bg-cyan-500" : "bg-neutral-800 border border-purple-500/40"
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-[1px] bg-white transition-transform ${
                        calmMode ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Crew Readiness Status */}
        <div className="relative" ref={crewRef}>
          <button
            onClick={() => setCrewPopoverOpen(!crewPopoverOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-[2px] text-[11px] font-telemetry-mono bg-[#130822] hover:bg-[#1E0C36] text-neutral-200 border border-pink-500/40 hover:border-pink-400 transition-colors shadow-[0_0_8px_rgba(255,42,133,0.15)]"
          >
            <User className="w-3 h-3 text-pink-400" />
            <span>CREW: MISSION_CAPABLE</span>
            <span className="text-cyan-300 font-bold">
              {readiness ? `${Math.min(99, 90 + readiness.level)}%` : "94%"}
            </span>
          </button>

          {crewPopoverOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3.5 bg-[#0E061A]/95 border border-cyan-400/50 rounded-[2px] shadow-[0_0_20px_rgba(0,240,255,0.25)] z-50 text-[12px] backdrop-blur-md">
              <div className="text-[11px] font-display-vc text-cyan-400 pb-2 mb-2 border-b border-cyan-400/30 tracking-wider">
                CREW BIOMETRIC LOG
              </div>
              <div className="space-y-2 font-telemetry-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-neutral-400">READINESS COEFFICIENT</span>
                  <span className="text-neutral-200">
                    0.94 // OPTIMAL
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">SURVEILLANCE CYCLE</span>
                  <span className="text-cyan-300">
                    DAY {readiness?.streak_days || 14}
                  </span>
                </div>
                <div className="pt-2 mt-2 border-t border-cyan-400/30">
                  <button
                    onClick={() => {
                      setCrewPopoverOpen(false);
                      onOpenCheckIn();
                    }}
                    className="w-full py-1.5 bg-[#1B0C32] border border-cyan-400/50 text-cyan-200 font-telemetry-mono text-[11px] rounded-[2px] hover:bg-[#281349] transition-colors"
                  >
                    INPUT BIOMETRIC CHECK-IN
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
