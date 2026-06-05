# Code Review: Homepage SAA (public marketing landing)

**Date:** 2026-06-05 | **Branch:** feat/homepage-saa (uncommitted) | **Reviewer:** Staff Engineer

---

## Scope

- **Files changed vs main:** 10 files, +205 / -273 LOC
- **New files reviewed (not in diff):** 22 additional files created on branch
- **Focus:** Security (public access change), auth controls, countdown correctness, i18n, DRY/KISS/YAGNI

---

## Overall Assessment

Solid implementation. The public-access change is correct and defense-in-depth is preserved. The countdown is well-designed (pure function, injected `now`, hydration-safe). DRY win on LanguageSwitcher is clean. No `any` types, no console.log, no secrets. The main concerns are one security/auth design risk (`/profile` as public), one functional bug (hardcoded i18n keys in header), one interval-cleanup fragility, and several lower-severity issues. No data leaks or injection vectors found.

---

## Critical Issues

**None.**

---

## High Priority

### H1 — `/profile` in PUBLIC_PATHS breaks auth intent
**File:** `lib/supabase/proxy-session.ts:16`

`/profile` is added to `PUBLIC_PATHS`, meaning unauthenticated guests can reach it with no redirect to `/login`. The current stub page just shows "coming soon" so there's no data leak today, but the proxy contract says "guests are redirected to /login for anything not in PUBLIC_PATHS." When `/profile` becomes a real page with user-specific data, this whitelist entry will remain unless explicitly removed — and it will silently allow unauthenticated access.

The plan/clarifications list `/profile` as a **stub** page, not a genuinely public resource. Its stub state is an implementation artifact, not a permanent access policy.

**Fix:** Remove `/profile` from `PUBLIC_PATHS`. The stub page is not the same as a public page. The proxy should redirect guests from `/profile` to `/login` now (correct UX) and the stub page renders inside the layout for authenticated users.

---

### H2 — Language switcher `aria-label` uses a nav link key, not a locale-select label
**File:** `app/(public)/layout.tsx:27`

```ts
<LanguageSwitcher ariaLabel={t("nav.aboutSaa")} />
```

`t("nav.aboutSaa")` resolves to `"About SAA 2025"` (EN) / `"About SAA 2025"` (VI). The `aria-label` on the language-switcher button will announce as "About SAA 2025" to screen readers — completely wrong. The login page correctly uses `t("langSelectAria")` from its own namespace.

No `langSelectAria` key exists in the `Home` namespace.

**Fix:** Add `"langSelectAria": "Select language"` (EN) and `"langSelectAria": "Chọn ngôn ngữ"` (VI) to `messages/en.json` and `messages/vi.json` under `Home.nav` (or a top-level `Home` key), then use `t("nav.langSelectAria")` in the layout.

---

## Medium Priority

### M1 — Header nav links are hardcoded English strings, not i18n keys
**File:** `app/(public)/_components/app-header.tsx:61,80,99`

```tsx
About SAA 2025   // line 61
Award Information // line 80
Sun* Kudos        // line 99
```

All three nav labels are hardcoded English. The footer correctly uses `t("aboutSaa")`, `t("awardInformation")`, `t("kudos")`. Keys exist in both `vi.json` and `en.json` under `Home.nav`. The header should use `getTranslations("Home.nav")` and render `t("aboutSaa")` etc.

**Fix:** Convert `AppHeader` to an async server component (or accept pre-resolved strings as props from the layout) and use the `Home.nav` keys.

---

### M2 — Stale doc comment in `app/(public)/page.tsx`
**File:** `app/(public)/page.tsx:9-11`

The comment states "app/page.tsx is kept as a thin re-export shell for backward compatibility." `app/page.tsx` was deleted in this diff — it does not exist. The comment is factually wrong and will mislead future developers.

**Fix:** Remove or rewrite the `ARCHITECTURE NOTE` block.

---

### M3 — Stale doc comment in `app/(public)/_components/homepage/homepage-content.tsx`
**File:** `homepage-content.tsx:8`

```
* Uses mock data from the Figma design; integration will replace with i18n keys + real data.
```

The component now uses i18n keys throughout — the comment is the opposite of the current state.

**Fix:** Remove the comment or replace with the actual architecture note (server component, i18n via `Home.*`).

---

### M4 — `use-countdown.ts`: interval stored on function object — fragile cleanup pattern
**File:** `lib/event/use-countdown.ts:50-63`

The interval ID is stored by mutating the `cleanup` function object:
```ts
(cleanup as { interval?: ReturnType<typeof setInterval> }).interval = interval;
```

This is a non-standard pattern. In practice it works because JS is single-threaded and React's cleanup runs in-order. But it is confusing, breaks type safety (the cast hides intent), and is a smell for future maintainers. A standard `useRef` pattern would be clearer.

**Recommended fix:**
```ts
const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
// in scheduleNext:
intervalRef.current = setInterval(tick, 60_000);
// in cleanup:
if (intervalRef.current) clearInterval(intervalRef.current);
```

---

### M5 — `CountdownTimer` silently truncates days ≥ 100
**File:** `app/(public)/_components/homepage/countdown-timer.tsx:76-77`

