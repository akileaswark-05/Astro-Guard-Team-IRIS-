"use client";

import React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { OrganSystem, Severity, Vitals } from "@/types/telemetry";

export interface VitalsHistoryPoint extends Vitals {
  timeStr: string;
  doseRate?: number;
}

interface VitalsChartsProps {
  history: VitalsHistoryPoint[];
  currentVitals?: Vitals;
  selectedOrgan: OrganSystem;
  organStatus: Record<OrganSystem, Severity>;
}

export const VitalsCharts: React.FC<VitalsChartsProps> = ({
  history,
  currentVitals,
}) => {
  const hr = currentVitals?.heart_rate ? Math.round(currentVitals.heart_rate) : 72;
  const sbp = currentVitals?.systolic_bp ? Math.round(currentVitals.systolic_bp) : 118;
  const dbp = currentVitals?.diastolic_bp ? Math.round(currentVitals.diastolic_bp) : 76;
  const bg = currentVitals?.blood_sugar ? Math.round(currentVitals.blood_sugar) : 94;
  const temp = currentVitals?.body_temp ? currentVitals.body_temp.toFixed(1) : "36.8";
  const sleep = currentVitals?.sleep_hours ? currentVitals.sleep_hours.toFixed(1) : "7.6";

  const isHrOutOfRange = hr > 100 || hr < 55;
  const traceColor = isHrOutOfRange ? "#FF2A85" : "#00F0FF";

  // Dynamic Y-axis min/max calculation with padding
  const hrValues = history.map((d) => d.heart_rate || 72);
  const minHr = hrValues.length > 0 ? Math.min(...hrValues) : 60;
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : 100;
  const yDomainMin = Math.max(30, Math.floor(minHr / 20) * 20 - 10);
  const yDomainMax = Math.min(200, Math.ceil(maxHr / 20) * 20 + 20);

  // Generate distinct ticks so no duplicate ticks or zeroes occur
  const ticks = [50, 80, 110, 140, 170].filter(
    (t) => t >= yDomainMin && t <= yDomainMax
  );
  if (ticks.length < 3) {
    ticks.push(60, 100, 140);
    ticks.sort((a, b) => a - b);
  }

  return (
    <div className="w-full h-full max-h-[24vh] px-5 py-2.5 select-none vc-glass-panel border-t border-cyan-400/30 flex items-center justify-between z-10 gap-5">
      {/* ── Left: Technical Clinical BPM Readout in Vice City Outlines ── */}
      <div className="flex flex-col justify-center min-w-[210px] flex-shrink-0 bg-[#130722]/85 p-3 rounded-[2px] border border-cyan-400/50 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
        <div className="flex items-center justify-between">
          <span className="font-display-vc text-[11px] text-cyan-300 tracking-wider">
            HEART RATE
          </span>
          <span className="font-telemetry-mono text-[9px] text-pink-400">
            ECG // LEAD II
          </span>
        </div>

        <div className="flex items-baseline gap-2 my-0.5">
          <div className="font-telemetry-mono font-bold text-[60px] lg:text-[72px] text-white leading-none tracking-tighter" style={{ textShadow: "0 0 16px rgba(0,240,255,0.3)" }}>
            {hr}
          </div>
          <div className="font-telemetry-mono text-[14px] text-cyan-300 font-bold">
            BPM
          </div>
        </div>

        {/* Crisp Vice City status tag */}
        <div>
          {isHrOutOfRange ? (
            <span className="inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-telemetry-mono font-bold tracking-wider bg-pink-950/60 border border-pink-500 text-pink-300 shadow-[0_0_10px_rgba(255,42,133,0.35)]">
              [ TACHYCARDIA // CRITICAL ]
            </span>
          ) : (
            <span className="inline-block px-2 py-0.5 rounded-[2px] text-[10px] font-telemetry-mono font-bold tracking-wider bg-cyan-950/60 border border-cyan-400 text-cyan-300 shadow-[0_0_10px_rgba(0,240,255,0.35)]">
              [ SINUS_RHYTHM // NOMINAL ]
            </span>
          )}
        </div>
      </div>

      {/* ── Center: Clinical Telemetry Waveform Sweep with Neon Trace ── */}
      <div className="flex-1 h-[95%] min-w-0 bg-[#130724]/80 p-2 rounded-[2px] border border-purple-500/40 shadow-[0_0_15px_rgba(168,85,247,0.15)] relative">
        <div className="absolute top-1 left-2 font-telemetry-mono text-[9px] text-pink-400 tracking-wider z-20">
          PLETHYSMOGRAPH WAVEFORM // SWEEP: 25mm/s
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="traceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={traceColor} stopOpacity={0.35} />
                <stop offset="100%" stopColor={traceColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Subtle neon gridlines */}
            <CartesianGrid stroke="rgba(168, 85, 247, 0.12)" strokeDasharray="3 3" />

            {/* Nominal Physiological Band: 60-100 BPM */}
            <ReferenceArea
              y1={60}
              y2={100}
              fill="rgba(0, 240, 255, 0.05)"
              stroke="rgba(0, 240, 255, 0.25)"
              strokeDasharray="2 2"
            />

            <XAxis
              dataKey="timeStr"
              tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "rgba(0, 240, 255, 0.2)" }}
              axisLine={{ stroke: "rgba(0, 240, 255, 0.2)" }}
              interval={0}
              tickFormatter={(v: string) => v || ""}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              ticks={ticks}
              tick={{ fill: "rgba(255, 255, 255, 0.5)", fontSize: 10, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "rgba(0, 240, 255, 0.2)" }}
              axisLine={{ stroke: "rgba(0, 240, 255, 0.2)" }}
              width={35}
              tickFormatter={(v: number) => `${Math.round(v)}`}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as VitalsHistoryPoint;
                  return (
                    <div className="bg-[#0E061A]/95 border border-pink-500/60 px-3 py-1.5 rounded-[2px] shadow-[0_0_15px_rgba(255,42,133,0.3)] font-telemetry-mono text-[11px] text-white">
                      <div>
                        HR: {Math.round(data.heart_rate)} BPM at {data.timeStr}
                      </div>
                      <div className="text-cyan-300 text-[10px]">
                        BP: {Math.round(data.systolic_bp)}/{Math.round(data.diastolic_bp)} mmHg
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />

            <Area
              type="monotone"
              dataKey="heart_rate"
              stroke={traceColor}
              strokeWidth={2}
              fill="url(#traceGradient)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* ── Right: 4 Modular Outlined Metric Cards (Vice City Theme) ── */}
      <div className="grid grid-cols-2 gap-2 flex-shrink-0 min-w-[340px]">
        {/* Blood Pressure Card */}
        <div className="bg-[#130722]/85 p-2.5 rounded-[2px] border border-pink-500/40 hover:border-pink-500/70 transition-colors shadow-[0_0_10px_rgba(255,42,133,0.15)]">
          <div className="font-display-vc text-[10px] text-pink-400 tracking-wider">
            BLOOD PRESSURE
          </div>
          <div className="font-telemetry-mono text-[18px] text-white font-bold mt-0.5">
            {sbp}/{dbp} <span className="text-[11px] font-normal text-pink-300">mmHg</span>
          </div>
          <div className="font-telemetry-mono text-[9px] text-neutral-300 mt-0.5">
            MEAN: {Math.round((sbp + 2 * dbp) / 3)} mmHg
          </div>
        </div>

        {/* Glucose Card */}
        <div className="bg-[#130722]/85 p-2.5 rounded-[2px] border border-cyan-400/40 hover:border-cyan-400/70 transition-colors shadow-[0_0_10px_rgba(0,240,255,0.15)]">
          <div className="font-display-vc text-[10px] text-cyan-300 tracking-wider">
            BLOOD GLUCOSE
          </div>
          <div className="font-telemetry-mono text-[18px] text-white font-bold mt-0.5">
            {bg} <span className="text-[11px] font-normal text-cyan-300">mg/dL</span>
          </div>
          <div className="font-telemetry-mono text-[9px] text-neutral-300 mt-0.5">
            TARGET: 75-115
          </div>
        </div>

        {/* Core Temperature Card */}
        <div className="bg-[#130722]/85 p-2.5 rounded-[2px] border border-amber-400/40 hover:border-amber-400/70 transition-colors shadow-[0_0_10px_rgba(251,191,36,0.15)]">
          <div className="font-display-vc text-[10px] text-amber-300 tracking-wider">
            CORE TEMP
          </div>
          <div className="font-telemetry-mono text-[18px] text-white font-bold mt-0.5">
            {temp} <span className="text-[11px] font-normal text-amber-300">°C</span>
          </div>
          <div className="font-telemetry-mono text-[9px] text-neutral-300 mt-0.5">
            ORBITAL THERM
          </div>
        </div>

        {/* Sleep Rest Card */}
        <div className="bg-[#130722]/85 p-2.5 rounded-[2px] border border-purple-400/40 hover:border-purple-400/70 transition-colors shadow-[0_0_10px_rgba(168,85,247,0.15)]">
          <div className="font-display-vc text-[10px] text-purple-300 tracking-wider">
            DAILY SLEEP
          </div>
          <div className="font-telemetry-mono text-[18px] text-white font-bold mt-0.5">
            {sleep} <span className="text-[11px] font-normal text-purple-300">h</span>
          </div>
          <div className="font-telemetry-mono text-[9px] text-neutral-300 mt-0.5">
            CIRCADIAN GOAL 8.0h
          </div>
        </div>
      </div>
    </div>
  );
};
