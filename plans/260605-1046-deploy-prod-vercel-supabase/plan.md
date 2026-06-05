---
title: Deploy SAA Kudos to PROD — Vercel + Supabase Cloud
date: 2026-06-05
status: in-progress
mode: auto
package_manager: pnpm
blockedBy: []
blocks: []
supersedes: [260603-1716-nextjs-supabase-vercel-setup/phase-05-vercel-and-supabase-cloud-deploy.md]
---

# Blueprint — First production deploy (Vercel + Supabase Cloud)

Ship the current app (Google OAuth login + i18n, 140 tests green) to PROD. Platform is **locked**
(`docs/tech-stack-decision.md`): Vercel hosts Next.js 16, Supabase Cloud is the backend. This plan
**supersedes** the old deferred `phase-05` — it now accounts for the **OAuth + i18n** work shipped
after that phase was written, and for the **June-2025 Supabase API-key rename** (`sb_publishable_*`).

## Locked decisions (from clarification)
| Q | Decision |
|---|----------|
| Platform | Vercel + Supabase Cloud (no `vercel.json`/`vercel.ts` — zero config, YAGNI) |
| CI/CD | Git auto-deploy (Vercel) + GitHub Action for `supabase db push` on migration changes |
| Supabase project | **Create new**: Postgres **17**, region **Singapore (ap-southeast-1)** |
| Domain | `*.vercel.app` first; custom domain deferred |

## Key insights (verified — see reports/)
- **`SUPABASE_SECRET_KEY` is unused** in code (grep-confirmed). SSR auth needs only the URL + publishable
  key. **Do NOT set the secret in Vercel** until an admin/RLS-bypass op actually needs it.
- **API key (2026):** new projects expose `sb_publishable_…` → that is the value for
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`. (Legacy `anon` JWT only on pre-Jun-2025 projects.)
- **OAuth previews are a non-issue here.** Google's authorized redirect URI is the *fixed* Supabase
  callback (`https://<ref>.supabase.co/auth/v1/callback`) — same for prod & every preview. The dynamic
  preview→app hop is governed by **Supabase's** redirect allow-list, which supports `*` wildcards.
  → No separate Google OAuth client needed. (Researcher's generic "make a 2nd client" advice N/A.)
- **`proxy.ts` runs on Vercel** (Node runtime). Cosmetic only: Vercel logs a "middleware missing" warning — ignore.
- **Turbopack build** is default & works on Vercel — but run `pnpm build` locally first to catch conflicts.
- **`supabase db push` = migrations only** (seeds skipped without `--include-seed`). Dev seeds stay local.
- **Vercel Node default = 24 LTS**; `engines.node >=20.9.0` resolves to it. Fine.

## Phases
| # | Phase | Status | Depends on |
|---|-------|--------|-----------|
| 01 | [Supabase Cloud project + schema](phase-01-supabase-cloud-project.md) | pending | — |
| 02 | [Vercel project + first deploy](phase-02-vercel-deploy.md) | pending | 01 |
| 03 | [Google OAuth + Auth URL config](phase-03-oauth-auth-config.md) | pending | 02 |
| 04 | [CI/CD — GitHub Action for migrations](phase-04-cicd-migrations.md) | 🔨 workflow file added (`.github/workflows/supabase-migrations.yml`); repo secrets pending | 01 |
| 05 | [Production verification](phase-05-verify-prod.md) | pending | 03 |

Phase 04 is independent of 02/03 (needs only the project ref + secrets) → can run in parallel with them.
The hard ordering is **01 → 02 → 03 → 05** (OAuth config needs the live `*.vercel.app` URL from 02).

## Reports (research)
- `plans/reports/researcher-260605-1050-supabase-cloud-prod-deploy.md`
- `plans/reports/researcher-260605-1050-vercel-nextjs16-deploy.md`

## Definition of Done
- `https://<app>.vercel.app` live, reading from Supabase Cloud (PG17, Singapore).
- Google login works end-to-end; `@sun-asterisk.com` allowed, other domains rejected to `/login?error=domain`.
- i18n locale switch (vi/en) persists via `NEXT_LOCALE` cookie in prod.
- Cloud schema = local migrations; **no dev seeds** in prod.
- GitHub Action pushes migrations on merge to `main`.
- Client bundle contains **no** secret (only `NEXT_PUBLIC_*`); confirmed by grep of `.next`.

## Pre-flight (one-time, before Phase 02)
- `npm i -g vercel` — Vercel CLI is **not installed** locally.
- `pnpm build` locally — confirm a clean Turbopack production build before first deploy.
