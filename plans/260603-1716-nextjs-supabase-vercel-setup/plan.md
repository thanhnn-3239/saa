---
title: Next.js 16 + Supabase + Vercel + Tailwind project setup
date: 2026-06-03
status: in-progress
mode: auto
blockedBy: []
blocks: []
package_manager: pnpm
---

# Blueprint — Full-stack foundation: Next.js 16 + Supabase + Vercel + Tailwind v4

Stand up a production-shaped foundation: Next.js 16.2 (App Router, RSC, Turbopack) +
Tailwind v4 already scaffolded → wire Supabase (auth/db/realtime-ready) via `@supabase/ssr`
→ local dev with **Supabase CLI backend stack + a Docker Compose Next.js dev container** →
deploy to **Vercel** with a **managed Supabase Cloud** backend.

**Scope: foundation only.** No auth UI. We install clients, set up browser/server/proxy
session handling, env config, one example DB read end-to-end, migrations + seed workflow,
the Docker dev environment, and the Vercel + Supabase Cloud deploy pipeline.

## Current State (already present)
- Next.js `16.2.7`, React `19.2.4`, Tailwind v4, TypeScript, ESLint 9 — scaffolded.
- `supabase init` done: `supabase/config.toml` (project_id `agentic-coding-live-demo`, db v17,
  API `54321`, db `54322`), `supabase/seeds/{common,dev}`.
- Docker `29.3.0` + Compose `v5.1.0` installed. Vercel CLI `51.2.1` (outdated → upgrade).
- Conflict: `package-lock.json` exists but `packageManager` field says pnpm → standardize on **pnpm**.

## Critical Decisions (locked)
| Decision | Choice |
|----------|--------|
| Local dev architecture | Supabase CLI runs a **trimmed** backend stack; Compose runs Next.js dev container. Linux uses `network_mode: host` to reach the CLI stack at `127.0.0.1:54321` |
| Local Supabase services | Enabled: `db, kong/api(rest), auth, realtime, storage` (6 containers). Disabled in `config.toml`: `studio, edge_runtime, analytics, vector, inbucket, db.pooler` — re-enable per need |
| Production backend | Supabase Cloud (managed), linked via CLI; migrations pushed from CI |
| Package manager | **pnpm** (drop `package-lock.json`, generate `pnpm-lock.yaml`) |
| Feature scope | Foundation only — no auth UI |

## ⚠️ Breaking-change landmines (Next.js 16 — verified against bundled docs)
1. **`middleware.ts` → `proxy.ts`** — named export `proxy`, **Node runtime only** (no edge).
   Supabase docs still say `middleware.ts`; we adapt the session-refresh logic into `proxy.ts`.
2. **Async dynamic APIs** — `await cookies()`, `await headers()`, `await params` are **required**
   (sync access removed). All Supabase server helpers must `await cookies()`.
3. **Turbopack is the default bundler** for `dev` and `build`. No custom `webpack` config.
4. Env: `NEXT_PUBLIC_*` exposure rule unchanged; `serverRuntimeConfig`/`publicRuntimeConfig` removed.
5. Supabase: use `@supabase/ssr` (auth-helpers deprecated); verify auth with `getClaims()`, never `getSession()`.

## Phases
| # | Phase | Status | Depends on |
|---|-------|--------|-----------|
| 01 | [Tooling & env foundation](phase-01-tooling-and-env-foundation.md) | ✅ done | — |
| 02 | [Supabase clients & proxy session](phase-02-supabase-clients-and-proxy.md) | ✅ done | 01 |
| 03 | [DB migrations, seeds & example read](phase-03-database-migrations-seeds-example.md) | ✅ done (verified + demo cleaned) | 02 |
| 04 | [Local Docker dev environment](phase-04-local-docker-dev-environment.md) | ✅ done (alpine, build+reach-Supabase verified) | 02 |
| 05 | [Vercel + Supabase Cloud deploy](phase-05-vercel-and-supabase-cloud-deploy.md) | ⏸️ deferred (when deploying for real) | 03 |
| 06 | [Docs & verification](phase-06-docs-and-verification.md) | ⏸️ deferred | 03,04,05 |

> **Local init setup COMPLETE (2026-06-04).** Phases 01–04 done & verified. App runs locally
> (host or Docker) against a trimmed 6-service Supabase stack. Phases 05–06 deferred to real deploy time.

Phases 03 and 04 are independent of each other (both depend on 02) and can run in parallel.

## Reports (research)
- `plans/reports/researcher-260603-1721-nextjs16-conventions.md`
- `plans/reports/researcher-260603-1716-supabase-next-vercel.md`

## Definition of Done
- `pnpm dev` works on host AND `docker compose up` runs the app against the local Supabase stack.
- Server component renders rows from a seeded example table (RLS-protected) — proving the full path.
- `supabase db reset` reapplies migrations + seeds cleanly; project linked to a cloud ref.
- A Vercel deployment is live, reading from Supabase Cloud, with env vars set for preview + production.
- `docs/` initialized; README documents the dev + deploy workflow.
