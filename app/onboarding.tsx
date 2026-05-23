/**
 * Onboarding — first-run flow (Feature 8).
 *
 * Steps:
 *  0. Language picker  — sets the UI language *before* the rest of the flow
 *                         so the welcome step already reads in the user's
 *                         language. French is the default.
 *  1. Welcome / brand intro.
 *  2. Taken / Skipped / Later interaction model.
 *  3. Notification-permission rationale shown *before* the OS prompt
 *      (Feature 10: clear, explained consent).
 *
 * Finishing routes the user straight to "add your first medication".
 */
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  CheckmarkCircle02Icon,
  Notification03Icon,
  WavingHand01Icon,
} from '@hugeicons/core-free-icons';
import { Button } from '@/components/Button';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { Logo } from '@/components/Logo';
import { LanguageSelector } from '@/components/LanguageSelector';
import { requestPermissions } from '@/services/notifications';
import { useSettingsStore } from '@/store/useSettingsStore';
import { applyLanguage, type Language } from '@/i18n';
import { colors, fontSize, spacing } from '@/theme';

interface ContentStep {
  icon: IconSvgElement | 'logo';
  titleKey: string;
  bodyKey: string;
}

const CONTENT_STEPS: ContentStep[] = [
  {
    icon: 'logo',
    titleKey: 'onboarding.welcome_title',
    bodyKey: 'onboarding.welcome_body',
  },
  {
    icon: CheckmarkCircle02Icon,
    titleKey: 'onboarding.model_title',
    bodyKey: 'onboarding.model_body',
  },
  {
    icon: Notification03Icon,
    titleKey: 'onboarding.notifications_title',
    bodyKey: 'onboarding.notifications_body',
  },
];

const TOTAL_STEPS = 1 + CONTENT_STEPS.length; // language step + content steps

export default function Onboarding(): React.JSX.Element {
  const router = useRouter();
  const update = useSettingsStore((s) => s.update);
  const settings = useSettingsStore((s) => s.settings);
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);

  const isLanguageStep = step === 0;
  const isLast = step === TOTAL_STEPS - 1;
  const content = !isLanguageStep ? CONTENT_STEPS[step - 1]! : null;

  const next = async (): Promise<void> => {
    if (!isLast) {
      setStep(step + 1);
      return;
    }
    setBusy(true);
    try {
      await requestPermissions(); // user already saw the rationale above
      await update({ onboardingComplete: true });
      router.replace('/(tabs)');
      router.push('/medication/edit');
    } finally {
      setBusy(false);
    }
  };

  const pickLanguage = async (lang: Language): Promise<void> => {
    // Switching to/from Arabic triggers a reload; persist via the store.
    await applyLanguage(lang, async (l) => update({ language: l }));
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        {isLanguageStep ? (
          <View style={styles.languageWrap}>
            <Text style={styles.title} accessibilityRole="header">
              {t('onboarding.language_title')}
            </Text>
            <Text style={styles.body}>{t('onboarding.language_body')}</Text>
            <View style={styles.selectorWrap}>
              <LanguageSelector
                value={settings.language}
                onChange={pickLanguage}
              />
            </View>
          </View>
        ) : (
          <>
            {content?.icon === 'logo' ? (
              <Logo size={96} />
            ) : (
              <View style={styles.iconBadge}>
                <Icon
                  icon={content!.icon as IconSvgElement}
                  size={64}
                  color={colors.brand}
                  strokeWidth={1.5}
                />
              </View>
            )}
            <Text style={styles.title} accessibilityRole="header">
              {t(content!.titleKey)}
            </Text>
            <Text style={styles.body}>{t(content!.bodyKey)}</Text>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <View
              key={i}
              style={[styles.dot, i === step && styles.dotActive]}
            />
          ))}
        </View>
        <Button
          label={isLast ? t('onboarding.finish') : t('common.continue')}
          onPress={next}
          loading={busy}
        />
        {!isLast && !isLanguageStep && (
          <Button
            label={t('common.skip')}
            variant="ghost"
            onPress={() => setStep(TOTAL_STEPS - 1)}
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
  languageWrap: { width: '100%', gap: spacing.md, alignItems: 'center' },
  selectorWrap: { width: '100%', marginTop: spacing.md },
  iconBadge: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.mist,
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
