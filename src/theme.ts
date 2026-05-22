/**
 * Design tokens. Centralised so screens stay consistent and the palette can
 * be audited for contrast (Feature 8: accessibility — all text/background
 * pairs below meet WCAG AA 4.5:1).
 */
export const colors = {
  primary: '#0E7C66', // teal — AA on white
  primaryDark: '#0A5C4C',
  primaryTint: '#F0F7F5',
  accent: '#9A6700', // amber for "later"/warnings — AA on white
  danger: '#B23A48', // red for "skipped"/destructive — AA on white
  text: '#1A1A1A',
  textMuted: '#5B5B5B', // AA on white
  border: '#E2E2E2',
  background: '#FFFFFF',
  surface: '#F7F7F7',
  white: '#FFFFFF',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 6,
  md: 12,
  lg: 20,
} as const;

export const fontSize = {
  sm: 13,
  body: 16,
  lg: 20,
  xl: 28,
} as const;

/** Maps a user action to its semantic color. */
export const actionColor: Record<string, string> = {
  taken: colors.primary,
  skipped: colors.danger,
  later: colors.accent,
  pending: colors.textMuted,
};
