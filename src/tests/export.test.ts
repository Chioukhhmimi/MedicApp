/**
 * Export-builder tests — CSV escaping and HTML generation (Feature 6).
 */
import { buildHistoryCsv, buildHistoryHtml } from '@/lib/export';
import type { AdherenceSummary } from '@/lib/adherence';
import type { LogEntry, Medication } from '@/lib/types';

const logs: LogEntry[] = [
  {
    id: 'l1',
    occurrenceId: 'o1',
    medId: 'm1',
    scheduledTime: '2026-01-05T08:00:00.000Z',
    userAction: 'taken',
    actionTime: '2026-01-05T08:05:00.000Z',
    source: 'notification',
  },
  {
    id: 'l2',
    occurrenceId: 'o2',
    medId: 'm1',
    scheduledTime: '2026-01-06T08:00:00.000Z',
    userAction: 'skipped',
    actionTime: '2026-01-06T08:10:00.000Z',
    source: 'manual',
    note: 'felt fine, said "no thanks"',
  },
];

describe('buildHistoryCsv', () => {
  it('emits a header row plus one row per log', () => {
    const csv = buildHistoryCsv(logs, { m1: 'Metformin' });
    const lines = csv.split('\r\n');
    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe(
      'Medication,Scheduled Time,Action,Action Time,Source,Note',
    );
    expect(lines[1]).toContain('Metformin');
    expect(lines[1]).toContain('taken');
  });

  it('escapes quotes and commas per RFC 4180', () => {
    const csv = buildHistoryCsv(logs, { m1: 'Metformin' });
    // The note contains a comma and quotes -> must be wrapped & doubled.
    expect(csv).toContain('"felt fine, said ""no thanks"""');
  });
});

describe('buildHistoryHtml', () => {
  it('embeds the adherence percentage and a row per log', () => {
    const meds: Medication[] = [
      {
        id: 'm1',
        name: 'Metformin',
        doseQuantity: 1,
        unit: 'pill',
        startDate: '2026-01-01',
        paused: false,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const summary: AdherenceSummary = {
      total: 2,
      taken: 1,
      skipped: 1,
      missed: 0,
      upcoming: 0,
      adherencePct: 50,
    };
    const html = buildHistoryHtml(logs, meds, summary, 'Jan 2026');
    expect(html).toContain('50%');
    expect(html).toContain('Metformin');
    expect(html).toContain('<table');
  });
});
