/**
 * Button — themed, accessible pressable.
 *
 * Accessibility: explicit `accessibilityRole`, a 48pt minimum hit target,
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
import { colors, fontSize, radius, shadow, spacing } from '@/theme';

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
  ghost: colors.primaryDark,
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
        variant !== 'ghost' && variant !== 'secondary' && shadow,
        variant === 'secondary' && styles.secondary,
        variant === 'ghost' && styles.ghost,
        {
          backgroundColor: bg[variant],
          opacity: isOff ? 0.5 : pressed ? 0.85 : 1,
        },
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
    minHeight: 52,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondary: { borderWidth: 1, borderColor: colors.border },
  ghost: { borderWidth: 1, borderColor: colors.primary },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  label: { fontSize: fontSize.body, fontWeight: '700', letterSpacing: 0.2 },
});
