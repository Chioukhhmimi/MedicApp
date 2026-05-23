/**
 * LanguageSelector — three clearly-labeled rows for the supported languages,
 * shown both during onboarding and inside Settings. Each row displays the
 * language name in its native script so first-time users can recognise their
 * own language even if the app is currently showing a different one.
 */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CheckmarkCircle02Icon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/Icon';
import { SUPPORTED_LANGUAGES, type Language } from '@/i18n';
import { colors, fontSize, radius, shadow, spacing } from '@/theme';

interface Option {
  value: Language;
  native: string;
  flag: string;
}

const OPTIONS: Option[] = [
  { value: 'fr', native: 'Français', flag: '🇫🇷' },
  { value: 'en', native: 'English', flag: '🇬🇧' },
  { value: 'ar', native: 'العربية', flag: '🇸🇦' },
];

interface Props {
  value: Language;
  onChange: (lang: Language) => void;
}

export function LanguageSelector({ value, onChange }: Props): React.JSX.Element {
  const { t } = useTranslation();

  // Render in the canonical order regardless of which language is active.
  const ordered = SUPPORTED_LANGUAGES.map(
    (lang) => OPTIONS.find((o) => o.value === lang)!,
  );

  return (
    <View style={styles.list}>
      {ordered.map((opt) => {
        const active = opt.value === value;
        const localizedName = t(`language.${opt.value}`);
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={localizedName}
            style={({ pressed }) => [
              styles.row,
              shadow,
              active && styles.rowActive,
              pressed && { opacity: 0.9 },
            ]}
          >
            <Text style={styles.flag}>{opt.flag}</Text>
            <View style={styles.body}>
              <Text style={[styles.native, active && styles.activeText]}>
                {opt.native}
              </Text>
              <Text style={styles.label}>
                {localizedName}
                {opt.value === 'fr' ? ` · ${t('language.fr_note')}` : ''}
              </Text>
            </View>
            {active ? (
              <Icon
                icon={CheckmarkCircle02Icon}
                size={26}
                color={colors.brand}
                strokeWidth={2}
              />
            ) : (
              <View style={styles.radio} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  rowActive: { borderColor: colors.brand },
  flag: { fontSize: 28 },
  body: { flex: 1, gap: 2 },
  native: {
    fontSize: fontSize.body,
    fontWeight: '800',
    color: colors.text,
  },
  activeText: { color: colors.brandDeep },
  label: { fontSize: fontSize.sm, color: colors.textMuted },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.border,
  },
});
