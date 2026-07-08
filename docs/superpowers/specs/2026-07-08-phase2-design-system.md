# Phase 2: Design System Spec

**Date:** 2026-07-08
**Status:** Approved
**Depends on:** Phase 1 (UX foundations)
**Feeds into:** Phase 3 (Critical flows)

---

## 1. Goal

Build the design system foundation that all subsequent phases consume. This means: a restructured theme with dark mode support, six core UI primitives, and the wiring to make theme switching work at runtime.

**This phase does NOT redesign screens.** It creates the building blocks.

---

## 2. Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Theme architecture | Zustand-derived `useTheme()` hook | Consistent with existing Zustand stores, no extra provider, efficient subscriptions |
| Art direction | Full Ambient Minimal (Option C) | Matches DESIGN.md. Teal primary, grayscale chrome, status-only colors |
| Dark mode | Extend `useSettingsStore` with `colorScheme` field | One store, one source of truth, persists across launches |
| Pressable | Replace `Touchable` with enhanced `Pressable` (haptics, long-press, reduce-motion) | DESIGN.md requirement, adds haptic feedback for core habit loop |
| Text | Variant-based (`display`, `title`, `h3`, `body`, `label`, `mono`) | Enforces type scale, prevents inconsistency |
| File organization | One file per primitive in `src/components/primitives/` | Follows existing pattern (Button.tsx, Touchable.tsx) |
| Sheet | Install `@gorhom/bottom-sheet` + deps now | Ready for Phase 3 ConfirmSheet |

---

## 3. Architecture

### 3.1 File Structure

```
src/
  theme/
    tokens.ts              — NEW: primitive colors, semantic tokens, spacing, radius, type scale, elevation
    index.ts               — NEW: re-exports from tokens.ts
  hooks/
    useTheme.ts            — NEW: reads colorScheme from store, returns active SemanticTokens
  components/
    primitives/
      Text.tsx             — NEW: variant-based text
      Pressable.tsx        — NEW: replaces Touchable, adds haptics
      Card.tsx             — NEW: surface component
      Chip.tsx             — NEW: selectable/filter/input chips
      Stepper.tsx          — NEW: numeric +/- input
      Sheet.tsx            — NEW: bottom sheet wrapper
  theme.ts                 — MODIFIED: deprecated re-export shim for backward compatibility
  components/
    Touchable.tsx          — MODIFIED: re-exports Pressable
  store/
    useSettingsStore.ts    — UNCHANGED (settings type extended in types.ts)
  lib/
    types.ts               — MODIFIED: add colorScheme to Settings
  app/
    _layout.tsx            — MODIFIED: wrap with GestureHandlerRootView
    (tabs)/
      settings.tsx         — MODIFIED: add dark mode toggle (small change, not redesign)
```

### 3.2 Token Architecture

Two-layer system:

**Layer 1: Primitive tokens** — raw color values. Never used directly by components.

```ts
// src/theme/tokens.ts

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
```

**Layer 2: Semantic tokens** — role-based. Two maps: light and dark.

```ts
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
  brand: primitives.teal500,   // brand never inverts
  brandInk: primitives.white,
  danger: primitives.red500,
  warning: primitives.amber500,
  success: primitives.teal500,
  info: primitives.blue500,
  focus: 'rgba(14,140,130,0.6)',
  border: '#1F2725',
};
```

**Design tokens:**

```ts
export const spacing = {
  4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32, 48: 48,
} as const;

export const radius = {
  8: 8,     // inputs
  12: 12,   // cards
  20: 20,   // sheets
  999: 999,  // pills
} as const;

export const typeScale = {
  display: { fontSize: 36, lineHeight: 40, fontWeight: '600' as const },
  title:   { fontSize: 22, lineHeight: 28, fontWeight: '600' as const },
  h3:      { fontSize: 17, lineHeight: 22, fontWeight: '600' as const },
  body:    { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
  label:   { fontSize: 13, lineHeight: 18, fontWeight: '500' as const },
  mono:    { fontSize: 15, lineHeight: 22, fontWeight: '400' as const, fontVariant: ['tabular-nums'] as const },
} as const;

export const elevation = {
  none: {},
  pressed: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 2, elevation: 1,
  },
  sheet: {
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.10, shadowRadius: 24, elevation: 8,
  },
} as const;
```

