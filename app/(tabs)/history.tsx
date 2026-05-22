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
import {
  actionColor,
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
} from '@/theme';
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
              <View style={[styles.card, shadow]}>
                <Text style={styles.cardKicker}>Your adherence</Text>
                <Text style={styles.pct}>{summary.adherencePct}%</Text>
                <View style={styles.statsRow}>
                  <View style={styles.statBlock}>
                    <Text style={[styles.statValue, { color: colors.mint }]}>
                      {summary.taken}
                    </Text>
                    <Text style={styles.statLabel}>Taken</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statValue, { color: colors.danger }]}>
                      {summary.skipped}
                    </Text>
                    <Text style={styles.statLabel}>Skipped</Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statBlock}>
                    <Text style={[styles.statValue, { color: colors.accent }]}>
                      {summary.missed}
                    </Text>
                    <Text style={styles.statLabel}>Missed</Text>
                  </View>
                </View>
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
  list: { padding: spacing.lg, gap: spacing.md, flexGrow: 1 },
  headerWrap: { gap: spacing.md, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardKicker: {
    fontSize: fontSize.sm,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  pct: {
    fontSize: 52,
    fontWeight: '900',
    color: colors.primaryDark,
    letterSpacing: -1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    alignSelf: 'stretch',
    justifyContent: 'space-around',
  },
  statBlock: { alignItems: 'center', flex: 1, gap: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  statValue: { fontSize: fontSize.lg, fontWeight: '900' },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  logRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  actionDot: { width: 10, height: 10, borderRadius: 5 },
  logBody: { flex: 1, gap: 2 },
  logAction: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: 0.5,
  },
  logTime: { fontSize: fontSize.sm, color: colors.textMuted },
  logNote: { fontSize: fontSize.sm, color: colors.text, fontStyle: 'italic' },
});
