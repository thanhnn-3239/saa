---
title: i18n system (next-intl, cookie-based) + translate Login
date: 2026-06-04
status: completed
mode: auto
package_manager: pnpm
blockedBy: [260604-1415-login-google-oauth]
blocks: []
---

# Blueprint — i18n with next-intl (no-routing) + Login translation

Add a real internationalization system (VN default + EN) using **next-intl 4.x** in
**cookie-based / no-URL-routing** mode, then replace the Login screen's hardcoded strings
and wire the language switcher to actually change the language.

**Scope:** infrastructure + translate the **Login** screen (and its language dropdown).
Other screens are translated incrementally later (just add keys to the message files).

## Why this approach (locked decisions)
| Decision | Choice | Reason |
|----------|--------|--------|
| Library | **next-intl 4.13** | App Router/RSC-native, supports Next 16 + React 19, type-safe, no peer-dep caveats |
| Routing | **Cookie-based, NO URL prefix** (`NEXT_LOCALE`) | Matches the switcher UX (change in place, no navigation) and needs **zero middleware** → our `proxy.ts` auth logic is untouched |
| Default locale | **vi**, second **en** | Per product |
| Switch mechanism | Server Action sets `NEXT_LOCALE` cookie → `router.refresh()` | Canonical next-intl no-routing pattern; re-runs RSC with new locale |

## ⚠️ Next.js 16 specifics (verified)
- No-routing mode requires **no middleware** — do **not** touch `proxy.ts`.
- `cookies()` is **async** — `await cookies()` in `i18n/request.ts` and the set-locale action.
- `createNextIntlPlugin()` (no path arg) auto-detects `./i18n/request.ts` (we have no `src/`).
- Turbopack works with the plugin out of the box. `cookies()` usage forces dynamic render — no extra `force-dynamic` needed; no `setRequestLocale` (that's routing-mode only).

## Project layout note
This repo has **no `src/`** — files live at root (`app/`, `lib/`). Paths below reflect that.

## Phases
| # | Phase | Status | Depends on |
|---|-------|--------|-----------|
| 01 | [next-intl infrastructure](phase-01-i18n-infrastructure.md) | ✅ done | — |
| 02 | [Translate Login + wire language switcher](phase-02-translate-login.md) | ✅ done | 01 |
| 03 | [Tests](phase-03-tests.md) | ✅ done | 01,02 |

## Context
- Builds on completed [260604-1415-login-google-oauth](../260604-1415-login-google-oauth/plan.md)
  (replaces its UI-only mock language switcher with the real thing).
- Research: `plans/reports/researcher-260604-1526-next-intl-no-routing.md`

## Definition of Done
- ✅ `pnpm add next-intl`; `next.config.ts` wrapped with the plugin; `i18n/request.ts` resolves locale from `NEXT_LOCALE` cookie (fallback `vi`); root `app/layout.tsx` async with `NextIntlClientProvider` + `<html lang={locale}>`.
- ✅ `messages/vi.json` + `messages/en.json` hold all Login + dropdown strings (same key tree).
- ✅ Login screen renders no hardcoded VN strings — all via `t()`; EN renders correct translations.
- ✅ Language switcher changes `NEXT_LOCALE` cookie and the whole page re-renders in the chosen language (flag + code reflect actual locale); persists on reload.
- ✅ `pnpm exec tsc --noEmit` clean, `pnpm run build` succeeds, `pnpm test` green (191 tests; incl. new i18n tests).
