# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

MediTrack — an **offline-first** medication reminder app (Expo SDK 54, React Native 0.81, React 19, TypeScript strict). No runtime network dependency; all state lives in on-device SQLite. See `README.md` for the full feature matrix.

## Commands

```bash
npm start              # Expo dev server (press i / a, or scan QR)
npm run android        # build & launch on Android
npm run ios            # build & launch on iOS

npm test               # Jest (unit tests only — see jest.config.js testMatch)
npm run test:watch
npm test -- src/tests/scheduler.test.ts          # run a single test file
npm test -- -t "next occurrence on DST forward"  # run a single test by name

npm run lint           # ESLint (CI fails on errors)
npm run lint:fix
npm run typecheck      # tsc --noEmit; strict + noUncheckedIndexedAccess
npm run format         # Prettier
```

Notifications are unreliable in Expo Go on Android — for end-to-end reminder testing use a development build (`npx expo run:android` / `:ios`).

## Architecture — the load-bearing rule

Dependencies flow in **one direction**, and every layer has a single responsibility. Violating this makes the pure logic untestable and is the most common refactor mistake.

```
app/ (screens)  →  src/store/ (Zustand)  →  src/services/ (I/O)  →  src/lib/ (pure)
                                                  │
                                           SQLite · expo-notifications · expo-file-system
```

- **`src/lib/`** — pure, deterministic, no I/O, no React. The scheduler, snooze policy, adherence math, date helpers, validation, types. Everything here is covered by Jest tests in `src/tests/`. If a function needs `Date.now()` or a timezone, take them as parameters.
- **`src/services/`** — the **only** layer that opens the database, calls `expo-notifications`, or touches the OS. Screens and stores must not run SQL or schedule notifications directly.
- **`src/store/`** — Zustand stores expose high-level actions. They orchestrate services; they do not contain business logic.
- **`app/`** — `expo-router` file-based screens. Presentational only: read stores, call actions.

Absolute imports use `@/` → `src/` (configured in both `tsconfig.json` paths and `babel.config.js` module-resolver — keep them in sync).

## Scheduler & occurrence pipeline

The scheduler is the deterministic core. Understand this before touching anything in `src/lib/scheduler.ts` or `src/services/scheduleService.ts`:

1. **`ScheduleRule`** (`src/lib/types.ts`) describes *when* a medication is due. Four types: `daily | weekly | interval | pattern`. Each rule carries its own IANA `timezone` — all wall-clock math goes through Luxon so DST transitions stay at the correct local time.
2. **`src/lib/scheduler.ts`** is pure: `nextOccurrence`, `occurrencesBetween`, `generateUpcoming`. No I/O. All DST and timezone behavior is locked in by `src/tests/scheduler.test.ts` — change with care.
3. **`src/services/scheduleService.ts`** is the orchestrator:
   - `ensureHorizon()` runs on every cold start (`app/_layout.tsx`) and pre-generates occurrences **60 days ahead** into SQLite.
   - `syncNotificationWindow()` mirrors only the next **14 days** of pending occurrences into the OS notification queue — this keeps us under iOS's ~64 pending-notification cap. Don't try to schedule the full horizon natively.
   - `resolveOccurrence()` is called from `app/confirm.tsx` and drives the snooze loop.
4. **Snooze loop** (`src/lib/snooze.ts`): Skipped/Later spawns a child `Occurrence` linked via `parentOccurrenceId`, default 30 min later. Termination is guaranteed by `maxSnoozeRepeats` (default 6) — do not remove this cap.
5. **`LogEntry` rows are append-only.** Corrections add a new entry; never edit or delete logs. `src/lib/adherence.ts` depends on this invariant.

## Notifications & deep linking

- Every pending occurrence in the 14-day window has one local notification carrying a `ReminderPayload` (`occurrenceId`, name, dose, time).
- The OS notification id is stored back on the occurrence row so it can be canceled.
- Taps deep-link to `/confirm`. Both **warm-start** and **cold-start** paths are wired in `app/_layout.tsx` — keep both working when changing navigation.
- All `expo-notifications` calls go through `src/services/notifications.ts`. If a feature needs deeper native control (e.g. Notifee), only that file should change.

## Data model conventions

- Calendar dates: `'YYYY-MM-DD'` strings (no time/zone).
- Timestamps: full ISO 8601 UTC (e.g. `2026-05-19T07:00:00.000Z`).
- IDs come from `newId(prefix)` in `src/lib/id.ts`.
- SQLite schema and migrations live in `src/services/database.ts`. The same module owns all queries — do not write SQL elsewhere.

## Testing

`jest.config.js` only matches `src/tests/**/*.test.ts` and `collectCoverageFrom` is restricted to `src/lib/**` and `src/services/**`. Screens are not unit-tested; logic going into screens that *should* be tested belongs in `src/lib/` first.

`expo-notifications` is mocked — see `jest.setup.ts` and `src/tests/notifications.test.ts` for the pattern.

## Future backend sync

`api/openapi.yaml` and `src/services/syncApi.ts` are a **stub** — not wired into the app. The local data model is designed to add sync later without migration. Until then the app must remain fully functional offline; do not introduce runtime network dependencies.
