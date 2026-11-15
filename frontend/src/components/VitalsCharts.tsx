"use client";

import React, { useState } from "react";
import {
  Area,
  AreaChart,
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
  selectedOrgan,
  organStatus,
}) => {
  const hr = currentVitals?.heart_rate ? Math.round(currentVitals.heart_rate) : 72;
  const sbp = currentVitals?.systolic_bp ? Math.round(currentVitals.systolic_bp) : 118;
  const dbp = currentVitals?.diastolic_bp ? Math.round(currentVitals.diastolic_bp) : 76;
  const bg = currentVitals?.blood_sugar ? Math.round(currentVitals.blood_sugar) : 94;
  const temp = currentVitals?.body_temp ? currentVitals.body_temp.toFixed(1) : "36.8";
  const sleep = currentVitals?.sleep_hours ? currentVitals.sleep_hours.toFixed(1) : "7.6";

  const isHrOutOfRange = hr > 100 || hr < 55;
  const traceColor = isHrOutOfRange ? "#EF4444" : "#BCD9FF";

  // Dynamic Y-axis min/max calculation with padding
  const hrValues = history.map((d) => d.heart_rate || 72);
  const minHr = hrValues.length > 0 ? Math.min(...hrValues) : 60;
  const maxHr = hrValues.length > 0 ? Math.max(...hrValues) : 100;
  const yDomainMin = Math.max(40, Math.floor((minHr - 10) / 10) * 10);
  const yDomainMax = Math.min(180, Math.ceil((maxHr + 10) / 10) * 10);

  return (
    <div className="w-full h-full max-h-[24vh] px-6 py-2 select-none rail-bottom-scrim hairline-t flex items-center justify-between z-10 gap-6">
      {/* Left: Large Hero BPM Readout (Instrument Serif, regular, never bold) */}
      <div className="flex items-baseline gap-3 min-w-[200px] flex-shrink-0">
        <div className="font-display-serif text-[84px] lg:text-[96px] text-white leading-none">
          {hr}
        </div>
        <div className="flex flex-col">
          <span className="font-ui-medium text-[13px] text-neutral-300 tracking-normal">
            BPM
          </span>
          <span className="font-telemetry-mono text-[12px] text-neutral-400">
            {isHrOutOfRange ? (
              <span className="text-red-400">● Tachycardia</span>
            ) : (
              <span className="text-emerald-400">● Resting nominal</span>
            )}
          </span>
        </div>
      </div>

      {/* Center: Live Sweeping Waveform Chart directly over the dark lower edge */}
      <div className="flex-1 h-[95%] min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={history} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="traceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={traceColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={traceColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>

            {/* Faint safe baseline band: 60-100 BPM */}
            <ReferenceArea
              y1={60}
              y2={100}
              fill="rgba(255, 255, 255, 0.025)"
              stroke="rgba(255, 255, 255, 0.06)"
              strokeDasharray="2 2"
            />

            <XAxis
              dataKey="timeStr"
              tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              interval={0}
              tickFormatter={(v: string) => v || ""}
            />
            <YAxis
              domain={[yDomainMin, yDomainMax]}
              tick={{ fill: "rgba(255, 255, 255, 0.35)", fontSize: 11, fontFamily: "var(--font-mono)" }}
              tickLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              axisLine={{ stroke: "rgba(255, 255, 255, 0.1)" }}
              width={35}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload as VitalsHistoryPoint;
                  return (
                    <div className="bg-neutral-950/95 border border-white/15 px-3 py-1.5 rounded shadow-xl font-telemetry-mono text-[12px] text-white">
                      <div>
                        {Math.round(data.heart_rate)} BPM at {data.timeStr}
                      </div>
                      <div className="text-neutral-400 text-[11px]">
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

      {/* Right: Key Secondary Health Indicators (all units >= 12px) */}
      <div className="flex items-center gap-5 flex-shrink-0 font-ui-sans">
        {/* Blood Pressure */}
        <div className="text-right">
          <div className="text-[12px] text-neutral-400">Blood pressure</div>
          <div className="font-telemetry-mono text-[16px] text-white">
            {sbp}/{dbp} <span className="text-[12px] text-neutral-400 font-ui-sans">mmHg</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        {/* Glucose */}
        <div className="text-right">
          <div className="text-[12px] text-neutral-400">Glucose</div>
          <div className="font-telemetry-mono text-[16px] text-white">
            {bg} <span className="text-[12px] text-neutral-400 font-ui-sans">mg/dL</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        {/* Core Temp */}
        <div className="text-right">
          <div className="text-[12px] text-neutral-400">Core temp</div>
          <div className="font-telemetry-mono text-[16px] text-white">
            {temp} <span className="text-[12px] text-neutral-400 font-ui-sans">°C</span>
          </div>
        </div>

        <div className="h-6 w-[1px] bg-white/10" />

        {/* Sleep */}
        <div className="text-right">
          <div className="text-[12px] text-neutral-400">Daily sleep</div>
          <div className="font-telemetry-mono text-[16px] text-white">
            {sleep} <span className="text-[12px] text-neutral-400 font-ui-sans">h</span>
          </div>
        </div>
      </div>
    </div>
  );
};
