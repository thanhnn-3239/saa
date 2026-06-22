# Project Changelog

Significant changes, features, and fixes in reverse-chronological order.

---

## [Unreleased] — 2026-06-11 (fix/ci-migrations-production-env + feat: send-kudos dialog)

### Added
- **Send-kudo dialog** (`app/(public)/sun-kudos/_components/send-dialog/`): full kudo-creation flow. Tiptap rich-text editor (HTML stored in `kudos.body`; rendered via `lib/kudos/sanitize-html.ts` with DOMPurify allowlist — XSS-safe). Image upload to `kudo-images` bucket (`{uid}/{uuid}.{ext}`, max 5 × 5 MB, jpg/png/webp). Hashtag picker (1–5 existing hashtags). Optional title (≤100 chars). Optional anonymous mode with alias display.
- **`POST /api/kudos`**: creates a kudo (401/400/422/500); validates `imagePaths` ownership against the authenticated user's storage prefix.
- **`GET /api/kudos/spotlight`**: extended with `excludeSelf=1` query param.
- **DB migration `20260611070000_kudo_title_anonymous_name.sql`**: adds `kudos.title` (text, nullable) and `kudos.anonymous_name` (text, nullable); re-creates `create_kudo` with new 8-param signature (adds `p_title`, `p_anonymous_name`); drops old 6-param overload; grants `EXECUTE` to `authenticated`.
- **Anonymous privacy:** `hydrateKudoCard` (server-side) masks real sender name/id with `anonymous_name` for anonymous rows — client never sees `sender_id`.
- **New deps:** `@tiptap/*` suite (rich text editor), `isomorphic-dompurify` (server-side HTML sanitization).
- **CI fix:** Supabase migration job bound to `Production` environment so `SUPABASE_*` secrets are available in the workflow.

### Changed
- Board kudo cards now render `title` (when present) and sanitized HTML `body`.
- Anonymous kudos display `anonymous_name` alias on cards (replacing sender name).

---

## [Unreleased] — 2026-06-10 (feat/sun-kudos-live-board — UI fidelity pass)

### Added
- **`kudo-card-base.tsx`** (`app/(public)/sun-kudos/_components/ui/`): new shared base component for feed and highlight kudo cards (Figma family 256:5231). Renders body text inside a gold-glass box (`bg-saa-gold-glass`, `border-saa-gold-accent`, `rounded-saa-card`), with timestamp placed below the sender divider. `highlight-card.tsx` and `kudo-post-card.tsx` are now thin wrappers over this base.

### Changed
- **Search inputs** (`banner.tsx`, `spotlight-cloud.tsx`): native browser search-clear (×) button hidden via CSS.
- **Filter dropdown trigger** (`ui/filter-dropdown.tsx`): restyled to a single `rounded-[4px]` pill; trigger label shows selected filter label, falling back to category name. Open panel behavior and accessibility attributes unchanged.
- **Sidebar stats flame badge** (`sidebar-stats.tsx`): "x2" badge added on the hearts row; gift icon repositioned to after button text (filled variant).

### Deferred (resolved in 2026-06-11 entry)
- Kudo card title ("IDOL GIỎI TRẺ"): was omitted here — `kudos.title` column added by `20260611070000_kudo_title_anonymous_name.sql` and cards now render it.

---

## [Unreleased] — 2026-06-06 (feat/sun-kudos-live-board)

### Added
- **Sun* Kudos Live Board** (`/sun-kudos`): full public-facing live board replacing the prior stub page. Ships:
  - **Highlight carousel** — top kudos in an Embla-powered auto-scroll carousel.
  - **Spotlight name-cloud** — simplified cloud sized by `hearts_received` from `profile_kudo_stats` view.
  - **All-kudos feed** — TanStack Query infinite-scroll feed with hashtag/date filters and realtime inserts via Supabase Realtime.
  - **Sidebar** — campaign stats (`kudo_heart_counts` view) + top-sender and top-recipient leaderboards.
  - **Heart button** — optimistic toggle-like with `kudo_likes` table; sender cannot like their own kudo.
