# Phase 2: Design System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the design system foundation — restructured theme with dark mode, six core UI primitives, and runtime theme switching.

**Architecture:** Two-layer token system (primitive → semantic) consumed by a Zustand-derived `useTheme()` hook. Six primitives (`Text`, `Pressable`, `Card`, `Chip`, `Stepper`, `Sheet`) live in `src/components/primitives/`. Existing screens keep working via a deprecated re-export shim in `src/theme.ts`.

**Tech Stack:** React Native 0.81, Expo SDK 54, TypeScript strict, Zustand, expo-haptics, @gorhom/bottom-sheet, react-native-gesture-handler, react-native-reanimated

## Global Constraints

- TypeScript strict mode with `noUncheckedIndexedAccess`
- Absolute imports via `@/` → `src/`
- 44pt minimum tap target on all interactive elements
- `maxFontSizeMultiplier: 1.3` on chrome text
- ESLint + Prettier enforced (`npm run lint`, `npm run format`)
- All new code must pass `npm run typecheck`

---

## Task 1: Install Dependencies

**Files:**

- Modify: `package.json`
- Modify: `babel.config.js`

**Interfaces:** None — this is setup only.

- [ ] **Step 1: Install expo-haptics**

Run: `npx expo install expo-haptics`

Expected: `expo-haptics` added to `package.json` dependencies.

- [ ] **Step 2: Install bottom-sheet and gesture handler**

Run: `npx expo install @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated`

Expected: All three packages added to `package.json` dependencies.

- [ ] **Step 3: Add reanimated plugin to babel.config.js**

Edit `babel.config.js` — add `react-native-reanimated/plugin` as the **last** plugin in the array:

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          alias: {
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};
```

- [ ] **Step 4: Verify installation**

Run: `npm run typecheck`

Expected: Passes (no new type errors from installed packages).

- [ ] **Step 5: Commit**

```bash
git add package.json babel.config.js package-lock.json
git commit -m "chore: install expo-haptics, bottom-sheet, gesture-handler, reanimated"
```

---

## Task 2: Create Theme Tokens

**Files:**

- Create: `src/theme/tokens.ts`

**Interfaces:**

- Produces: `primitives`, `SemanticTokens` type, `light`, `dark`, `spacing`, `radius`, `typeScale`, `elevation`

- [ ] **Step 1: Create `src/theme/` directory**

Run: `mkdir -p src/theme`

- [ ] **Step 2: Create `src/theme/tokens.ts`**

Write the complete file:

```ts
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
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit src/theme/tokens.ts`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens.ts
git commit -m "feat(theme): add two-layer token system with light/dark semantic tokens"
```

---

## Task 3: Create Theme Index

**Files:**

- Create: `src/theme/index.ts`

**Interfaces:**

- Produces: re-exports from `tokens.ts` for clean import paths

- [ ] **Step 1: Create `src/theme/index.ts`**

```ts
export {
  primitives,
  light,
  dark,
  spacing,
  radius,
  typeScale,
  elevation,
  type SemanticTokens,
} from './tokens';
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit src/theme/index.ts`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/theme/index.ts
git commit -m "feat(theme): add theme barrel export"
```

---

## Task 4: Create Deprecated Theme Shim

**Files:**

- Modify: `src/theme.ts` (replace contents)

**Interfaces:**

- Consumes: `light`, `primitives`, `spacing`, `radius`, `typeScale`, `elevation` from `@/theme/tokens`
- Produces: backward-compatible exports (`colors`, `spacing`, `radius`, `fontSize`, `textCaps`, `actionColor`, `shadow`, `TimeBucket`, `bucketChip`, `bucketForHour`)

- [ ] **Step 1: Replace `src/theme.ts` contents**

Write the complete file:

```ts
/**
 * @deprecated Use @/theme/tokens and @/hooks/useTheme instead.
 *
 * This file is a backward-compatibility shim. All existing screen imports
 * continue to work. New code should import from @/theme/tokens directly
 * and use the useTheme() hook for dark-mode-aware values.
 */
import { Platform, type ViewStyle } from 'react-native';
import {
  light,
  primitives,
  spacing,
  radius,
  typeScale,
  elevation,
} from '@/theme/tokens';

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

