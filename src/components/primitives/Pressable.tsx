import React, { useCallback, useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Pressable as RNPressable,
  type PressableProps,
  type ViewStyle,
  type StyleProp,
  StyleSheet,
} from 'react-native';
import * as Haptics from 'expo-haptics';

type StyleFn = (state: { pressed: boolean }) => StyleProp<ViewStyle>;

interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | StyleFn;
  minSize?: number;
  haptic?: 'light' | 'medium' | 'heavy' | 'none';
  longPressHaptic?: 'medium' | 'heavy';
  onLongPress?: () => void;
  destructive?: boolean;
  disableHaptics?: boolean;
}

const hapticMap: Record<
  'light' | 'medium' | 'heavy',
  Haptics.ImpactFeedbackStyle
> = {
  light: Haptics.ImpactFeedbackStyle.Light,
  medium: Haptics.ImpactFeedbackStyle.Medium,
  heavy: Haptics.ImpactFeedbackStyle.Heavy,
};

export function Pressable({
  children,
  style,
  minSize = 44,
  haptic = 'light',
  longPressHaptic = 'medium',
  onLongPress,
  destructive = false,
  disableHaptics = false,
  accessibilityRole = 'button',
  hitSlop,
  onPress: onPressProp,
  ...rest
}: Props): React.JSX.Element {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v) => {
        setReduceMotion(v);
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      setReduceMotion(v);
    });
    return () => sub.remove();
  }, []);

  const fireHaptic = useCallback(
    async (feedback: Haptics.ImpactFeedbackStyle) => {
      if (disableHaptics) return;
      try {
        await Haptics.impactAsync(feedback);
      } catch {
        // expo-haptics unavailable on some devices/Emulator
      }
    },
    [disableHaptics],
  );

  const handlePress = useCallback(
    (event: import('react-native').GestureResponderEvent) => {
      if (destructive) return;
      if (haptic !== 'none') {
        void fireHaptic(hapticMap[haptic] ?? Haptics.ImpactFeedbackStyle.Light);
      }
      onPressProp?.(event);
    },
    [haptic, fireHaptic, onPressProp, destructive],
  );

  const handleLongPress = useCallback(() => {
    const feedback =
      longPressHaptic === 'heavy'
        ? Haptics.ImpactFeedbackStyle.Heavy
        : Haptics.ImpactFeedbackStyle.Medium;
    void fireHaptic(feedback);
    onLongPress?.();
  }, [longPressHaptic, fireHaptic, onLongPress]);

  return (
    <RNPressable
      accessibilityRole={accessibilityRole}
      hitSlop={hitSlop ?? 8}
      onPress={handlePress}
      onLongPress={onLongPress ? handleLongPress : undefined}
      style={({ pressed }) => [
        styles.base,
        { minHeight: minSize, minWidth: minSize },
        !reduceMotion && pressed && styles.pressed,
        typeof style === 'function' ? style({ pressed }) : style,
      ]}
      {...rest}
    >
      {children}
    </RNPressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
