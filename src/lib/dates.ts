/**
 * Thin date helpers built on Luxon.
 *
 * Luxon is used throughout MediTrack instead of the JS `Date` object because
 * it models IANA time zones and Daylight Saving Time correctly — both are
 * hard requirements for a reminder app (Feature 11: edge cases & reliability).
 */
import { DateTime } from 'luxon';

/** "HH:mm" -> { hour, minute }. Throws on malformed input. */
export function parseTime(time: string): { hour: number; minute: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) throw new Error(`Invalid time string: "${time}"`);
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    throw new Error(`Time out of range: "${time}"`);
  }
  return { hour, minute };
}

/** The device's current IANA zone, e.g. "Europe/Paris". */
export function deviceZone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

/** Start-of-day for an ISO calendar date ('YYYY-MM-DD') in a given zone. */
export function dayStart(isoDate: string, zone: string): DateTime {
  return DateTime.fromISO(isoDate, { zone }).startOf('day');
}

/**
 * Whole-day difference between two start-of-day DateTimes.
 * Rounded because a DST transition makes the raw diff e.g. 0.958 or 1.04 days.
 */
export function calendarDaysBetween(from: DateTime, to: DateTime): number {
  return Math.round(to.diff(from, 'days').days);
}

/** Format an ISO timestamp for display in a target zone. */
export function formatTimestamp(
  iso: string,
  zone: string = deviceZone(),
): string {
  return DateTime.fromISO(iso, { zone }).toFormat('ccc d LLL, HH:mm');
}

/** Is `iso` inside the (possibly overnight) quiet-hours window? */
export function isWithinQuietHours(
  iso: string,
  start: string,
  end: string,
  zone: string = deviceZone(),
): boolean {
  const dt = DateTime.fromISO(iso, { zone });
  const minutes = dt.hour * 60 + dt.minute;
  const s = parseTime(start);
  const e = parseTime(end);
  const startM = s.hour * 60 + s.minute;
  const endM = e.hour * 60 + e.minute;
  // Overnight window (e.g. 22:00 -> 07:00) wraps past midnight.
  return startM <= endM
    ? minutes >= startM && minutes < endM
    : minutes >= startM || minutes < endM;
}
