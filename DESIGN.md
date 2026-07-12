# DESIGN.md

Product-design reference for MediTrack / Dosely. Sibling to `CLAUDE.md`, which owns the functional/architectural guidance. This file owns visual direction, UX patterns, design system, and the redesign roadmap. Consult before touching UI.

The engine is strong (pure scheduler, DST-safe, immutable log). The product surface is the weak point.

## PART 1 — Product Understanding

**What it is.** Offline-first medication reminder app. Engine is well-built; UI is under-designed.

**Who it's for.**

| Persona                          | Reality                                      | What the current app gets wrong                              |
| -------------------------------- | -------------------------------------------- | ------------------------------------------------------------ |
| Self-managing patient (1–3 meds) | Wants to confirm and leave.                  | Confirm screen is a full modal with a never-used note field. |
| Older adult / low-tech           | Small text and buttons hurt.                 | Font scaling uncapped; no haptics; small settings inputs.    |
| Caregiver                        | Needs at-a-glance status for another person. | No caregiver mode.                                           |
| Chronic condition (5+ meds)      | Wants routine + streak reinforcement.        | Nothing rewards continuity.                                  |

**Core UX goal.** _Trust the app enough to stop worrying about doses._ Requires: low-friction confirmation, transparent history, emotional payoff. App delivers the first two mechanically; almost none of the third.

## PART 2 — Full UX/UI Audit

- **Information architecture — high.** Today and Medications overlap. Add-medication has no discoverable primary entry. Export is buried. Collapse to 3 tabs (Today / Meds / Insights); promote Add.
- **Navigation — medium.** Tab focus signal is stroke-weight only — nearly invisible. Modal presentation on confirm feels heavy for a two-tap action.
- **Onboarding — medium.** Four stacked text screens. Collects nothing. Day 1 = empty home. Should collect first med + wake time + quiet hours.
- **Today / home — critical.** Slogan hero wastes 25% of fold. Section cards look identical. No "now vs later" anchor, no progress, no streak, no inline confirm. Highest-value screen, biggest missed opportunity.
- **Medication list — medium.** Clean but every row looks the same — no health-status signal per med.
- **Medication detail — high.** Reads like a settings page. No adherence hero. Destructive actions live on primary surface.
- **Add/edit medication — critical.** Single 10+ field form with ScheduleEditor mid-scroll. #1 abandonment risk. Split into 4-step wizard.
- **Reminder confirmation — critical.** Three equal buttons is a choice problem — Taken is 95% action, should be elevated. No haptics. Dead note field. 1.4s arbitrary auto-dismiss. Snooze is fixed 30 min with no picker.
- **History / adherence — high.** Big % + three stat blocks. Readable, not insightful. Missing per-med breakdown, weekday heatmap, streak.
- **Export — low.** Fine but undiscoverable.
- **Settings — medium.** Numeric TextInputs for snooze — use chip row / stepper instead.
- **Error / empty / loading — high.** No skeletons, no error boundaries visible on confirm path, one generic empty state reused everywhere. Silent failure is a trust breaker in a health app.
- **Accessibility — high.** ~47 accessibility labels/roles is a good baseline. Zero `maxFontSizeMultiplier` — layouts explode at accessibility font sizes. Tab bar has no non-color active-state signifier.
- **Trust / credibility — high.** Privacy story is the best thing in the app but buried in a Settings paragraph. Surface it: "Offline · On device" pill on Today and Export.
- **Emotional / motivation — critical.** "Dose logged. Nice work!" for 1.4s is the entire reinforcement loop. This is a habit product with no habit design.

## PART 3 — What to Redesign

**Visual:** kill hero slogan; 2-tier surface system (elevated "now" vs quiet "later"); accent-per-time-of-day dot instead of full chips; retire sparkles empty state; commission 3 quiet illustrations.

**UX flow:** Add-medication → 4-step wizard; Confirm → lightweight sheet with one big Taken; snooze duration chips (10/30/60); inline confirm gesture on Today (long-press / swipe); onboarding captures first med.

**Layout:** Today → NextDoseHero + progress strip + timeline; Medications → 7-day dot strip + next-dose chip per row; Med detail → adherence hero + menu-based destructive actions; History → adherence + streak + heatmap + day-grouped log.

