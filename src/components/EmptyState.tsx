/** EmptyState — friendly placeholder for empty lists. */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { PillIcon } from '@hugeicons/core-free-icons';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { colors, fontSize, spacing } from '@/theme';

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
      <View style={styles.iconWrap}>
        <Icon icon={icon} size={56} color={colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  iconWrap: { marginBottom: spacing.xs },
  title: { fontSize: fontSize.lg, fontWeight: '700', color: colors.text },
  message: {
    fontSize: fontSize.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
