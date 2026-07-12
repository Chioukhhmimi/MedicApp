# Task 15: Dark Mode Toggle in Settings

## Status: COMPLETE

## Commit

- SHA: `20af8eae2c6128f5647575cfbdb4835d43fced0b`
- Message: `feat(settings): add dark mode toggle to settings screen`

## Verification

- `npm run typecheck` — passes (0 errors)

## Changes

1. **`src/store/useSettingsStore.ts`** — Added `toggleDarkMode` method to `SettingsState` interface and implementation. Toggles `colorScheme` between `'dark'` and `'light'`.
2. **`app/(tabs)/settings.tsx`** — Imported `useTheme` from `@/hooks/useTheme`. Added `colorScheme`, `toggleDarkMode`, and `theme` selectors. Added "Appearance" section with a custom dark mode toggle switch and a ghost button to switch modes.

## Notes

- The toggle uses a custom styled `View` pair (no external component needed)
- `useTheme` provides the active semantic token set for the brand color in the toggle
- The store's `toggleDarkMode` delegates to `update({ colorScheme })` to persist via SQLite
