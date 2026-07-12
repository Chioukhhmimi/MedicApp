# Task 8: Create Pressable Primitive

**Status:** ✅ Complete  
**Commit (original):** `2e2ecc09f8e5b035eda2dcf2448e066974d3fe93`  
**Commit (fixes):** `eda9277`  
**Verification:** `npm run typecheck` — passed, zero errors

## Summary

Created `src/components/primitives/Pressable.tsx` — a Pressable wrapper that:

- Enforces 44pt minimum tap target via `minSize` prop
- Fires haptic feedback on press (`light`/`medium`/`heavy`/`none`)
- Supports long-press with configurable haptic (`medium`/`heavy`)
- Respects `reduceMotion` via `AccessibilityInfo` (falls back visually)
- Includes `hitSlop: 8` default for comfortable tapping
- Defaults `accessibilityRole="button"`

## Fix Applied

The original spec called `rest.onPress?.()` without forwarding the `GestureResponderEvent`, which TypeScript flagged as an argument-count mismatch. Fixed by accepting the event in `handlePress` and forwarding it to `rest.onPress?.(event)`.

## Files

- Created: `src/components/primitives/Pressable.tsx`

## Task 8b: Post-Review Fixes

**Status:** ✅ Complete  
**Commit:** `eda9277`  
**Verification:** `npm run typecheck` + `npm run lint` — passed

### Fixes Applied

| #   | Severity  | Issue                                                                      | Fix                                                                                                                            |
| --- | --------- | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1   | CRITICAL  | `destructive` prop unused — destructive elements still fired `onPress`     | `handlePress` now returns early when `destructive=true`; only `onLongPress` fires                                              |
| 2   | IMPORTANT | `...rest` spread after explicit `onPress`/`onLongPress` overwrote handlers | Destructured `onPress: onPressProp` from props before rest spread                                                              |
| 3   | IMPORTANT | `reduceMotion` ref never re-rendered on user toggle                        | Replaced `useRef` with `useState`; subscribed to `AccessibilityInfo.addEventListener('reduceMotionChanged', ...)` with cleanup |
| 4   | IMPORTANT | `hapticMap` typed as `Record<string, ...>`                                 | Changed to `Record<'light' \| 'medium' \| 'heavy', Haptics.ImpactFeedbackStyle>`                                               |
