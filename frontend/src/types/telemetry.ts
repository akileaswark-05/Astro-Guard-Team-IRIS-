export type OrganSystem =
  | "cardiovascular"
  | "neuro_behavioral"
  | "metabolic_endocrine"
  | "immune_radiation";

export type Severity = "NOMINAL" | "WATCH" | "CRITICAL";

export interface Vitals {
  heart_rate: number;
  systolic_bp: number;
  diastolic_bp: number;
  blood_sugar: number;
  body_temp: number;
  sleep_hours: number;
  mood_score: number;
}

export interface SpaceWeather {
  source: string;
  solar_radiation_level: Severity | "ELEVATED" | "SEVERE";
  kp_index: number;
  cme_flux: string;
  last_flare_class: string;
  radiation_dose_rate_uSv_h: number;
  updated_at: string;
  alert?: string;
}

export interface CountermeasureQuest {
  quest_id: string;
  title: string;
  category: string;
  xp_reward: number;
  duration_seconds: number;
}

export interface FlightSurgeonExplanation {
  organ_system: OrganSystem;
  severity: Severity;
  plain_english_summary: string;
  why_measured: string;
  spaceflight_hazard_link: string;
  actionable_steps: string[];
  recommended_quest: CountermeasureQuest;
}

export interface CompletedQuest {
  quest_id: string;
  title: string;
  category: string;
  xp_reward: number;
  completed_at: string;
}

export interface CrewReadiness {
  xp: number;
  level: number;
  streak_days: number;
  recovery_active: boolean;
  recovery_ticks_remaining: number;
  recent_completed_quests: CompletedQuest[];
}

export interface TelemetryPacket {
  timestamp: string;
  scenario: string;
  vitals: Vitals;
  space_weather: SpaceWeather;
  crew_readiness: CrewReadiness;
  anomaly_score?: number;
  is_anomaly?: boolean;
  organ_status?: Record<OrganSystem, Severity>;
  active_explanation?: FlightSurgeonExplanation;
}

