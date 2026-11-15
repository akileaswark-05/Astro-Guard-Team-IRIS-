"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  ChevronDown,
  Cpu,
  Moon,
  Radio,
  Sun,
  User,
  Shield,
  Zap,
  Sparkles,
  Heart,
  Sliders,
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
    nominal_orbit: "Nominal orbit",
    solar_storm_tachycardia: "Solar flare & tachycardia",
    circadian_hypoglycemia: "Circadian disruption & hypoglycemia",
  };

  return (
    <header className="h-14 w-full px-5 flex items-center justify-between hairline-b bg-transparent select-none z-30">
      {/* Left: Wordmark + MET clock */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
          <span className="font-ui-medium text-[16px] text-white tracking-tight">
            Astro-Guard
          </span>
        </div>

        <div className="h-3.5 w-[1px] bg-white/10" />

        <div className="font-telemetry-mono text-[13px] text-neutral-400">
          {formatMet(metSeconds)}
        </div>
      </div>

      {/* Center: Scenario selector + Simulate [D] */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="appearance-none bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-200 text-[13px] font-ui-sans py-1.5 pl-3 pr-8 rounded border border-white/10 hover:border-white/20 transition-colors cursor-pointer outline-none"
          >
            {availableScenarios.map((sc) => (
              <option key={sc} value={sc} className="bg-neutral-900 text-neutral-200">
                {scenarioLabels[sc] || sc}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        <button
          onClick={onOpenDemoModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-neutral-900/60 hover:bg-neutral-800/80 text-amber-300 text-[13px] font-ui-sans rounded border border-amber-500/25 hover:border-amber-500/40 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Simulate</span>
          <kbd className="font-telemetry-mono text-[12px] px-1 py-0.2 bg-black/40 rounded border border-white/10 text-neutral-400">
            D
          </kbd>
        </button>
      </div>

      {/* Right: System Popover + Crew Popover */}
      <div className="flex items-center gap-3">
        {/* System popover button */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => setSystemPopoverOpen(!systemPopoverOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[13px] font-ui-sans bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 border border-white/10 hover:border-white/20 transition-colors"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isConnected ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-red-400"
              }`}
            />
            <span>System</span>
          </button>

          {systemPopoverOpen && (
            <div className="absolute right-0 mt-2 w-72 p-3.5 bg-neutral-950/95 border border-white/15 rounded-lg shadow-2xl backdrop-blur-xl z-50 text-[13px]">
              <div className="text-[12px] font-ui-medium text-neutral-400 pb-2 mb-2 hairline-b">
                Hardware & Telemetry Engine
              </div>
              <div className="space-y-2.5 font-ui-sans">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-amber-400" /> Edge LLM
                  </span>
                  <span className="font-telemetry-mono text-neutral-200 text-[12px]">
                    qwen2.5-coder:7b
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Radio className="w-3.5 h-3.5 text-sky-400" /> Space Weather
                  </span>
                  <span className="font-telemetry-mono text-neutral-200 text-[12px]">
                    NASA DONKI
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" /> Dose Rate
                  </span>
                  <span className="font-telemetry-mono text-emerald-300 text-[12px]">
                    {spaceWeather?.radiation_dose_rate_uSv_h?.toFixed(1) || "22.0"} µSv/h
                  </span>
                </div>

                <div className="pt-2 mt-2 hairline-t flex items-center justify-between">
                  <span className="text-neutral-300 flex items-center gap-1.5">
                    {calmMode ? <Moon className="w-3.5 h-3.5 text-sky-300" /> : <Sun className="w-3.5 h-3.5 text-amber-300" />}
                    Calm rest mode
                  </span>
                  <button
                    onClick={onToggleCalmMode}
                    className={`w-9 h-5 rounded-full p-0.5 transition-colors ${
                      calmMode ? "bg-sky-500" : "bg-neutral-800 border border-white/15"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        calmMode ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Crew popover button */}
        <div className="relative" ref={crewRef}>
          <button
            onClick={() => setCrewPopoverOpen(!crewPopoverOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded text-[13px] font-ui-sans bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 border border-white/10 hover:border-white/20 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <span>Crew</span>
            {readiness && (
              <span className="font-telemetry-mono text-[12px] text-amber-300">
                Lv{readiness.level}
              </span>
            )}
          </button>

          {crewPopoverOpen && (
            <div className="absolute right-0 mt-2 w-64 p-3.5 bg-neutral-950/95 border border-white/15 rounded-lg shadow-2xl backdrop-blur-xl z-50 text-[13px]">
              <div className="text-[12px] font-ui-medium text-neutral-400 pb-2 mb-2 hairline-b">
                Astronaut Profile
              </div>
              <div className="space-y-2 font-ui-sans">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Readiness XP</span>
                  <span className="font-telemetry-mono text-neutral-200">
                    {readiness?.xp || 365} XP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Check-in streak</span>
                  <span className="font-telemetry-mono text-amber-300">
                    {readiness?.streak_days || 13} days
                  </span>
                </div>
                <div className="pt-2 mt-2 hairline-t">
                  <button
                    onClick={() => {
                      setCrewPopoverOpen(false);
                      onOpenCheckIn();
                    }}
                    className="w-full py-1.5 bg-white text-black font-ui-medium text-[13px] rounded hover:bg-neutral-200 transition-colors"
                  >
                    Open crew self-log
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
