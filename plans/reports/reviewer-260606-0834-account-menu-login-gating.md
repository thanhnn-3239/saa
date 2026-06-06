# Code Review — Account Menu Redesign + Login-Required Gating

**Branch:** feat/account-menu-login-required  
**Date:** 2026-06-06  
**Reviewer:** Staff Engineer (reviewer agent)  
**Score: 7.5 / 10**

---

## Scope

| File | Change |
|------|--------|
| `lib/supabase/proxy-session.ts` | Narrow `PUBLIC_PATHS` to `{/login, /auth/callback}` |
| `lib/supabase/proxy-session.test.ts` | 4 test cases flipped to expect 307 instead of 200 |
| `components/header/account-menu.tsx` | Full UI restyle; remove `email` prop; add i18n |
| `components/header/account-menu.test.tsx` | Rewritten with next-intl wrapper |
| `app/(public)/layout.tsx` | Remove `email` from `<AccountMenu>` call site |
| `messages/{en,vi}.json` | Add `Home.account.*` keys |
| `vitest.config.ts` | Add `components/**` to include list |

LOC changed: ~230 lines net (not counting test files)

---

## Overall Assessment

The auth-policy change is sound and the core security invariants hold: public paths are minimal, trailing-slash bypass is prevented, domain restriction is intact, OAuth round-trip works, and signOut flows cleanly to `/login` without a loop. The UI restyle is clean and consistent with codebase conventions. Two medium-severity issues and several nits; no critical blocking bugs.

---

## Critical Issues

None.

---

## High Priority

### H1 — `getSessionUser` skips `isAllowedEmail` check (defense-in-depth gap)

**File:** `lib/auth/get-session-user.ts:28`

`getSessionUser()` returns a `SessionUser` for any JWT with a `sub` claim, regardless of email domain. It does NOT call `isAllowedEmail()`. The proxy (`proxy-session.ts:68-69`) is the real gate and correctly checks both, so no current exploit path exists. However, `layout.tsx` calls `getSessionUser()` to decide whether to render `<AccountMenu>`. If a future Supabase provider, admin override, or test environment produces a session for a non-`@sun-asterisk.com` address, that user sees the full authenticated UI (account menu, notification bell) even though every page navigation would redirect them.

**Impact:** Not exploitable today — the proxy rejects disallowed sessions on every request. But it is a two-layer system with a gap in the UI layer; the proxy comment explicitly calls the domain check "defense-in-depth," implying the UI layer should share that defense.

**Fix:**
```ts
// get-session-user.ts
import { isAllowedEmail } from "@/lib/auth/allowed-domain";
// ...
const email = (claims.email as string | undefined) ?? "";
if (!email || !isAllowedEmail(email)) return null;
```

---

### H2 — `/admin` link is client-side only; no server-side RBAC exists or is planned near-term

**File:** `components/header/account-menu.tsx:134` + `proxy.ts` (absent)

The Admin Dashboard link is shown only when `role === "admin"` (client component). The `/admin` route does not yet exist. When it is built, the proxy will grant access to ANY authenticated `@sun-asterisk.com` user because `proxy-session.ts` only checks authentication, not authorization. Role enforcement is entirely client-side UI today.

Additionally, the OAuth `?next=` param in `app/auth/callback/route.ts:30-32` allows a crafted `?next=/admin` link to land an authenticated non-admin user directly on `/admin` after login — bypassing the client-side dropdown gate entirely.

**Current exploitability:** Zero — `/admin` 404s. But this is a known future trap documented in plan comments (`INVARIANT: /admin must NOT live under app/(public)`), and needs a server-side guard when the route is built.

**Required action before `/admin` goes live:** Add a role check in the route handler or a second proxy condition, and remove or validate the `?next=` forwarding for role-protected paths.

---

## Medium Priority

### M1 — "Hides Admin Dashboard" tests pass trivially (menu never opened)

**File:** `components/header/account-menu.test.tsx:146-154`

```ts
it("hides Admin Dashboard item when role is undefined", () => {
  renderMenu();
  expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
});
it("hides Admin Dashboard item when role is not admin", () => {
  renderMenu({ role: "user" });
  expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
});
```

