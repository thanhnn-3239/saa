# Phase 03 — Tests

## Context Links
- [plan.md](plan.md) · depends on [phase-01](phase-01-i18n-infrastructure.md), [phase-02](phase-02-translate-login.md)
- Existing stack: Vitest + React Testing Library (`pnpm test`).

## Overview
- **Priority:** High
- **Status:** completed
- Cover the i18n infra + the translated Login behavior. 191 tests pass; Vitest suite extended with i18n + component tests.

## Tests to add/update
1. **`i18n/request.ts`** (mock `next/headers cookies`): returns `vi` by default; returns `en` when cookie=`en`; falls back to `vi` for an invalid cookie value; loads the matching messages object.
2. **`lib/i18n/locale-actions.ts`** (mock `cookies`): `setLocale("en")` sets `NEXT_LOCALE` cookie with correct options; rejects/ignores an invalid locale.
3. **`language-switcher`**: renders current locale from `useLocale` (mock `next-intl`), shows correct flag for `vi` vs `en`; clicking an option calls mocked `setLocale` + `router.refresh` (mock `next/navigation`); has `cursor-pointer`.
4. **`login-error-banner`**: renders the translated message for each code via a mocked `useTranslations`; unknown code → `error.generic`; nothing without code; dismissible. (Update the existing banner test — it now uses translations, not the inline map.)
5. **Message-file parity**: a small test asserting `messages/vi.json` and `messages/en.json` have identical key trees (catches missing translations).

## Implementation Steps
1. Update existing `login-error-banner` test to the translations-based API.
2. Add new tests (1–3, 5 above).
3. Mock boundaries only: `next/headers`, `next/navigation`, `next-intl` hooks. No over-mocking.
4. `pnpm test` until green + `pnpm exec tsc --noEmit` clean. Delegate execution to `tester`.

## Todo List
- [x] request.ts tests
- [x] locale-actions tests
- [x] language-switcher tests (locale, flag, switch action, cursor)
- [x] login-error-banner test updated to translations
- [x] vi/en key-parity test
- [x] `pnpm test` green (191 tests) + tsc clean

## Success Criteria
- All new + existing tests pass; key-parity test guards against missing translations.

## Risk Assessment
- next-intl hooks hard to mock → mock `useTranslations` to return a key-echo or a small dictionary; assert keys requested rather than final copy where simpler.
