"use client";

import React, { useState } from "react";
import { UserCheck, X } from "lucide-react";

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitCheckIn: (data: {
    mood_score: number;
    sleep_hours: number;
    blood_sugar?: number;
    notes?: string;
  }) => Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  onSubmitCheckIn,
}) => {
  const [mood, setMood] = useState(8.0);
  const [sleep, setSleep] = useState(7.5);
  const [bloodSugar, setBloodSugar] = useState<string>("95");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmitCheckIn({
        mood_score: Number(mood),
        sleep_hours: Number(sleep),
        blood_sugar: bloodSugar ? parseFloat(bloodSugar) : undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-fadeIn backdrop-blur-sm">
      <div className="bg-[#0D061A]/95 max-w-md w-full p-6 shadow-[0_0_30px_rgba(0,240,255,0.25)] relative rounded-[2px] border border-cyan-400/50 backdrop-blur-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-cyan-400 hover:text-white p-1 rounded-[2px] border border-cyan-400/30 hover:bg-[#1C0D34]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-cyan-400/30">
          <div className="w-7 h-7 rounded-[2px] bg-cyan-500/20 border border-cyan-400/50 flex items-center justify-center text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.3)]">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-display-vc text-[13px] text-cyan-300 tracking-wider">
              BIOMETRIC SELF-LOG
            </h3>
            <p className="font-telemetry-mono text-[9px] text-pink-400">
              NASA HRP // SUBJECTIVE READINESS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Mood / Cognitive Readiness Slider */}
          <div className="p-3 bg-[#130724]/85 border border-purple-500/40 rounded-[2px] shadow-[0_0_10px_rgba(168,85,247,0.12)]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-display-vc text-[11px] text-purple-300 tracking-wider">
                PSYCHOLOGICAL READINESS
              </label>
              <span className="font-telemetry-mono text-[13px] text-cyan-300 font-bold">
                {Number(mood).toFixed(1)} / 10.0
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={mood}
              onChange={(e) => setMood(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-none accent-pink-500 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-telemetry-mono text-neutral-400 mt-1">
              <span>ACUTE FATIGUE</span>
              <span>NOMINAL ALERTNESS</span>
            </div>
          </div>

          {/* Sleep Hours Slider */}
          <div className="p-3 bg-[#130724]/85 border border-purple-500/40 rounded-[2px] shadow-[0_0_10px_rgba(168,85,247,0.12)]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-display-vc text-[11px] text-purple-300 tracking-wider">
                CIRCADIAN SLEEP RECORD
              </label>
              <span className="font-telemetry-mono text-[13px] text-pink-400 font-bold">
                {Number(sleep).toFixed(1)} h
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-none accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-telemetry-mono text-neutral-400 mt-1">
              <span>0h (DEPLETED)</span>
              <span>8h (CIRCADIAN_NOM)</span>
              <span>12h</span>
            </div>
          </div>

          {/* Capillary Glucose Input */}
          <div className="p-3 bg-[#130724]/85 border border-purple-500/40 rounded-[2px] shadow-[0_0_10px_rgba(168,85,247,0.12)]">
            <label className="block font-display-vc text-[11px] text-cyan-300 tracking-wider mb-1.5">
              CAPILLARY GLUCOSE (mg/dL)
            </label>
            <input
              type="number"
              min="40"
              max="300"
              value={bloodSugar}
              onChange={(e) => setBloodSugar(e.target.value)}
              placeholder="e.g. 95"
              className="w-full bg-[#0A0414] border border-cyan-400/40 rounded-[2px] p-2 text-white font-telemetry-mono text-[13px] focus:border-cyan-300 outline-none"
            />
          </div>

          {/* Clinical Symptom Notes */}
          <div className="p-3 bg-[#130724]/85 border border-purple-500/40 rounded-[2px] shadow-[0_0_10px_rgba(168,85,247,0.12)]">
            <label className="block font-display-vc text-[11px] text-pink-300 tracking-wider mb-1.5">
              PHYSIOLOGICAL OBSERVATION NOTES
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Subjective sensory or vestibulocochlear symptoms..."
              className="w-full bg-[#0A0414] border border-pink-500/40 rounded-[2px] p-2 text-white font-body-vc text-[12px] focus:border-pink-300 outline-none resize-none placeholder:text-neutral-500"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-[2px] border border-pink-500/40 font-telemetry-mono text-[11px] text-pink-300 hover:bg-[#1D0C36] transition-colors"
            >
              ABORT
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-[2px] bg-[#1B0C32] border border-cyan-400/60 text-cyan-200 font-display-vc font-bold text-[12px] hover:bg-[#28134C] hover:border-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
            >
              {isSubmitting ? "RECORDING..." : "COMMIT TELEMETRY LOG"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