### 3.3 useTheme Hook

```ts
// src/hooks/useTheme.ts
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '@/store/useSettingsStore';
import { light, dark, type SemanticTokens } from '@/theme/tokens';

export function useTheme(): SemanticTokens {
  const colorScheme = useSettingsStore(s => s.settings.colorScheme);
  const systemScheme = useColorScheme();

  const mode = colorScheme === 'system' ? (systemScheme ?? 'light') : colorScheme;
  return mode === 'dark' ? dark : light;
}
```

**Performance note:** Zustand's selector ensures `useTheme()` only re-renders the component when `settings.colorScheme` changes — not on every store update. The semantic token object reference is stable per mode (light/dark are module-level constants).

### 3.4 Backward Compatibility

`src/theme.ts` becomes a deprecated re-export shim:

```ts
/** @deprecated Use @/theme/tokens and @/hooks/useTheme instead */
export { light as colors } from '@/theme/tokens';
export { spacing } from '@/theme/tokens';
export { radius } from '@/theme/tokens';
export { typeScale as fontSize } from '@/theme/tokens';
export { elevation } from '@/theme/tokens';

// Legacy name mappings
export const textCaps = {
  chrome: { maxFontSizeMultiplier: 1.3, allowFontScaling: true } as const,
  numeric: { maxFontSizeMultiplier: 1.2, allowFontScaling: true } as const,
} as const;

export const shadow = elevation.sheet;

/** Maps a user action to its semantic color. */
export const actionColor: Record<string, string> = {
  taken: light.success,
  skipped: light.danger,
  later: primitives.amber500,
  pending: light.inkMuted,
};

// Time-of-day bucket types (unchanged, consumed by Today screen)
export type TimeBucket = 'morning' | 'afternoon' | 'evening' | 'night';
export const bucketChip = { /* ... */ };
export function bucketForHour(hour: number): TimeBucket { /* ... */ }
```

All existing screen imports (`import { colors, spacing } from '@/theme'`) continue to work.

---

## 4. Primitives

### 4.1 Text

**File:** `src/components/primitives/Text.tsx`

Variant-based. Enforces the type scale via presets.

```tsx
interface Props extends TextProps {
  variant?: 'display' | 'title' | 'h3' | 'body' | 'label' | 'mono';
  color?: string;
  muted?: boolean;     // inkMuted
  quiet?: boolean;     // inkQuiet
  center?: boolean;
  maxFontSizeMultiplier?: number;
  children: React.ReactNode;
}
```

- Default variant: `body`
- Default color: `theme.ink` (resolves via `useTheme()`)
- `muted` overrides to `theme.inkMuted`
- `quiet` overrides to `theme.inkQuiet`
- Explicit `color` prop overrides all
- `maxFontSizeMultiplier` is opt-in per instance (chrome text caps at 1.3, content uncapped)
- Does NOT bake in `accessibilityRole="header"` — consumers add it when appropriate

### 4.2 Pressable

**File:** `src/components/primitives/Pressable.tsx`

Replaces `Touchable`. Adds haptics, long-press for destructive, reduce-motion fallback.

```tsx
interface Props extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle> | StyleFn;
  minSize?: number;                        // default 44
  haptic?: 'light' | 'medium' | 'heavy' | 'none';  // default 'light'
  longPressHaptic?: 'medium' | 'heavy';              // default 'medium'
  onLongPress?: () => void;
  destructive?: boolean;                   // long-press required
  disableHaptics?: boolean;                // global kill switch
}
```

**Behavior:**

