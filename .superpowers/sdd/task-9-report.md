## Task 9: Create Card Primitive

**Status:** DONE

**Commit:** `0235d385227053d0386c21144dedc25f2664540e`

**Verification:** `npm run typecheck` — PASSED (0 errors)

**File:** `src/components/primitives/Card.tsx`

**What was built:**

- `Card` surface component with dark mode support via `useTheme()`
- Interactive mode (`onPress` prop) using `Pressable` with haptic feedback
- Static mode (no `onPress`) using `View`
- Configurable padding, border, and elevation
- Uses `spacing`, `radius`, and `elevation` tokens from theme system
