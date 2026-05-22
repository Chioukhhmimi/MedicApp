/**
 * Export screen (Feature 6) — choose a range and export CSV or PDF.
 *
 * Export is the only path that produces a file leaving the device, and it is
 * always user-initiated via the OS share sheet (Feature 10: privacy).
 */
import React, { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { DateTime } from 'luxon';
import { Button } from '@/components/Button';
import { SegmentedControl } from '@/components/SegmentedControl';
import { exportHistoryCsv, exportHistoryPdf } from '@/services/exportService';
import { reportError } from '@/services/monitoring';
import { colors, fontSize, radius, spacing } from '@/theme';

type Range = '30' | '90' | 'all';

export default function ExportScreen(): React.JSX.Element {
  const [range, setRange] = useState<Range>('30');
  const [busy, setBusy] = useState<'csv' | 'pdf' | null>(null);

  const filter = (): { fromIso?: string } => {
    if (range === 'all') return {};
    return {
      fromIso: DateTime.utc()
        .minus({ days: Number(range) })
        .toISO()!,
    };
  };

  const run = async (kind: 'csv' | 'pdf'): Promise<void> => {
    setBusy(kind);
    try {
      if (kind === 'csv') await exportHistoryCsv(filter());
      else await exportHistoryPdf(filter());
    } catch (err) {
      reportError(err, 'export');
      Alert.alert('Export failed', 'Could not generate the file.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.label}>Date range</Text>
      <SegmentedControl<Range>
        options={[
          { value: '30', label: 'Last 30d' },
          { value: '90', label: 'Last 90d' },
          { value: 'all', label: 'All time' },
        ]}
        value={range}
        onChange={setRange}
      />

      <View style={styles.note}>
        <Text style={styles.noteText}>
          The exported file includes every logged dose in the selected range
          plus an adherence summary. It is created locally and shared through
          your device&apos;s share sheet — nothing is uploaded automatically.
        </Text>
      </View>

      <Button
        label="Export as CSV"
        onPress={() => run('csv')}
        loading={busy === 'csv'}
      />
      <Button
        label="Export as PDF"
        variant="secondary"
        onPress={() => run('pdf')}
        loading={busy === 'pdf'}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
    flexGrow: 1,
  },
  label: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  note: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    lineHeight: 20,
  },
});
