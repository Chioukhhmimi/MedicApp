/**
 * Snooze planning — pure logic for the "remind me later" loop.
 *
 * Feature 5: if a dose is Skipped or Later, MediTrack re-reminds every
 * `snoozeIntervalMin` minutes until the user marks it Taken, capped at
 * `maxSnoozeRepeats` to guarantee the loop terminates.
 *
 * Each snooze produces a *child* Occurrence linked to the original via
 * `parentOccurrenceId`, so history stays attributable to one real dose.
 */
import { DateTime } from 'luxon';
import type { MedicationSnoozeOverride, Occurrence, Settings } from './types';

export interface SnoozePlan {
  /** ISO UTC timestamp for the next reminder. */
  scheduledTime: string;
  /** snoozeCount the child occurrence should carry. */
  nextSnoozeCount: number;
}

/** Resolves the effective snooze config (per-med override beats global). */
export function effectiveSnoozeConfig(
  settings: Settings,
  override?: MedicationSnoozeOverride | null,
): { intervalMin: number; maxRepeats: number } {
  return {
    intervalMin:
      override?.snoozeIntervalMin ?? settings.defaultSnoozeIntervalMin,
    maxRepeats: override?.maxSnoozeRepeats ?? settings.maxSnoozeRepeats,
  };
}

/**
 * Plans the next snooze reminder for an occurrence.
 *
 * @returns the next SnoozePlan, or `null` when the repeat cap is reached —
 *          callers MUST treat null as "stop reminding" to avoid infinite loops.
 */
export function planSnooze(
  occurrence: Occurrence,
  settings: Settings,
  override: MedicationSnoozeOverride | null,
  fromIso: string,
): SnoozePlan | null {
  // Resolved doses never snooze again.
  if (occurrence.status === 'taken' || occurrence.canceled) return null;

  const { intervalMin, maxRepeats } = effectiveSnoozeConfig(settings, override);
  if (occurrence.snoozeCount >= maxRepeats) return null;

  const next = DateTime.fromISO(fromIso, { zone: 'utc' }).plus({
    minutes: intervalMin,
  });
  return {
    scheduledTime: next.toUTC().toISO()!,
    nextSnoozeCount: occurrence.snoozeCount + 1,
  };
}
