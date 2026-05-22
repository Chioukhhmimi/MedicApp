/**
 * Confirmation screen (Feature 5).
 *
 * Reached by tapping a reminder notification (deep link) or the "Confirm"
 * button on the dashboard. Pre-filled with medication name, dose, scheduled
 * time and the occurrence id. The user picks Taken / Skipped / Later:
 *  - Taken   -> dose logged, snooze chain ends.
 *  - Skipped -> logged, re-reminds every N minutes (capped).
 *  - Later   -> logged, re-reminds every N minutes (capped).
 */
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { DateTime } from 'luxon';
import {
  Cancel01Icon,
  Clock01Icon,
  Tick02Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/Button';
import { getMedication, getOccurrence } from '@/services/database';
import { resolveOccurrence } from '@/services/scheduleService';
import { dismiss } from '@/lib/navigation';
import { formatTimestamp } from '@/lib/dates';
import { colors, fontSize, radius, spacing } from '@/theme';
import type { Medication, Occurrence, UserAction } from '@/lib/types';

export default function Confirm(): React.JSX.Element {
  const router = useRouter();
  const { occurrenceId } = useLocalSearchParams<{ occurrenceId: string }>();

  const [occ, setOcc] = useState<Occurrence | null>(null);
  const [med, setMed] = useState<Medication | null>(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    void (async () => {
      if (!occurrenceId) {
        setMissing(true);
        return;
      }
      const o = await getOccurrence(occurrenceId);
      if (!o) {
        setMissing(true);
        return;
      }
      setOcc(o);
      setMed(await getMedication(o.medId));
    })();
  }, [occurrenceId]);

  const act = async (action: Exclude<UserAction, 'pending'>): Promise<void> => {
    if (!occ) return;
    setBusy(true);
    try {
      const child = await resolveOccurrence(occ.id, action, {
        note: note.trim() || undefined,
        source: 'notification',
      });
      if (action === 'taken') {
        setResult('Dose logged. Nice work!');
      } else if (child) {
        setResult(
          `Okay — we'll remind you again at ${DateTime.fromISO(
            child.scheduledTime,
          ).toFormat('HH:mm')}.`,
        );
      } else {
        setResult(
          'Logged. The snooze limit was reached, so no more reminders for this dose.',
        );
      }
      setTimeout(() => dismiss(router), 1400);
    } finally {
      setBusy(false);
    }
  };

  if (missing) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Reminder unavailable</Text>
        <Text style={styles.muted}>
          This dose could not be found — it may have been removed.
        </Text>
        <Button label="Close" onPress={() => dismiss(router)} />
      </View>
    );
  }

  if (!occ || !med) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.center}>
        <Text style={styles.resultText}>{result}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.kicker}>Medication reminder</Text>
        <Text style={styles.medName} accessibilityRole="header">
          {med.name}
        </Text>
        <Text style={styles.dose}>
          Take {med.doseQuantity} {med.unit}
          {med.strength ? ` · ${med.strength}` : ''}
        </Text>
        <Text style={styles.time}>
          Scheduled for {formatTimestamp(occ.scheduledTime)}
        </Text>
        {occ.snoozeCount > 0 ? (
          <Text style={styles.snoozeTag}>Snoozed {occ.snoozeCount}×</Text>
        ) : null}
      </View>

      <Text style={styles.label}>Add a note (optional)</Text>
      <TextInput
        style={styles.input}
        value={note}
        onChangeText={setNote}
        placeholder="e.g. felt nauseous, took with food"
        multiline
        accessibilityLabel="Optional note about this dose"
      />

      <View style={styles.actions}>
        <Button
          label="Taken"
          icon={Tick02Icon}
          variant="primary"
          loading={busy}
          onPress={() => act('taken')}
          accessibilityHint="Logs the dose and stops reminders"
        />
        <Button
          label="Skipped"
          icon={Cancel01Icon}
          variant="danger"
          loading={busy}
          onPress={() => act('skipped')}
          accessibilityHint="Logs a skip; reminders continue until taken"
        />
        <Button
          label="Later"
          icon={Clock01Icon}
          variant="secondary"
          loading={busy}
          onPress={() => act('later')}
          accessibilityHint="Reminds you again after the snooze interval"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.lg, gap: spacing.md },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  kicker: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.primary,
    textTransform: 'uppercase',
  },
  medName: { fontSize: fontSize.xl, fontWeight: '900', color: colors.text },
  dose: { fontSize: fontSize.body, color: colors.text },
  time: { fontSize: fontSize.body, color: colors.primaryDark },
  snoozeTag: {
    marginTop: spacing.xs,
    fontSize: fontSize.sm,
    color: colors.accent,
    fontWeight: '700',
  },
  label: { fontSize: fontSize.sm, fontWeight: '700', color: colors.text },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.md,
    minHeight: 64,
    textAlignVertical: 'top',
    fontSize: fontSize.body,
    color: colors.text,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  title: { fontSize: fontSize.lg, fontWeight: '800', color: colors.text },
  muted: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resultText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
});
