# Phase 04 — Integration + tests

## Context Links
- [plan.md](plan.md) · [clarifications.md](clarifications.md)
- Depends on: [phase-01](phase-01-supabase-google-oauth.md), [phase-02](phase-02-proxy-auth-enforcement.md), [phase-03](phase-03-login-ui.md)
- MoMorph: Login `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz`

## Overview
- **Priority:** Critical (closes the loop)
- **Status:** completed
- Replace UI mocks with real auth: wire the login button to `signInWithGoogle()`,
  render the error banner from `?error=`, manage loading state, then test against the 17 test cases.

## Key Insights
- Track A produced presentational components with a known props contract (see phase-03). Integration only connects handlers/state/data — no UI redesign.
- Loading state: button click sets local `loading=true`, calls `signInWithGoogle()`; full-page redirect to Google follows, so loading persists until navigation (TC `37eae882`).
- Error banner copy keyed by `?error=` code: `domain` → "Vui lòng đăng nhập bằng tài khoản @sun-asterisk.com"; `oauth` → generic auth failure.

## Requirements
- Functional: button triggers OAuth; `?error=domain|oauth` renders banner; authed redirect verified; loading disables button.
- Non-functional: no regressions to foundation; all tests pass; files < 200 lines.

## Architecture
```
app/login/page.tsx (server): read searchParams.error -> <LoginErrorBanner code={error}/>
  -> <LoginButton/> (client): onClick => setLoading(true); signInWithGoogle().catch(showError)
proxy.ts (phase-02) guards entry/exit; /auth/callback (phase-01) finishes the flow
```

## Related Code Files
- **Modify:** `app/login/page.tsx` — pass `searchParams.error` to banner; mount client login button.
- **Modify:** `app/login/_components/login-button.tsx` — call `signInWithGoogle` from phase-01, manage `loading`.
- **Modify:** `app/login/_components/login-error-banner.tsx` — map `code` → localized message.
- **Create (tests):** `app/login/__tests__/login.test.tsx`, `app/auth/callback/__tests__/callback.test.ts` (or e2e under `tests/e2e/login.spec.ts` via Playwright).
- **Read:** `lib/auth/oauth-actions.ts`, `lib/auth/allowed-domain.ts`.

## Implementation Steps
1. Wire `LoginButton` onClick → `signInWithGoogle()`; set `loading` + `disabled` during call; surface thrown errors.
2. In `page.tsx`, read `searchParams` (await — Next.js 16) and render `<LoginErrorBanner code={error}/>`.
3. Add localized messages for `domain` / `oauth` codes in the banner.
4. Decide test stack: if none present, add **Vitest + React Testing Library** for unit/component and **Playwright** (already available) for e2e. Add `test` script to `package.json`.
5. Write tests mapped to test cases (below). Mock Supabase browser client for unit tests; use a stubbed session/route for callback + access-control e2e.
6. `pnpm run build` + run tests; fix until green. Delegate test run to `tester` agent per workflow.

## Test Case Mapping (from the 17 MoMorph TCs)
- Access control (`45278c06`, `f62b0c97`): unauth `/`→`/login`; authed `/login`→`/`; logout→`/login` (e2e on proxy).
- Login button (`60bc5bbb`-init, `6ae76d15`, `c18649fa`, `37eae882`, `60bc5bbb`-fn): visible+centered, Google icon, hover elevation, disabled+loader on click, OAuth initiates.
- Domain guard (extends `e76aa170`): non-`@sun-asterisk.com` → `/login?error=domain` + banner.
- Language control (`5f1cbabd`, `98e20775`, `20d87e28`, `4426635b`, `cb42461d`): default VN, flag+chevron, dropdown opens, hover pointer (UI-only).
- Layout (`b9805e65`, `8415b629`, `33a1dacf`, `5fbe2a18`, `42b82364`): logo top-left, language top-right, footer fixed bottom, hero art, title+descriptions.

## Todo List
- [x] Login button wired to `signInWithGoogle` + loading state
- [x] Error banner from `?error=` with VN messages
- [x] Test stack set up (Vitest + RTL; Playwright e2e) + `test` script
- [x] Unit/component tests (button, banner, callback domain guard)
- [x] e2e access-control tests (proxy redirects)
- [x] `pnpm run build` + all tests green (via `tester` agent)

## Success Criteria
- All Definition-of-Done items in `plan.md` verified by passing tests.
- No fake/mocked-to-pass tests; failures fixed at the source.

## Risk Assessment
- e2e OAuth against real Google is flaky in CI → mock the provider / stub session for the redirect-exchange leg; keep the live-Google check manual.
- No test infra yet → step 4 adds it; keep config minimal (KISS).

## Security Considerations
- Confirm disallowed-domain path truly signs out (no residual cookies) in callback test.
- Ensure `?error=` cannot inject HTML — render as plain mapped text only.

## Next Steps
- Update `docs/` (auth flow) via `doc-writer`; mark plan completed; consider follow-up plan for real i18n + language dropdown screen.

**Status:** completed

**Test results:** 140 tests passing (Vitest + RTL), tsc clean, production build succeeds, code review APPROVE_WITH_NITS 7.5/10 (all correctness/security items fixed).
