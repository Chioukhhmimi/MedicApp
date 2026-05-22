/**
 * Design tokens — Dosely brand identity (teal + coral).
 *
 * Brand language: calming teal builds trust and signals health; warm coral
 * powers calls-to-action. Soft cream / mist neutrals keep screens clean.
 * Token names are preserved so existing callers don't need renaming —
 * only the underlying values move.
 */
import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  // Brand — teal family. Used for the logo, headings, app icon tile,
  // health-positive signals ("taken"), and quiet accent surfaces.
  brand: '#0E8C82',
  brandBright: '#1FB8A6',
  brandDeep: '#0B5A54',
  brandInk: '#103D3A',

  // Action — coral. Reserved for primary CTAs and alerts per the brand guide.
  primary: '#FF6B5E', // coral; fill color (use dark variant for text on white)
  primaryDark: '#C8453A', // coral-ink, AA on white
  primaryTint: '#FFE7E1', // soft tint card / chip background
  coralSoft: '#FF8A6B',

  // Neutrals & surfaces — paper canvas, cream cards, mist dividers.
  background: '#FBFDFC', // paper
  surface: '#FFFFFF',
  surfaceMuted: '#F4F8F6', // cream
  mist: '#E3EFEC', // soft teal-tint
  text: '#103D3A', // ink
  textMuted: '#5B8C87', // slate — AA on white & cream
  border: '#E3EFEC',
  white: '#FFFFFF',

  // Time-of-day chip accents (kept under existing names so the Today screen
  // doesn't need touching). Mint = brand teal for "taken"; sky/lavender map
  // to deeper teal shades to keep variety while staying on-brand.
  accent: '#B86A1F', // amber — for "later"
  accentTint: '#FFE9C7',
  sky: '#0E8C82', // teal for evening chip
  skyTint: '#E3EFEC',
  mint: '#0E8C82', // brand teal — "taken" status
  mintTint: '#DCF1E8',
  lavender: '#0B5A54', // teal-deep — night chip

  // Status
  danger: '#B23A48', // red — AA on white
  dangerTint: '#FBE3E6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const fontSize = {
  sm: 13,
  body: 16,
  lg: 20,
  xl: 28,
  display: 34, // big "Worry less." style heading
} as const;

/** Maps a user action to its semantic color. */
export const actionColor: Record<string, string> = {
  taken: colors.mint,
  skipped: colors.danger,
  later: colors.accent,
  pending: colors.textMuted,
};

/**
 * Time-of-day chip palette. Used on the Today list to colour-code groups.
 * Morning is warm coral; afternoon amber; evening cool teal; night deep teal.
 */
export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export const bucketChip: Record<
  TimeBucket,
  { bg: string; fg: string; label: string }
> = {
  morning: { bg: colors.primaryTint, fg: colors.primaryDark, label: 'Morning' },
  afternoon: { bg: colors.accentTint, fg: colors.accent, label: 'Afternoon' },
  evening: { bg: colors.mist, fg: colors.brand, label: 'Evening' },
  night: { bg: '#D8E5E2', fg: colors.brandDeep, label: 'Night' },
};

/** Returns the time-of-day bucket for an "HH:mm" or full ISO timestamp. */
export function bucketForHour(hour: number): TimeBucket {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}

/** Soft elevated-card shadow. iOS uses native shadow props, Android falls back to elevation. */
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