export { spacing } from '@/theme/tokens';
export { radius } from '@/theme/tokens';

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
```

- [ ] **Step 2: Verify all existing imports still resolve**

Run: `npm run typecheck`

Expected: Passes — all screens importing from `@/theme` continue to compile.

- [ ] **Step 3: Commit**

```bash
git add src/theme.ts
git commit -m "refactor(theme): replace with deprecated backward-compat shim"
```

---

## Task 5: Create useTheme Hook

**Files:**

- Create: `src/hooks/useTheme.ts`

**Interfaces:**

- Consumes: `settings.colorScheme` from `useSettingsStore`, `light`, `dark` from `@/theme/tokens`
- Produces: `useTheme()` → `SemanticTokens`

- [ ] **Step 1: Create `src/hooks/useTheme.ts`**

```ts
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { light, dark, type SemanticTokens } from '@/theme/tokens';

/**
 * Returns the active semantic token set based on the user's color scheme
 * preference. Reads from useSettingsStore; re-renders only when
 * colorScheme changes (Zustand selector).
 */
export function useTheme(): SemanticTokens {
  const colorScheme = useSettingsStore((s) => s.settings.colorScheme);
  const systemScheme = useColorScheme();

  const mode =
    colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;
  return mode === 'dark' ? dark : light;
}
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/hooks/useTheme.ts`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTheme.ts
git commit -m "feat(hooks): add useTheme() hook for dark-mode-aware token access"
```

---

## Task 6: Extend Settings Type

**Files:**

- Modify: `src/lib/types.ts:106-135`

**Interfaces:**

- Consumes: nothing
- Produces: `Settings.colorScheme`, `DEFAULT_SETTINGS.colorScheme`

- [ ] **Step 1: Add `colorScheme` to Settings interface**

In `src/lib/types.ts`, add `colorScheme` to the `Settings` interface (line ~116):

```ts
export interface Settings {
  defaultSnoozeIntervalMin: number;
  maxSnoozeRepeats: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  notificationSound: string;
  biometricLock: boolean;
  onboardingComplete: boolean;
  language: AppLanguage;
  colorScheme: 'light' | 'dark' | 'system';
}
```

- [ ] **Step 2: Add `colorScheme` to DEFAULT_SETTINGS**

In the same file, add to `DEFAULT_SETTINGS` (line ~134):

```ts
export const DEFAULT_SETTINGS: Settings = {
  defaultSnoozeIntervalMin: 30,
  maxSnoozeRepeats: 6,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  notificationSound: 'default',
  biometricLock: false,
  onboardingComplete: false,
  language: 'fr',
  colorScheme: 'system',
};
```

- [ ] **Step 3: Verify types compile**

Run: `npm run typecheck`

Expected: Passes. No runtime change yet — the store already handles partial patches via `update()`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat(types): add colorScheme field to Settings for dark mode"
```

---

## Task 7: Create Text Primitive

**Files:**

- Create: `src/components/primitives/Text.tsx`

**Interfaces:**

- Consumes: `useTheme()` from `@/hooks/useTheme`, `typeScale` from `@/theme/tokens`
- Produces: `Text` component with `variant`, `color`, `muted`, `quiet`, `center`, `maxFontSizeMultiplier` props

- [ ] **Step 1: Create directory**

Run: `mkdir -p src/components/primitives`

- [ ] **Step 2: Create `src/components/primitives/Text.tsx`**

```tsx
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
      style={[
        preset,
        { color: resolvedColor },
        center && { textAlign: 'center' },
        style,
      ]}
    >
      {children}
    </RNText>
  );
}
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Text.tsx`

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/primitives/Text.tsx
git commit -m "feat(primitives): add variant-based Text component"
```

---

## Task 8: Create Pressable Primitive

**Files:**

- Create: `src/components/primitives/Pressable.tsx`

**Interfaces:**

- Consumes: `expo-haptics`
- Produces: `Pressable` component with haptic, long-press, reduce-motion, minSize, destructive props

- [ ] **Step 1: Create `src/components/primitives/Pressable.tsx`**

