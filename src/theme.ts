/**
 * Design tokens. Centralised so screens stay consistent and the palette can
 * be audited for contrast (Feature 8: accessibility — all text/background
 * pairs below meet WCAG AA 4.5:1 unless explicitly noted).
 *
 * Visual language: soft-lavender canvas, white elevated cards, coral primary,
 * sky/mint/amber accents — inspired by the "Daily Dose" Dribbble reference.
 */
import { Platform, type ViewStyle } from 'react-native';

export const colors = {
  // Brand — coral
  primary: '#FE7E6E', // coral; fill color (use dark variant for text on white)
  primaryDark: '#C44530', // coral, AA on white
  primaryTint: '#FFE7E1', // soft peach (card tint / chip bg)

  // Accents
  accent: '#E08A2B', // amber (text on white, AA) — used for "later"
  accentTint: '#FFE9C7',
  sky: '#5A93AE', // muted sky for evening chip text — AA on white
  skyTint: '#DDEEF6', // chip background
  mint: '#3E8E6D', // mint — AA on white
  mintTint: '#DCF1E8',
  lavender: '#7B7FC1', // periwinkle accent text

  // Status
  danger: '#B23A48', // red — AA on white
  dangerTint: '#FBE3E6',

  // Surfaces & text
  background: '#EEF0F8', // soft lavender canvas
  surface: '#FFFFFF', // elevated card
  surfaceMuted: '#F7F8FC', // inner pill / quiet section
  text: '#1A1F2E', // near-black for headings
  textMuted: '#6B7088', // slate-muted — AA on white & lavender
  border: '#E3E5F0',
  white: '#FFFFFF',
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
 * Time-of-day chip palette. Used on the Today list to colour-code groups —
 * mirrors the "Morning, before breakfast" / "Morning, after breakfast" chips
 * from the reference design.
 */
export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';

export const bucketChip: Record<
  TimeBucket,
  { bg: string; fg: string; label: string }
> = {
  morning: { bg: colors.primaryTint, fg: colors.primaryDark, label: 'Morning' },
  afternoon: { bg: colors.accentTint, fg: colors.accent, label: 'Afternoon' },
  evening: { bg: colors.skyTint, fg: colors.sky, label: 'Evening' },
  night: { bg: '#E5E2F5', fg: colors.lavender, label: 'Night' },
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
    shadowColor: '#1A1F2E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
  },
  android: { elevation: 2 },
  default: {},
})!;
