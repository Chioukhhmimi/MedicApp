/**
 * Design tokens — two-layer system.
 *
 * Layer 1: Primitives — raw color values. Never used directly by components.
 * Layer 2: Semantic — role-based tokens (light and dark maps).
 *
 * Art direction: Ambient Minimal (Option C from DESIGN.md).
 * Teal primary, grayscale chrome, status-only colors.
 */

// ─── Layer 1: Primitives ─────────────────────────────────────────────────────

export const primitives = {
  white: '#FFFFFF',
  black: '#0B0F0F',

  // Teal (brand)
  teal50: '#E6F5F3',
  teal100: '#B3E0DB',
  teal500: '#0E8C82',
  teal700: '#0B5A54',
  teal900: '#063B37',

  // Red (danger)
  red500: '#B23A48',

  // Amber (warning)
  amber500: '#B86A1F',

  // Blue (info)
  blue500: '#4A6B99',

  // Greys
  grey50: '#F7F9F8',
  grey100: '#E4E9E8',
  grey200: '#CFD6D4',
  grey400: '#8B9793',
  grey600: '#5B6A67',
  grey800: '#2A3533',
  grey900: '#0F1615',
} as const;

// ─── Layer 2: Semantic Tokens ────────────────────────────────────────────────

export interface SemanticTokens {
  bg: string;
  surface1: string;
  surface2: string;
  ink: string;
  inkMuted: string;
  inkQuiet: string;
  brand: string;
  brandInk: string;
  danger: string;
  warning: string;
  success: string;
  info: string;
  focus: string;
  border: string;
}

export const light: SemanticTokens = {
  bg: primitives.white,
  surface1: primitives.grey50,
  surface2: primitives.white,
  ink: primitives.grey900,
  inkMuted: primitives.grey600,
  inkQuiet: primitives.grey400,
  brand: primitives.teal500,
  brandInk: primitives.white,
  danger: primitives.red500,
  warning: primitives.amber500,
  success: primitives.teal500,
  info: primitives.blue500,
  focus: 'rgba(14,140,130,0.6)',
  border: primitives.grey100,
};

export const dark: SemanticTokens = {
  bg: primitives.black,
  surface1: '#131817',
  surface2: '#1A2020',
  ink: '#ECF1EF',
  inkMuted: '#8FA09C',
  inkQuiet: '#667470',
  brand: primitives.teal500, // brand never inverts
  brandInk: primitives.white,
  danger: primitives.red500,
  warning: primitives.amber500,
  success: primitives.teal500,
  info: primitives.blue500,
  focus: 'rgba(14,140,130,0.6)',
  border: '#1F2725',
};

// ─── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  4: 4,
  8: 8,
  12: 12,
  16: 16,
  20: 20,
  24: 24,
  32: 32,
  48: 48,
} as const;

// ─── Border Radius ───────────────────────────────────────────────────────────

export const radius = {
  8: 8, // inputs
  12: 12, // cards
  20: 20, // sheets
  999: 999, // pills
} as const;

// ─── Type Scale ──────────────────────────────────────────────────────────────

export const typeScale = {
  display: {
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '600' as const,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '600' as const,
  },
  h3: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
  mono: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400' as const,
    fontVariant: ['tabular-nums'] as const,
  },
} as const;

// ─── Elevation ───────────────────────────────────────────────────────────────

export const elevation = {
  none: {},
  pressed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sheet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;
