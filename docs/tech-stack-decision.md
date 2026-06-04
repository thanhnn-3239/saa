# Tech Stack Decision — SAA Kudos

**Date:** 2026-06-04 · **Status:** Accepted · **Stage:** Init setup (tech selection)

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

## Environment model
- **Local dev:** Supabase CLI runs a trimmed backend stack — `db, kong/api, auth, realtime, storage, studio` (+pg-meta); `edge_runtime, analytics, vector, inbucket, db.pooler` disabled in `config.toml`. Docker Compose (`node:24-alpine`, `network_mode: host`) runs the Next.js dev container.
- **Production:** Vercel hosts Next.js; Supabase Cloud hosts the backend; migrations pushed via CLI/CI.
- **Package manager:** pnpm.

## Key constraints carried forward
- RLS enabled on every table from day one.
- Correctness-critical logic (random rewards, atomic multi-table writes) lives in **Postgres functions**, never client-side.
- Realtime via Supabase, not a hand-rolled WebSocket server.

## Out of scope (this stage)
Detailed schema, feature implementation, auth UI. Init setup only.
Schema design draft (for later): `plans/260603-1716-nextjs-supabase-vercel-setup/data-model-and-backend-architecture.md`.

## Related
- Setup plan: `plans/260603-1716-nextjs-supabase-vercel-setup/plan.md`
- Design analysis: `plans/reports/researcher-260604-1059-saa-kudos-design-analysis.md`
