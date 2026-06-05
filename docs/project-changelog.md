# Project Changelog

Significant changes, features, and fixes in reverse-chronological order.

---

## [Unreleased] — 2026-06-05

### Added
- **Public marketing homepage** (`/`): hero section with live event countdown, awards grid (6 static categories), Sun* Kudos promo, floating widget, footer.
- **Public route group** (`app/(public)/`): shared `AppHeader`/`AppFooter` layout. Stub "coming soon" pages for `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`.
- **`NEXT_PUBLIC_EVENT_DATETIME`** env var (ISO-8601): drives homepage countdown. Must be set in Vercel for production; degrades gracefully if absent.
- **i18n `Home` namespace** in `messages/{vi,en}.json`.
- New libs: `lib/event/*` (countdown), `lib/awards/categories.ts`, `lib/navigation/routes.ts`, `lib/auth/{get-session-user,sign-out-action}.ts`.

### Changed
- **Public access policy**: `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung` now accessible without login (via `lib/supabase/proxy-session.ts`). `/profile` remains auth-gated.
- Header notification bell and account menu render only when authenticated.

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
