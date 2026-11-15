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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-neutral-950/95 max-w-md w-full p-6 shadow-2xl relative rounded-lg border border-white/15">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white p-1 rounded"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4 pb-3 hairline-b">
          <div className="w-7 h-7 rounded bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-ui-medium text-[16px] text-white">
              Daily astronaut check-in
            </h3>
            <span className="text-[12px] font-telemetry-mono text-neutral-400">
              Subjective resilience & sleep logging
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1 text-[13px] font-ui-sans">
              <label className="text-neutral-300">Mood score</label>
              <span className="font-telemetry-mono text-amber-400">{mood}/10</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={mood}
              onChange={(e) => setMood(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-[13px] font-ui-sans">
              <label className="text-neutral-300">Sleep hours</label>
              <span className="font-telemetry-mono text-amber-400">{sleep} h</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              step="0.5"
              value={sleep}
              onChange={(e) => setSleep(parseFloat(e.target.value))}
              className="w-full accent-amber-400 bg-neutral-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-[13px] font-ui-sans text-neutral-300 mb-1">
              Capillary blood glucose (mg/dL)
            </label>
            <input
              type="number"
              value={bloodSugar}
              onChange={(e) => setBloodSugar(e.target.value)}
              placeholder="e.g. 95"
              className="w-full bg-neutral-900 border border-white/15 rounded px-3 py-1.5 font-telemetry-mono text-[13px] text-white focus:border-amber-400 outline-none"
            />
          </div>

          <div>
            <label className="block text-[13px] font-ui-sans text-neutral-300 mb-1">
              Clinical notes / observations
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Head fullness, vestibular motion sickness, visual phosphenes..."
              className="w-full bg-neutral-900 border border-white/15 rounded p-2 text-[13px] font-ui-sans text-white focus:border-amber-400 outline-none resize-none"
            />
          </div>

          <div className="pt-2 hairline-t flex justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-[13px] font-ui-sans text-neutral-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 bg-white text-black font-ui-medium text-[13px] rounded hover:bg-neutral-200 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Submitting..." : "Submit check-in"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