The menu is closed at render time. The `queryByText` call trivially passes because the `{open && <ul>}` branch renders nothing at all — it would pass even if the conditional `{isAdmin && ...}` was deleted entirely. The correct test opens the dropdown first, then asserts the item is absent.

**Fix:**
```ts
it("hides Admin Dashboard item when role is not admin", async () => {
  const user = userEvent.setup();
  renderMenu({ role: "user" });
  await user.click(screen.getByRole("button", { name: /Account menu/i }));
  await waitFor(() => {
    expect(screen.getByRole("menu")).toBeInTheDocument();
    expect(screen.queryByText(/Admin Dashboard/i)).not.toBeInTheDocument();
  });
});
```

### M2 — Duplicate test: "redirects / to /login" tested twice identically

**File:** `lib/supabase/proxy-session.test.ts:134` and `334`

Both tests are in different `describe` blocks ("unauthenticated users" and "edge cases"), have different names, but are byte-for-byte identical: same mock (`data: null`), same path (`/`), same assertions (`307`, `/login`). One should be removed or meaningfully differentiated.

### M3 — No proxy-session tests for the formerly-public routes now blocked

**File:** `lib/supabase/proxy-session.test.ts`

The test suite now covers `/` → 307, but never exercises `/awards-information`, `/sun-kudos`, or `/tieu-chuan-chung` to confirm they redirect guests. These were explicitly in the old `PUBLIC_PATHS` and are now locked. A regression that re-adds any of them to `PUBLIC_PATHS` would go undetected.

**Suggested additions:**
```ts
it.each(["/awards-information", "/sun-kudos", "/tieu-chuan-chung", "/profile"])(
  "redirects unauthenticated user from %s to /login",
  async (path) => { ... }
);
```

### M4 — WAI-ARIA `role=menu` without arrow-key navigation

**File:** `components/header/account-menu.tsx:87`

The `<ul role="menu">` uses native tab order for keyboard navigation, but the WAI-ARIA [Menu Button Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/) requires `ArrowDown`/`ArrowUp` to move focus between `menuitem` elements, and `Tab`/`Shift+Tab` to close the menu. Using `role=menu` without implementing this contract means screen-reader users with arrow-key navigation will find a broken menu.

This is not a regression — the previous version had the same gap. But the restyle adds no improvement either.

**Options:** Implement arrow-key navigation, or downgrade `role="menu"` → `role="list"` and `role="menuitem"` → remove (use plain links/buttons), which still conveys the structure without the broken contract.

---

## Nits

### N1 — `account-menu.tsx` at 232 lines exceeds the 200-line file limit

**File:** `components/header/account-menu.tsx`

Project rule: keep files under 200 lines. The icon components (`PersonIcon`, `ChevronRightIcon`) are 30+ lines of SVG markup that could be extracted to `components/icons/` or inlined as a single `icons.tsx` module shared with other header components.

### N2 — `app/(public)/` route group name is now a misnomer

**Documented in plan.md as intentional (YAGNI).** Acceptable for now, but creates a cognitive trap: any developer reading `app/(public)/layout.tsx` will assume the routes are publicly accessible, then be confused by the proxy behavior. The layout comment ("Guests see nav + language switcher only") reinforces the misnomer. If the group is ever reorganized, rename to `app/(main)/` or `app/(protected)/`.

### N3 — Inline style objects recreated on every render

**File:** `components/header/account-menu.tsx:59-70`, `103-120`, `137-151`, `165-183`

Each style `{{...}}` literal is a new object on every render. For this component this is inconsequential (small, infrequent renders), but inconsistent with how other components in this codebase use Tailwind classes for static styles (see `app-header.tsx` mixing both patterns). No action required unless performance becomes an issue, but a future cleanup to extract constant style objects (`const triggerStyle = { ... }` outside the component) would be cleaner.

### N4 — `aria-label` on trigger is only "Account menu" (non-personalized)

**File:** `components/header/account-menu.tsx:58`

Old behavior: `aria-label={`Account menu for ${displayName}`}` identified the specific user. New: generic `"Account menu"`. Acceptable given the `email` prop was removed, but worth noting for screen-reader UX — a user logged in to multiple tabs/windows cannot distinguish whose menu this is.

### N5 — vi.json `logout` / `profile` / `adminDashboard` are not translated to Vietnamese

