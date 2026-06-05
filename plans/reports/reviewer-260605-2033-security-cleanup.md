# Security + Cleanup Review — SAA Homepage / FAB / Thể lệ Panel
**Branch:** feat/homepage-saa vs main | **Date:** 2026-06-05

---

## Scope
- Modified: `proxy.ts`, `lib/supabase/proxy-session.ts`, `lib/auth/sign-out-action.ts`, `lib/auth/get-session-user.ts`, `app/layout.tsx`, `app/login/_components/language-switcher.tsx`, `messages/*.json`
- New: `app/(public)/`, `components/`, `lib/auth/`, `lib/awards/`, `lib/event/`, `lib/navigation/`
- LOC delta: ~+300 / -278

---

## Critical Issues

None.

---

## High

### H-1 — Proxy matcher regex: extension-suffix bypass on arbitrary paths
**Files:** `proxy.ts:15`, `lib/supabase/proxy-session.ts`

The matcher negative-lookahead uses a `$` anchor so it matches only when the _entire path_ ends in a font/image extension:

```
.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|otf|eot)$
```

A request to `/profile/avatar.woff2` or `/protected-route.png` matches the extension exclusion, so the proxy is **never invoked** and the auth check is skipped entirely for those paths.

**Concrete test:**
```js
const regex = /((?!_next\/static|_next\/image|favicon\.ico|.*\.(?:…)$).*)/;
regex.test("/profile/avatar.woff2") // → false → proxy NOT called
```

**Current exposure:** Low-to-medium because App Router only routes to `page.tsx` handlers via directory structure — `/profile/avatar.woff2` yields a Next.js 404, not the profile page. No existing catch-all route exists (`find app -name "[*"` returns nothing). However:

1. Any future `[[...slug]]` catch-all under a protected route would be instantly exploitable.
2. The existing `/profile` stub already shows `ComingSoon` which is benign, but the pattern is fragile by design.

**Fix:** Move static-asset exclusion to the `_next/static`, `_next/image`, and `public/` prefix tiers, not extension-suffix patterns. The safest approach is to use an explicit allowlist of static prefixes only:

```ts
matcher: [
  "/((?!_next/static|_next/image|favicon\\.ico|public/).*)",
],
```

Font and image files under `public/` are already served by Next.js's static file handler before middleware runs on `_next/*` paths. Alternatively, add a second line in the exclusion that also guards against extension patterns appearing mid-path (not only at `$`).

---

### H-2 — `/admin` link exists with no route, no auth guard documented
**File:** `components/header/account-menu.tsx:108`

When `role === "admin"`, a link to `/admin` is rendered. No `/admin` route exists anywhere in the app. If a future developer creates `app/admin/page.tsx`, it must be added to a protected (non-public) route group and verified absent from `PUBLIC_PATHS`. There is no test or comment warning of this invariant.

**Risk:** Accidental public exposure of a future admin route if it is placed under `app/(public)/` by mistake.

**Fix:** Add a comment beside the link or in `PUBLIC_PATHS` warning that `/admin` must never appear in that set. Optionally add a test case:

```ts
it("redirects unauthenticated users from /admin to /login", ...)
```

---

## Medium

### M-1 — `console.log` left in shipped code
**File:** `app/(public)/_components/floating-widget-button.tsx:57`

```ts
console.log("write-kudos: not yet implemented");
```

Leaks internal implementation detail to browser console in production. Remove or replace with a silent no-op / toast notification stub.

---

### M-2 — `t: any` typed props in sub-components
**File:** `app/(public)/_components/the-le-panel.tsx:383, 458`

`HeroTierRowProps.t` and `KudosIconItemProps.t` are typed `any` with `eslint-disable` comments. If the i18n key structure changes, no compile-time error surfaces. Comments reference the suppression explicitly but the underlying type is available from `next-intl`:

```ts
import type { TranslationValues } from "next-intl";
// or use ReturnType<typeof useTranslations>
```

**Impact:** Medium — no security risk but type safety hole in the panel's public contract.

---

### M-3 — `TheLeLPanel` export name typo (interface/impl mismatch)
**File:** `app/(public)/_components/the-le-panel.tsx:8,14`

The interface is `TheLePanelProps` but the exported function is `TheLeLPanel` (double-L). Both caller and callee compile because they're in the same codebase, but the inconsistency will confuse future contributors and cause a find/grep miss (searching `TheLePanelProps` won't locate the component function).

**Fix:** Rename export to `TheLe**P**anel` (or rename interface to `TheLe**L**PanelProps`) — pick one spelling consistently.

---

### M-4 — Unused i18n key: `Home.about.title`
**Files:** `messages/en.json:39`, `messages/vi.json:39`

The key `"title": "Sun* annual awards 2025"` lives under `Home.about` in both locale files. `RootFurtherContent` uses `Home.about` namespace but only accesses `heroParagraph1`, `quote`, `heroParagraph2`. `hero-section.tsx` accesses `about.sectionCta`. No component reads `about.title`.

**Risk:** Maintenance noise; will cause a test failure if next-intl unused-key linting is ever enabled.

---

### M-5 — sign-out action swallows errors silently
**File:** `lib/auth/sign-out-action.ts:18`

```ts
await supabase.auth.signOut();
// error is intentionally discarded
redirect("/login");
```

