# Project Changelog

Significant changes, features, and fixes in reverse-chronological order.

---

## [Unreleased] — 2026-06-06

### Added
- **CSS token standardization (issue #8)**: 8 components migrated from hardcoded inline styles to `@theme` tokens and Tailwind utilities. `@theme` expanded with alpha tokens (`--color-saa-gold-glass`, `--color-saa-scrim-black`), shadow (`--shadow-saa-glow`), and radius (`--radius-saa-card`, `--radius-saa-button`) tokens. ESLint guard (`saa/inline-style-guard`) added at warn level — new `style` props trigger a warning pointing to `docs/styling-conventions.md`. Convention doc created at `docs/styling-conventions.md`.

### Changed
- **Login-required policy (BREAKING)**: all routes now require authentication. `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`, and `/profile` redirect unauthenticated users to `/login`. Only `/login` and `/auth/callback` remain public. Enforced in `lib/supabase/proxy-session.ts` (`PUBLIC_PATHS`); `lib/auth/get-session-user.ts` adds `isAllowedEmail` domain guard as defense-in-depth.
- **Account menu redesign**: `components/header/account-menu.tsx` updated to MoMorph design — plain user-icon trigger, dark dropdown with Profile / role-gated Admin Dashboard / Logout (label was "Sign out"). All labels use `next-intl` keys under `Home.account.*` namespace (added to `messages/{vi,en}.json`).
- **Vitest scope**: `vitest.config.ts` now includes `components/**` test files. 275 tests pass.

---

## 2026-06-05

### Added
- **Public marketing homepage** (`/`): hero section with live event countdown, awards grid (6 static categories), Sun* Kudos promo, floating widget, footer.
- **Public route group** (`app/(public)/`): shared `AppHeader`/`AppFooter` layout. Stub "coming soon" pages for `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`.
- **`NEXT_PUBLIC_EVENT_DATETIME`** env var (ISO-8601): drives homepage countdown. Must be set in Vercel for production; degrades gracefully if absent.
- **i18n `Home` namespace** in `messages/{vi,en}.json`.
- New libs: `lib/event/*` (countdown), `lib/awards/categories.ts`, `lib/navigation/routes.ts`, `lib/auth/{get-session-user,sign-out-action}.ts`.

### Changed
- Header notification bell and account menu render only when authenticated.

> **Note:** The public-access policy for marketing pages documented here was reversed in the 2026-06-06 entry above — all routes are now login-required.

### Deferred
- Real notifications, user roles, Admin Dashboard, widget menu options, full target pages for public stubs.

---

## 2026-06-04

### Added
- Google OAuth login restricted to `@sun-asterisk.com` domain.
- i18n (vi/en) with `NEXT_LOCALE` cookie persistence.
- SAA Kudos database schema, RLS policies, helper functions, dev seeds.

### Infrastructure
- Next.js 16 + Supabase + Docker local dev setup.
- Vercel Git Integration (production + preview) + GitHub Action for DB migrations.
