"use client";

import React, { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Send, Check } from "lucide-react";
import {
  CrewReadiness,
  FlightSurgeonExplanation,
  OrganSystem,
  Severity,
  Vitals,
} from "@/types/telemetry";

interface FlightSurgeonPanelProps {
  explanation?: FlightSurgeonExplanation;
  readiness?: CrewReadiness;
  selectedOrgan: OrganSystem;
  organSeverity: Severity;
  currentVitals?: Vitals;
  radiationDoseRate?: number;
  onCompleteCountermeasure: (questId: string, title: string, category: string, xp: number) => Promise<void>;
  isLoadingExplanation?: boolean;
}

export const FlightSurgeonPanel: React.FC<FlightSurgeonPanelProps> = ({
  explanation,
  readiness,
  selectedOrgan,
  organSeverity,
  currentVitals,
  radiationDoseRate,
  onCompleteCountermeasure,
  isLoadingExplanation = false,
}) => {
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [openSections, setOpenSections] = useState({
    happening: true,
    why: false,
    countermeasure: true,
  });

  const [question, setQuestion] = useState("");
  const [customReply, setCustomReply] = useState<string | null>(null);

  useEffect(() => {
    setCheckedSteps({});
    setCustomReply(null);
  }, [selectedOrgan, organSeverity]);

  // CLINICAL TRUTH DISPATCHER: NASA-STD-3001 Aerospace Medicine Logic
  const getClinicalDossier = () => {
    const hr = Math.round(currentVitals?.heart_rate || 72);
    const sbp = Math.round(currentVitals?.systolic_bp || 120);
    const dbp = Math.round(currentVitals?.diastolic_bp || 80);
    const bg = Math.round(currentVitals?.blood_sugar || 95);
    const temp = (currentVitals?.body_temp || 36.8).toFixed(1);
    const sleep = (currentVitals?.sleep_hours || 7.5).toFixed(1);
    const dose = (radiationDoseRate || 22.0).toFixed(1);

    if (selectedOrgan === "cardiovascular") {
      if (organSeverity === "CRITICAL") {
        return {
          hero: `Acute sinus tachycardia (${hr} BPM) with cephalad arterial hypertension (${sbp}/${dbp} mmHg). Emergency protocol active.`,
          happening: `Cephalic fluid redistribution has engorged central thoracic circulation, spiking cardiac output and sympathetic myocardial workload.`,
          why: `In zero gravity, loss of hydrostatic pressure pooling increases central blood volume by ~2L, triggering baroreceptor dysfunction and acute stress tachycardia.`,
          checklist: [
            { text: "Execute 15-second Valsalva vagal maneuver", xp: 45 },
            { text: "Ingest 250ml chilled electrolyte rehydration solution", xp: 35 },
            { text: "Engage Lower-Body Negative Pressure (LBNP) garment at -30 mmHg", xp: 60 },
          ],
        };
      }
      if (organSeverity === "WATCH") {
        return {
          hero: `Cardiovascular pulse pressure widening (${sbp}/${dbp} mmHg) with moderate heart rate elevation (${hr} BPM).`,
          happening: `Mild sympathetic activation detected with compensatory stroke volume elevation.`,
          why: `Microgravity fluid shifts are altering vascular impedance and baroreceptor sensitivity.`,
          checklist: [
            { text: "Initiate 5-minute paced diaphragmatic breathing protocol", xp: 25 },
            { text: "Re-calibrate continuous arterial tonometry cuff", xp: 20 },
          ],
        };
      }
      return {
        hero: `Cardiovascular hemodynamics are nominal and stable at ${hr} BPM (${sbp}/${dbp} mmHg).`,
        happening: `Resting cardiac rhythm and systemic perfusion remain within certified NASA-STD-3001 deep-space operational boundaries.`,
        why: `Adapted baroreflex response maintains stable cerebral perfusion across routine mission operations.`,
        checklist: [
          { text: "Complete routine 30-minute cycle ergometer exercise session", xp: 30 },
          { text: "Record routine crew hydration telemetry log", xp: 15 },
        ],
      };
    }

    if (selectedOrgan === "immune_radiation") {
      if (organSeverity === "CRITICAL" || organSeverity === "WATCH") {
        return {
          hero: `Solar Particle Event (SPE) proton flux active at ${dose} µSv/h. Radiation shelter protocol engaged.`,
          happening: `High-energy galactic and solar cosmic proton flux is penetrating secondary hull shielding at ${dose} µSv/h.`,
          why: `Ionizing radiation suppresses hematopoietic bone marrow stem cell proliferation while microgravity inhibits cellular DNA repair enzymes.`,
          checklist: [
            { text: "Relocate crew to internal storm shelter module", xp: 50 },
            { text: "Administer 200mg radioprotective antioxidant formulation", xp: 35 },
            { text: "Activate active water-wall radiation shielding matrix", xp: 40 },
          ],
        };
      }
      return {
        hero: `Radiation environment is nominal at background dose rate of ${dose} µSv/h.`,
        happening: `Deep-space ionizing radiation levels remain beneath standard ALARA mission exposure constraints.`,
        why: `Cosmic ray flux is within modeled solar quiet boundaries.`,
        checklist: [
          { text: "Verify passive thermoluminescent dosimeter (TLD) readouts", xp: 20 },
        ],
      };
    }

    if (selectedOrgan === "metabolic_endocrine") {
      if (organSeverity === "CRITICAL") {
        return {
          hero: `Blood glucose crashed to ${bg} mg/dL with core temperature drift (${temp}°C). Acute hypoglycemia.`,
          happening: `Acute plasma glucose deficit (${bg} mg/dL) coupled with thermoregulatory instability from depleted glycogen reserves.`,
          why: `Microgravity alters insulin receptor sensitivity and slows splanchnic nutrient absorption under continuous mission workload.`,
          checklist: [
            { text: "Ingest 15g fast-acting dextrose nutritional pouch", xp: 50 },
            { text: "Adjust thermal flight garment active heating to 23.0°C", xp: 30 },
            { text: "Re-assay capillary blood glucose in 10 minutes", xp: 25 },
          ],
        };
      }
      return {
        hero: `Metabolic and glycemic regulation are balanced at ${bg} mg/dL and ${temp}°C.`,
        happening: `Plasma glucose and core body temperature indicate stable cellular metabolic homeostasis.`,
        why: `Caloric intake and microgravity thermal convection equilibrium are maintained.`,
        checklist: [
          { text: "Log nutritional intake and water reconstitution log", xp: 20 },
        ],
      };
    }

    // Neuro-behavioral
    if (organSeverity === "CRITICAL" || organSeverity === "WATCH") {
      return {
        hero: `Circadian disruption detected with ${sleep}h sleep. Cognitive latency elevation active.`,
        happening: `Severe sleep fragmentation (${sleep}h) and desynchronized melatonin circadian phase rhythm.`,
        why: `16 orbital sunrises per day and microgravity sleep architecture degradation impair prefrontal executive cognition.`,
        checklist: [
          { text: "Shift cabin ambient illumination to 480nm blue-depleted mode", xp: 30 },
          { text: "Ingest 0.5mg timed-release melatonin supplement", xp: 25 },
          { text: "Schedule 90-minute protected restorative sleep cycle", xp: 40 },
        ],
      };
    }

    return {
      hero: `Neuro-cognitive and circadian metrics are nominal with ${sleep}h restorative sleep.`,
      happening: `Sleep architecture (${sleep}h) and subjective mood indices reflect stable psychological readiness.`,
      why: `Circadian lighting entrainment protocols are preserving cognitive alertness and psychomotor reaction latency.`,
      checklist: [
        { text: "Perform routine 2-minute psychomotor vigilance task (PVT)", xp: 20 },
      ],
    };
  };

  const dossier = getClinicalDossier();

  const handleToggleCheck = async (idx: number, item: { text: string; xp: number }) => {
    const nextState = !checkedSteps[idx];
    setCheckedSteps((p) => ({ ...p, [idx]: nextState }));

    if (nextState) {
      await onCompleteCountermeasure(
        `quest_${selectedOrgan}_${idx}`,
        item.text,
        selectedOrgan,
        item.xp
      );
    }
  };

  const handleAsk = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;
    setCustomReply(
      `FLIGHT SURGEON DIRECTIVE: Telemetry evaluation for ${selectedOrgan.toUpperCase()} indicates: "${dossier.hero}". Execute assigned clinical countermeasures immediately.`
    );
    setQuestion("");
  };

  return (
    <div className="w-[350px] h-full flex flex-col justify-between p-4 select-none vc-glass-panel border-l border-cyan-400/30 z-10 overflow-hidden">
      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
        {/* Rail Header in Rajdhani Display / Monospace */}
        <div className="flex items-center justify-between pb-2.5 border-b border-cyan-400/30">
          <div>
            <div className="font-display-vc text-[13px] text-cyan-400 tracking-wider">
              FLIGHT SURGEON
            </div>
            <div className="font-telemetry-mono text-[9px] text-pink-400">
              NASA-STD-3001 // CLINICAL
            </div>
          </div>
          <div className="font-telemetry-mono text-[10px] px-2 py-0.5 bg-cyan-950/40 border border-cyan-400/50 text-cyan-300 rounded-[2px] shadow-[0_0_8px_rgba(0,240,255,0.2)]">
            AI_CORE: ACTIVE
          </div>
        </div>

        {/* HERO ASSESSMENT: Clean Authentic Font with Vice City Outlined Box */}
        <div className="p-3 bg-[#130722]/85 border border-pink-500/40 rounded-[2px] shadow-[0_0_12px_rgba(255,42,133,0.18)]">
          <div className="font-display-vc text-[11px] text-pink-400 tracking-wider mb-1">
            &gt; CLINICAL ASSESSMENT SUMMARY
          </div>
          <div className="font-body-vc font-medium text-[13.5px] text-white leading-snug">
            {dossier.hero}
          </div>
        </div>

        {/* Section 1: CLINICAL ASSESSMENT */}
        <div className="pt-2 border-t border-purple-500/30">
          <button
            onClick={() => setOpenSections((p) => ({ ...p, happening: !p.happening }))}
            className="w-full flex items-center justify-between text-left font-display-vc font-bold text-[12px] text-cyan-300 hover:text-cyan-200 tracking-wider"
          >
            <span>[+] CLINICAL ASSESSMENT</span>
            {openSections.happening ? <ChevronUp className="w-3.5 h-3.5 text-cyan-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />}
          </button>
          {openSections.happening && (
            <p className="mt-1.5 font-body-vc text-[12.5px] text-neutral-200 leading-relaxed bg-[#140824]/85 p-2.5 rounded-[2px] border border-cyan-400/30 shadow-[0_0_10px_rgba(0,240,255,0.1)]">
              {dossier.happening}
            </p>
          )}
        </div>

        {/* Section 2: MICROGRAVITY IMPACT */}
        <div className="pt-2 border-t border-purple-500/30">
          <button
            onClick={() => setOpenSections((p) => ({ ...p, why: !p.why }))}
            className="w-full flex items-center justify-between text-left font-display-vc font-bold text-[12px] text-purple-300 hover:text-purple-200 tracking-wider"
          >
            <span>[+] MICROGRAVITY IMPACT</span>
            {openSections.why ? <ChevronUp className="w-3.5 h-3.5 text-purple-400" /> : <ChevronDown className="w-3.5 h-3.5 text-purple-400" />}
          </button>
          {openSections.why && (
            <p className="mt-1.5 font-body-vc text-[12.5px] text-neutral-200 leading-relaxed bg-[#140824]/85 p-2.5 rounded-[2px] border border-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
              {dossier.why}
            </p>
          )}
        </div>

        {/* Section 3: PROTOCOL CHECKLIST */}
        <div className="pt-2 border-t border-purple-500/30">
          <button
            onClick={() => setOpenSections((p) => ({ ...p, countermeasure: !p.countermeasure }))}
            className="w-full flex items-center justify-between text-left font-display-vc font-bold text-[12px] text-pink-300 hover:text-pink-200 tracking-wider"
          >
            <span>[+] PROTOCOL CHECKLIST</span>
            {openSections.countermeasure ? <ChevronUp className="w-3.5 h-3.5 text-pink-400" /> : <ChevronDown className="w-3.5 h-3.5 text-pink-400" />}
          </button>

          {openSections.countermeasure && (
            <div className="mt-2 space-y-2">
              {dossier.checklist.map((item, idx) => {
                const isDone = !!checkedSteps[idx];
                return (
                  <div
                    key={idx}
                    onClick={() => handleToggleCheck(idx, item)}
                    className={`p-2.5 rounded-[2px] border transition-all cursor-pointer flex items-start gap-2.5 ${
                      isDone
                        ? "bg-cyan-950/40 border-cyan-400 text-cyan-200 shadow-[0_0_10px_rgba(0,240,255,0.2)]"
                        : "bg-[#130724]/85 hover:bg-[#1D0C36] border-pink-500/40 text-neutral-100 shadow-[0_0_8px_rgba(255,42,133,0.1)]"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[1px] mt-0.5 flex-shrink-0 flex items-center justify-center border transition-colors ${
                        isDone
                          ? "bg-cyan-400 border-cyan-300 text-black shadow-[0_0_8px_#00F0FF]"
                          : "border-pink-500/50 bg-black/60"
                      }`}
                    >
                      {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>

                    <div className="flex-1 font-body-vc text-[12px] leading-snug">
                      <div className={isDone ? "line-through opacity-70" : ""}>
                        {item.text}
                      </div>
                      {/* Subtle protocol completion weight */}
                      <div className="font-telemetry-mono text-[10px] text-pink-400 mt-1">
                        PROTOCOL WEIGHT: {(item.xp / 100).toFixed(2)} // LOG VERIFIED
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Custom reply if asked */}
        {customReply && (
          <div className="p-2.5 rounded-[2px] bg-[#140824]/90 border border-cyan-400/50 text-[11px] font-telemetry-mono text-cyan-200 mt-2 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
            {customReply}
          </div>
        )}
      </div>

      {/* Flight Surgeon Command Prompt */}
      <form onSubmit={handleAsk} className="pt-2.5 mt-2 border-t border-cyan-400/30 flex items-center gap-2">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ENTER MEDICAL QUERY..."
          className="flex-1 bg-[#120822] text-neutral-200 text-[11px] font-telemetry-mono px-3 py-1.5 rounded-[2px] border border-cyan-400/40 focus:border-cyan-300 outline-none placeholder:text-neutral-500 tracking-wider shadow-[0_0_8px_rgba(0,240,255,0.15)]"
        />
        <button
          type="submit"
          className="p-1.5 rounded-[2px] bg-[#1A0C32] hover:bg-[#28134C] text-pink-400 border border-pink-500/50 shadow-[0_0_10px_rgba(255,42,133,0.25)] transition-colors"
          title="Submit Clinical Query"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
