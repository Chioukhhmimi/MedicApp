import React from 'react';
import {
  Text as RNText,
  type TextProps,
  type StyleProp,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { typeScale } from '@/theme/tokens';

type Variant = 'display' | 'title' | 'h3' | 'body' | 'label' | 'mono';

interface Props extends TextProps {
  variant?: Variant;
  color?: string;
  muted?: boolean;
  quiet?: boolean;
  center?: boolean;
  maxFontSizeMultiplier?: number;
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
}

export function Text({
  variant = 'body',
  color,
  muted,
  quiet,
  center,
  maxFontSizeMultiplier,
  children,
  style,
  ...rest
}: Props): React.JSX.Element {
  const theme = useTheme();
  const preset = typeScale[variant];

  const resolvedColor = color
    ? color
    : muted
      ? theme.inkMuted
      : quiet
        ? theme.inkQuiet
        : theme.ink;

  return (
    <RNText
      {...rest}
      maxFontSizeMultiplier={maxFontSizeMultiplier}
      style={[preset, { color: resolvedColor }, center && { textAlign: 'center' }, style]}
    >
      {children}
    </RNText>
  );
}