**Components:** `Button` gets haptics + long-press destructive; `MedicationCard` gets `WeekDotStrip` + `NextDoseChip`; new `NextDoseHero`, `AdherenceRing`, `StreakBadge`, `TimeChip`, `WeekHeatmap`, `ConfirmSheet`.

**Copy:** drop wellness slogan. Task-first: "Next dose in 42 min", "3 of 5 taken today", "12-day streak". Snooze feedback: "Reminder in 10 min" (not "at 14:30" — spare clock math).

**Motion / micro:** install `react-native-reanimated` + `expo-haptics`. Taken → medium haptic + check-morph + subtle dot burst. Snooze → light haptic + slide. Shared-element on med card → detail.

**Accessibility:** cap `maxFontSizeMultiplier` on chrome; 44pt Pressable primitive; `accessibilityLiveRegion` on confirm result; reduce-motion fallbacks; non-color state signifiers throughout.

**Trust:** "Offline · On device" pill on Today + Export; preview text before export; explicit "stored on this device only" in Settings header.

**Adherence features:** streak; weekly recap notification (Sunday morning); soft missed-dose recovery nudge; time-of-day heatmap; refill estimates; caregiver share PDF via existing export.

## PART 4 — Art Direction (3 options)

**A. Clinical Calm** — soft hospital-grade. Cool off-white, single sage/teal accent, warm-grey text. Inter or SF Pro. Flat surfaces, hairline dividers, 14pt radius. Thin-stroke line icons. Slow easeOut motion. Trustworthy, adult, won't age.

**B. Warm Ritual** — morning tea, dependable. Warm cream bg, terracotta primary, sage secondary. Serif display for numerics, humanist sans for UI. Rounded 22–28pt cards, warm shadows. Filled + duotone icons. Buttery bouncy motion. Reframes medication as ritual. Risk: skews wellness/female.

**C. Ambient Minimal (recommended)** — iOS-native, weightless. Near-black on white, single teal accent, everything else grayscale. Status color only on status. SF Pro / Inter. Minimal cards, dividers over shadows, 12–16pt radius. SF Symbols-style icons. Fast snappy motion. Matches Apple Health — implicit credibility. Cheapest to build. Reduces cognitive noise for older users.

## PART 5 — Design System

**Color roles** (light / dark):

- `bg` #FFFFFF / #0B0F0F · `surface-1` #F7F9F8 / #131817 · `surface-2` #FFFFFF / #1A2020
- `ink` #0F1615 / #ECF1EF · `ink-muted` #5B6A67 / #8FA09C · `ink-quiet` #8B9793 / #667470
- `brand` #0E8C82 (keep) · `brand-ink` #FFFFFF
- `danger` #B23A48 · `warning` #B86A1F · `success` #0E8C82 · `info` #4A6B99
- `focus` #0E8C82 @ 60% · `border` #E4E9E8 / #1F2725

Status colors used **only for status**, never chrome. Discipline that separates health app from marketing app.

**Surface hierarchy.** Three levels only: `bg`, `surface-1` (cards, rows, inputs), `surface-2` (sheets, modals). Elevation via surface color + 1px border, not shadows — except modal sheets get one soft shadow.

**Type scale.** `display 36/40 Semibold` (hero numerics) · `title 22/28 Semibold` · `h3 17/22 Semibold` · `body 15/22 Regular` · `label 13/18 Medium` · `mono 15 tabular-nums` (times, doses). Cap `maxFontSizeMultiplier: 1.3` on chrome and hero numerics; leave uncapped on body.

**Spacing (4-pt base).** `4 / 8 / 12 / 16 / 20 / 24 / 32 / 48`. Retire `xs/sm/md/lg` string tokens — use numeric names (`space-4`, `space-8`).

**Radius.** `8` inputs · `12` cards · `20` sheets · `999` pills. Retire the 22/28 range.

**Elevation.** `elev-1` (`0 1 2 rgba(0,0,0,0.04)`) for pressed/hover; `elev-2` (`0 12 24 rgba(6,59,55,0.10)`) for sheets/modals. Everywhere else: borders. Shadows kill perceived cleanliness on Android.

**Buttons.** Primary = solid brand, white text, 52pt, semibold. Secondary = surface-1 bg, ink text, border. Tertiary/Ghost = text only. Destructive = danger text on surface-1, requires long-press or confirm. All ship haptics.

**Inputs.** 48pt tall, surface-1 fill, border outline, brand outline on focus with visible ring. Numeric → steppers, not raw text. Time → chips launching native picker.