| Feature | Detail |
|---|---|
| Default haptic | `Haptics.ImpactFeedbackStyle.Light` on press |
| Medium haptic | For primary actions (e.g., Taken button) |
| Heavy haptic | For destructive confirmation |
| `destructive` + `onLongPress` | Requires 500ms hold. Medium haptic on trigger. |
| Reduce motion | Checked via `AccessibilityInfo.isReduceMotionEnabled()`. If active: opacity stays 1, haptics still fire. |
| hitSlop | Default 8pt |
| Visual feedback | `opacity: 0.85` on press (unless reduce-motion active) |

**Dependencies:** `expo-haptics`

### 4.3 Card

**File:** `src/components/primitives/Card.tsx`

Surface component. Dark-mode-aware via `useTheme()`.

```tsx
interface Props {
  children: React.ReactNode;
  onPress?: () => void;       // if provided, wraps in Pressable
  padding?: number;            // default spacing[16]
  style?: StyleProp<ViewStyle>;
  elevated?: boolean;          // sheet-level shadow
  border?: boolean;            // default true
}
```

**Variants:**

| Configuration | Use Case |
|---|---|
| Default (border, not elevated) | List rows, settings rows, standard cards |
| `elevated` | Modal sheets, overlays — uses `elevation.sheet` |
| `border={false}` | Flat groups within a surface |
| `onPress` | Interactive — wraps in `Pressable` with light haptic |

**Surface hierarchy enforcement:**
- `bg` → applied by screen layout (SafeAreaView background)
- `surface1` → `Card` default
- `surface2` → `Card elevated`

Components must never hardcode `#FFFFFF` or `#F7F9F8`.

### 4.4 Chip

**File:** `src/components/primitives/Chip.tsx`

Selectable, filter, or input chips.

```tsx
type ChipVariant = 'selectable' | 'filter' | 'input';

interface Props {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  variant?: ChipVariant;       // default 'selectable'
  icon?: React.ReactNode;
  onDismiss?: () => void;
  disabled?: boolean;
}
```

**Variants:**

| Variant | Visual | Use Case |
|---|---|---|
| `selectable` | Outline → brand fill on select | Snooze duration, schedule type |
| `filter` | Outline → brand fill + dismiss × | History range, per-med filter |
| `input` | surface1 fill + dismiss × | Time chips in ScheduleEditor |

**Styling:** `borderRadius: 999` (pill), `minHeight: 40`, `paddingHorizontal: 16`.

**Accessibility:**
- `accessibilityRole="checkbox"`
- `accessibilityState={{ checked: selected }}`
- Dismiss button: `accessibilityLabel="Remove ${label}"`

### 4.5 Stepper

**File:** `src/components/primitives/Stepper.tsx`

Numeric input with +/- buttons.

```tsx
interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;                 // default 0
  max?: number;                 // default 999
  step?: number;                // default 1
  label?: string;
  suffix?: string;              // e.g. "min", "times"
}
```

**Layout:** `[ — ]  30 min  [ + ]`

- Minus/Plus: 44pt `Pressable` with light haptic
- Value: `Text variant="mono"` centered
- Suffix: `Text variant="label" muted`
- Bounds: buttons dim at min/max
- Long-press repeats at 200ms intervals
- `onChange` fires per step, not on blur

**Accessibility:**
- `accessibilityRole="adjustable"`
- `accessibilityActions={['increment', 'decrement']}`

### 4.6 Sheet

**File:** `src/components/primitives/Sheet.tsx`

Bottom sheet using `@gorhom/bottom-sheet`.

```tsx
interface Props extends Omit<BottomSheetModalProps, 'children'> {
  children: React.ReactNode;
  title?: string;
  snapPoints?: (string | number)[];  // default ['70%']
}
```

**Dependencies:**
- `@gorhom/bottom-sheet`
- `react-native-gesture-handler`
- `react-native-reanimated`

