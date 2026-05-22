/**
 * Adherence reporting — pure aggregation over occurrences.
 *
 * Feature 6: report an adherence percentage for a selected date range.
 * "Adherence" = doses Taken ÷ doses that were actually due (past, not
 * canceled). Future doses and canceled doses are excluded so the number
 * reflects real behaviour rather than scheduling noise.
 */
import { DateTime } from 'luxon';
import type { Occurrence } from './types';

export interface AdherenceSummary {
  total: number; // due, non-canceled, primary doses in range
  taken: number;
  skipped: number;
  missed: number; // due in the past but never resolved
  upcoming: number; // due in the future (informational only)
  adherencePct: number; // taken / total * 100, 0 when total is 0
}

/**
 * Aggregates adherence over [fromIso, toIso].
 *
 * Snooze children (`parentOccurrenceId` set) are ignored — they represent the
 * same physical dose as their parent and would otherwise double-count.
 */
export function computeAdherence(
  occurrences: Occurrence[],
  fromIso: string,
  toIso: string,
  nowIso: string = DateTime.utc().toISO()!,
): AdherenceSummary {
  const from = DateTime.fromISO(fromIso, { zone: 'utc' });
  const to = DateTime.fromISO(toIso, { zone: 'utc' });
  const now = DateTime.fromISO(nowIso, { zone: 'utc' });

  let taken = 0;
  let skipped = 0;
  let missed = 0;
  let upcoming = 0;

  for (const occ of occurrences) {
    if (occ.canceled || occ.parentOccurrenceId) continue;
    const t = DateTime.fromISO(occ.scheduledTime, { zone: 'utc' });
    if (t < from || t > to) continue;

    if (t > now) {
      upcoming++;
      continue;
    }
    if (occ.status === 'taken') taken++;
    else if (occ.status === 'skipped') skipped++;
    else missed++; // 'pending' or 'later' that is now in the past
  }

  const total = taken + skipped + missed;
  return {
    total,
    taken,
    skipped,
    missed,
    upcoming,
    adherencePct: total > 0 ? Math.round((taken / total) * 1000) / 10 : 0,
  };
}
