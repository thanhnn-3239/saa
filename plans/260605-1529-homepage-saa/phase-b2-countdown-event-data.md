# Phase B2 — Countdown & event data (Track B · logic)

**MoMorph refs:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM · Clarifications: clarifications.md

## Overview
- **Priority:** High · **Status:** todo · **Depends on:** B1
- Implement the countdown logic that drives `CountdownTimer` (A1): compute DAYS/HOURS/MINUTES
  remaining until the event datetime, tick per minute, and handle zero/invalid/missing states.

## Key insights (specs B1/B1.2/B1.3 + tests ID-12/39/40/41/42/43/56/57/60)
- Source: `NEXT_PUBLIC_EVENT_DATETIME` (ISO-8601, e.g. `2025-12-26T18:30:00+07:00`). Design event info shows 26/12/2025 18h30.
- Units: DAYS, HOURS, MINUTES only (no seconds). Always 2-digit, leading-zero padded (ID-40).
- Update cadence: per minute (ID-39).
- At/after event start: show `00 00 00` **and** hide "Coming soon" label (ID-41/42); before: show "Coming soon" (ID-43).
- Invalid/missing datetime: graceful fallback (e.g. hide countdown or show 00s) with **no crash** (ID-60).
- ⚠️ Hydration: compute remaining time on the **client** to avoid SSR/client mismatch; render a stable placeholder until mounted.

## Requirements
- Pure function `getCountdown(targetIso, now)` → `{ days, hours, minutes, isExpired, isValid }` (testable, no Date.now inside — `now` injected).
- Client hook `useCountdown(targetIso)` that re-renders every minute using the pure function.
- `CountdownTimer` consumes the hook; parent decides "Coming soon" visibility from `isExpired`.

## Related code files
- Create: `lib/event/countdown.ts` (pure logic), `lib/event/use-countdown.ts` (client hook), `lib/event/config.ts` (reads + validates env var).
- Modify: `CountdownTimer` (from A1) to use the hook; hero parent to toggle "Coming soon".

## Implementation steps
1. `lib/event/config.ts`: read `NEXT_PUBLIC_EVENT_DATETIME`, validate ISO-8601, export parsed target + `isValid`.
2. `lib/event/countdown.ts`: pure diff → days/hours/minutes (floored), `isExpired` when target ≤ now, `isValid` flag. 2-digit pad helper.
3. `lib/event/use-countdown.ts`: `'use client'`; setInterval at 60s, also align to minute boundary; cleanup on unmount.
4. Wire into `CountdownTimer`; expose `isExpired` upward for the "Coming soon" toggle.

## Todo
- [x] `getCountdown` pure fn (+ pad, isExpired, isValid) — `lib/event/countdown.ts`
- [x] env config reader + validation — `lib/event/config.ts`
- [x] `useCountdown` minute-tick hook (no hydration mismatch) — `lib/event/use-countdown.ts`
- [x] Wire timer + Coming-soon visibility via `countdown-live.tsx` client wrapper

## Status
✅ **Completed** (2026-06-05). Pure `getCountdown()` function with injected `now` (testable, SSR-safe). `useCountdown` hook ticks per minute with hydration-safe initial state. Countdown values passed to presentational `CountdownTimer` component.

## Success criteria
- ✅ Correct values for a known target; single-digit → leading zero; expired → 00/00/00 + label hidden; invalid env → no crash.
- ✅ Unit tests for `getCountdown` cover ID-40/41/56/57/60 cases. 6 CountdownTimer tests passing (250/250 total).

## Risks
- Timezone correctness — rely on ISO-8601 offset; do not assume local tz. Per-minute (not per-second) keeps it light.
