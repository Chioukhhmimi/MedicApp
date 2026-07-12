# Task 5 Report: useTheme Hook

**Status:** ✅ Complete  
**Commit:** `0bb3b86102ed0f28a4fa86e2644bd17d319f4416`  
**Message:** `feat(hooks): add useTheme() hook for dark-mode-aware token access`  
**Verification:** `tsc --noEmit` — passed (0 errors)

## Files Created

- `src/hooks/useTheme.ts` — reads `colorScheme` from `useSettingsStore`, falls back to system scheme when set to `'system'`, returns `light` or `dark` semantic token set.
