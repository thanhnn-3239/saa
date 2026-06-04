# Phase 01 — Tooling & Env Foundation

**Priority:** High · **Status:** pending · **Depends on:** —

Resolve the package-manager conflict, establish env conventions, and clean the base scaffold so
every later phase builds on a consistent foundation.

## Key Insights
- `packageManager` field says `pnpm@11.5.1` but a `package-lock.json` exists → must pick one. Decision: **pnpm**.
- `.gitignore` already ignores `.env*`, `.next/`, `node_modules`, `.vercel` — good. It also ignores `.claude/*`.
- Supabase CLI secrets live under `supabase/.gitignore` (`.env.local`, `.env.keys`) — already correct.
- Env var names: standardize code on `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  (local CLI emits exactly these via `supabase status`; the Vercel integration injects the same names).
  New `*_PUBLISHABLE_KEY` values are drop-in compatible later — document but don't adopt now (YAGNI).

## Requirements
- One lockfile (`pnpm-lock.yaml`), no `package-lock.json`.
- `.env.example` committed; `.env.local` git-ignored and used for real values.
- `.nvmrc` / engines pinned to Node 24 LTS (Vercel default; matches Docker base later).

## Related Code Files
**Modify:** `package.json`, `.gitignore`, `next.config.ts`, `README.md`
**Create:** `.env.example`, `.env.local` (local only, git-ignored), `.nvmrc`
**Delete:** `package-lock.json`

## Implementation Steps
1. **Switch to pnpm**
   - `corepack enable && corepack prepare pnpm@11.5.1 --activate` (pnpm is pinned in `packageManager`).
   - `rm package-lock.json && rm -rf node_modules`
   - `pnpm install` → generates `pnpm-lock.yaml`. Commit the new lockfile.
2. **Pin Node**
   - Create `.nvmrc` with `24`.
   - Add to `package.json`: `"engines": { "node": ">=24" }`.
3. **Env scaffolding** — create `.env.example`:
   ```dotenv
   # Local dev: values come from `supabase status` after `supabase start`
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   # Server-only — NEVER prefix with NEXT_PUBLIC_
   SUPABASE_SECRET_KEY=
   ```
   - Create `.env.local` (git-ignored) with the same keys; fill after Phase 03's `supabase start`.
4. **`next.config.ts`** — leave minimal. Do NOT add `output: 'standalone'` yet (only needed if we
   ship a prod Docker image; Vercel doesn't need it). Note Turbopack is default — add no webpack config.
5. **Add helper scripts** to `package.json` (filled in across later phases):
   ```json
   "scripts": {
     "dev": "next dev",
     "build": "next build",
     "start": "next start",
     "lint": "eslint",
     "db:start": "supabase start",
     "db:stop": "supabase stop",
     "db:reset": "supabase db reset",
     "db:status": "supabase status"
   }
   ```
6. **Compile check:** `pnpm run build` (or `pnpm dev` smoke) — confirm the base app still compiles after the pnpm switch.

## Todo
- [ ] corepack → pnpm, remove `package-lock.json`, `pnpm install`, commit `pnpm-lock.yaml`
- [ ] `.nvmrc` (24) + `engines` in package.json
- [ ] `.env.example` + local `.env.local`
- [ ] Add `db:*` scripts
- [ ] `pnpm run build` passes

## Success Criteria
- Only `pnpm-lock.yaml` present; `pnpm install` reproducible.
- `pnpm run build` succeeds on the untouched scaffold.

## Risks
- **pnpm + Next 16 peer deps:** if install warns on React 19 peers, they are non-blocking. Verify build.
- **Editor/agent confusion** between lockfiles: ensure `package-lock.json` is fully deleted, not just ignored.