The comment justifies this ("proxy will reject the stale session"), which is correct for the happy path. However if `createClient()` itself throws (e.g. env var missing in SSR context), the error propagates unhandled past the `await` line as an uncaught exception, potentially surfacing a raw Next.js 500 with a stack trace to the browser.

**Fix:** Wrap in try/catch; log the error server-side (not client-side), then always redirect:

```ts
try {
  const supabase = await createClient();
  await supabase.auth.signOut();
} catch {
  // server-side log only; never expose to client
}
redirect("/login");
```

---

## Low

### L-1 — `handleToggle` can be simplified
**File:** `app/(public)/_components/floating-widget-button.tsx:42-48`

```ts
const handleToggle = () => {
  if (expanded) { setExpanded(false); } else { setExpanded(true); }
};
```

Should be `setExpanded(v => !v)`. Not a security issue but unnecessary verbosity.

---

### L-2 — Scroll-lock state can leak if panel is unmounted mid-open
**File:** `app/(public)/_components/the-le-panel.tsx:30-38`

The scroll-lock `useEffect` saves `document.body.style.overflow` at mount time. If the component is unmounted while open (e.g. route change triggered from keyboard), the cleanup runs and restores the saved value. This is correct for single-panel usage but fragile with concurrent panels (none exist today, YAGNI).

---

### L-3 — Focus trap queries focusable elements at keydown time
**File:** `app/(public)/_components/the-le-panel.tsx:49-64`

The selector used in the Tab trap:

```
'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
```

Missing: `audio[controls]`, `video[controls]`, `details>summary`. Unlikely to matter here since the panel contains only `button` elements, but worth noting if the panel content grows.

---

### L-4 — Admin link visible in menu before route exists
**File:** `components/header/account-menu.tsx:108`

(Also noted in H-2.) Clicking `/admin` produces a 404 for any `role === "admin"` user today. Consider either hiding it entirely until the route ships, or showing a "coming soon" state.

---

## Nits

- `imageKey` field on each `HERO_TIERS` entry (`kudos-rules-data.ts:4-33`) is declared `as const` but never read by any consumer. Dead field — remove to keep the data shape minimal.
- `DSEG7Modern-Bold.woff2` / `DSEG7Modern-Regular.woff2` appear in `public/fonts/` — if the countdown timer is the only consumer, verify both weights are used; the regular weight may be unused.
- `docs/project-changelog.md` is untracked (new file) — it should be committed alongside the feature if it documents this work.

---

## Files / Keys Safe to Delete

| Item | Location | Reason |
|------|----------|--------|
| `Home.about.title` key | `messages/en.json:39`, `messages/vi.json:39` | No component reads it |
| `imageKey` field | `lib/awards/kudos-rules-data.ts` (all 4 HERO_TIERS entries) | Field declared but never accessed |
| Old language switcher logic | Removed by this diff (196 lines → 14 lines) — already done, nothing to delete |

---

## Recommended .gitignore Additions

The existing `.gitignore` already covers `.env*` (excluding `.env.example`). No gaps found.

Suggestion: add entries to prevent accidental commit of generated plan reports if they contain sensitive findings:

```
# Optionally ignore agent-generated reports
# plans/reports/
```

(Decision call — not a security requirement since reports contain no secrets.)

---

## Security Checklist (Adversarial Pass)

| Check | Result |
|-------|--------|
| `dangerouslySetInnerHTML` in new components | None found |
| `target="_blank"` without `rel="noopener"` | None found |
| User-controlled data rendered as HTML | None — all i18n values are static JSON |
| Secrets / API keys in source | None — `.env.local` is gitignored; only `NEXT_PUBLIC_*` in client bundles |
| Ext. i18n strings used in href/src | No — all `href` values are internal `ROUTES.*` constants or static `awardAnchor()` |
| Auth check skippable on protected routes | H-1 theoretical bypass via extension suffix on non-existent paths; no actual data exposed currently |
| `/profile` accessible to guests | No — correctly absent from `PUBLIC_PATHS`; proxy redirects to `/login` |
| `getClaims()` (JWT-verified) used, not `getSession()` | Yes — both proxy and `getSessionUser()` use `getClaims()` |
| Domain guard at proxy | Yes — `isAllowedEmail()` check on every request |
| CSRF on sign-out Server Action | Not applicable — Next.js 15+ Server Actions enforce POST + action token automatically |
| `SUPABASE_SECRET_KEY` reachable client-side | No — never prefixed `NEXT_PUBLIC_`, never imported in `"use client"` files |

---

## Overall Score

**7 / 10**

Auth model is solid (JWT-verified claims, domain guard, correct PUBLIC_PATHS enumeration, no `dangerouslySetInnerHTML`, no secrets in bundles). The single meaningful security issue (H-1 extension-suffix bypass) is currently unexploitable given the absence of catch-all routes, but it is a structural fragility that should be fixed before any catch-all route is added.

**Ship verdict:** Conditional — safe to ship as-is for current routes. **Fix H-1 before adding any `[[...slug]]` catch-all route to a protected path.** H-2, M-1, M-5 are quick fixes that should be done in a follow-up before the feature goes to production traffic.

---

**Status:** DONE_WITH_CONCERNS  
**Summary:** Review complete. Auth and data exposure are clean. One structural proxy bypass (H-1) is currently inert but is a fragility that will become critical the moment any catch-all route is added under a protected path.  
**Concerns:** H-1 (proxy matcher extension bypass) must be resolved before adding catch-all routes. M-5 (silent error swallow in createClient path) could surface raw 500 errors.
