/**
 * Global history — adherence summary, date-filtered log list, export link.
 */
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DateTime } from 'luxon';
import { Download04Icon, InboxIcon } from '@hugeicons/core-free-icons';
import { Button } from '@/components/Button';
import { EmptyState } from '@/components/EmptyState';
import { SegmentedControl } from '@/components/SegmentedControl';
import { getLogs, getOccurrencesBetween } from '@/services/database';
import { computeAdherence, type AdherenceSummary } from '@/lib/adherence';
import { formatTimestamp } from '@/lib/dates';
import { actionColor, colors, fontSize, radius, spacing } from '@/theme';
import type { LogEntry } from '@/lib/types';

type Range = '7' | '30' | '90';

export default function History(): React.JSX.Element {
  const router = useRouter();
  const [range, setRange] = useState<Range>('30');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [summary, setSummary] = useState<AdherenceSummary | null>(null);

  const load = useCallback(async () => {
    const fromIso = DateTime.utc()
      .minus({ days: Number(range) })
      .toISO()!;
    const toIso = DateTime.utc().plus({ days: 90 }).toISO()!;
    const [logRows, occ] = await Promise.all([
      getLogs({ fromIso }),
      getOccurrencesBetween(fromIso, toIso),
    ]);
    setLogs(logRows);
    setSummary(computeAdherence(occ, fromIso, DateTime.utc().toISO()!));
  }, [range]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.headerWrap}>
            <SegmentedControl<Range>
              options={[
                { value: '7', label: '7 days' },
                { value: '30', label: '30 days' },
                { value: '90', label: '90 days' },
              ]}
              value={range}
              onChange={setRange}
            />
            {summary && (
              <View style={styles.card}>
                <Text style={styles.pct}>{summary.adherencePct}%</Text>
                <Text style={styles.pctLabel}>adherence</Text>
                <Text style={styles.breakdown}>
                  {summary.taken} taken · {summary.skipped} skipped ·{' '}
                  {summary.missed} missed
                </Text>
              </View>
            )}
            <Button
              label="Export history"
              variant="ghost"
              icon={Download04Icon}
              onPress={() => router.push('/export')}
            />
            <Text style={styles.section}>Log</Text>
          </View>
        }
        renderItem={({ item }: { item: LogEntry }) => (
          <View style={styles.logRow}>
            <View
              style={[
                styles.actionDot,
                { backgroundColor: actionColor[item.userAction] },
              ]}
            />
            <View style={styles.logBody}>
              <Text style={styles.logAction}>
                {item.userAction.toUpperCase()}
              </Text>
              <Text style={styles.logTime}>
                Due {formatTimestamp(item.scheduledTime)}
              </Text>
              {item.note ? (
                <Text style={styles.logNote}>{item.note}</Text>
              ) : null}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            title="No history yet"
            message="Confirm a dose and it will appear here."
            icon={InboxIcon}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.md, gap: spacing.sm, flexGrow: 1 },
  headerWrap: { gap: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  pct: { fontSize: 44, fontWeight: '900', color: colors.primary },
  pctLabel: { fontSize: fontSize.sm, color: colors.primaryDark },
  breakdown: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.sm,
  },
  section: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  logRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionDot: { width: 12, height: 12, borderRadius: 6 },
  logBody: { flex: 1, gap: 2 },
  logAction: { fontSize: fontSize.sm, fontWeight: '800', color: colors.text },
  logTime: { fontSize: fontSize.sm, color: colors.textMuted },
  logNote: { fontSize: fontSize.sm, color: colors.text, fontStyle: 'italic' },
});
