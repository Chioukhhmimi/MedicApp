import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, type ViewStyle, type StyleProp } from 'react-native';
import { MinusSignIcon, PlusSignIcon } from '@hugeicons/core-free-icons';
import { Pressable } from '@/components/primitives/Pressable';
import { Text } from '@/components/primitives/Text';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius } from '@/theme/tokens';
import { Icon } from '@/components/Icon';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  suffix?: string;
  style?: StyleProp<ViewStyle>;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  suffix,
  style,
}: Props): React.JSX.Element {
  const theme = useTheme();
  const repeatTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clamp = (v: number): number => Math.min(max, Math.max(min, v));
  const canDec = value > min;
  const canInc = value < max;

  const dec = useCallback(() => {
    if (canDec) onChange(clamp(value - step));
  }, [canDec, value, step, onChange]);

  const inc = useCallback(() => {
    if (canInc) onChange(clamp(value + step));
  }, [canInc, value, step, onChange]);

  const latestRepeatFn = useRef<(() => void) | null>(null);
  latestRepeatFn.current = null;

  const startRepeat = useCallback((fn: () => void) => {
    latestRepeatFn.current = fn;
    fn();
    repeatTimer.current = setInterval(() => {
      latestRepeatFn.current?.();
    }, 200);
  }, []);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  const handleAccessibilityAction = useCallback(
    (event: { nativeEvent: { actionName: string } }) => {
      if (event.nativeEvent.actionName === 'increment') inc();
      if (event.nativeEvent.actionName === 'decrement') dec();
    },
    [inc, dec],
  );

  const display = suffix ? `${value} ${suffix}` : String(value);

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={label ? `${label}, ${display}` : display}
      accessibilityState={{ disabled: !canDec && !canInc }}
      accessibilityActions={[
        { name: 'increment', label: 'Increment' },
        { name: 'decrement', label: 'Decrement' },
      ]}
      onAccessibilityAction={handleAccessibilityAction}
    >
      <Pressable
        onPress={dec}
        onLongPress={() => canDec && startRepeat(dec)}
        onPressOut={stopRepeat}
        disabled={!canDec}
        haptic="light"
        minSize={44}
        style={[
          styles.btn,
          { borderColor: theme.border },
          !canDec && styles.btnDisabled,
        ]}
      >
        <Icon
          icon={MinusSignIcon}
          size={18}
          color={canDec ? theme.ink : theme.inkQuiet}
          strokeWidth={2}
        />
      </Pressable>

      <Text variant="mono" center style={styles.value}>
        {display}
      </Text>

      <Pressable
        onPress={inc}
        onLongPress={() => canInc && startRepeat(inc)}
        onPressOut={stopRepeat}
        disabled={!canInc}
        haptic="light"
        minSize={44}
        style={[
          styles.btn,
          { borderColor: theme.border },
          !canInc && styles.btnDisabled,
        ]}
      >
        <Icon
          icon={PlusSignIcon}
          size={18}
          color={canInc ? theme.ink : theme.inkQuiet}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius[8],
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.4 },
  value: { minWidth: 60 },
});
