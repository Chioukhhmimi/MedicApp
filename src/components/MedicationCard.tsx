/** MedicationCard — list row showing a medication and its schedule summary. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { PillIcon } from '@hugeicons/core-free-icons';
import { Icon } from '@/components/Icon';
import { colors, fontSize, radius, shadow, spacing } from '@/theme';
import type { Medication } from '@/lib/types';

interface Props {
  medication: Medication;
  scheduleSummary?: string;
  onPress: () => void;
}

export function MedicationCard({
  medication,
  scheduleSummary,
  onPress,
}: Props): React.JSX.Element {
  const { t } = useTranslation();
  const accent = medication.pillColor ?? colors.primary;
  const dose = `${medication.doseQuantity} ${medication.unit}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${dose}`}
      accessibilityHint="Opens medication details"
      style={({ pressed }) => [styles.card, shadow, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: `${accent}22` }]}>
        <Icon icon={PillIcon} size={22} color={accent} strokeWidth={1.75} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{medication.name}</Text>
        <Text style={styles.meta}>
          {dose}
          {medication.strength ? ` · ${medication.strength}` : ''}
        </Text>
        {scheduleSummary ? (
          <Text style={styles.schedule}>{scheduleSummary}</Text>
        ) : null}
      </View>
      {medication.paused ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{t('medications.paused_badge')}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.85 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.body, fontWeight: '800', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  schedule: {
    fontSize: fontSize.sm,
    color: colors.primaryDark,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
