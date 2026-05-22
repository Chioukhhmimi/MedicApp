/**
 * Scheduling-engine tests — daily, weekly, interval and binary-pattern
 * schedules, plus timezone & DST correctness. All pure; no mocks needed.
 */
import { DateTime } from 'luxon';
import {
  describeRule,
  generateUpcoming,
  isActiveDay,
  nextOccurrence,
  occurrencesBetween,
} from '@/lib/scheduler';
import type { ScheduleRule } from '@/lib/types';

function rule(partial: Partial<ScheduleRule>): ScheduleRule {
  return {
    id: 'r1',
    medId: 'm1',
    type: 'daily',
    timezone: 'UTC',
    startDate: '2026-01-01',
    times: ['08:00'],
    ...partial,
  };
}

describe('nextOccurrence — daily', () => {
  it('returns the next time on the same day', () => {
    const r = rule({ type: 'daily', times: ['08:00', '20:00'] });
    const next = nextOccurrence(r, '2026-01-05T09:00:00.000Z');
    expect(next).toBe('2026-01-05T20:00:00.000Z');
  });

  it('rolls to the next day when all times have passed', () => {
    const r = rule({ type: 'daily', times: ['08:00', '20:00'] });
    const next = nextOccurrence(r, '2026-01-05T21:00:00.000Z');
    expect(next).toBe('2026-01-06T08:00:00.000Z');
  });

  it('never returns a time before the rule start date', () => {
    const r = rule({ type: 'daily', startDate: '2026-06-01' });
    const next = nextOccurrence(r, '2026-01-01T00:00:00.000Z');
    expect(next).toBe('2026-06-01T08:00:00.000Z');
  });

  it('returns null once the rule end date has passed', () => {
    const r = rule({ type: 'daily', endDate: '2026-01-10' });
    expect(nextOccurrence(r, '2026-02-01T00:00:00.000Z')).toBeNull();
  });
});

describe('nextOccurrence — weekly', () => {
  // 2026-01-01 is a Thursday (ISO weekday 4).
  it('fires only on selected weekdays (Mon & Fri)', () => {
    const r = rule({ type: 'weekly', weekdays: [1, 5] });
    // From Thu 2026-01-01 the next Mon/Fri is Fri 2026-01-02.
    expect(nextOccurrence(r, '2026-01-01T00:00:00.000Z')).toBe(
      '2026-01-02T08:00:00.000Z',
    );
    // After Friday's dose, next is Monday 2026-01-05.
    expect(nextOccurrence(r, '2026-01-02T09:00:00.000Z')).toBe(
      '2026-01-05T08:00:00.000Z',
    );
  });
});

describe('nextOccurrence — interval', () => {
  it('fires every 3 days counting from the start date', () => {
    const r = rule({
      type: 'interval',
      intervalDays: 3,
      startDate: '2026-01-01',
    });
    expect(nextOccurrence(r, '2026-01-01T00:00:00.000Z')).toBe(
      '2026-01-01T08:00:00.000Z',
    );
    expect(nextOccurrence(r, '2026-01-01T09:00:00.000Z')).toBe(
      '2026-01-04T08:00:00.000Z',
    );
    expect(nextOccurrence(r, '2026-01-05T00:00:00.000Z')).toBe(
      '2026-01-07T08:00:00.000Z',
    );
  });
});

describe('nextOccurrence — binary pattern', () => {
  it('handles an every-other-day [1,0] pattern', () => {
    const r = rule({
      type: 'pattern',
      pattern: [1, 0],
      startDate: '2026-01-01',
    });
    expect(nextOccurrence(r, '2026-01-01T09:00:00.000Z')).toBe(
      '2026-01-03T08:00:00.000Z',
    );
  });

  it('handles a [1,0,1,0] pattern identically to [1,0]', () => {
    const r = rule({ type: 'pattern', pattern: [1, 0, 1, 0] });
    const days = occurrencesBetween(
      r,
      '2026-01-01T00:00:00.000Z',
      '2026-01-08T00:00:00.000Z',
    );
    expect(days).toEqual([
      '2026-01-01T08:00:00.000Z',
      '2026-01-03T08:00:00.000Z',
      '2026-01-05T08:00:00.000Z',
      '2026-01-07T08:00:00.000Z',
    ]);
  });

  it('handles an asymmetric [1,1,0] pattern', () => {
    const r = rule({ type: 'pattern', pattern: [1, 1, 0] });
    const days = occurrencesBetween(
      r,
      '2026-01-01T00:00:00.000Z',
      '2026-01-07T00:00:00.000Z',
    );
    // take, take, skip, take, take, skip ...
    expect(days).toEqual([
      '2026-01-01T08:00:00.000Z',
      '2026-01-02T08:00:00.000Z',
      '2026-01-04T08:00:00.000Z',
      '2026-01-05T08:00:00.000Z',
    ]);
  });
});

