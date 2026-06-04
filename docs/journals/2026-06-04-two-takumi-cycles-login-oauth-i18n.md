# Two Takumi Cycles: Login (Google OAuth) + i18n (next-intl)

**Date**: 2026-06-04 14:15–16:00  
**Severity**: Medium  
**Component**: Auth (Supabase Google OAuth), Internationalization (next-intl)  
**Status**: Resolved  
**Branch**: feat/login-google-oauth-i18n (commit 68894a2, not yet pushed)

## What Happened

Executed two end-to-end takumi implementation cycles on SAA 2025:

**Cycle 1 — Login (Google OAuth):** Built sign-in UI from MoMorph Figma (GzbNeVGJHz) and integrated Supabase Auth Google provider with domain-gated access (`@sun-asterisk.com` only). Server-side enforcement via `app/auth/callback/route.ts` with PKCE flow, provider-error allowlist, and signOut on rejected domains. Client redirects via `signInWithGoogle` with `hd` hint. Proxy-based access control via `proxy.ts`/`proxy-session.ts`: authed users skip /login, unauthed bounce to /login, session validated via `sub` claim + email whitelist.

**Cycle 2 — i18n (next-intl):** Implemented cookie-based locale switching (vi/en default). NO URL routing — zero middleware pollution. Config via `i18n/request.ts` (cookie-aware), locale actions in `lib/i18n/`, plugin in `next.config.ts`, provider + lang attribute in `app/layout.tsx`. Login fully i18n-enabled; language switcher calls `setLocale` server action + `router.refresh()`.

## The Brutal Truth

This felt rushed at points because Next.js 16 broke enough surface area that we were constantly checking docs mid-implementation. The session structure living in `proxy.ts` instead of `middleware.ts` isn't intuitive — took two review passes to nail. Adding next-intl exposed a tooling gremlin in `pnpm-workspace.yaml` that broke the entire build until we set `allowBuilds` flags. The real pain: **no automated E2E or visual tests**. Manual verification on Login got us to ~90% confidence, but a real-browser test suite would have caught subtle redirect timing and cookie issues earlier. We deferred that to a future plan and I know we're gonna regret it.

## Technical Details

**Auth Implementation (cycle 1):**
- `app/auth/callback/route.ts`: PKCE `exchangeCodeForSession`, domain guard (reject non-`@sun-asterisk.com`), provider-error allowlist (replaces undocumented `t.has()` calls), secure cookie, try/catch coverage
- `lib/supabase/proxy-session.ts`: `getClaims()` to extract `sub` claim, email allowlist validation (NOT getSession — that's the breaking change in v16)
- `lib/supabase/proxy.ts`: authed → skip /login, unauthed → /login, trailing-slash safe redirect, re-verify domain at proxy layer for defense-in-depth
- Client: `signInWithGoogle` (full-page redirect), error banner from `?error=query param`
- UI: background implementer agent (header, hero, Google button, footer, language switcher)

**i18n Implementation (cycle 2):**
- `i18n/request.ts`: `getRequestConfig` reads `NEXT_LOCALE` cookie, no URL routing
- `lib/i18n/config.ts`: vi + en, en fallback
- `lib/i18n/locale-actions.ts`: `setLocale` server action sets cookie + clears cache
- `next.config.ts`: next-intl plugin, no middleware
- `app/layout.tsx`: `NextIntlClientProvider` with explicit `messages` prop, `<html lang>` from locale
- `messages/{vi,en}.json`: Login strings + common UI strings
- 191 passing tests (Vitest + React Testing Library, real intl provider)

**Tooling fix:**
- `pnpm-workspace.yaml` had unset `allowBuilds` for `@parcel/watcher` + `@swc/core` → broke `pnpm install/build/test`
- Set to `true`; both cycles now run clean
- Scoped `vitest.config.ts` exclude to stop picking up `.claude/` tooling suites

## What We Tried

1. **Auth session structure:** Initially sketched in `middleware.ts` (old habit from Next 14) — review flagged broken; moved to `proxy.ts`, verified via `getClaims()` not deprecated `getSession()`
2. **next-intl routing:** Considered URL-based routing (`/vi/...`, `/en/...`) — rejected because auth proxy already owns URL space; cookie-based cleaner and zero-middleware
3. **i18n prop inheritance:** Draft used implicit message inheritance; review (M2) pushed for explicit `messages` prop to `NextIntlClientProvider` — less magic, better type safety
4. **Error handling (callback):** Started with direct `getUser()` call; review added try/catch, provider-error allowlist (vendor doc references), signOut fallback
5. **Testing:** Vitest + RTL strong at unit/component; tried rough E2E sketch with `@testing-library/user-event` click chains — works but fragile, deferred real E2E to future

## Root Cause Analysis

**Why the session structure confusion?** Next.js 16 moved away from global `middleware.ts` for auth — the framework wants you in `proxy.ts` now. We didn't have that pattern in our heads initially. Docs exist but aren't front-and-center.

**Why the tooling break?** `pnpm-workspace.yaml` had placeholder `allowBuilds` fields that nobody touched during init. They silently disable builds for those deps, and only showed up once we added a package (next-intl) that transitively depends on them.

**Why no E2E tests?** Scope creep risk + vitest RTL handles most of what we need locally. Real-browser verification (Playwright/Cypress) would've been 3+ hours; we chose the "fast feedback" path. That's a business decision that'll hurt us if Login auth logic shifts and we don't catch a regression.

## Lessons Learned

1. **Next.js 16 surface area is real.** Always check docs for breaking changes by version when you're unsure about session/auth patterns. `getClaims()` vs `getSession()` matters.
2. **Middleware-free i18n is possible and clean.** Cookie-based + `getRequestConfig` is simpler than URL routing for our use case. Less moving parts = fewer bugs.
3. **Review catches architectural debt fast.** Both cycles had 1–2 design flaws that reviewers spotted in ~20 min. Lean into review, especially for cross-cutting concerns like auth.
4. **Workspace config needs scrutiny.** `allowBuilds` silently breaks; we need a checklist for monorepo deps after adding new packages.
5. **Testing pyramid is real.** 191 unit/component tests gave us ~80% confidence; E2E would take us to ~95%. For auth in particular, manual testing + unit tests is a gamble long-term.

## Next Steps

1. **Push branch** — commit 68894a2 is ready; open PR for final review before merge to main
2. **Google OAuth credentials** — configure in Supabase console (see `docs/google-oauth-setup.md`); live testing blocked until done
3. **E2E + visual tests** — defer to next planning cycle; document as known gap in `docs/testing-roadmap.md`
4. **Background artwork (Login)** — gradient placeholder; Figma design has no export; either implement hand-coded gradient or request design update
5. **A11y audit** — Language switcher, error messages, auth flow nav; deferred but mark as tech debt

**Owner**: thanhnn-3239 | **Timeline**: OAuth config next sprint, E2E plan next month
