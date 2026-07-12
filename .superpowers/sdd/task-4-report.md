# Task 4: Create Deprecated Theme Shim

## Status: ✅ COMPLETE

## Commit

- **SHA:** `c1281a4`
- **Message:** `refactor(theme): replace with deprecated backward-compat shim`

## What Changed

Replaced `src/theme.ts` with a backward-compatible re-export shim that maps all legacy exports to the new token system (`@/theme/tokens`).

### Exports preserved

| Export          | Mapping                                                 |
| --------------- | ------------------------------------------------------- |
| `colors`        | Semantic tokens from `light` + `primitives`             |
| `spacing`       | Legacy named keys (`xs`, `sm`, `md`, `lg`, `xl`, `xxl`) |
| `radius`        | Legacy named keys (`sm`, `md`, `lg`, `xl`, `pill`)      |
| `fontSize`      | Mapped from `typeScale`                                 |
| `textCaps`      | Kept as-is                                              |
| `actionColor`   | Mapped from `light.success/danger` + primitives         |
| `TimeBucket`    | Type kept as-is                                         |
| `bucketChip`    | Mapped from primitives                                  |
| `bucketForHour` | Kept as-is                                              |
| `shadow`        | Kept as-is (iOS shadow / Android elevation)             |

### Why spacing/radius were NOT re-exported from tokens

The new token system uses numeric keys (`{ 4: 4, 8: 8, 16: 16 }`) while existing screens use named keys (`spacing.xs`, `radius.pill`). Direct re-export would break 48 spacing usages and 27 radius usages across the codebase.

## Verification

- `npm run typecheck` — **passed** (zero errors)
- All 22 files importing from `@/theme` remain compatible