**Cards.** surface-1 bg, 12pt radius, border, 16pt padding. Rows: 60pt min tall, 44pt icon left, title + subtitle, meta right. Hero cards (next dose): 100pt+, dedicated composition.

**Status colors** (always pair color with icon for colorblind safety):

- Upcoming: `ink-muted` outline, no fill
- Taken: `success` filled dot, check icon
- Skipped: `danger` filled dot, x icon
- Missed: `warning` filled dot, alert icon
- Snoozed / Later: `info` filled dot, clock icon

**Notifications / alerts.** Push: emoji-free, title = MedName, body = "Dose · time · Tap to confirm". In-app toast: non-critical only, slide from top, 2s auto-dismiss, one action max. Alert dialogs: destructive only, verb-first primary ("Cancel 27 reminders").

**Empty state.** Single-color line illustration 96×96 → title (17 Semibold) → body (15 muted) → single primary action. Different content per screen — no generic reuse.

**Accessibility rules.** 44pt min tap target enforced via primitive · focus ring on every focusable (2px focus color) · `accessibilityLabel` on every interactive, `accessibilityHint` when action isn't obvious · `accessibilityLiveRegion="polite"` on confirm feedback · non-color signifiers for every state · reduce-motion respected · `maxFontSizeMultiplier: 1.3` on chrome, unbounded on content.

**Dark mode.** Ship v1. Two rules: (1) brand never inverts — teal keeps its hue; (2) elevate via lightening surface-1 above bg, not shadow. Read `Appearance.getColorScheme()`, store override in Settings.

## PART 6 — Screen-by-Screen Plan

**Today** — Goal: answer "what now" in <1s. Layout: greeting + Offline pill · NextDoseHero (name, dose, time-until, big Taken + Later chip) · Today Progress strip · Remaining list. Components: `NextDoseHero`, `ProgressStrip`, `DoseRow`, `ConfirmSheet`. States: skeleton loading, empty-Day-1 (add-first-med CTA), all-done (streak), notifications-denied warning. Impl: move to FlatList with ListHeaderComponent.

**Medications** — Rich rows with 7-day dot strip + next-dose chip. Search once list > 5. Sticky FAB. Sort by "next due" default. Precompute per-med adherence in store to avoid render cost.

**Med Detail** — Hero header (color-tinted) · This month adherence (ring + 2 stats) · Next 5 doses · Recent history (day-grouped) · overflow menu (…) with Edit / Pause / Cancel / Delete. Move destructive off primary surface.

**Add/Edit (wizard)** — 4 full-screen steps: (1) name + strength, (2) dose qty + unit chips, (3) schedule + times, (4) extras. Sticky Step N of 4 + Back/Continue. Keep single `react-hook-form` state; just split render.

**Confirm (bottom sheet)** — 70% height, drag-to-dismiss. Med name (large), dose, scheduled time, snooze count. Giant Taken button (72pt) with medium haptic. Secondary row: Later (opens duration chips) + Skip (text). Collapsible "Add a note". Post-tap: check-morph 250ms + haptic + close 400ms. Requires `@gorhom/bottom-sheet` + `react-native-gesture-handler` + `react-native-reanimated`. Biggest lift; worth it.

**Insights (renamed History)** — Range chips (7/30/90) · Adherence ring (animated) · Streak card ("12-day · best 34") · Weekday×hours heatmap · Per-med list · Log (day-grouped) · Export link. Compute heatmap client-side, memoize.

**Export** — Preview text ("47 log entries + adherence summary. Nothing uploaded.") + range + CSV/PDF buttons.

**Settings** — Grouped list: Reminders (snooze chip row, max repeats stepper, quiet hours) · Privacy (biometric switch + explainer) · Language · About. Replace text inputs with chips/steppers.

**Onboarding** — Language → welcome + privacy promise → wake time + quiet hours → add first medication (mini-wizard) → notification permission → drop into Today with real data.

## PART 7 — Roadmap

**Phase 1: UX foundations (1 week)** — 44pt Pressable primitive; `maxFontSizeMultiplier` caps; confirm error boundary; skeleton loaders; copy pass. No dependencies. Order: first.

**Phase 2: Design system (1–2 weeks)** — `src/theme.ts` v2 (numeric tokens, dark tokens); core primitives (Text, Pressable, Card, Sheet, Chip, Stepper); dark mode toggle. Depends: Phase 1. Order: second.