describe('isActiveDay', () => {
  it('respects start/end bounds', () => {
    const r = rule({ startDate: '2026-01-05', endDate: '2026-01-10' });
    const z = (d: string): DateTime =>
      DateTime.fromISO(d, { zone: 'UTC' }).startOf('day');
    expect(isActiveDay(r, z('2026-01-04'))).toBe(false);
    expect(isActiveDay(r, z('2026-01-05'))).toBe(true);
    expect(isActiveDay(r, z('2026-01-10'))).toBe(true);
    expect(isActiveDay(r, z('2026-01-11'))).toBe(false);
  });
});

describe('timezone & DST handling', () => {
  it('keeps the wall-clock time across a spring-forward DST change', () => {
    // Europe/Paris springs forward on 2026-03-29 (02:00 -> 03:00).
    const r = rule({
      type: 'daily',
      timezone: 'Europe/Paris',
      times: ['08:00'],
      startDate: '2026-03-28',
    });
    // Reference times sit just before each day's 08:00 reminder.
    const before = nextOccurrence(r, '2026-03-28T06:00:00+01:00');
    const after = nextOccurrence(r, '2026-03-29T03:00:00+02:00');
    // Both must be local 08:00 Paris despite the offset change.
    expect(DateTime.fromISO(before!).setZone('Europe/Paris').hour).toBe(8);
    expect(DateTime.fromISO(after!).setZone('Europe/Paris').hour).toBe(8);
    // The UTC instants differ by one hour because the offset changed:
    // 08:00 at +01:00 = 07:00 UTC, but 08:00 at +02:00 = 06:00 UTC.
    expect(before).toBe('2026-03-28T07:00:00.000Z');
    expect(after).toBe('2026-03-29T06:00:00.000Z');
  });

  it('produces 7 daily occurrences across a DST week (no gaps/dupes)', () => {
    const r = rule({
      type: 'daily',
      timezone: 'Europe/Paris',
      startDate: '2026-03-26',
    });
    const list = occurrencesBetween(
      r,
      DateTime.fromISO('2026-03-26', { zone: 'Europe/Paris' }),
      DateTime.fromISO('2026-04-02', { zone: 'Europe/Paris' }),
    );
    expect(list).toHaveLength(7);
    list.forEach((iso) =>
      expect(DateTime.fromISO(iso).setZone('Europe/Paris').hour).toBe(8),
    );
  });
});

describe('occurrencesBetween & generateUpcoming', () => {
  it('window is half-open: includes `from`, excludes `to`', () => {
    const r = rule({ type: 'daily' });
    const list = occurrencesBetween(
      r,
      '2026-01-01T08:00:00.000Z',
      '2026-01-03T08:00:00.000Z',
    );
    expect(list).toEqual([
      '2026-01-01T08:00:00.000Z',
      '2026-01-02T08:00:00.000Z',
    ]);
  });

  it('pre-generates ~30 days ahead with two reminder times', () => {
    const r = rule({ type: 'daily', times: ['08:00', '20:00'] });
    const list = generateUpcoming(r, '2026-01-01T00:00:00.000Z', 30);
    expect(list).toHaveLength(60); // 30 days x 2 times
  });

  it('returns an empty array when there are no reminder times', () => {
    const r = rule({ times: [] });
    expect(generateUpcoming(r, '2026-01-01T00:00:00.000Z', 30)).toEqual([]);
  });
});

describe('describeRule', () => {
  it('summarises each schedule type', () => {
    expect(describeRule(rule({ type: 'daily' }))).toContain('Every day');
    expect(describeRule(rule({ type: 'weekly', weekdays: [1, 3] }))).toContain(
      'Mon, Wed',
    );
    expect(describeRule(rule({ type: 'interval', intervalDays: 2 }))).toContain(
      'Every 2',
    );
    expect(describeRule(rule({ type: 'pattern', pattern: [1, 0] }))).toContain(
      '[1,0]',
    );
  });
});