`TimerUnit` renders exactly two `DigitTile`s via `padded[0]` and `padded[1]`. For `days >= 100`, `String(100).padStart(2,"0") = "100"`, so `padded[0]="1"`, `padded[1]="0"` — the third digit `"0"` is silently dropped, rendering "10" instead of "100".

For the current event date (Dec 2025, already past), this fires immediately with `isExpired=true` and shows `00/00/00`, so the bug is not user-visible today. However, for any future event set more than 99 days out, the display is wrong.

**Fix:** Either cap `days` at 99 explicitly with a comment, or render tiles dynamically from the full string.

---

### M6 — `FloatingWidgetButton` placeholder strings are hardcoded Vietnamese, not i18n
**File:** `app/(public)/_components/floating-widget-button.tsx:23`

```tsx
{["Viết Kudos", "Thể lệ SAA"].map((item) => ...)}
```

These are hardcoded Vietnamese strings in a component that will appear on a bilingual page. Per plan this widget is a placeholder/stub — but even stubs shouldn't violate the app's i18n contract. Acceptable for the stub phase per clarifications, but should be tracked.

**Fix (stub phase):** Add `Home.widget.kudos` / `Home.widget.rules` keys and use them. Or accept as known limitation with a `// TODO(i18n)` comment.

---

### M7 — `NotificationBell` hardcodes Vietnamese strings
**File:** `components/header/notification-bell.tsx:73,79`

```tsx
Thông báo
Chưa có thông báo mới.
```

These will not update when locale switches to EN. Per clarifications, the notification panel is intentionally a placeholder — but these visible strings should use i18n keys.

**Fix:** Add `Home.notifications.title` / `Home.notifications.empty` keys; or explicitly mark as deferred-i18n stub with a comment.

---

## Low Priority

### L1 — Typo in `messages/vi.json`
**File:** `messages/vi.json:24`

```json
"comingSoon": "Comming soon"
```

`"Comming"` → `"Coming"`. Note: the EN file has the correct spelling (`"Coming soon"`).

---

### L2 — SVG `clipPath` IDs are global and collision-prone
**File:** `components/language-switcher.tsx:148,175`

`id="vn-clip"` and `id="en-clip"` are static DOM IDs. If the `LanguageSwitcher` ever renders twice on the same page (e.g., mobile nav + desktop nav as part of a future responsive layout), the second set of IDs silently wins and the first clip path may render incorrectly.

Currently only one instance per page — not an active bug. But the pattern is fragile.

**Fix:** Use `useId()` (React 18+) or a module-level counter to generate unique IDs per instance.

---

### L3 — `AccountMenu` and `AppHeader` nav labels bypass i18n (English-only)
**File:** `components/header/account-menu.tsx:110,125,146`

"Profile", "Admin Dashboard", "Sign out" are hardcoded English. These components will remain English regardless of locale. For an authenticated user switching to VI locale, the account menu stays in English.

Per clarifications, no explicit requirement to i18n these menu labels was stated — but it's inconsistent with the rest of the page.

---

### L4 — `KudosSection` uses fixed pixel positioning, breaks on small screens
**File:** `app/(public)/_components/homepage/kudos-section.tsx:22,44,56-60`

```css
height: "500px"    /* fixed container */
left: "64px"       /* absolute overlay */
width: "457px"     /* absolute content block */
top: "46px"
```

On viewports < ~600px, the content block overflows the card. The design targets are likely desktop-only (Figma) but the page claims to be responsive. The awards grid is responsive; the kudos section is not.

This is a design fidelity issue, not a correctness bug. Flag for mobile QA.

---

### L5 — `signOut` action swallows error silently — comment may mislead
**File:** `lib/auth/sign-out-action.ts:10-13`

The comment says "session cookie will be cleared by the redirect regardless." This is only true if the Supabase `signOut()` side effect (clearing the cookie) completes before the `redirect()` throws. `redirect()` in Next.js throws a special error internally. The cookie-clearing side effect in `@supabase/ssr` happens in the `setAll` handler, which runs during the client setup phase, not on signOut. So the session may not be fully cleared on sign-out failure.

In practice Supabase signOut rarely fails — but the comment's reasoning is incorrect. The risk is low.

---

## Nits

- `app/(public)/page.tsx:18` — trailing blank line after `}`.
- `lib/event/config.ts` — `isValid` is exported but never imported outside tests; `countdown-live.tsx` imports `targetIso` and derives validity from `useCountdown`. The exported `isValid` is unused in production code. Suggest removing or marking as test-only.
- `app/(public)/_components/app-header.tsx:6` — `// mm:2167:9091` comment appears twice (line 6 and line 17), duplicated MoMorph reference.
- Header nav link "Award Information" (line 80) vs footer "Award Information" key `awardInformation` — singular "Award" in header, matches key value. Fine, but inconsistent with the `awardInformation` key name implying plural.

---

## Edge Cases Found (Scouting)

