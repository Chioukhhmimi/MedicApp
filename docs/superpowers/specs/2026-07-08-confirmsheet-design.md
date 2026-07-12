# ConfirmSheet Design Spec

**Date:** 2026-07-08
**Status:** Approved
**Phase:** 3 — Critical Flows (part 1)

## Summary

Convert the full-screen Confirm modal into a bottom sheet (`@gorhom/bottom-sheet`) with haptics, a giant "Taken" button, snooze duration chips, collapsible note, and a check-morph success animation.

## Problem

The current Confirm screen (`app/confirm.tsx`) is a full-screen modal that forces context-switching. For the most frequent action in the app (confirming a dose), this is too heavy. The screen also uses the deprecated `colors` theme and has no haptic feedback.

## Goals

1. Reduce confirmation friction: one big tap = done
2. Add haptic feedback on all actions
3. Animate success state (check-morph) for instant visual confirmation
4. Support snooze with duration chips (10m / 30m / 60m)
5. Keep backward compatibility with deep links

## Architecture

```
app/confirm.tsx (screen — thin wrapper, opens Sheet)
  └── src/components/ConfirmSheet.tsx (sheet content)
        ├── Header: med name + dose + time
        ├── Giant "Taken" button (72pt, medium haptic)
        ├── Secondary row: "Later" chip + "Skip" text
        ├── Collapsible "Add a note"
        └── Success state: check-morph + auto-close
```

- `app/confirm.tsx` receives `occurrenceId` from deep link / navigation params
- Renders `<Sheet>` with `<ConfirmSheet occurrenceId={id} />` as children
- Sheet snaps to 70% height, drag-to-dismiss disallowed

## Layout

```
┌─────────────────────────────┐
│  ━━━  (drag handle)         │
│                             │
│  METFORMIN                  │  ← Text variant="title", ink
│  500 mg · 08:00             │  ← Text variant="body", inkMuted
│  Snoozed 2×                 │  ← Text variant="label", brand (if snoozed > 0)
│                             │
│  ┌─────────────────────────┐│
│  │     ✓  Taken            ││  ← 72pt height, brand bg, white text
│  │                         ││     medium haptic on press
│  └─────────────────────────┘│
│                             │
│  [ Later 30m ]  [ Skip ]    │  ← Chip (Later) + text button (Skip)
│                             │
│  + Add a note               │  ← Collapsible, expand on tap
│  ┌─────────────────────────┐│
│  │ Optional note...        ││  ← TextInput, visible when expanded
│  └─────────────────────────┘│
└─────────────────────────────┘
```

## Interaction Flow

### Taken (primary action)

1. **0ms:** Button press → medium haptic fires
2. **0–250ms:** Button background morphs to a checkmark circle (Reanimated `withTiming`)
3. **250ms:** Checkmark fully visible, confirmation haptic
4. **250–650ms:** Sheet slides down (Reanimated `withTiming`)
5. **650ms:** Sheet dismissed, screen returns to previous state

### Later (snooze)

1. Tap "Later" → snooze duration chips appear inline (10m / 30m / 60m)
2. Select a duration → light haptic → `resolveOccurrence` with `action: 'later'`
3. Success: toast "Reminded at HH:mm" → auto-close 1400ms

### Skip

1. Tap "Skip" → light haptic → `resolveOccurrence` with `action: 'skipped'`
2. Immediate close (no toast)

### Note

1. Tap "+ Add a note" → TextInput expands below
2. Optional — note is passed to `resolveOccurrence` if non-empty

### Drag dismiss

- Disallowed — user must pick an action (Taken / Later / Skip)

## Success Animation

Uses `react-native-reanimated` for the Taken button morph:

```tsx
// State: 'idle' | 'success'
// On 'success':
//   - Button bg transitions to brand color
//   - Text morphs to checkmark icon
//   - 250ms hold → sheet dismiss
```

**Timing:**

- Check morph: 250ms (`withTiming`)
- Confirmation haptic at 250ms
- Sheet dismiss: 400ms (`withTiming`)
- Total: ~650ms

## Snooze Duration Chips

When "Later" is tapped, three chips appear inline:

```
[ 10 min ] [ 30 min ] [ 60 min ]
```

- Uses `Chip` component with `variant="selectable"`
- Default selection: none (user must pick)
- Selecting one triggers `resolveOccurrence` with the chosen duration
- Chips disappear after selection (success state takes over)

## Data Flow

```
app/confirm.tsx
  receives occurrenceId from deep link / navigation params
  → Passes occurrenceId to <ConfirmSheet occurrenceId={id} />
    → ConfirmSheet loads occurrence + medication via useEffect
    → Shows skeleton while loading
    → Renders sheet content once loaded

ConfirmSheet.act(action, duration?)
  → resolveOccurrence(occ.id, action, { source: 'notification', note })
  → If 'taken': animate success → close
  → If 'later': animate success → close (child occurrence created)
  → If 'skipped': animate success → close
  → On error: show toast, keep sheet open
```

## Backward Compatibility

- Deep links (`/confirm?occurrenceId=xxx`) still work — `app/confirm.tsx` handles the route
- `resolveOccurrence` and `dismiss` logic unchanged
- No changes to `scheduleService.ts`, `notifications.ts`, `snooze.ts`, or `_layout.tsx`

## Theme Migration

ConfirmSheet uses new primitives exclusively:

- `useTheme()` for all colors (dark mode support)
- `Text` variant-based component
- `Pressable` with haptics
- `Chip` for snooze durations
- `Sheet` for bottom sheet container
- No deprecated `colors` imports

## Scope

**In scope:**

- `src/components/ConfirmSheet.tsx` — full sheet content component
- `app/confirm.tsx` — rewrite to use Sheet wrapper
- Snooze duration chips (10m / 30m / 60m)
- Taken animation (check-morph via Reanimated)
- Theme migration to `useTheme()` + new primitives
- Haptics on all actions

**Deferred:**

- Inline confirm gesture on Today (swipe-to-confirm) — Phase 4
- Streak badge / recap — Phase 4
- Today rework (NextDoseHero, progress strip) — separate Phase 3 task
- Medication wizard — separate Phase 3 task
- Onboarding — separate Phase 3 task

## Testing

- Unit test for ConfirmSheet action logic (happy path + error)
- Manual test: deep link triggers sheet, all 3 actions work
- Manual test: snooze chips appear on "Later", selecting one snoozes
- Manual test: note input expands/collapses
- Manual test: dark mode renders correctly

## Estimated Complexity

~5 files changed, ~400 lines of new code. Single implementation plan.
