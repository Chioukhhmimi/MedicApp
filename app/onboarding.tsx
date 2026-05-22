/**
 * Onboarding — first-run flow (Feature 8).
 *
 * Three short steps: welcome, the Taken/Skipped/Later model, and a
 * notification-permission rationale shown *before* the OS prompt
 * (Feature 10: clear, explained consent). Finishing routes the user
 * straight to "add your first medication".
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  CheckmarkCircle02Icon,
  Notification03Icon,
  WavingHand01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/Button';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { requestPermissions } from '@/services/notifications';
import { useSettingsStore } from '@/store/useSettingsStore';
import { colors, fontSize, spacing } from '@/theme';

const STEPS: ReadonlyArray<{
  icon: IconSvgElement;
  title: string;
  body: string;
}> = [
  {
    icon: WavingHand01Icon,
    title: 'Welcome to Dosely',
    body: 'Never miss a dose. Schedule your medications, get reminded on time, and keep an honest history of every dose — all stored privately on this device.',
  },
  {
    icon: CheckmarkCircle02Icon,
    title: 'Taken, Skipped or Later',
    body: 'When a reminder fires you choose: "Taken" logs the dose and stops reminders. "Skipped" or "Later" keep nudging you every 30 minutes (up to 6 times) until you take it.',
  },
  {
    icon: Notification03Icon,
    title: 'Allow notifications',
    body: 'MediTrack needs notification permission to remind you. Reminders are local to this device — nothing is sent to a server.',
  },
];

export default function Onboarding(): React.JSX.Element {
  const router = useRouter();
  const update = useSettingsStore((s) => s.update);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const current = STEPS[step]!;
  const isLast = step === STEPS.length - 1;

  const next = async (): Promise<void> => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await requestPermissions(); // user already saw the rationale above
      await update({ onboardingComplete: true });
      // Land on the tabs first, THEN open the (modal) editor — this gives the
      // editor a screen to return to. Replacing straight to the modal would
      // leave it with no parent, so closing it would emit an unhandled
      // GO_BACK action.
      router.replace('/(tabs)');
      router.push('/medication/edit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {step === 0 ? (
          <Logo size={96} />
        ) : (
          <View style={styles.iconBadge}>
            <Icon
              icon={current.icon}
              size={64}
              color={colors.brand}
              strokeWidth={1.5}
            />
          </View>
        )}
        <Text style={styles.title} accessibilityRole="header">
          {current.title}
        </Text>
        <Text style={styles.body}>{current.body}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          label={isLast ? 'Allow & add first medication' : 'Continue'}
          onPress={next}
          loading={busy}
        />
        {!isLast && (
          <Button
            label="Skip"
            variant="ghost"
            onPress={() => setStep(STEPS.length - 1)}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  body: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { padding: spacing.lg, gap: spacing.sm },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: { backgroundColor: colors.primary, width: 24 },
});
