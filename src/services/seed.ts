/**
 * Dev seed helper — loads sample-data/medications.json into the database.
 *
 * Not used in production. Call `seedSampleData()` once from a dev build (e.g.
 * a temporary button on the Settings screen) to populate the app with the
 * four sample medications covering every schedule type.
 */
import sample from '../../sample-data/medications.json';
import { newId } from '@/lib/id';
import { replaceRules, upsertMedication } from './database';
import { regenerateForMed } from './scheduleService';
import type { Medication, ScheduleRule } from '@/lib/types';

interface SampleSchedule {
  type: ScheduleRule['type'];
  timezone: string;
  times: string[];
  weekdays?: number[];
  intervalDays?: number;
  pattern?: number[];
}

interface SampleMed extends Omit<Medication, never> {
  schedule: SampleSchedule;
}

export async function seedSampleData(): Promise<number> {
  const meds = (sample as { medications: SampleMed[] }).medications;
  for (const entry of meds) {
    const { schedule, ...med } = entry;
    await upsertMedication(med as Medication);
    const rule: ScheduleRule = {
      id: newId('rule'),
      medId: med.id,
      type: schedule.type,
      timezone: schedule.timezone,
      startDate: med.startDate,
      endDate: med.endDate,
      times: schedule.times,
      weekdays: schedule.weekdays,
      intervalDays: schedule.intervalDays,
      pattern: schedule.pattern,
    };
    await replaceRules(med.id, [rule]);
    await regenerateForMed(med.id);
  }
  return meds.length;
}