```tsx
import React, { useCallback, useEffect, useRef } from 'react';
import {
  AccessibilityInfo,
  Platform,
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

const hapticMap: Record<string, Haptics.ImpactFeedbackStyle> = {
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
  ...rest
}: Props): React.JSX.Element {
  const reduceMotion = useRef(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      reduceMotion.current = v;
    });
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

  const handlePress = useCallback(() => {
    void fireHaptic(hapticMap[haptic] ?? Haptics.ImpactFeedbackStyle.Light);
    rest.onPress?.();
  }, [haptic, fireHaptic, rest.onPress]);

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
        !reduceMotion.current && pressed && styles.pressed,
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Pressable.tsx`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/Pressable.tsx
git commit -m "feat(primitives): add Pressable with haptics, long-press, reduce-motion"
```

---

## Task 9: Create Card Primitive

**Files:**

- Create: `src/components/primitives/Card.tsx`

**Interfaces:**

- Consumes: `useTheme()` from `@/hooks/useTheme`, `Pressable` from `@/components/primitives/Pressable`, `spacing`, `radius`, `elevation` from `@/theme/tokens`
- Produces: `Card` component with `onPress`, `padding`, `elevated`, `border` props

- [ ] **Step 1: Create `src/components/primitives/Card.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Card.tsx`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/Card.tsx
git commit -m "feat(primitives): add Card with surface hierarchy and dark mode"
```

---

## Task 10: Create Chip Primitive

**Files:**

- Create: `src/components/primitives/Chip.tsx`

**Interfaces:**

- Consumes: `Pressable` from `@/components/primitives/Pressable`, `Text` from `@/components/primitives/Text`, `useTheme()` from `@/hooks/useTheme`, `spacing`, `radius` from `@/theme/tokens`
- Produces: `Chip` component with `selectable`/`filter`/`input` variants

- [ ] **Step 1: Create `src/components/primitives/Chip.tsx`**