- **`kudo_likes` DB migration** (`20260606000000_kudo_likes.sql`): new table, indexes, RLS policies, `kudo_heart_counts` + `profile_kudo_stats` views, `REPLICA IDENTITY FULL`, realtime publication.
- **API routes**: `GET /api/kudos/feed`, `/highlight`, `/spotlight`, `/sidebar`, `/filters`; `POST/DELETE /api/kudos/[id]/like`.
- **Data layer** (`lib/kudos/*`): TanStack Query hooks (`use-kudos-feed`, `use-highlight-kudos`, `use-spotlight`, `use-sidebar`, `use-toggle-like`, `use-filters`), query key types, Supabase realtime subscription helper.
- **TanStack Query provider** (`app/providers.tsx`): wraps the app with `QueryClientProvider`.
- **New deps**: `@tanstack/react-query`, `embla-carousel-react`.
- **i18n keys** under `Home.kudosPage.*` namespace in `messages/{vi,en}.json`.

### Changed
- `/sun-kudos` promoted from a "coming soon" stub to a fully-implemented live board page.

---

## [Unreleased] — 2026-06-06

### Added
- **Auto-login backdoor for test/E2E (issue #7, DEV ONLY)**: token-gated `GET /auto-login?email=&token=` that mints a **real** Supabase session for an existing internal user, bypassing Google OAuth. Default-OFF — disabled unless `AUTO_LOGIN_TOKEN` is set. Every reject branch returns an identical **404** (never 403) so the route's existence is never revealed: token unset, missing/wrong token (constant-time compare), disallowed domain, and user-not-found all 404. The minted session is genuine (`getClaims()` verifies, RLS uses the real `auth.uid()`). New `lib/supabase/admin.ts` (service-role client, first code use of `SUPABASE_SECRET_KEY`); `/auto-login` added to `PUBLIC_PATHS`. Dev seeder `supabase/seeds/dev/seed.sql` (opt-in via `SUPABASE_EXTRA_SEEDS`) creates `admin-test`/`member-test` + `member01..08` across departments. **NEVER set `AUTO_LOGIN_TOKEN`/`SUPABASE_SECRET_KEY` in production.** Note: seeding `auth.users` manually requires the nullable GoTrue token columns (`confirmation_token`, etc.) set to `''`, not NULL, or the Admin API fails with "Database error finding user".
- **CSS token standardization (issue #8)**: 8 components migrated from hardcoded inline styles to `@theme` tokens and Tailwind utilities. `@theme` expanded with alpha tokens (`--color-saa-gold-glass`, `--color-saa-scrim-black`), shadow (`--shadow-saa-glow`), and radius (`--radius-saa-card`, `--radius-saa-button`) tokens. ESLint guard (`saa/inline-style-guard`) added at warn level — new `style` props trigger a warning pointing to `docs/styling-conventions.md`. Convention doc created at `docs/styling-conventions.md`.

### Changed
- **Login-required policy (BREAKING)**: all routes now require authentication. `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`, and `/profile` redirect unauthenticated users to `/login`. Only `/login` and `/auth/callback` remain public. Enforced in `lib/supabase/proxy-session.ts` (`PUBLIC_PATHS`); `lib/auth/get-session-user.ts` adds `isAllowedEmail` domain guard as defense-in-depth.
- **Account menu redesign**: `components/header/account-menu.tsx` updated to MoMorph design — plain user-icon trigger, dark dropdown with Profile / role-gated Admin Dashboard / Logout (label was "Sign out"). All labels use `next-intl` keys under `Home.account.*` namespace (added to `messages/{vi,en}.json`).
- **Vitest scope**: `vitest.config.ts` now includes `components/**` test files. 275 tests pass.

### Fixed
- **Login Google button overflow (mobile)**: on narrow viewports (~341px) the 22px nowrap label exceeded the width-capped button, pushing the Google icon ~45px outside the button. `app/login/_components/login-button.tsx` now uses a responsive label (`text-base` on mobile, `sm:text-[22px]` for the design size), tighter mobile padding (`px-4 sm:px-6`), `min-w-0` + `truncate` guard so the icon stays inside. Desktop (22px, auto-width) unchanged. Severity: low (cosmetic, login screen).

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
