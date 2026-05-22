/**
 * MediTrack scheduling engine.
 *
 * Pure, deterministic functions — no I/O, no `Date.now()` reads except where a
 * caller passes the reference time in explicitly. This makes every schedule
 * type fully unit-testable (see src/tests/scheduler.test.ts).
 *
 * Core idea: a `ScheduleRule` describes active *calendar days* (in the rule's
 * own IANA time zone) plus a list of reminder `times`. The engine answers two
 * questions:
 *   - nextOccurrence(rule, after)      -> the single next due timestamp
 *   - occurrencesBetween(rule, a, b)   -> every due timestamp in a window
 *
 * All returned timestamps are ISO 8601 UTC strings.
 */
import { DateTime } from 'luxon';
import type { ScheduleRule } from './types';
import { calendarDaysBetween, dayStart, parseTime } from './dates';

/** Safety bound so a misconfigured rule can never loop forever. */
const MAX_SCAN_DAYS = 366 * 3;

/** Normalises Date | ISO string | DateTime into a zoned Luxon DateTime. */
function toDateTime(value: Date | string | DateTime, zone: string): DateTime {
  if (value instanceof DateTime) return value.setZone(zone);
  if (value instanceof Date) {
    return DateTime.fromJSDate(value).setZone(zone);
  }
  return DateTime.fromISO(value, { zone });
}

/**
 * Does `day` (a start-of-day DateTime in the rule's zone) carry a dose?
 *
 * Handles startDate/endDate bounds plus the per-type cadence. Pure.
 */
export function isActiveDay(rule: ScheduleRule, day: DateTime): boolean {
  const start = dayStart(rule.startDate, rule.timezone);
  if (day < start) return false;
  if (rule.endDate) {
    const end = dayStart(rule.endDate, rule.timezone);
    if (day > end) return false;
  }

  const offset = calendarDaysBetween(start, day);

  switch (rule.type) {
    case 'daily':
      return true;

    case 'weekly': {
      const days = rule.weekdays ?? [];
      // Luxon weekday: 1 = Monday … 7 = Sunday.
      return days.includes(day.weekday);
    }

    case 'interval': {
      const n = rule.intervalDays ?? 1;
      if (n < 1) return false;
      return offset % n === 0;
    }

    case 'pattern': {
      const pattern = rule.pattern ?? [];
      if (pattern.length === 0) return false;
      // Pattern repeats forever, aligned to startDate.
      const idx = ((offset % pattern.length) + pattern.length) % pattern.length;
      return pattern[idx] === 1;
    }

    default:
      return false;
  }
}

/** Reminder times sorted ascending so scanning yields chronological output. */
function sortedTimes(rule: ScheduleRule): { hour: number; minute: number }[] {
  return rule.times
    .map(parseTime)
    .sort((a, b) => a.hour * 60 + a.minute - (b.hour * 60 + b.minute));
}

/**
 * Builds the concrete zoned timestamp for a reminder time on a given day.
 *
 * Luxon resolves DST anomalies automatically: on a "spring forward" day a
 * non-existent wall time is pushed forward into the new offset; on "fall back"
 * the earlier instant is chosen. Either way the result is a valid instant.
 */
function timeOnDay(
  day: DateTime,
  time: { hour: number; minute: number },
): DateTime {
  return day.set({
    hour: time.hour,
    minute: time.minute,
    second: 0,
    millisecond: 0,
  });
}

/**
 * The next dose strictly after `after`.
 *
 * @returns ISO 8601 UTC string, or null if the rule has ended.
 */
export function nextOccurrence(
  rule: ScheduleRule,
  after: Date | string | DateTime,
): string | null {
  const afterDT = toDateTime(after, rule.timezone);
  const times = sortedTimes(rule);
  if (times.length === 0) return null;

  let day = afterDT.startOf('day');
  for (let scanned = 0; scanned < MAX_SCAN_DAYS; scanned++) {
    if (rule.endDate) {
      const end = dayStart(rule.endDate, rule.timezone);
      if (day > end) return null;
    }
    if (isActiveDay(rule, day)) {
      for (const time of times) {
        const candidate = timeOnDay(day, time);
        if (candidate > afterDT) {
          return candidate.toUTC().toISO();
        }
      }
    }
    day = day.plus({ days: 1 });
  }
  return null;
}

/**
 * Every dose timestamp in the half-open window [from, to).
 *
 * Used to pre-generate 30–90 days of occurrences into the local database.
 * @returns ascending array of ISO 8601 UTC strings.
 */
export function occurrencesBetween(
  rule: ScheduleRule,
  from: Date | string | DateTime,
  to: Date | string | DateTime,
): string[] {
  const fromDT = toDateTime(from, rule.timezone);
  const toDT = toDateTime(to, rule.timezone);
  const times = sortedTimes(rule);
  const out: string[] = [];
  if (times.length === 0 || toDT <= fromDT) return out;

  let day = fromDT.startOf('day');
  for (let scanned = 0; scanned < MAX_SCAN_DAYS; scanned++) {
    if (day.startOf('day') > toDT) break;
    if (rule.endDate) {
      const end = dayStart(rule.endDate, rule.timezone);
      if (day > end) break;
    }
    if (isActiveDay(rule, day)) {
      for (const time of times) {
        const candidate = timeOnDay(day, time);
        if (candidate >= fromDT && candidate < toDT) {
          out.push(candidate.toUTC().toISO()!);
        }
      }
    }
    day = day.plus({ days: 1 });
  }
  return out;
}

/**
 * Convenience wrapper: pre-generate occurrences for `daysAhead` days from
 * `fromIso`. This is what the app calls on launch and after any schedule edit.
 */
export function generateUpcoming(
  rule: ScheduleRule,
  fromIso: string,
  daysAhead = 60,
): string[] {
  const from = DateTime.fromISO(fromIso, { zone: rule.timezone });
  const to = from.plus({ days: daysAhead });
  return occurrencesBetween(rule, from, to);
}

/** Human-readable summary of a rule, used on cards and detail screens. */
export function describeRule(rule: ScheduleRule): string {
  const timeList = rule.times.join(', ');
  switch (rule.type) {
    case 'daily':
      return `Every day at ${timeList}`;
    case 'weekly': {
      const names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const picked = (rule.weekdays ?? [])
        .slice()
        .sort((a, b) => a - b)
        .map((w) => names[w - 1])
        .join(', ');
      return `${picked || 'No days'} at ${timeList}`;
    }
    case 'interval':
      return `Every ${rule.intervalDays ?? 1} day(s) at ${timeList}`;
    case 'pattern':
      return `Pattern [${(rule.pattern ?? []).join(',')}] at ${timeList}`;
    default:
      return timeList;
  }
}

/** Common pattern presets surfaced in the schedule editor. */
export const PATTERN_PRESETS: { label: string; pattern: number[] }[] = [
  { label: 'Every other day', pattern: [1, 0] },
  { label: 'Two on, one off', pattern: [1, 1, 0] },
  { label: 'One on, two off', pattern: [1, 0, 0] },
  { label: 'Weekdays-ish (5 on, 2 off)', pattern: [1, 1, 1, 1, 1, 0, 0] },
];
