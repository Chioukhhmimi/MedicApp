/**
 * Medication detail (Features 1, 6, 7, 9).
 *
 * Shows the medication, its schedule, recent history and the next upcoming
 * doses. Offers pause/resume, edit, per-medication snooze override, canceling
 * the future series (with a multi-dose warning) and deletion.
 */
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import { Button } from '@/components/Button';
import { dismiss } from '@/lib/navigation';
import { useMedStore } from '@/store/useMedStore';
import {
  getLogs,
  getMedication,
  getOccurrencesBetween,
  getRulesForMed,
  getSnoozeOverride,
} from '@/services/database';
import { describeRule } from '@/lib/scheduler';
import { formatTimestamp } from '@/lib/dates';
import {
  actionColor,
  colors,
  fontSize,
  radius,
  shadow,
  spacing,
} from '@/theme';
import type { LogEntry, Medication, Occurrence } from '@/lib/types';

export default function MedicationDetail(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const setPaused = useMedStore((s) => s.setPaused);
  const removeMedication = useMedStore((s) => s.removeMedication);
  const cancelFutureSeries = useMedStore((s) => s.cancelFutureSeries);

  const [med, setMed] = useState<Medication | null>(null);
  const [scheduleText, setScheduleText] = useState('');
  const [upcoming, setUpcoming] = useState<Occurrence[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [overrideText, setOverrideText] = useState('Global default');

  const load = useCallback(async () => {
    if (!id) return;
    const m = await getMedication(id);
    setMed(m);
    const rules = await getRulesForMed(id);
    setScheduleText(rules[0] ? describeRule(rules[0]) : 'No schedule');

    const nowIso = DateTime.utc().toISO()!;
    const horizon = DateTime.utc().plus({ days: 30 }).toISO()!;
    const occ = await getOccurrencesBetween(nowIso, horizon, id);
    setUpcoming(
      occ.filter((o) => !o.canceled && o.status === 'pending').slice(0, 5),
    );
    setLogs((await getLogs({ medId: id })).slice(0, 8));

    const ov = await getSnoozeOverride(id);
    setOverrideText(
      ov && (ov.snoozeIntervalMin !== null || ov.maxSnoozeRepeats !== null)
        ? `Every ${ov.snoozeIntervalMin ?? 'global'} min, max ${
            ov.maxSnoozeRepeats ?? 'global'
          }`
        : 'Global default',
    );
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!med) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  const confirmCancelSeries = (): void => {
    Alert.alert(
      'Cancel all future doses?',
      `This will cancel ${upcoming.length}+ upcoming reminders for ${med.name}. Past history is kept. This cannot be undone.`,
      [
        { text: 'Keep them', style: 'cancel' },
        {
          text: 'Cancel doses',
          style: 'destructive',
          onPress: async () => {
            const count = await cancelFutureSeries(med.id);
            Alert.alert('Done', `${count} future dose(s) canceled.`);
            void load();
          },
        },
      ],
    );
  };

  const confirmDelete = (): void => {
    Alert.alert(
      'Delete medication?',
      `${med.name} and its schedule will be removed. History logs are kept for your records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await removeMedication(med.id);
            dismiss(router);
          },
        },
      ],
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View
        style={[
          styles.hero,
          shadow,
          { backgroundColor: med.pillColor ?? colors.primaryTint },
        ]}
      >
        <Text style={styles.medName}>{med.name}</Text>
        <Text style={styles.dose}>
          {med.doseQuantity} {med.unit}
          {med.strength ? ` · ${med.strength}` : ''}
        </Text>
        {med.paused ? <Text style={styles.pausedTag}>PAUSED</Text> : null}
      </View>

      <Section title="Schedule">
        <Text style={styles.body}>{scheduleText}</Text>
        <Text style={styles.muted}>
          From {med.startDate}
          {med.endDate ? ` to ${med.endDate}` : ''}
        </Text>
      </Section>

      {med.notes ? (
        <Section title="Notes">
          <Text style={styles.body}>{med.notes}</Text>
        </Section>
      ) : null}

      <Section title="Snooze override">
        <Text style={styles.body}>{overrideText}</Text>
        <Text style={styles.muted}>
          Adjust per-medication snooze behaviour in a future update; currently
          it follows the global Settings unless an override row exists.
        </Text>
      </Section>

      <Section title="Next doses">
        {upcoming.length === 0 ? (
          <Text style={styles.muted}>No upcoming doses scheduled.</Text>
        ) : (
          upcoming.map((o) => (
            <View key={o.id} style={styles.occRow}>
              <Text style={styles.body}>
                {formatTimestamp(o.scheduledTime)}
              </Text>
              <Button
                label="Confirm"
                variant="ghost"
                onPress={() =>
                  router.push({
                    pathname: '/confirm',
                    params: { occurrenceId: o.id },
                  })
                }
              />
            </View>
          ))
        )}
      </Section>

      <Section title="Recent history">
        {logs.length === 0 ? (
          <Text style={styles.muted}>No history yet.</Text>
        ) : (
          logs.map((l) => (
            <View key={l.id} style={styles.logRow}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: actionColor[l.userAction] },
                ]}
              />
              <Text style={styles.body}>
                {l.userAction} · {formatTimestamp(l.scheduledTime)}
              </Text>
            </View>
          ))
        )}
      </Section>

      <View style={styles.actions}>
        <Button
          label="Edit medication"
          onPress={() =>
            router.push({
              pathname: '/medication/edit',
              params: { id: med.id },
            })
          }
        />
        <Button
          label={med.paused ? 'Resume reminders' : 'Pause reminders'}
          variant="secondary"
          onPress={async () => {
            await setPaused(med.id, !med.paused);
            void load();
          }}
        />
        <Button
          label="Cancel all future doses"
          variant="ghost"
          onPress={confirmCancelSeries}
        />
        <Button
          label="Delete medication"
          variant="danger"
          onPress={confirmDelete}
        />
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  medName: {
    fontSize: fontSize.xl,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.5,
  },
  dose: { fontSize: fontSize.body, color: colors.text },
  pausedTag: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.danger,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  body: { fontSize: fontSize.body, color: colors.text },
  muted: { fontSize: fontSize.sm, color: colors.textMuted },
  occRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  logRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  actions: { gap: spacing.sm, marginVertical: spacing.lg },
});
