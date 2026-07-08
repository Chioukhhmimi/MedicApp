/**
 * ConfirmSheet — bottom sheet content for confirming a medication dose.
 *
 * Shows med name, dose, scheduled time, and action buttons:
 * - Taken: giant 72pt button, medium haptic, check-morph animation
 * - Later: snooze duration chips (10m / 30m / 60m)
 * - Skip: text button, light haptic
 * - Note: collapsible text input
 */
import React, { useEffect, useState } from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { DateTime } from 'luxon';
import * as Haptics from 'expo-haptics';
import {
  Cancel01Icon,
  Clock01Icon,
  Tick02Icon,
  Add01Icon,
} from '@hugeicons/core-free-icons';
import { Text } from '@/components/primitives/Text';
import { Pressable } from '@/components/primitives/Pressable';
import { Chip } from '@/components/primitives/Chip';
import { Icon } from '@/components/Icon';
import { useTheme } from '@/hooks/useTheme';
import { getMedication, getOccurrence } from '@/services/database';
import { resolveOccurrence } from '@/services/scheduleService';
import { spacing, radius } from '@/theme/tokens';
import type { Medication, Occurrence, UserAction } from '@/lib/types';

interface Props {
  occurrenceId: string;
  onDone?: () => void;
}

type Phase = 'idle' | 'confirming' | 'success';

const SNOOZE_OPTIONS = [
  { label: '10 min', minutes: 10 },
  { label: '30 min', minutes: 30 },
  { label: '60 min', minutes: 60 },
];

