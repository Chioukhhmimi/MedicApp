/**
 * Medication store (Zustand).
 *
 * Holds the in-memory medication list and exposes high-level actions that
 * wrap the database + schedule services. Screens read `medications` and call
 * actions; they never touch SQLite directly.
 */
import { create } from 'zustand';
import { DateTime } from 'luxon';
import {
  deleteMedication,
  getRulesForMed,
  listMedications,
  replaceRules,
  upsertMedication,
} from '@/services/database';
import { cancelAllNotifications } from '@/services/notifications';
import {
  cancelSeries,
  ensureHorizon,
  regenerateForMed,
  syncNotificationWindow,
} from '@/services/scheduleService';
import { newId } from '@/lib/id';
import { deviceZone } from '@/lib/dates';
import type { Medication, ScheduleRule, ScheduleType } from '@/lib/types';

/** Shape of a schedule as edited in the UI (rule without ids/timezone). */
export interface ScheduleDraft {
  type: ScheduleType;
  times: string[];
  weekdays?: number[];
  intervalDays?: number;
  pattern?: number[];
}

/** Medication fields as edited in the form (no id/timestamps). */
export type MedicationDraft = Omit<
  Medication,
  'id' | 'createdAt' | 'updatedAt' | 'paused'
>;

interface MedState {
  medications: Medication[];
  loading: boolean;

  /** Loads meds and refreshes the 60-day occurrence horizon. */
  bootstrap: () => Promise<void>;
  refresh: () => Promise<void>;

  /** Creates or updates a medication together with its schedule. */
  saveMedication: (
    draft: MedicationDraft,
    schedule: ScheduleDraft,
    existingId?: string,
  ) => Promise<string>;

  removeMedication: (id: string) => Promise<void>;
  setPaused: (id: string, paused: boolean) => Promise<void>;
  getRules: (medId: string) => Promise<ScheduleRule[]>;
  cancelFutureSeries: (medId: string, fromIso?: string) => Promise<number>;
}

export const useMedStore = create<MedState>((set, get) => ({
  medications: [],
  loading: false,

  bootstrap: async () => {
    set({ loading: true });
    try {
      await ensureHorizon();
      const medications = await listMedications();
      set({ medications });
    } finally {
      set({ loading: false });
    }
  },

  refresh: async () => {
    set({ medications: await listMedications() });
  },

  saveMedication: async (draft, schedule, existingId) => {
    const now = DateTime.utc().toISO()!;
    const id = existingId ?? newId('med');
    const existing = existingId
      ? get().medications.find((m) => m.id === existingId)
      : undefined;

    const med: Medication = {
      ...draft,
      id,
      paused: existing?.paused ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    await upsertMedication(med);

    // A medication has exactly one schedule rule in v1; editing replaces it.
    const rule: ScheduleRule = {
      id: newId('rule'),
      medId: id,
      type: schedule.type,
      timezone: deviceZone(),
      startDate: draft.startDate,
      endDate: draft.endDate,
      times: schedule.times,
      weekdays: schedule.weekdays,
      intervalDays: schedule.intervalDays,
      pattern: schedule.pattern,
    };
    await replaceRules(id, [rule]);

    // Editing a schedule invalidates pending future occurrences.
    if (existingId) {
      await cancelSeries(id, { fromIso: now });
    }
    await regenerateForMed(id);
    await get().refresh();
    return id;
  },

  removeMedication: async (id) => {
    await cancelSeries(id, { fromIso: '1970-01-01T00:00:00.000Z' });
    await deleteMedication(id);
    await get().refresh();
  },

  setPaused: async (id, paused) => {
    const med = get().medications.find((m) => m.id === id);
    if (!med) return;
    await upsertMedication({
      ...med,
      paused,
      updatedAt: DateTime.utc().toISO()!,
    });
    await regenerateForMed(id);
    if (!paused) await syncNotificationWindow(id);
    await get().refresh();
  },

  getRules: (medId) => getRulesForMed(medId),

  cancelFutureSeries: async (medId, fromIso) => {
    const count = await cancelSeries(medId, {
      fromIso: fromIso ?? DateTime.utc().toISO()!,
    });
    return count;
  },
}));

/** Clears every scheduled OS notification (used by destructive settings). */
export async function purgeAllNotifications(): Promise<void> {
  await cancelAllNotifications();
}
