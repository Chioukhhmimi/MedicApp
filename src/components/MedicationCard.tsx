/** MedicationCard — list row showing a medication and its schedule summary. */
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, radius, spacing } from '@/theme';
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
  const accent = medication.pillColor ?? colors.primary;
  const dose = `${medication.doseQuantity} ${medication.unit}`;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${dose}`}
      accessibilityHint="Opens medication details"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
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
          <Text style={styles.badgeText}>Paused</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.md,
  },
  pressed: { opacity: 0.7 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  body: { flex: 1, gap: 2 },
  name: { fontSize: fontSize.body, fontWeight: '700', color: colors.text },
  meta: { fontSize: fontSize.sm, color: colors.textMuted },
  schedule: { fontSize: fontSize.sm, color: colors.primary },
  badge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: fontSize.sm, color: colors.textMuted },
});