**Styling:**
- `backgroundStyle`: `theme.surface2`, `borderRadius: radius[20]`
- `handleIndicatorStyle`: `theme.border` color, 40pt wide
- Backdrop: `rgba(0,0,0,0.4)`, press-to-dismiss
- Content: `BottomSheetScrollView` with `spacing[24]` padding
- Optional `title`: `Text variant="h3"` at top

**Usage:** Ref-based `present()` / `dismiss()`.

---

## 5. Settings Extension

### 5.1 Type Change

In `src/lib/types.ts`, add to `Settings`:

```ts
colorScheme: 'light' | 'dark' | 'system';
```

Add to `DEFAULT_SETTINGS`:

```ts
colorScheme: 'system',
```

### 5.2 Settings Screen

Add a dark mode row in `app/(tabs)/settings.tsx`:

```
Appearance
  [ Light ] [ Dark ] [ System ]    ← SegmentedControl (existing component)
```

Use the existing `SegmentedControl` component (already in `src/components/SegmentedControl.tsx`). Wire it to `update({ colorScheme: value })`. This is a minimal change to the settings screen — not a redesign.

---

## 6. Root Layout Changes

### 6.1 GestureHandlerRootView

Wrap the app root with `GestureHandlerRootView`. It must be the outermost provider — `SafeAreaProvider` goes inside it:

```tsx
// app/_layout.tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar ... />
        <Stack>...</Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

### 6.2 StatusBar

Add dark-mode-aware StatusBar:

```tsx
const theme = useTheme();
const isDark = theme.bg === '#0B0F0F';
<StatusBar style={isDark ? 'light' : 'dark'} />
```

---

## 7. Dependencies

```bash
npx expo install expo-haptics @gorhom/bottom-sheet react-native-gesture-handler react-native-reanimated
```

**Note:** `react-native-reanimated` must be added to `babel.config.js` plugins:

```js
plugins: ['react-native-reanimated/plugin'],
```

This must be the last plugin in the list.

---

## 8. What Phase 2 Does NOT Do

- Does NOT redesign any screen layout
- Does NOT change existing component internals (Button, SegmentedControl, etc.)
- Does NOT add streak, heatmap, or adherence features
- Does NOT change navigation structure
- Does NOT add animations beyond haptics
- Does NOT migrate existing screens to new primitives (Phase 3+)
- Does NOT remove the old `src/theme.ts` (deprecated shim stays)

---

## 9. Implementation Order

1. Install dependencies (`expo-haptics`, `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`)
2. Create `src/theme/tokens.ts` (primitive tokens, semantic tokens, spacing, radius, type scale, elevation)
3. Create `src/theme/index.ts` (re-exports)
4. Replace `src/theme.ts` with deprecated re-export shim
5. Create `src/hooks/useTheme.ts`
6. Extend `Settings` type with `colorScheme`
7. Create `src/components/primitives/Text.tsx`
8. Create `src/components/primitives/Pressable.tsx`
9. Create `src/components/primitives/Card.tsx`
10. Create `src/components/primitives/Chip.tsx`
11. Create `src/components/primitives/Stepper.tsx`
12. Create `src/components/primitives/Sheet.tsx`
13. Update `src/components/Touchable.tsx` to re-export Pressable
14. Update `app/_layout.tsx` with GestureHandlerRootView + dark-aware StatusBar
15. Add dark mode toggle to settings screen
16. Verify: all existing screens compile, dark mode toggles correctly, haptics fire

---

## 10. Verification

After implementation:

- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes
- [ ] All existing screens render correctly with deprecated theme shim
- [ ] Dark mode toggle works: Light / Dark / System
- [ ] All primitives render with correct theme tokens
- [ ] `Pressable` fires haptics on tap
- [ ] `Stepper` increments/decrements with haptic feedback
- [ ] `Sheet` opens/closes with gesture support
- [ ] `Chip` selectable state toggles correctly
- [ ] `Text` variants render correct type scale
- [ ] `Card` elevated variant shows sheet shadow
- [ ] Reduce-motion disables opacity animation on Pressable
- [ ] No regressions in existing screens