export function ConfirmSheet({
  occurrenceId,
  onDone,
}: Props): React.JSX.Element {
  const theme = useTheme();

  const [occ, setOcc] = useState<Occurrence | null>(null);
  const [med, setMed] = useState<Medication | null>(null);
  const [note, setNote] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState<string | null>(null);

  // Check-morph animation
  const checkScale = useSharedValue(0);
  const checkOpacity = useSharedValue(0);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkOpacity.value,
  }));

  useEffect(() => {
    let active = true;
    void (async () => {
      const o = await getOccurrence(occurrenceId);
      if (!active || !o) return;
      setOcc(o);
      const m = await getMedication(o.medId);
      if (active) setMed(m ?? null);
    })();
    return () => {
      active = false;
    };
  }, [occurrenceId]);

  const triggerHaptic = async (
    type: 'success' | 'warning' | 'light',
  ): Promise<void> => {
    try {
      if (type === 'success')
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      else if (type === 'warning')
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning,
        );
      else await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Expo Go fallback
    }
  };

  const act = async (
    action: Exclude<UserAction, 'pending'>,
    snoozeMinutes?: number,
  ): Promise<void> => {
    if (!occ || phase !== 'idle') return;
    setPhase('confirming');
    setError(null);

    try {
      await resolveOccurrence(occ.id, action, {
        note: note.trim() || undefined,
        source: 'notification',
        ...(snoozeMinutes ? { snoozeIntervalMin: snoozeMinutes } : {}),
      });

      if (action === 'taken') {
        // Check-morph animation
        await triggerHaptic('success');
        checkScale.value = withTiming(1, {
          duration: 250,
          easing: Easing.out(Easing.back(1.5)),
        });
        checkOpacity.value = withTiming(1, { duration: 150 });
        setPhase('success');
        setTimeout(() => onDone?.(), 650);
      } else if (action === 'later') {
        await triggerHaptic('light');
        setPhase('success');
        setTimeout(() => onDone?.(), 400);
      } else {
        // skipped
        await triggerHaptic('light');
        setPhase('success');
        setTimeout(() => onDone?.(), 400);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setPhase('idle');
    }
  };

  if (!occ || !med) {
    return (
      <View style={styles.center}>
        <Text variant="body" color={theme.inkMuted}>
          Loading…
        </Text>
      </View>
    );
  }

  if (phase === 'success') {
    return (
      <View style={styles.center}>
        <Animated.View
          style={[
            styles.checkCircle,
            { backgroundColor: theme.brand },
            checkStyle,
          ]}
        >
          <Icon
            icon={Tick02Icon}
            size={40}
            color={theme.brandInk}
            strokeWidth={2.5}
          />
        </Animated.View>
      </View>
    );
  }

  const due = DateTime.fromISO(occ.scheduledTime);
  const timeStr = due.toFormat('HH:mm');

  return (
    <View style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text variant="title" color={theme.ink} maxFontSizeMultiplier={1.2}>
          {med.name}
        </Text>
        <Text variant="body" color={theme.inkMuted}>
          {med.doseQuantity} {med.unit}
          {med.strength ? ` · ${med.strength}` : ''}
          {' · '}
          {timeStr}
        </Text>
        {occ.snoozeCount > 0 ? (
          <Text variant="label" color={theme.brand}>
            Snoozed {occ.snoozeCount}×
          </Text>
        ) : null}
      </View>

      {/* Taken button — 72pt */}
      <Pressable
        onPress={() => act('taken')}
        disabled={phase !== 'idle'}
        haptic="medium"
        accessibilityRole="button"
        accessibilityLabel="Taken"
        accessibilityHint="Logs the dose and stops reminders"
        style={[
          styles.takenBtn,
          { backgroundColor: theme.brand },
          phase !== 'idle' && { opacity: 0.5 },
        ]}
      >
        <Icon
          icon={Tick02Icon}
          size={24}
          color={theme.brandInk}
          strokeWidth={2.5}
        />
        <Text variant="body" color={theme.brandInk} style={styles.takenLabel}>
          Taken
        </Text>
      </Pressable>

      {/* Secondary actions */}
      <View style={styles.secondaryRow}>
        {showSnooze ? (
          <View style={styles.snoozeRow}>
            {SNOOZE_OPTIONS.map((opt) => (
              <Chip
                key={opt.minutes}
                label={opt.label}
                variant="selectable"
                onPress={() => {
                  void triggerHaptic('light');
                  void act('later', opt.minutes);
                }}
              />
            ))}
          </View>
        ) : (
          <Pressable
            onPress={() => {
              void triggerHaptic('light');
              setShowSnooze(true);
            }}
            haptic="light"
            minSize={44}
            accessibilityRole="button"
            accessibilityLabel="Later"
            accessibilityHint="Reminds you again after the snooze interval"
            style={styles.laterBtn}
          >
            <Icon
              icon={Clock01Icon}
              size={18}
              color={theme.inkMuted}
              strokeWidth={2}
            />
            <Text variant="body" color={theme.inkMuted}>
              Later
            </Text>
          </Pressable>
        )}

        <Pressable
          onPress={() => void act('skipped')}
          disabled={phase !== 'idle'}
          haptic="light"
          minSize={44}
          accessibilityRole="button"
          accessibilityLabel="Skip"
          accessibilityHint="Logs a skip; reminders continue until taken"
          style={styles.skipBtn}
        >
          <Icon
            icon={Cancel01Icon}
            size={18}
            color={theme.inkMuted}
            strokeWidth={2}
          />
          <Text variant="body" color={theme.inkMuted}>
            Skip
          </Text>
        </Pressable>
      </View>

      {/* Collapsible note */}
      {showNote ? (
        <View style={styles.noteSection}>
          <TextInput
            style={[
              styles.noteInput,
              {
                borderColor: theme.border,
                color: theme.ink,
                backgroundColor: theme.surface1,
              },
            ]}
            value={note}
            onChangeText={setNote}
            placeholder="e.g. felt nauseous, took with food"
            placeholderTextColor={theme.inkQuiet}
            multiline
            accessibilityLabel="Optional note about this dose"
          />
        </View>
      ) : (
        <Pressable
          onPress={() => setShowNote(true)}
          haptic="light"
          minSize={44}
          accessibilityRole="button"
          accessibilityLabel="Add a note"
          style={styles.addNoteBtn}
        >
          <Icon
            icon={Add01Icon}
            size={16}
            color={theme.inkMuted}
            strokeWidth={2}
          />
          <Text variant="label" color={theme.inkMuted}>
            Add a note
          </Text>
        </Pressable>
      )}

      {/* Error */}
      {error ? (
        <Text variant="label" color={theme.danger} center>
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing[16],
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[32],
    minHeight: 200,
  },
  header: {
    gap: spacing[4],
  },
  takenBtn: {
    minHeight: 72,
    borderRadius: radius[12],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
  },
  takenLabel: {
    fontWeight: '800',
    fontSize: 18,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: spacing[12],
  },
  snoozeRow: {
    flexDirection: 'row',
    gap: spacing[8],
    flex: 1,
  },
  laterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    minHeight: 44,
    borderRadius: radius[8],
    borderWidth: 1,
    borderColor: 'transparent',
  },
  skipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[8],
    minHeight: 44,
    borderRadius: radius[8],
  },
  addNoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    minHeight: 44,
  },
  noteSection: {
    gap: spacing[8],
  },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius[8],
    padding: spacing[12],
    minHeight: 72,
    textAlignVertical: 'top',
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
