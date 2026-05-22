/**
 * Button — themed, accessible pressable.
 *
 * Accessibility: explicit `accessibilityRole`, a 44pt minimum hit target,
 * and a disabled state exposed to screen readers (Feature 8).
 */
import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Icon, type IconSvgElement } from '@/components/Icon';
import { colors, fontSize, radius, spacing } from '@/theme';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  accessibilityHint?: string;
  style?: ViewStyle;
  icon?: IconSvgElement;
}

const bg: Record<Variant, string> = {
  primary: colors.primary,
  secondary: colors.surface,
  danger: colors.danger,
  ghost: 'transparent',
};
const fg: Record<Variant, string> = {
  primary: colors.white,
  secondary: colors.text,
  danger: colors.white,
  ghost: colors.primary,
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  accessibilityHint,
  style,
  icon,
}: Props): React.JSX.Element {
  const isOff = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isOff}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: isOff }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: bg[variant],
          opacity: isOff ? 0.5 : pressed ? 0.85 : 1,
        },
        variant === 'ghost' && styles.ghost,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg[variant]} />
      ) : (
        <View style={styles.content}>
          {icon ? (
            <Icon icon={icon} size={18} color={fg[variant]} strokeWidth={2} />
          ) : null}
          <Text style={[styles.label, { color: fg[variant] }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghost: { borderWidth: 1, borderColor: colors.primary },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: { fontSize: fontSize.body, fontWeight: '600' },
});
