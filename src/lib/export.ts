/**
 * History export — CSV and PDF (HTML) generation.
 *
 * Feature 6: users can export their medication history. Both builders are
 * pure string functions so they are trivially testable; the file-writing /
 * sharing side-effects live in src/services (see exportService).
 */
import { formatTimestamp } from './dates';
import type { AdherenceSummary } from './adherence';
import type { LogEntry, Medication } from './types';

/** Escapes a value for safe inclusion in a CSV cell (RFC 4180). */
function csvCell(value: string | number | undefined): string {
  const s = String(value ?? '');
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Builds a CSV document from log entries.
 * `medNames` maps medId -> display name so the file is human-readable.
 */
export function buildHistoryCsv(
  logs: LogEntry[],
  medNames: Record<string, string>,
): string {
  const header = [
    'Medication',
    'Scheduled Time',
    'Action',
    'Action Time',
    'Source',
    'Note',
  ];
  const rows = logs.map((l) =>
    [
      csvCell(medNames[l.medId] ?? l.medId),
      csvCell(l.scheduledTime),
      csvCell(l.userAction),
      csvCell(l.actionTime),
      csvCell(l.source),
      csvCell(l.note),
    ].join(','),
  );
  return [header.join(','), ...rows].join('\r\n');
}

/**
 * Builds a printable HTML document for `expo-print`. Kept self-contained
 * (inline styles) so it renders identically on iOS and Android.
 */
export function buildHistoryHtml(
  logs: LogEntry[],
  meds: Medication[],
  summary: AdherenceSummary,
  rangeLabel: string,
): string {
  const medNames = Object.fromEntries(meds.map((m) => [m.id, m.name]));
  const badge = (action: string): string => {
    const color =
      action === 'taken'
        ? '#0E7C66'
        : action === 'skipped'
          ? '#B23A48'
          : '#9A6700';
    return `<span style="color:${color};font-weight:600">${action}</span>`;
  };
  const rows = logs
    .map(
      (l) => `<tr>
        <td>${medNames[l.medId] ?? l.medId}</td>
        <td>${formatTimestamp(l.scheduledTime)}</td>
        <td>${badge(l.userAction)}</td>
        <td>${formatTimestamp(l.actionTime)}</td>
        <td>${l.note ?? ''}</td>
      </tr>`,
    )
    .join('');

  return `<!doctype html>
<html><head><meta charset="utf-8" />
<style>
  body { font-family: -apple-system, Roboto, sans-serif; color: #1a1a1a; padding: 24px; }
  h1 { color: #0E7C66; margin-bottom: 2px; }
  .meta { color: #666; font-size: 12px; margin-bottom: 16px; }
  .summary { background: #F0F7F5; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
  .pct { font-size: 32px; font-weight: 700; color: #0E7C66; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #0E7C66; color: #fff; padding: 6px 8px; }
  td { padding: 6px 8px; border-bottom: 1px solid #eee; }
</style></head>
<body>
  <h1>MediTrack — Medication History</h1>
  <div class="meta">Range: ${rangeLabel} · Generated ${formatTimestamp(
    new Date().toISOString(),
  )}</div>
  <div class="summary">
    <div class="pct">${summary.adherencePct}%</div>
    <div>Adherence — ${summary.taken} taken, ${summary.skipped} skipped,
      ${summary.missed} missed of ${summary.total} due doses.</div>
  </div>
  <table>
    <thead><tr><th>Medication</th><th>Scheduled</th><th>Action</th>
      <th>Acted</th><th>Note</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="5">No records.</td></tr>'}</tbody>
  </table>
</body></html>`;
}
