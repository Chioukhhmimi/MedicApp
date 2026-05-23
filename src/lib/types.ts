/**
 * MediTrack — core domain models.
 *
 * Dates are stored as ISO strings so they survive SQLite round-trips:
 *  - "calendar dates"  -> 'YYYY-MM-DD'        (no time, no zone)
 *  - "timestamps"      -> full ISO 8601 UTC  (e.g. 2026-05-19T07:00:00.000Z)
 * Every ScheduleRule carries its own IANA `timezone`, so an occurrence's
 * wall-clock time is always reproducible regardless of where the device is.
 */

/** A medication the user is tracking. */
export interface Medication {
  id: string;
  name: string; // required — validated by zod
  strength?: string; // e.g. "500" — free text paired with `unit`
  doseQuantity: number; // how many units per intake, e.g. 2
  unit: string; // "pill", "ml", "tablet", "puff", ...
  notes?: string;
  startDate: string; // 'YYYY-MM-DD' — first day the medication applies
  endDate?: string; // 'YYYY-MM-DD' — optional last day (inclusive)
  pillColor?: string; // hex color used as the card accent / icon tint
  icon?: string; // optional icon key
  paused: boolean; // paused meds keep data but generate no occurrences
  createdAt: string; // ISO timestamp
  updatedAt: string; // ISO timestamp
}

/** Discriminator for the four supported schedule families. */
export type ScheduleType = 'daily' | 'weekly' | 'interval' | 'pattern';

/**
 * A deterministic description of *when* a medication is due.
 *
 * One ScheduleRule belongs to exactly one Medication (`medId`). The scheduler
 * never mutates a rule — editing a schedule replaces the rule and recomputes
 * future occurrences.
 */
export interface ScheduleRule {
  id: string;
  medId: string;
  type: ScheduleType;
  timezone: string; // IANA zone, e.g. "Europe/Paris"
  startDate: string; // 'YYYY-MM-DD' — anchor for interval/pattern math
  endDate?: string; // 'YYYY-MM-DD' — optional inclusive end

  /** Reminder times in 24h "HH:mm". Each time yields its own occurrence. */
  times: string[];

  /** weekly only: ISO weekdays to fire on (1 = Mon … 7 = Sun). */
  weekdays?: number[];

  /** interval only: fire every N days counting from `startDate`. */
  intervalDays?: number;

  /**
   * pattern only: repeating take/skip mask aligned to `startDate`.
   * 1 = take, 0 = skip. e.g. [1,0] = every other day.
   */
  pattern?: number[];
}

/** What the user did with a scheduled dose. */
export type UserAction = 'taken' | 'skipped' | 'later' | 'pending';

/** How a log entry was produced — useful for auditing/debugging. */
export type LogSource = 'notification' | 'manual' | 'auto' | 'snooze';

/**
 * A single concrete dose event, pre-generated 30–90 days ahead and stored
 * locally. Snooze repeats are modelled as new occurrences that point back to
 * their origin via `parentOccurrenceId`.
 */
export interface Occurrence {
  id: string;
  medId: string;
  ruleId: string;
  scheduledTime: string; // full ISO UTC timestamp the dose is due
  status: UserAction; // 'pending' until the user resolves it
  notificationId?: string; // expo-notifications identifier (for cancel)
  parentOccurrenceId?: string; // set on snooze children
  snoozeCount: number; // how many times this dose chain has snoozed
  canceled: boolean; // true if the user canceled this occurrence
  createdAt: string;
}

/**
 * Immutable history record. One LogEntry is appended whenever a user resolves
 * an occurrence. Logs are never edited or deleted — corrections append a new
 * entry instead, keeping an honest adherence trail.
 */
export interface LogEntry {
  id: string;
  occurrenceId: string;
  medId: string;
  scheduledTime: string; // ISO UTC — when the dose was due
  userAction: Exclude<UserAction, 'pending'>;
  actionTime: string; // ISO UTC — when the user acted
  source: LogSource;
  note?: string;
}

/** Supported UI languages — French (default), English, Arabic (RTL). */
export type AppLanguage = 'fr' | 'en' | 'ar';

/** App-wide settings, persisted in SQLite (a single row). */
export interface Settings {
  defaultSnoozeIntervalMin: number; // minutes between snooze reminders
  maxSnoozeRepeats: number; // hard cap to prevent infinite loops
  quietHoursEnabled: boolean;
  quietHoursStart: string; // "HH:mm"
  quietHoursEnd: string; // "HH:mm"
  notificationSound: string; // "default" or a bundled sound key
  biometricLock: boolean;
  onboardingComplete: boolean;
  language: AppLanguage; // chosen UI language; defaults to French
}

/** Per-medication overrides for snooze behaviour (null = use global). */
export interface MedicationSnoozeOverride {
  medId: string;
  snoozeIntervalMin: number | null;
  maxSnoozeRepeats: number | null;
}

export const DEFAULT_SETTINGS: Settings = {
  defaultSnoozeIntervalMin: 30,
  maxSnoozeRepeats: 6,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  notificationSound: 'default',
  biometricLock: false,
  onboardingComplete: false,
  language: 'fr',
};
