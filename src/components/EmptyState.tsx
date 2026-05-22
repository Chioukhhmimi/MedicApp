/** EmptyState — friendly placeholder for empty lists. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PillIcon } from '@hugeicons/core-free-icons';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { colors, fontSize, radius, spacing } from '@/theme';

interface Props {
  title: string;
  message: string;
  icon?: IconSvgElement;
}

export function EmptyState({
  title,
  message,
  icon = PillIcon,
}: Props): React.JSX.Element {
  return (
    <View style={styles.wrap} accessibilityRole="summary">
      <View style={styles.iconBadge}>
        <Icon icon={icon} size={48} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  iconBadge: {
    width: 96,
    height: 96,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
