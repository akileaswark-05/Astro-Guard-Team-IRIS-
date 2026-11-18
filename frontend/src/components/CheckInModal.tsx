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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 select-none animate-fadeIn">
      <div className="bg-[#0D1015] max-w-md w-full p-6 shadow-2xl relative rounded-[2px] border border-tactical">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded-[2px] border border-tactical hover:bg-[#161B26]"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-tactical">
          <div className="w-7 h-7 rounded-[2px] bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-akira text-[12px] text-white tracking-widest">
              BIOMETRIC SELF-LOG
            </h3>
            <p className="font-telemetry-mono text-[10px] text-neutral-400">
              NASA HRP // SUBJECTIVE READINESS
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mood / Cognitive Readiness Slider */}
          <div className="p-3 bg-[#12151D] border border-tactical rounded-[2px]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-akira text-[10px] text-neutral-300 tracking-wider">
                PSYCHOLOGICAL READINESS
              </label>
              <span className="font-telemetry-mono text-[13px] text-cyan-400 font-bold">
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
              className="w-full h-1.5 bg-neutral-800 rounded-none accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-telemetry-mono text-neutral-500 mt-1">
              <span>ACUTE FATIGUE</span>
              <span>NOMINAL ALERTNESS</span>
            </div>
          </div>

          {/* Sleep Hours Slider */}
          <div className="p-3 bg-[#12151D] border border-tactical rounded-[2px]">
            <div className="flex justify-between items-center mb-1.5">
              <label className="font-akira text-[10px] text-neutral-300 tracking-wider">
                CIRCADIAN SLEEP RECORD
              </label>
              <span className="font-telemetry-mono text-[13px] text-cyan-400 font-bold">
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
            <div className="flex justify-between text-[10px] font-telemetry-mono text-neutral-500 mt-1">
              <span>0h (DEPLETED)</span>
              <span>8h (CIRCADIAN_NOM)</span>
              <span>12h</span>
            </div>
          </div>

          {/* Capillary Glucose Input */}
          <div className="p-3 bg-[#12151D] border border-tactical rounded-[2px]">
            <label className="block font-akira text-[10px] text-neutral-300 tracking-wider mb-1.5">
              CAPILLARY GLUCOSE (mg/dL)
            </label>
            <input
              type="number"
              min="40"
              max="300"
              value={bloodSugar}
              onChange={(e) => setBloodSugar(e.target.value)}
              placeholder="e.g. 95"
              className="w-full bg-[#090A0D] border border-tactical rounded-[2px] p-2 text-white font-telemetry-mono text-[13px] focus:border-cyan-400 outline-none"
            />
          </div>

          {/* Clinical Symptom Notes */}
          <div className="p-3 bg-[#12151D] border border-tactical rounded-[2px]">
            <label className="block font-akira text-[10px] text-neutral-300 tracking-wider mb-1.5">
              PHYSIOLOGICAL OBSERVATION NOTES
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Subjective sensory or vestibulocochlear symptoms..."
              className="w-full bg-[#090A0D] border border-tactical rounded-[2px] p-2 text-white font-ui-sans text-[12px] focus:border-cyan-400 outline-none resize-none placeholder:text-neutral-600"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded-[2px] border border-tactical font-telemetry-mono text-[11px] text-neutral-400 hover:bg-[#161B26] transition-colors"
            >
              ABORT
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2 rounded-[2px] bg-[#161B26] border border-cyan-500/40 text-cyan-300 font-telemetry-mono font-bold text-[11px] hover:bg-[#1E2536] hover:border-cyan-400 transition-colors"
            >
              {isSubmitting ? "RECORDING..." : "COMMIT TELEMETRY LOG"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
