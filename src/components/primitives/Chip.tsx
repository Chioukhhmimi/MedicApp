import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius } from '@/theme/tokens';

type ChipVariant = 'selectable' | 'filter' | 'input';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;
  onDismiss?: () => void;
  disabled?: boolean;
}

export function Chip({
  label,
  selected = false,
  onPress,
  variant = 'selectable',
  onDismiss,
  disabled = false,
}: Props): React.JSX.Element {
  const theme = useTheme();

  const isSelected = selected;
  const showDismiss =
    onDismiss && (variant === 'filter' || variant === 'input');

  const bgColor = (() => {
    if (disabled) return theme.surface1;
    if (variant === 'input') return theme.surface1;
    if (isSelected) return theme.brand;
    return 'transparent';
  })();

  const borderColor = (() => {
    if (disabled) return theme.border;
    if (variant === 'input') return theme.border;
    if (isSelected) return theme.brand;
    return theme.border;
  })();

  const textColor = (() => {
    if (disabled) return theme.inkQuiet;
    if (isSelected) return theme.brandInk;
    return theme.inkMuted;
  })();

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        haptic="light"
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isSelected, disabled }}
        accessibilityLabel={label}
        style={[
          styles.chip,
          { backgroundColor: bgColor, borderColor },
          disabled && styles.disabled,
        ]}
      >
        <Text variant="label" color={textColor} maxFontSizeMultiplier={1.3}>
          {label}
        </Text>
      </Pressable>
      {showDismiss ? (
        <Pressable
          onPress={onDismiss}
          haptic="light"
          minSize={28}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${label}`}
          style={styles.dismiss}
        >
          <Text variant="label" color={theme.inkQuiet}>
            ×
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
    minWidth: 40,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: radius[999],
    borderWidth: 1,
  },
  disabled: { opacity: 0.5 },
  dismiss: {
    marginLeft: -spacing[4],
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
