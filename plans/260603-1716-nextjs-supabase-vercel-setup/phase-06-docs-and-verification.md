# Phase 06 — Docs & Verification

**Priority:** Medium · **Status:** pending · **Depends on:** 03, 04, 05

Document the workflow and run the end-to-end verification checklist so the foundation is reproducible
by anyone cloning the repo.

## Related Code Files
**Create/Modify:**
- `README.md` — quickstart (local + Docker + deploy)
- `docs/system-architecture.md` — stack diagram + data flow
- `docs/development-roadmap.md`, `docs/project-changelog.md`, `docs/code-standards.md` (per project rules)

## Implementation Steps
1. **README quickstart** covering:
   - Prereqs: Node 24, pnpm (corepack), Docker, Supabase CLI, Vercel CLI.
   - Local (host): `pnpm install` → `pnpm db:start` → copy keys from `pnpm db:status` into `.env.local`
     → `supabase db reset` → `pnpm dev`.
   - Local (Docker): `pnpm db:start` → `pnpm dev:docker`.
   - Deploy: link Vercel + Supabase Cloud, set env vars, `vercel --prod` (point to Phase 05).
2. **`docs/system-architecture.md`** — short diagram: Browser → Next.js (Vercel/Docker) → Supabase
   (`@supabase/ssr` clients + `proxy.ts` session) → Postgres (local CLI stack / cloud). Note the
   `middleware.ts → proxy.ts` and async-`cookies()` Next.js 16 specifics so future contributors don't trip.
3. **`docs/code-standards.md`** — env var conventions (`NEXT_PUBLIC_*` vs server-only), RLS-first rule,
   pnpm-only, file-size + kebab-case conventions from `.claude/rules/development-rules.md`.
4. **`docs/development-roadmap.md` + `project-changelog.md`** — record this setup as the initial milestone.
5. **Run the verification matrix** (below) and record results.

## End-to-End Verification Matrix
| # | Check | Pass when |
|---|-------|-----------|
| 1 | `pnpm install` | clean, only `pnpm-lock.yaml` |
| 2 | `pnpm run build` | compiles (Turbopack, no webpack/edge errors) |
| 3 | `supabase start` + `db reset` | migration + seed applied, no warnings |
| 4 | `pnpm dev` → `/notes` (host) | 3 seeded rows render |
| 5 | `pnpm dev:docker` → `/notes` | rows render from container; HMR works |
| 6 | `proxy.ts` active | session cookie refresh on requests; no edge-runtime error |
| 7 | `vercel --prod` | production URL live, reads cloud DB |
| 8 | client bundle audit | `SUPABASE_SECRET_KEY` NOT present in browser JS |
| 9 | RLS check | disabling policy blocks reads (proves RLS enforced) |

## Todo
- [ ] README quickstart (local + Docker + deploy)
- [ ] `docs/` architecture + standards + roadmap + changelog
- [ ] Run verification matrix 1–9, record results
- [ ] Note Next.js 16 gotchas (`proxy.ts`, async `cookies()`) in docs

## Success Criteria
- A fresh clone can reach a working `/notes` locally by following the README only.
- All 9 verification checks pass; results recorded in the changelog.

## Risks
- **Docs drift:** keep README env names in sync with `.env.example` and Vercel.
