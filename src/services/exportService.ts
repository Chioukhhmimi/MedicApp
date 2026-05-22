/**
 * Export side-effects — writes CSV / PDF files and opens the OS share sheet.
 *
 * The pure document builders live in src/lib/export.ts; this module only
 * handles file I/O (expo-file-system), PDF rendering (expo-print) and
 * sharing (expo-sharing).
 *
 * Uses the SDK 54 `File`/`Paths` API of expo-file-system (the legacy
 * `writeAsStringAsync`/`cacheDirectory` API was removed in v19).
 */
import { File, Paths } from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { buildHistoryCsv, buildHistoryHtml } from '@/lib/export';
import { computeAdherence } from '@/lib/adherence';
import {
  getLogs,
  getMedication,
  getOccurrencesBetween,
  listMedications,
} from './database';
import type { Medication } from '@/lib/types';

/** Writes the history CSV to a cache file and opens the share sheet. */
export async function exportHistoryCsv(filter?: {
  medId?: string;
  fromIso?: string;
  toIso?: string;
}): Promise<string> {
  const logs = await getLogs(filter);
  const meds = await listMedications();
  const medNames = Object.fromEntries(meds.map((m) => [m.id, m.name]));
  const csv = buildHistoryCsv(logs, medNames);

  const file = new File(Paths.cache, `meditrack-history-${Date.now()}.csv`);
  file.create({ overwrite: true });
  file.write(csv);
  await shareFile(file.uri, 'text/csv');
  return file.uri;
}

/** Renders the history PDF via expo-print and opens the share sheet. */
export async function exportHistoryPdf(filter?: {
  medId?: string;
  fromIso?: string;
  toIso?: string;
}): Promise<string> {
  const logs = await getLogs(filter);
  const meds: Medication[] = filter?.medId
    ? [await getMedication(filter.medId)].filter(
        (m): m is Medication => m !== null,
      )
    : await listMedications();

  const from = filter?.fromIso ?? '1970-01-01T00:00:00.000Z';
  const to = filter?.toIso ?? new Date().toISOString();
  const occ = await getOccurrencesBetween(from, to, filter?.medId);
  const summary = computeAdherence(occ, from, to);

  const rangeLabel = `${from.slice(0, 10)} → ${to.slice(0, 10)}`;
  const html = buildHistoryHtml(logs, meds, summary, rangeLabel);

  const { uri } = await Print.printToFileAsync({ html });
  await shareFile(uri, 'application/pdf');
  return uri;
}

async function shareFile(uri: string, mimeType: string): Promise<void> {
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType, UTI: mimeType });
  }
}
