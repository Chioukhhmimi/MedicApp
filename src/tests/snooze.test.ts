/**
 * Snooze-logic tests — verifies the 30-minute repeat loop and, crucially,
 * that it terminates at the repeat cap (no infinite reminders — Feature 5).
 */
import { effectiveSnoozeConfig, planSnooze } from '@/lib/snooze';
import { DEFAULT_SETTINGS } from '@/lib/types';
import type { Occurrence } from '@/lib/types';

function occ(partial: Partial<Occurrence>): Occurrence {
  return {
    id: 'o1',
    medId: 'm1',
    ruleId: 'r1',
    scheduledTime: '2026-01-05T08:00:00.000Z',
    status: 'later',
    snoozeCount: 0,
    canceled: false,
    createdAt: '2026-01-05T08:00:00.000Z',
    ...partial,
  };
}

describe('effectiveSnoozeConfig', () => {
  it('falls back to global settings when there is no override', () => {
    expect(effectiveSnoozeConfig(DEFAULT_SETTINGS, null)).toEqual({
      intervalMin: 30,
      maxRepeats: 6,
    });
  });

  it('lets a per-medication override win', () => {
    const cfg = effectiveSnoozeConfig(DEFAULT_SETTINGS, {
      medId: 'm1',
      snoozeIntervalMin: 15,
      maxSnoozeRepeats: 3,
    });
    expect(cfg).toEqual({ intervalMin: 15, maxRepeats: 3 });
  });

  it('mixes override and global per-field (null = use global)', () => {
    const cfg = effectiveSnoozeConfig(DEFAULT_SETTINGS, {
      medId: 'm1',
      snoozeIntervalMin: 10,
      maxSnoozeRepeats: null,
    });
    expect(cfg).toEqual({ intervalMin: 10, maxRepeats: 6 });
  });
});

describe('planSnooze', () => {
  it('schedules the next reminder 30 minutes out', () => {
    const plan = planSnooze(
      occ({ snoozeCount: 0 }),
      DEFAULT_SETTINGS,
      null,
      '2026-01-05T08:00:00.000Z',
    );
    expect(plan).not.toBeNull();
    expect(plan!.scheduledTime).toBe('2026-01-05T08:30:00.000Z');
    expect(plan!.nextSnoozeCount).toBe(1);
  });

  it('stops (returns null) once the repeat cap is reached', () => {
    const plan = planSnooze(
      occ({ snoozeCount: 6 }),
      DEFAULT_SETTINGS,
      null,
      '2026-01-05T11:00:00.000Z',
    );
    expect(plan).toBeNull();
  });

  it('never snoozes a dose already marked taken', () => {
    const plan = planSnooze(
      occ({ status: 'taken' }),
      DEFAULT_SETTINGS,
      null,
      '2026-01-05T08:00:00.000Z',
    );
    expect(plan).toBeNull();
  });

  it('never snoozes a canceled occurrence', () => {
    const plan = planSnooze(
      occ({ canceled: true }),
      DEFAULT_SETTINGS,
      null,
      '2026-01-05T08:00:00.000Z',
    );
    expect(plan).toBeNull();
  });

  it('terminates a full chain after exactly maxRepeats steps', () => {
    let current = occ({ snoozeCount: 0 });
    let from = '2026-01-05T08:00:00.000Z';
    let steps = 0;
    for (;;) {
      const plan = planSnooze(current, DEFAULT_SETTINGS, null, from);
      if (!plan) break;
      steps++;
      current = occ({ snoozeCount: plan.nextSnoozeCount });
      from = plan.scheduledTime;
      if (steps > 50) throw new Error('snooze loop did not terminate');
    }
    expect(steps).toBe(DEFAULT_SETTINGS.maxSnoozeRepeats);
  });
});