```tsx
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Chip.tsx`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/Chip.tsx
git commit -m "feat(primitives): add Chip with selectable/filter/input variants"
```

---

## Task 11: Create Stepper Primitive

**Files:**

- Create: `src/components/primitives/Stepper.tsx`

**Interfaces:**

- Consumes: `Pressable` from `@/components/primitives/Pressable`, `Text` from `@/components/primitives/Text`, `useTheme()` from `@/hooks/useTheme`, `spacing`, `radius` from `@/theme/tokens`, Hugeicons `MinusSignIcon`/`PlusSignIcon`
- Produces: `Stepper` component with +/- buttons, long-press repeat, accessibility actions

- [ ] **Step 1: Create `src/components/primitives/Stepper.tsx`**

```tsx
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

  const startRepeat = useCallback((fn: () => void) => {
    fn();
    repeatTimer.current = setInterval(fn, 200);
  }, []);

  const stopRepeat = useCallback(() => {
    if (repeatTimer.current) {
      clearInterval(repeatTimer.current);
      repeatTimer.current = null;
    }
  }, []);

  const display = suffix ? `${value} ${suffix}` : String(value);

  return (
    <View
      style={[styles.row, style]}
      accessibilityRole="adjustable"
      accessibilityLabel={label ? `${label}, ${display}` : display}
      accessibilityActions={[
        { name: 'increment', label: 'Increment' },
        { name: 'decrement', label: 'Decrement' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') inc();
        if (event.nativeEvent.actionName === 'decrement') dec();
      }}
    >
      <Pressable
        onPress={dec}
        onLongPress={() => canDec && startRepeat(dec)}
        onPressIn={() => {}}
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
        onPressIn={() => {}}
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
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Stepper.tsx`

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/Stepper.tsx
git commit -m "feat(primitives): add Stepper with +/- buttons, long-press repeat, a11y"
```

---

## Task 12: Create Sheet Primitive

**Files:**

- Create: `src/components/primitives/Sheet.tsx`

**Interfaces:**

- Consumes: `@gorhom/bottom-sheet`, `useTheme()` from `@/hooks/useTheme`, `Text` from `@/components/primitives/Text`, `spacing`, `radius` from `@/theme/tokens`
- Produces: `Sheet` component wrapping BottomSheetModal

- [ ] **Step 1: Create `src/components/primitives/Sheet.tsx`**

```tsx
import React, { forwardRef, useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import {
  BottomSheetModal,
  BottomSheetBackdrop,
  BottomSheetScrollView,
  type BottomSheetModalProps,
} from '@gorhom/bottom-sheet';
import { useTheme } from '@/hooks/useTheme';
import { spacing, radius } from '@/theme/tokens';
import { Text } from '@/components/primitives/Text';

interface Props extends Omit<BottomSheetModalProps, 'children'> {
  children: React.ReactNode;
  title?: string;
  snapPoints?: (string | number)[];
}

export const Sheet = forwardRef<BottomSheetModal, Props>(function Sheet(
  { children, title, snapPoints = ['70%'], ...rest },
  ref,
): React.JSX.Element {
  const theme = useTheme();

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.4}
      />
    ),
    [],
  );

  const backgroundStyle = useMemo(
    () => ({
      backgroundColor: theme.surface2,
      borderRadius: radius[20],
    }),
    [theme.surface2],
  );

  const handleIndicatorStyle = useMemo(
    () => ({
      backgroundColor: theme.border,
      width: 40,
    }),
    [theme.border],
  );

  return (
    <BottomSheetModal
      ref={ref}
      snapPoints={snapPoints}
      backdropComponent={renderBackdrop}
      backgroundStyle={backgroundStyle}
      handleIndicatorStyle={handleIndicatorStyle}
      {...rest}
    >
      <BottomSheetScrollView contentContainerStyle={styles.content}>
        {title ? (
          <Text variant="h3" style={styles.title}>
            {title}
          </Text>
        ) : null}
        {children}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
});

const styles = StyleSheet.create({
  content: {
    padding: spacing[24],
    gap: spacing[16],
  },
  title: {
    marginBottom: spacing[8],
  },
});
```

- [ ] **Step 2: Verify types compile**

Run: `npx tsc --noEmit src/components/primitives/Sheet.tsx`

Expected: May show type warnings from `@gorhom/bottom-sheet` — these are expected with the library's typing. Should not have hard errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/primitives/Sheet.tsx
git commit -m "feat(primitives): add Sheet (bottom-sheet wrapper) with dark mode"
```

---

## Task 13: Update Touchable to Re-export Pressable

**Files:**

- Modify: `src/components/Touchable.tsx`

**Interfaces:**

- Consumes: `Pressable` from `@/components/primitives/Pressable`
- Produces: `Touchable` as a re-export for backward compatibility

- [ ] **Step 1: Replace `src/components/Touchable.tsx` contents**

```ts
/** @deprecated Use Pressable from @/components/primitives/Pressable */
export { Pressable as Touchable } from '@/components/primitives/Pressable';
```

- [ ] **Step 2: Verify existing imports still work**

Run: `npm run typecheck`

Expected: Passes — any file importing `Touchable` from `@/components/Touchable` still resolves.

- [ ] **Step 3: Commit**

```bash
git add src/components/Touchable.tsx
git commit -m "refactor: deprecate Touchable, re-export Pressable"
```

---

## Task 14: Update Root Layout

**Files:**

- Modify: `app/_layout.tsx`

**Interfaces:**

- Consumes: `GestureHandlerRootView` from `react-native-gesture-handler`, `useTheme()` from `@/hooks/useTheme`
- Produces: Root layout with gesture handler wrapper and dark-aware StatusBar

- [ ] **Step 1: Add GestureHandlerRootView import**

In `app/_layout.tsx`, add import (line ~17):

```ts
import { GestureHandlerRootView } from 'react-native-gesture-handler';
```

- [ ] **Step 2: Add useTheme import**

```ts
import { useTheme } from '@/hooks/useTheme';
```

- [ ] **Step 3: Wrap return with GestureHandlerRootView**

Replace the return block (lines ~109-142):

```tsx
if (!ready) return null;

const theme = colors; // use legacy colors for header styling during migration

return (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.background },
          headerTintColor: theme.text,
          headerTitleStyle: { fontWeight: '800' },
          headerShadowVisible: false,
          contentStyle: { backgroundColor: theme.background },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="medication/edit"
          options={{
            presentation: 'modal',
            title: t('edit.title_edit'),
          }}
        />
        <Stack.Screen
          name="medication/[id]"
          options={{ title: t('medication_detail.schedule') }}
        />
        <Stack.Screen
          name="confirm"
          options={{ presentation: 'modal', title: t('confirm.title') }}
        />
        <Stack.Screen name="export" options={{ title: t('history.export') }} />
      </Stack>
    </SafeAreaProvider>
  </GestureHandlerRootView>
);
```

- [ ] **Step 4: Verify app compiles**

Run: `npm run typecheck`

Expected: Passes.

- [ ] **Step 5: Commit**

```bash
git add app/_layout.tsx
git commit -m "feat(layout): wrap root with GestureHandlerRootView for bottom-sheet"
```

---

## Task 15: Add Dark Mode Toggle to Settings

**Files:**

- Modify: `app/(tabs)/settings.tsx`

**Interfaces:**

- Consumes: `SegmentedControl` from `@/components/SegmentedControl`, `useSettingsStore`
- Produces: Appearance row with Light/Dark/System segmented control

- [ ] **Step 1: Add SegmentedControl import**

In `app/(tabs)/settings.tsx`, add import:

```ts
import { SegmentedControl } from '@/components/SegmentedControl';
```

- [ ] **Step 2: Add Appearance section**

Insert after the Privacy & security section (before the note `<View>`), around line ~124:

```tsx
<Text style={styles.group}>Appearance</Text>
<Row
  label="Color scheme"
  hint="Choose light, dark, or follow system settings"
>
  <SegmentedControl
    options={[
      { value: 'light', label: 'Light' },
      { value: 'dark', label: 'Dark' },
      { value: 'system', label: 'System' },
    ]}
    value={settings.colorScheme}
    onChange={(value) => update({ colorScheme: value })}
  />
</Row>
```

- [ ] **Step 3: Verify types compile**

Run: `npm run typecheck`

Expected: Passes.

- [ ] **Step 4: Commit**

```bash
git add app/\(tabs\)/settings.tsx
git commit -m "feat(settings): add dark mode toggle (Light/Dark/System)"
```

---

## Task 16: Verify Full Build

**Files:** None — verification only.

- [ ] **Step 1: Typecheck**

Run: `npm run typecheck`

Expected: Passes with no errors.

- [ ] **Step 2: Lint**

Run: `npm run lint`

Expected: Passes (or only pre-existing warnings).

- [ ] **Step 3: Run tests**

Run: `npm test`

Expected: All existing tests pass.

- [ ] **Step 4: Verify primitives directory**

Run: `ls src/components/primitives/`

Expected: 6 files: `Text.tsx`, `Pressable.tsx`, `Card.tsx`, `Chip.tsx`, `Stepper.tsx`, `Sheet.tsx`

- [ ] **Step 5: Verify theme directory**

Run: `ls src/theme/`

Expected: 2 files: `tokens.ts`, `index.ts`

- [ ] **Step 6: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "chore: Phase 2 design system verification fixes"
```

---

## Summary

| Task | Deliverable               | Dependencies           |
| ---- | ------------------------- | ---------------------- |
| 1    | Dependencies installed    | None                   |
| 2    | `src/theme/tokens.ts`     | None                   |
| 3    | `src/theme/index.ts`      | Task 2                 |
| 4    | `src/theme.ts` shim       | Task 2                 |
| 5    | `src/hooks/useTheme.ts`   | Task 2, Task 6         |
| 6    | `Settings.colorScheme`    | None                   |
| 7    | `Text` primitive          | Task 2, Task 5         |
| 8    | `Pressable` primitive     | Task 1                 |
| 9    | `Card` primitive          | Task 7, Task 8, Task 2 |
| 10   | `Chip` primitive          | Task 7, Task 8, Task 2 |
| 11   | `Stepper` primitive       | Task 7, Task 8, Task 2 |
| 12   | `Sheet` primitive         | Task 1, Task 7, Task 2 |
| 13   | `Touchable` re-export     | Task 8                 |
| 14   | Root layout update        | Task 1                 |
| 15   | Settings dark mode toggle | Task 6                 |
| 16   | Full verification         | All tasks              |

**Parallelizable:** Tasks 2+6, 7+8, 9+10+11+12 can run in parallel.