**File:** `messages/vi.json:26-29`

```json
"profile": "Profile",
"adminDashboard": "Admin Dashboard",
"logout": "Logout"
```

All three remain English in the Vietnamese locale. This appears intentional (consistent with other untranslated labels like `"DAYS"`, `"HOURS"`) but should be a deliberate product decision, not an oversight.

---

## Edge Cases Found

1. **`/auth/callback` when already authenticated:** Proxy passes through (not redirected to `/`) because only `/login` triggers the authed→redirect check. An authed user revisiting the callback URL (e.g. browser back button) reaches the route handler which re-processes the exchange. The handler gracefully handles a missing/invalid code (redirects to `/login?error=oauth`). No security issue.

2. **Case-sensitivity of paths:** `proxy-session.ts:72` normalizes trailing slashes but not case. `/Login` or `/AUTH/CALLBACK` would redirect guests to `/login`. Next.js normalizes URL casing before the proxy runs in most deployments, so this is low risk but untested.

3. **`redirectTo` strips all query params:** `url.search = ""` on line 24. An authenticated user at `/login?error=domain` (edge: if they somehow re-hit this URL with a valid session) gets redirected to `/` with no error context. Harmless but worth knowing.

4. **No `?next=` forwarding on auth gate:** When a guest hits `/profile`, they're redirected to `/login` with no `?next=/profile` param. After login, they land on `/` instead of their intended destination. Not a security issue; a UX gap.

---

## Positive Observations

- `redirectTo()` correctly clears `url.search` to prevent query-string leakage into redirect targets.
- Trailing-slash normalization `replace(/\/+$/, "") || "/"` is correct and handles root path without a blank result.
- `getClaims()` used (not `getSession()`) throughout — JWT-verified, not trust-on-client.
- Domain check in `isAllowedEmail` correctly uses `endsWith` with the full `@domain` string — not a suffix match — so `@evil-sun-asterisk.com` is correctly rejected.
- OAuth callback correctly validates `next` param (relative path, no `//` prefix) to prevent open redirect.
- `signOut` error handling is explicitly documented; `redirect()` is correctly outside the try/catch (it throws `NEXT_REDIRECT` internally).
- `aria-haspopup="menu"` + `aria-expanded` on trigger are correct.
- `role="none"` on `<li>` wrappers is correct WAI-ARIA for the menu/menuitem pattern.
- `PersonIcon` is properly reused between trigger and Profile item (DRY).
- `vitest.config.ts` fix (adding `components/**`) was a genuine gap — component tests were silently not running. Correct call.
- `account-menu.test.tsx` correctly wraps with `NextIntlClientProvider` — previous version mocked the wrong module path (`@/lib/auth/auth-actions` vs `sign-out-action`). Both bugs fixed.

---

## Recommended Actions (prioritized)

1. **Before merging:** Fix `M1` — open the menu in the "hides Admin Dashboard" tests. These tests currently give false confidence.
2. **Before merging:** Add `M3` — parameterized tests for formerly-public routes (`/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`) to lock the policy change in tests.
3. **Before `/admin` goes live:** Address `H1` (add `isAllowedEmail` to `getSessionUser`) and `H2` (server-side role guard, validate/strip `?next=` for role-protected paths).
4. **Soon:** Resolve `M4` — either implement ArrowDown/ArrowUp navigation or change `role="menu"` to `role="list"` to avoid a broken ARIA contract.
5. **Nice-to-have:** Remove duplicate test (N2), extract icons to stay under 200 lines (N1).

---

## Metrics

- Type coverage: No `any` usages introduced; strict null handling throughout.
- Test coverage: 272 passing. Auth-policy change has 4 correct regression tests. UI has 14 component tests. Two quality gaps (M1, M3).
- Lint: Clean (per tester report; build green).

---

## Unresolved Questions

1. Is the `vi.json` keeping "Profile"/"Logout"/"Admin Dashboard" in English intentional product copy, or a missed translation?
2. Should `getSessionUser` add `isAllowedEmail` check for defense-in-depth, or is the proxy-layer check explicitly considered sufficient?
3. When `/admin` route is eventually built, will a server-side RBAC check (proxy or route handler) be added at that time? The current code has a comment-only invariant with no enforcement mechanism.
