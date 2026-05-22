/**
 * Settings — global snooze, quiet hours, sound, privacy (Feature 9).
 * Per-medication overrides live on the medication detail screen.
 */
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/Button';
import { useSettingsStore } from '@/store/useSettingsStore';
import { colors, fontSize, radius, spacing } from '@/theme';

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  return (
    <View style={styles.row}>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint ? <Text style={styles.rowHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

export default function SettingsScreen(): React.JSX.Element {
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const [snooze, setSnooze] = useState(
    String(settings.defaultSnoozeIntervalMin),
  );
  const [maxRepeats, setMaxRepeats] = useState(
    String(settings.maxSnoozeRepeats),
  );

  const saveNumbers = (): void => {
    void update({
      defaultSnoozeIntervalMin: Math.max(1, Number(snooze) || 30),
      maxSnoozeRepeats: Math.max(0, Number(maxRepeats) || 6),
    });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.group}>Snooze</Text>
        <Row label="Snooze interval (minutes)">
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            value={snooze}
            onChangeText={setSnooze}
            onBlur={saveNumbers}
            accessibilityLabel="Default snooze interval in minutes"
          />
        </Row>
        <Row
          label="Max snooze repeats"
          hint="Hard cap that prevents endless reminders"
        >
          <TextInput
            style={styles.numInput}
            keyboardType="number-pad"
            value={maxRepeats}
            onChangeText={setMaxRepeats}
            onBlur={saveNumbers}
            accessibilityLabel="Maximum snooze repeats"
          />
        </Row>

        <Text style={styles.group}>Quiet hours</Text>
        <Row
          label="Enable quiet hours"
          hint="Reminders inside this window are de-emphasised"
        >
          <Switch
            value={settings.quietHoursEnabled}
            onValueChange={(v) => update({ quietHoursEnabled: v })}
          />
        </Row>
        {settings.quietHoursEnabled && (
          <>
            <Row label="Quiet start (HH:mm)">
              <TextInput
                style={styles.numInput}
                value={settings.quietHoursStart}
                onChangeText={(t) => update({ quietHoursStart: t })}
                accessibilityLabel="Quiet hours start"
              />
            </Row>
            <Row label="Quiet end (HH:mm)">
              <TextInput
                style={styles.numInput}
                value={settings.quietHoursEnd}
                onChangeText={(t) => update({ quietHoursEnd: t })}
                accessibilityLabel="Quiet hours end"
              />
            </Row>
          </>
        )}

        <Text style={styles.group}>Privacy & security</Text>
        <Row
          label="Biometric lock"
          hint="Require Face ID / fingerprint to open the app"
        >
          <Switch
            value={settings.biometricLock}
            onValueChange={(v) => update({ biometricLock: v })}
          />
        </Row>

        <View style={styles.note}>
          <Text style={styles.noteText}>
            MediTrack runs fully offline. All medication data is stored in an
            on-device database; sensitive flags use the OS keychain. Nothing is
            uploaded unless you explicitly export a file.
          </Text>
        </View>

        <Button
          label="Replay onboarding"
          variant="ghost"
          onPress={() => update({ onboardingComplete: false })}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, gap: spacing.sm },
  group: {
    fontSize: fontSize.sm,
    fontWeight: '800',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: fontSize.body, color: colors.text, fontWeight: '600' },
  rowHint: { fontSize: fontSize.sm, color: colors.textMuted },
  numInput: {
    minWidth: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    textAlign: 'center',
    fontSize: fontSize.body,
    color: colors.text,
  },
  note: {
    backgroundColor: colors.primaryTint,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    lineHeight: 20,
  },
});
