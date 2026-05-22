/**
 * Schedule orchestration — the glue between the pure scheduler, SQLite, and
 * the OS notification queue.
 *
 * Public flow:
 *   ensureHorizon()      — called on app launch & after edits; pre-generates
 *                          occurrences 60 days ahead and (re)schedules a
 *                          rolling window of OS notifications.
 *   regenerateForMed()   — called after a medication's schedule changes.
 *   resolveOccurrence()  — called from the Confirmation screen; logs the
 *                          action and drives the snooze loop.
 *
 * Why a rolling notification window: iOS caps pending local notifications at
 * ~64. Occurrences live in SQLite indefinitely; only the next
 * NOTIFICATION_WINDOW_DAYS are mirrored into the OS queue.
 */
import { DateTime } from 'luxon';
import {
  appendLog,
  cancelOccurrences,
  getMedication,
  getOccurrence,
  getOccurrencesBetween,
  getRulesForMed,
  getSettings,
  getSnoozeOverride,
  insertOccurrence,
  listMedications,
  setOccurrenceNotificationId,
  updateOccurrenceStatus,
} from './database';
import {
  cancelNotification,
  scheduleOccurrenceNotification,
} from './notifications';
import { generateUpcoming } from '@/lib/scheduler';
import { planSnooze } from '@/lib/snooze';
import { newId } from '@/lib/id';
import type { LogEntry, Occurrence, UserAction } from '@/lib/types';

const HORIZON_DAYS = 60;
const NOTIFICATION_WINDOW_DAYS = 14;

/**
 * Generates occurrences for one medication's rules, de-duplicated against
 * what is already stored, then refreshes its notification window.
 */
export async function regenerateForMed(medId: string): Promise<void> {
  const med = await getMedication(medId);
  if (!med) return;

  const nowIso = DateTime.utc().toISO()!;
  const horizonIso = DateTime.utc().plus({ days: HORIZON_DAYS }).toISO()!;

  // Existing future occurrences — keep resolved ones, drop stale pending ones.
  const existing = await getOccurrencesBetween(nowIso, horizonIso, medId);
  const known = new Set(existing.map((o) => `${o.ruleId}@${o.scheduledTime}`));

  if (med.paused) {
    // Paused meds keep history but cancel every pending future reminder.
    for (const o of existing) {
      if (o.status === 'pending' && o.notificationId) {
        await cancelNotification(o.notificationId);
        await setOccurrenceNotificationId(o.id, null);
      }
    }
    return;
  }

  const rules = await getRulesForMed(medId);
  for (const rule of rules) {
    const times = generateUpcoming(rule, nowIso, HORIZON_DAYS);
    for (const scheduledTime of times) {
      if (known.has(`${rule.id}@${scheduledTime}`)) continue;
      const occ: Occurrence = {
        id: newId('occ'),
        medId,
        ruleId: rule.id,
        scheduledTime,
        status: 'pending',
        snoozeCount: 0,
        canceled: false,
        createdAt: nowIso,
      };
      await insertOccurrence(occ);
    }
  }
  await syncNotificationWindow(medId);
}

/** Runs regeneration for every medication. Cheap to call on every launch. */
export async function ensureHorizon(): Promise<void> {
  const meds = await listMedications();
  for (const med of meds) {
    await regenerateForMed(med.id);
  }
}

/**
 * Ensures every pending occurrence inside the rolling window has a live OS
 * notification, and that occurrences outside it / already resolved do not.
 */
export async function syncNotificationWindow(medId?: string): Promise<void> {
  const nowIso = DateTime.utc().toISO()!;
  const windowEnd = DateTime.utc()
    .plus({ days: NOTIFICATION_WINDOW_DAYS })
    .toISO()!;
  const occ = await getOccurrencesBetween(nowIso, windowEnd, medId);

  for (const o of occ) {
    const shouldHave = o.status === 'pending' && !o.canceled;
    if (shouldHave && !o.notificationId) {
      const med = await getMedication(o.medId);
      if (!med || med.paused) continue;
      const id = await scheduleOccurrenceNotification(o, med);
      if (id) await setOccurrenceNotificationId(o.id, id);
    } else if (!shouldHave && o.notificationId) {
      await cancelNotification(o.notificationId);
      await setOccurrenceNotificationId(o.id, null);
    }
  }
}

/**
 * Resolves an occurrence from the Confirmation screen.
 *
 *  - taken   -> log, cancel any pending notification, end the snooze chain.
 *  - skipped -> log, then start/continue the snooze loop (Feature 5).
 *  - later   -> log, then start/continue the snooze loop.
 *
 * Returns the snooze child created (if any) so the UI can confirm "we'll
 * remind you again at HH:mm" — or null when the repeat cap was reached.
 */
export async function resolveOccurrence(
  occurrenceId: string,
  action: Exclude<UserAction, 'pending'>,
  opts: { note?: string; source?: LogEntry['source'] } = {},
): Promise<Occurrence | null> {
  const occ = await getOccurrence(occurrenceId);
  if (!occ) return null;

  const nowIso = DateTime.utc().toISO()!;
  await updateOccurrenceStatus(occ.id, action);

  const log: LogEntry = {
    id: newId('log'),
    occurrenceId: occ.id,
    medId: occ.medId,
    scheduledTime: occ.scheduledTime,
    userAction: action,
    actionTime: nowIso,
    source: opts.source ?? 'notification',
    note: opts.note,
  };
  await appendLog(log);

  // Always clear this occurrence's own pending notification.
  if (occ.notificationId) {
    await cancelNotification(occ.notificationId);
    await setOccurrenceNotificationId(occ.id, null);
  }

  if (action === 'taken') {
    return null; // dose done — no further reminders.
  }

  // Skipped or Later -> plan the next snooze reminder.
  const settings = await getSettings();
  const override = await getSnoozeOverride(occ.medId);
  const plan = planSnooze(occ, settings, override, nowIso);
  if (!plan) return null; // repeat cap reached — stop, no infinite loop.

  const med = await getMedication(occ.medId);
  if (!med || med.paused) return null;

  const child: Occurrence = {
    id: newId('occ'),
    medId: occ.medId,
    ruleId: occ.ruleId,
    scheduledTime: plan.scheduledTime,
    status: 'pending',
    parentOccurrenceId: occ.parentOccurrenceId ?? occ.id,
    snoozeCount: plan.nextSnoozeCount,
    canceled: false,
    createdAt: nowIso,
  };
  await insertOccurrence(child);
  const notifId = await scheduleOccurrenceNotification(child, med);
  if (notifId) await setOccurrenceNotificationId(child.id, notifId);
  return child;
}

/**
 * Cancels a single occurrence or a medication's whole future series, removing
 * the matching OS notifications. Returns how many occurrences were canceled
 * (callers warn the user when this is > 1 — Feature 7).
 */
export async function cancelSeries(
  medId: string,
  opts: { occurrenceId?: string; fromIso?: string },
): Promise<number> {
  const nowIso = DateTime.utc().toISO()!;
  const horizonIso = DateTime.utc().plus({ days: HORIZON_DAYS }).toISO()!;
  const affected = await getOccurrencesBetween(nowIso, horizonIso, medId);

  for (const o of affected) {
    const match = opts.occurrenceId
      ? o.id === opts.occurrenceId
      : o.status === 'pending' && o.scheduledTime >= (opts.fromIso ?? nowIso);
    if (match && o.notificationId) {
      await cancelNotification(o.notificationId);
      await setOccurrenceNotificationId(o.id, null);
    }
  }
  return cancelOccurrences(medId, opts);
}
