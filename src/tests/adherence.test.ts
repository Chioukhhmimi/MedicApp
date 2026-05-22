/**
 * Adherence-aggregation tests (Feature 6).
 */
import { computeAdherence } from '@/lib/adherence';
import type { Occurrence } from '@/lib/types';

function occ(partial: Partial<Occurrence>): Occurrence {
  return {
    id: Math.random().toString(36),
    medId: 'm1',
    ruleId: 'r1',
    scheduledTime: '2026-01-05T08:00:00.000Z',
    status: 'pending',
    snoozeCount: 0,
    canceled: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...partial,
  };
}

const FROM = '2026-01-01T00:00:00.000Z';
const TO = '2026-01-31T00:00:00.000Z';
const NOW = '2026-01-20T00:00:00.000Z';

describe('computeAdherence', () => {
  it('computes the percentage from past, non-canceled doses', () => {
    const data = [
      occ({ scheduledTime: '2026-01-05T08:00:00.000Z', status: 'taken' }),
      occ({ scheduledTime: '2026-01-06T08:00:00.000Z', status: 'taken' }),
      occ({ scheduledTime: '2026-01-07T08:00:00.000Z', status: 'skipped' }),
      occ({ scheduledTime: '2026-01-08T08:00:00.000Z', status: 'pending' }),
    ];
    const s = computeAdherence(data, FROM, TO, NOW);
    expect(s.total).toBe(4);
    expect(s.taken).toBe(2);
    expect(s.skipped).toBe(1);
    expect(s.missed).toBe(1); // past + still pending
    expect(s.adherencePct).toBe(50);
  });

  it('excludes future doses from the total but counts them as upcoming', () => {
    const data = [
      occ({ scheduledTime: '2026-01-05T08:00:00.000Z', status: 'taken' }),
      occ({ scheduledTime: '2026-01-25T08:00:00.000Z', status: 'pending' }),
    ];
    const s = computeAdherence(data, FROM, TO, NOW);
    expect(s.total).toBe(1);
    expect(s.upcoming).toBe(1);
    expect(s.adherencePct).toBe(100);
  });

  it('ignores canceled occurrences and snooze children', () => {
    const data = [
      occ({ scheduledTime: '2026-01-05T08:00:00.000Z', status: 'taken' }),
      occ({ scheduledTime: '2026-01-06T08:00:00.000Z', canceled: true }),
      occ({
        scheduledTime: '2026-01-07T08:00:00.000Z',
        status: 'skipped',
        parentOccurrenceId: 'o1',
      }),
    ];
    const s = computeAdherence(data, FROM, TO, NOW);
    expect(s.total).toBe(1);
    expect(s.adherencePct).toBe(100);
  });

  it('returns 0% when there are no due doses', () => {
    expect(computeAdherence([], FROM, TO, NOW).adherencePct).toBe(0);
  });
});
