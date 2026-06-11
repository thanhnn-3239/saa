# Tech Stack Decision — SAA Kudos

**Date:** 2026-06-04 · **Status:** Accepted · **Stage:** Auth + login shipped (2026-06-04)

## Decision
Build the SAA recognition app on **Next.js 16 (App Router) + Supabase + Vercel + TailwindCSS v4**.
No separate backend service — Supabase is the backend (DB, Auth, Storage, Realtime, auto APIs).

## Why (validated against the MoMorph design)
| System need | Covered by |
|-------------|-----------|
| Live board + realtime notifications | Supabase Realtime (no custom socket server) |
| Google login + roles (admin/member) | Supabase Auth (native OAuth) + RLS |
| Kudo image / avatar upload | Supabase Storage |
| Secret-box random reward (server-authoritative, atomic) | Postgres functions (built into Supabase) |
| Feed / filter / search | Supabase + Row Level Security, direct from client |
| UI + light server logic | Next.js Server Components/Actions on Vercel |

→ The app is **data-centric with a few correctness-critical operations** — a perfect fit for the
Supabase model. A traditional standalone backend (Node/Nest/etc.) would add ops cost with no benefit here.

## Stack roles
- **Next.js 16 / Vercel** — UI, server logic (Server Actions / Route Handlers), session proxy.
- **Supabase** — Postgres + Auth + Storage + Realtime; the real backend. Cloud for prod, CLI for local.
- **TailwindCSS v4** — styling.
- **next-intl 4.13** — i18n; cookie-based locale (`NEXT_LOCALE`), no URL routing. Locales: `vi` (default), `en`.
- **@tanstack/react-query** — client-side data fetching, caching, and infinite scroll for the kudos board. Provider in `app/providers.tsx`; hooks in `lib/kudos/`.
- **embla-carousel-react** — lightweight carousel used by the kudos highlight section.

## Environment model
- **Local dev:** Supabase CLI runs a trimmed backend stack — `db, kong/api, auth, realtime, storage, studio` (+pg-meta); `edge_runtime, analytics, vector, inbucket, db.pooler` disabled in `config.toml`. Docker Compose (`node:24-alpine`, `network_mode: host`) runs the Next.js dev container.
- **Production:** Vercel hosts Next.js; Supabase Cloud hosts the backend; migrations pushed via CLI/CI.
- **Package manager:** pnpm.

## Key constraints carried forward
- RLS enabled on every table from day one.
- Correctness-critical logic (random rewards, atomic multi-table writes) lives in **Postgres functions**, never client-side.
- Realtime via Supabase, not a hand-rolled WebSocket server.

## Shipped

**2026-06-04**
- **Auth + login screen** — Google OAuth via Supabase Auth (`@supabase/ssr`, PKCE). Domain restriction enforced server-side in `app/auth/callback/route.ts`. Access control in `proxy.ts` + `lib/supabase/proxy-session.ts`.
- **Login UI** — `/login` route (SAA branded hero; inline error banner for `?error=oauth|domain|access_denied`).
- **i18n** — next-intl 4.13; cookie-based locale, no URL routing; `vi`/`en` with key-parity test. See `docs/i18n.md`.
- **Tests** — Vitest + React Testing Library; 275 tests passing (`pnpm test`).
- **Database schema** — full Kudos schema, RLS, functions/triggers, dev seeds. See `docs/database-design.md`.

**2026-06-06**
- **Kudos Live Board** (`/sun-kudos`) — highlight carousel, spotlight cloud, infinite-scroll feed, sidebar stats + leaderboards, heart toggle. TanStack Query + Supabase Realtime. `kudo_likes` migration. See `docs/project-changelog.md`.

## Still out of scope
Send-kudo flow, full profile pages, admin dashboard, secret-box grant triggers, notifications bell (realtime read).

Schema design reference: `plans/260603-1716-nextjs-supabase-vercel-setup/data-model-and-backend-architecture.md`.

## Related
- Setup plan: `plans/260603-1716-nextjs-supabase-vercel-setup/plan.md`
- Design analysis: `plans/reports/researcher-260604-1059-saa-kudos-design-analysis.md`