1. **`/profile` as public:** Already filed as H1 — functional today but security time-bomb when profile page gains real user data.
2. **Event date in the past:** `NEXT_PUBLIC_EVENT_DATETIME=2025-12-26T18:30:00+07:00` is ~161 days ago. Countdown will always show `00/00/00` with no "Coming soon" label. This is correct per the plan's expired-state behavior, but the `.env.example` ships a past date — could confuse developers who run locally and wonder why the countdown doesn't tick.
3. **Locale switch on language-switcher with wrong aria-label (H2):** Screen reader users navigating in VI locale will hear "About SAA 2025" announced for the language button — unhelpful.
4. **`getSessionUser()` called on every public request** in `app/(public)/layout.tsx:21` — even for guests. The Supabase `getClaims()` verifies the JWT locally (no network call), so this is efficient. No N+1 concern.
5. **`t(category.titleKey as Parameters<typeof t>[0])` cast in `awards-section.tsx:69`** — the `as` cast suppresses TS type safety on the key name. If a `titleKey` value doesn't match an actual key in `Home.awards`, it silently falls back to the raw key string at runtime (next-intl behavior). The static dataset + i18n file are in sync today, but the cast prevents compile-time catching of future typos.

---

## Positive Observations

- **proxy-session.ts** — Trailing slash normalization (`replace(/\/+$/, "") || "/"`) is a good defense against `/login/` bypass. Correct.
- **getSessionUser** — Uses `getClaims()` (JWT-verified) consistently with the proxy, not the weaker `getSession()`. Good defense-in-depth.
- **useCountdown** — Pure `getCountdown()` with injected `now` is fully testable and SSR-safe. Hydration-safe INITIAL state is the right pattern.
- **LanguageSwitcher DRY** — Login wrapper is ~5 lines, shared component is the source of truth. Clean refactor.
- **signOut via `<form action={signOut}>`** — Correct Next.js pattern; Server Actions are CSRF-protected by the framework when invoked through forms.
- **PUBLIC_PATHS trailing-slash defense** — `pathname.replace(/\/+$/, "") || "/"` is a clean one-liner that handles edge cases.
- **i18n key parity** — `vi.json` and `en.json` have identical key sets (verified programmatically). No missing keys.
- **No `any` types, no console.log, no secrets in code.**

---

## Metrics

| Metric | Value |
|--------|-------|
| Type Safety | High — no `any`, one `as` cast with known risk (M5) |
| Test Coverage | 250/250 pass; 18 MoMorph IDs covered |
| Linting Issues | 0 (build green) |
| i18n Key Parity | Exact match vi ↔ en |
| Security Issues | 1 High (`/profile` public) |

---

## Recommended Actions (Priority Order)

1. **[H1] Remove `/profile` from `PUBLIC_PATHS`** — security time-bomb; easy 1-line fix.
2. **[H2] Fix `ariaLabel` for LanguageSwitcher in public layout** — add `langSelectAria` key to `Home` namespace, use it.
3. **[M1] i18n the AppHeader nav links** — keys already exist, just not wired.
4. **[L1] Fix typo `"Comming soon"` → `"Coming soon"` in `messages/vi.json`**.
5. **[M2/M3] Remove/fix stale comments** in `(public)/page.tsx` and `homepage-content.tsx`.
6. **[M4] Refactor `use-countdown` interval cleanup** to use `useRef` pattern.
7. **[M5] Document or guard `days >= 100` truncation** in `CountdownTimer`.

Items 6-7 are refactors — acceptable to defer if timeline is tight.

---

## Unresolved Questions

1. Is `/profile` intentionally public (stub "coming soon" for unauthenticated)? The plan says stub pages are public to avoid broken links — but profile is user-specific. Clarification needed before merge.
2. Should `messages/vi.json` `Home.nav.*` labels be translated (currently mostly English placeholders like "About SAA 2025")? The vi.json and en.json are identical for the nav group — is this intentional?
3. The `.env.example` ships `NEXT_PUBLIC_EVENT_DATETIME=2025-12-26T18:30:00+07:00` which is in the past. Should the example be updated to a future sentinel or removed?

---

## Score: 7.5 / 10

The core security model (JWT verification, domain allow-list, proxy auth) is correct. The countdown and DRY refactor are well-executed. The deductions are: wrong aria-label on a user-facing accessibility element (H2), `/profile` incorrectly public (H1), non-i18n'd header nav labels visible to all users (M1), and several medium-quality issues.

**Verdict: NO-SHIP until H1 and H2 are fixed.** M1 (header i18n) should also be resolved before production since it produces an English-only nav regardless of locale setting. The remaining issues can be addressed in a follow-up.

---

**Status:** DONE_WITH_CONCERNS
**Summary:** Review complete. Found 2 High issues (security + accessibility) and 5 Medium issues that should be addressed before merge.
**Concerns:**
- H1: `/profile` in `PUBLIC_PATHS` is a security time-bomb — profile data will be publicly accessible by default when the real page ships unless this is explicitly removed.
- H2: Wrong `aria-label` on language switcher announces "About SAA 2025" to screen readers — functional accessibility defect.
- M1: AppHeader nav labels are hardcoded English — locale switch does not affect header navigation.
