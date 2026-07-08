/**
 * @deprecated Use @/theme/tokens and @/hooks/useTheme instead.
 *
 * This file is a backward-compatibility shim. All existing screen imports
 * continue to work. New code should import from @/theme/tokens directly
 * and use the useTheme() hook for dark-mode-aware values.
 */
import { Platform, type ViewStyle } from 'react-native';
import { light, primitives, typeScale, elevation } from '@/theme/tokens';

/** @deprecated Use light or dark semantic tokens via useTheme() */
export const colors = {
  // Brand
  brand: light.brand,
  brandBright: primitives.teal100,
  brandDeep: primitives.teal700,
  brandInk: primitives.teal900,

  // Action — coral (legacy, will be replaced by teal in Phase 3+)
  primary: '#FF6B5E',
  primaryDark: '#C8453A',
  primaryTint: '#FFE7E1',
  coralSoft: '#FF8A6B',

  // Neutrals & surfaces
  background: light.bg,
  surface: light.surface2,
  surfaceMuted: primitives.grey50,
  mist: primitives.teal50,
  text: light.ink,
  textMuted: light.inkMuted,
  border: light.border,
  white: primitives.white,

  // Time-of-day chip accents
  accent: primitives.amber500,
  accentTint: '#FFE9C7',
  sky: primitives.teal500,
  skyTint: primitives.teal50,
  mint: primitives.teal500,
  mintTint: '#DCF1E8',
  lavender: primitives.teal700,

  // Status
  danger: light.danger,
  dangerTint: '#FBE3E6',
} as const;

/** @deprecated Use spacing from @/theme/tokens */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

/** @deprecated Use radius from @/theme/tokens */
export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

/** @deprecated Use typeScale from @/theme/tokens */
export const fontSize = {
  sm: typeScale.label.fontSize,
  body: typeScale.body.fontSize,
  lg: 20,
  xl: 28,
  display: typeScale.display.fontSize,
} as const;

export const textCaps = {
  chrome: { maxFontSizeMultiplier: 1.3, allowFontScaling: true } as const,
  numeric: { maxFontSizeMultiplier: 1.2, allowFontScaling: true } as const,
} as const;

/** Maps a user action to its semantic color. */
export const actionColor: Record<string, string> = {
  taken: light.success,
  skipped: light.danger,
  later: primitives.amber500,
  pending: light.inkMuted,
};

export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export const bucketChip: Record<TimeBucket, { bg: string; fg: string }> = {
  morning: { bg: '#FFE7E1', fg: '#C8453A' },
  afternoon: { bg: '#FFE9C7', fg: primitives.amber500 },
  evening: { bg: primitives.teal50, fg: light.brand },
  night: { bg: '#D8E5E2', fg: primitives.teal700 },
};

export function bucketForHour(hour: number): TimeBucket {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** @deprecated Use elevation.sheet from @/theme/tokens */
export const shadow: ViewStyle = Platform.select<ViewStyle>({
  ios: {
    shadowColor: '#063B37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
  },
  android: { elevation: 2 },
  default: {},
})!;
