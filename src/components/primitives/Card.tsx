import React from 'react';
import { View, type ViewStyle, type StyleProp } from 'react-native';
import { Pressable } from '@/components/primitives/Pressable';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius, elevation } from '@/theme/tokens';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  padding?: number;
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;
  border?: boolean;
}

export function Card({
  children,
  onPress,
  padding = spacing[16],
  style,
  elevated = false,
  border = true,
}: Props): React.JSX.Element {
  const theme = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: theme.surface1,
    borderRadius: radius[12],
    padding,
    borderWidth: border ? 1 : 0,
    borderColor: theme.border,
    ...(elevated ? elevation.sheet : {}),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        haptic="light"
        style={({ pressed }) => [
          cardStyle,
          pressed && elevation.pressed,
          style,
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={[cardStyle, style]}>{children}</View>;
}