**Phase 3: Critical flows (2–3 weeks)** — Today rework, ConfirmSheet with haptics + animation, 4-step Add wizard, onboarding rework. Depends: Phases 1–2 + `@gorhom/bottom-sheet`, `react-native-gesture-handler`, `react-native-reanimated`, `expo-haptics`. Highest impact.

**Phase 4: Polish & motion (1–2 weeks)** — Motion tokens, Taken check-morph, pull-to-refresh redesign, 3 empty illustrations, tab bar active-state animation. Depends: Phase 3.

**Phase 5: A11y & trust (1 week)** — Every screen audited, VoiceOver / TalkBack walk-through, reduce-motion fallbacks, "Offline · On device" pill everywhere, export preview.

**Phase 6: Adherence features (2–3 weeks)** — Streak, weekly recap notification, heatmap, per-med adherence, refill estimates, caregiver share PDF, smart missed-dose nudge.

## PART 8 — Quick Wins vs Deeper Work

**Quick wins (1–3 days each):** remove slogan hero; install `expo-haptics`; cap font multiplier on chrome; snooze chip row; move Export to Insights entry; "Offline · On device" pill; Add-first-med empty CTA on Today; tab bar active state (bold + dot); skeleton loaders.

**Medium (1–2 weeks each):** Add-medication wizard; History → Insights with ring + streak; Med detail rework with menu-based destructive; theme v2 + primitives; dark mode.

**Major (3–6 weeks each):** ConfirmSheet with animation + haptics; Today with NextDoseHero + timeline + progress; habit features (streak, recap, heatmap); Reanimated motion pass; caregiver share.

## PART 9 — Prioritization Table

| #   | Item                                             | Severity | User impact             | Effort  | Priority | Notes                              |
| --- | ------------------------------------------------ | -------- | ----------------------- | ------- | -------- | ---------------------------------- |
| 1   | Confirm → bottom sheet + haptics + one-tap Taken | Critical | Very high               | High    | P0       | Highest-frequency screen.          |
| 2   | Today: NextDoseHero + progress + inline confirm  | Critical | Very high               | High    | P0       | Answers "now what".                |
| 3   | Add-medication wizard (4 steps)                  | Critical | High                    | Medium  | P0       | Reduces #1 abandonment risk.       |
| 4   | Font scaling caps + tap target primitive         | High     | High (older users)      | Low     | P0       | Cheap; prevents a11y disasters.    |
| 5   | Design tokens v2 + core primitives               | High     | Med (indirect)          | Medium  | P0       | Prerequisite for everything below. |
| 6   | Skeleton loading + real error states             | High     | High (trust)            | Low-Med | P1       | Silent failure kills trust.        |
| 7   | Dark mode                                        | Med      | Med-high                | Medium  | P1       | Expected. Halfway there.           |
| 8   | Insights: adherence ring + streak + heatmap      | High     | High (retention)        | Medium  | P1       | Turns app into habit tool.         |
| 9   | Onboarding captures first medication             | High     | High (activation)       | Medium  | P1       | Prevents empty-Day-1 dropout.      |
| 10  | Snooze duration picker                           | Med      | Med                     | Low     | P1       | Fixed 30 min is a UX bug.          |
| 11  | Tab bar active state                             | Med      | Med                     | Low     | P2       | Non-color signifier, WCAG.         |
| 12  | Motion / haptic pass                             | Med      | Med (perceived quality) | Medium  | P2       | After primitives ship.             |
| 13  | Custom empty-state illustrations (×3)            | Low-Med  | Med (delight)           | Low-Med | P2       | Needs illustrator.                 |
| 14  | Weekly recap notification                        | Med      | High (retention)        | Medium  | P2       | Sunday-morning summary.            |
| 15  | Caregiver share (PDF via export)                 | Low      | High (niche)            | Low     | P3       | Free on top of export.             |
| 16  | Refill estimation                                | Low      | Med                     | Medium  | P3       | Data model supports it.            |
| 17  | Remove hero slogan                               | Low      | Med                     | Trivial | Ship now | Free win.                          |

**Verdict.** Architecture is a strength — clean, testable, DST-safe, offline-honest. Product surface is 30% of what the engine deserves. Focus obsessively on **Today** and **Confirm** — that's where the app becomes indispensable or gets uninstalled. Everything else can wait a phase.
