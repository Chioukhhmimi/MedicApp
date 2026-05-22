# MediTrack 💊

An **offline-first medication reminder app** for iOS & Android, built with
**Expo + React Native + TypeScript**. Schedule medications with flexible
recurrence rules, get local-notification reminders, confirm doses
(Taken / Skipped / Later) with an automatic snooze loop, and export an
adherence history as CSV or PDF.

> **Privacy first** — all data lives in an on-device SQLite database. The app
> works with zero network access. Nothing is uploaded unless *you* export a file.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [The scheduling engine](#the-scheduling-engine)
- [Notifications & deep linking](#notifications--deep-linking)
- [Snooze loop](#snooze-loop)
- [Testing](#testing)
- [Building & publishing](#building--publishing)
- [Coding conventions](#coding-conventions)
- [Data handling & privacy](#data-handling--privacy)
- [Expo managed-workflow limitations](#expo-managed-workflow-limitations)
- [Future backend sync](#future-backend-sync)

---

## Features

| # | Feature | Where |
|---|---------|-------|
| 1 | Medication CRUD, grouped active/paused | `app/(tabs)/medications.tsx`, `app/medication/*` |
| 2 | Scheduling engine — daily / weekly / interval / binary pattern | `src/lib/scheduler.ts` |
| 3 | One or more reminder times per medication | `src/components/TimePickerList.tsx` |
| 4 | Local notifications + deep link into a pre-filled confirmation screen | `src/services/notifications.ts`, `app/confirm.tsx` |
| 5 | Taken / Skipped / Later + 30-min snooze loop (capped) | `src/lib/snooze.ts`, `src/services/scheduleService.ts` |
| 6 | Immutable history, adherence %, CSV/PDF export | `src/lib/adherence.ts`, `src/lib/export.ts`, `app/export.tsx` |
| 7 | Edit/cancel future occurrences (with multi-dose warning) | `app/medication/[id].tsx` |
| 8 | Onboarding flow + accessibility (labels, large text, AA contrast) | `app/onboarding.tsx`, `src/theme.ts` |
| 9 | Global + per-medication settings | `app/(tabs)/settings.tsx` |
| 10 | Privacy: explained permission prompt, secure storage, local-only mode | `src/services/secureStore.ts` |
| 11 | Edge cases: timezone/DST, reboot, cold start, offline | `src/lib/dates.ts`, `app/_layout.tsx` |

---

## Tech stack

- **Expo SDK 54** (managed workflow, React Native 0.81, React 19) +
  **expo-router** v6 (file-based navigation)
- **TypeScript** (strict, `noUncheckedIndexedAccess`)
- **Zustand** — local-first state
- **expo-sqlite** — primary persistence · **expo-secure-store** — sensitive flags
- **expo-notifications** — local notifications & deep links
- **Luxon** — correct IANA timezone & DST math
- **react-hook-form** + **zod** — form validation
- **expo-print** / **expo-file-system** / **expo-sharing** — CSV & PDF export
- **Jest** + **@testing-library/react-native** — tests
- **Sentry** — optional error monitoring (no-op without a DSN)

---

## Getting started

### Prerequisites

- Node.js 20+
- The **Expo Go** app on a device, or an iOS Simulator / Android Emulator

### Install & run

```bash
npm install
npm start          # opens the Expo dev server
# then press: i (iOS simulator) · a (Android emulator) · or scan the QR code
```

```bash
npm run android    # build & launch on Android
npm run ios        # build & launch on iOS
```

> **Notifications note:** Expo Go supports scheduled local notifications, but
> for a fully reliable test (especially on Android) build a **development
> build**: `npx expo run:android` / `npx expo run:ios`.

### Seeding sample data (dev only)

`sample-data/medications.json` contains four medications covering every
schedule type. To load them, call `seedSampleData()` from
`src/services/seed.ts` (e.g. wire a temporary button into the Settings screen
during development).

---

## Project structure

```
meditrack/
├── app/                       # expo-router screens (file-based routes)
│   ├── _layout.tsx            # root: bootstrap, notifications, deep links
│   ├── index.tsx              # entry redirect (onboarding vs tabs)
│   ├── onboarding.tsx         # first-run flow
│   ├── (tabs)/                # Today · Medications · History · Settings
│   ├── medication/[id].tsx    # medication detail
│   ├── medication/edit.tsx    # add / edit medication (modal)
│   ├── confirm.tsx            # confirmation screen (notification target)
│   └── export.tsx             # CSV / PDF export
├── src/
│   ├── components/            # reusable UI (Button, ScheduleEditor, ...)
│   ├── hooks/                 # useUpcoming
│   ├── lib/                   # PURE logic: scheduler, snooze, adherence,
│   │                          #   dates, export, validation, types
│   ├── services/              # I/O: database, notifications, schedule
│   │                          #   orchestration, export, secureStore, sync
│   ├── store/                 # Zustand stores
│   ├── tests/                 # Jest unit tests
│   └── theme.ts               # design tokens
├── api/openapi.yaml           # future-backend OpenAPI stub
├── sample-data/               # seed JSON + example CSV export
└── .github/workflows/ci.yml   # lint + typecheck + test
```

Absolute imports use the `@/` alias → `src/` (configured in `tsconfig.json`
and `babel.config.js`).

---

## Architecture

A strict one-way dependency flow keeps logic testable:

```
 screens (app/) ──► stores (Zustand) ──► services (I/O) ──► lib (pure)
                                            │
                                     SQLite · expo-notifications
```

- **`src/lib/`** — pure, deterministic, no I/O. 100% unit-tested.
- **`src/services/`** — the only layer touching SQLite / OS notifications.
- **`src/store/`** — Zustand; exposes high-level actions to screens.
- **`app/`** — presentational; reads stores, calls actions.

---

## The scheduling engine

`src/lib/scheduler.ts` is the deterministic core. A `ScheduleRule` describes
*active calendar days* (in its own IANA timezone) plus reminder `times`:

| Type | Params | Example |
|------|--------|---------|
| `daily` | `times[]` | 08:00 & 20:00 every day |
| `weekly` | `weekdays[]` (1=Mon…7=Sun) | Mon & Fri at 09:00 |
| `interval` | `intervalDays` | every 14 days |
| `pattern` | `pattern[]` of 0/1 | `[1,0]` = every other day |

Key functions:

```ts
nextOccurrence(rule, after)        // -> next due ISO-UTC timestamp | null
occurrencesBetween(rule, from, to) // -> all due timestamps in [from, to)
generateUpcoming(rule, fromIso, n) // -> pre-generate n days ahead
```

**Timezone & DST:** all wall-clock math uses Luxon. A daily 08:00 reminder
stays at 08:00 *local* time even across a DST transition — the underlying UTC
instant shifts by an hour, which is correct. See the DST tests in
`src/tests/scheduler.test.ts`.

Occurrences are pre-generated **60 days ahead** into SQLite on launch and
after every edit (`scheduleService.ensureHorizon()`).

---

## Notifications & deep linking

1. Each pending `Occurrence` within a rolling **14-day window** gets one local
   notification (`scheduleService.syncNotificationWindow()`). The window keeps
   the app under iOS's ~64 pending-notification cap.
2. The notification carries a `ReminderPayload` (`occurrenceId`, med name,
   dose, time).
3. Tapping it — warm or **cold start** — deep-links to `/confirm` pre-filled
   from the payload (`app/_layout.tsx`).
4. The OS notification id is stored on the occurrence so it can be canceled.

---

## Snooze loop

When a dose is **Skipped** or marked **Later**:

- `planSnooze()` schedules a child occurrence `defaultSnoozeIntervalMin`
  (30 min) later, linked via `parentOccurrenceId`.
- This repeats until **Taken** or until `maxSnoozeRepeats` (default 6) — the
  hard cap that **guarantees the loop terminates**.
- Both values can be overridden globally (Settings) or per medication.

Marking **Taken** logs the dose and cancels any pending snooze for that chain.

---

## Testing

```bash
npm test            # run all unit tests
npm run test:watch  # watch mode
npm test -- --coverage
```

Covered (`src/tests/`):

- `scheduler.test.ts` — `nextOccurrence`, all four schedule types, **DST**,
  window boundaries, `generateUpcoming`
- `snooze.test.ts` — 30-min loop, repeat cap / no infinite loop, overrides
- `adherence.test.ts` — adherence %, future/canceled/snooze-child exclusion
- `notifications.test.ts` — notification scheduling, deep-link payload,
  cold-start tap (expo-notifications mocked)
- `export.test.ts` — CSV escaping (RFC 4180), PDF/HTML generation

Run lint & types too:

```bash
npm run lint
npm run typecheck
```

---

## Building & publishing

This project uses **EAS Build**.

```bash
npm install -g eas-cli
eas login
eas build:configure

eas build --platform android        # produces an .aab
eas build --platform ios            # produces an .ipa (Apple account needed)

# Store submission
eas submit --platform android
eas submit --platform ios

# OTA JS updates
eas update --branch production
```

Bump `expo.version` (and native build numbers) in `app.json` before each
store release.

---

## Coding conventions

- **Strict TypeScript** — no implicit `any`; indexed access is checked.
- **Absolute imports** via `@/` — never deep relative `../../..`.
- **Pure logic in `src/lib`** — anything testable without a device lives here.
- **Services own I/O** — screens/stores never run SQL or call the OS directly.
- **ESLint + Prettier** enforced (`npm run lint`, `npm run format`); CI fails
  on lint or type errors.
- **Naming:** `PascalCase` components, `camelCase` functions/vars,
  `useX` hooks, `*.test.ts` tests.

---

## Data handling & privacy

- **Local-only:** medication data is stored in a device-local SQLite database
  (`meditrack.db`). The app has no runtime network dependency.
- **Secure storage:** sensitive flags (biometric-lock preference, a reserved
  future sync token) use `expo-secure-store` — the OS Keychain / Keystore.
- **Notification permission** is requested *after* an in-app rationale screen
  explaining why and that reminders are local.
- **Immutable history:** `logs` rows are append-only — corrections add a new
  entry, never rewrite, keeping an honest adherence trail.
- **Export** is the only path producing data that leaves the device, and it is
  always user-initiated through the OS share sheet.
- **Error monitoring** (Sentry) is disabled unless a DSN is supplied, and
  never attaches PII.

---

## Expo managed-workflow limitations

| Concern | Limitation | MediTrack's mitigation |
|---------|-----------|------------------------|
| iOS pending-notification cap (~64) | Can't pre-schedule months of reminders | Rolling 14-day notification window; occurrences live in SQLite, refreshed on launch |
| Android exact alarms / OEM battery killers | Aggressive OEMs may delay notifications | `SCHEDULE_EXACT_ALARM` permission + high-importance channel; for guaranteed delivery, swap in **Notifee** (requires a development build, not Expo Go) |
| Device reboot | Pending OS notifications survive reboot on both platforms; `RECEIVE_BOOT_COMPLETED` is declared. App also re-syncs the window on next launch | `ensureHorizon()` on every cold start |
| Background re-computation | Managed workflow has limited background execution | Schedules are recomputed on app launch rather than via a background task; **expo-task-manager** can be added later if needed |

If a feature truly needs deeper native control (e.g. full-screen alarm-style
reminders), migrate to a **development build** and add **Notifee** — the
architecture isolates this behind `src/services/notifications.ts`, so only
that one file changes.

---

## Future backend sync

`api/openapi.yaml` defines an optional sync API
(`GET/POST/PUT/DELETE /medications`, `GET /history`). `src/services/syncApi.ts`
is a typed client **stub** — not wired into the app. The local data model was
designed so adding Supabase/Firebase later needs no schema migration. Until
then, MediTrack stays 100% offline.

## License

MIT
