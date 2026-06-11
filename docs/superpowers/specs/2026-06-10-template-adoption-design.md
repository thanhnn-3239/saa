# Template Adoption — Typed Env, lefthook, E2E

**Date:** 2026-06-10
**Status:** Approved design (pre-plan)
**Branch (impl):** `feat/template-adoption` (worktree off `origin/main` — the kudos feature branch's board work is uncommitted/non-building, so we base off clean `main`; `/sun-kudos` is a `ComingSoon` stub there)

## Context

`ssa` is an in-flight Next.js 16 / React 19 app (Kudos live board, homepage, auth,
i18n) on the **REST + pnpm + ESLint + Tailwind v4 + Supabase** stack, with `app/` at
the repo root (`@/*` alias, no `src/`).

A separate scaffold — `/home/nguyen.ngoc.thanh@sun-asterisk.com/Documents/learn/sun-nextjs-template`
— is a T3-style init template (tRPC, zod, shadcn/ui, Biome/Ultracite, lefthook,
Playwright, Bun, `src/`, typed env, multi-agent configs). The goal is to borrow the
**good, low-risk, additive** parts of that template into `ssa` **without** breaking the
running app or swapping its established toolchain.

### Decisions locked during brainstorming

- **Scope = safe-additive only.** Keep ESLint, pnpm, REST API routes, root `app/`
  layout. Do **not** switch to Biome, Bun, tRPC, or `src/`.
- **Items chosen:** (A) typed env validation, (B) lefthook pre-commit, (C) Playwright
  E2E. `cn()` util was considered and **dropped**.
- **E2E approach = Cách 1:** pull the two existing E2E PRs into one worktree, resolve
  conflicts, then write the missing authenticated tests. Preserves already-tested work.

## Goals

1. Fail-fast, type-safe environment variable access across the app.
2. Catch lint/type errors locally before they reach CI (pre-commit).
3. A working Playwright E2E setup, including **authenticated** tests for the Kudos
   board, built on the existing `/auto-login` backdoor.

## Non-goals

- No toolchain swaps (ESLint→Biome, pnpm→Bun, REST→tRPC, root→`src/`).
- No shadcn/ui adoption, no `cn()` util, no stricter tsconfig flags, no MCP/agent
  config changes (out of the chosen safe-additive scope).
- No new auth-bypass surface beyond what PR #11 already introduces.

## Existing artifacts being integrated

| Source | What it is | State |
|---|---|---|
| **PR #4** `claude/affectionate-euler-GeCkp` | Playwright infra: `playwright.config.ts`, `docker-compose.e2e.yml`, smoke test `e2e/auth-redirect.spec.ts` (unauth → `/login`), `docs/e2e-testing.md`, `test:e2e*` scripts, browser-install hook | Open, built on older base |
| **PR #11** `feat/auto-login-backdoor` (closes #7) | `GET /auto-login` token-gated backdoor minting a **real** Supabase session for E2E; `lib/supabase/admin.ts`; dev seeder (`admin-test`/`member-test`/`member01..08`); 404-on-every-reject; ~288 unit tests pass | Open, built on older base |
| **Issue #7** | Spec for the auto-login backdoor | Closed-by PR #11 |
| Template `src/env.js`, `lefthook.yml`, `playwright.config.ts` | Reference patterns | Read-only reference |

PR #4's authenticated tests were deliberately deferred ("scaffold for future"). PR #11
is the enabler. Together they complete the E2E story.

## Sequencing & worktree

- Create a worktree branched from **HEAD of `feat/sun-kudos-live-board`** (so the Kudos
  board exists for E2E to test against), branch name `feat/template-adoption`.
- Three focused commits in order **A → B → C** (env first: C consumes
  `AUTO_LOGIN_TOKEN` / `SUPABASE_SECRET_KEY` declared in A's schema).
- Final PR targets `feat/sun-kudos-live-board` (E2E references that board).

## A. Typed env validation

- **Deps:** add `@t3-oss/env-nextjs` + `zod` (v4, matching template). Verify
  `@t3-oss/env-nextjs` ↔ zod v4 compatibility at install; fall back to zod v3 if needed.
- **New file `lib/env.ts`** (ssa convention is `lib/`, not `src/`):
  - **server:** `NODE_ENV` enum `["development","test","production"]` (default
    `development`); `SUPABASE_SECRET_KEY` `z.string().optional()` (only admin/auto-login
    need it); `AUTO_LOGIN_TOKEN` `z.string().optional()` (empty = disabled).
  - **client:** `NEXT_PUBLIC_SUPABASE_URL` `z.string().url()`;
    `NEXT_PUBLIC_SUPABASE_ANON_KEY` `z.string().min(1)`;
    `NEXT_PUBLIC_EVENT_DATETIME` `z.string().datetime({ offset: true })`.
  - `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are **excluded** — not read by app code
    (consumed by the Supabase CLI via `config.toml`). Documented inline.
  - `emptyStringAsUndefined: true`; `skipValidation: !!process.env.SKIP_ENV_VALIDATION`.
- **Wire-up:** `import "./lib/env"` at the top of `next.config.ts` → validation runs
  fail-fast at build/dev start. (Use relative path; if the TS config loader cannot
  resolve it at config-eval time, keep it relative rather than via `@/` alias.)
- **Migrate call sites** from `process.env.X!` to `env.X`:
  - `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/supabase/proxy-session.ts`
  - `lib/event/config.ts`
  - (from PR #11) `lib/supabase/admin.ts`, `app/auto-login/route.ts`
- **Edge note:** `lib/supabase/proxy-session.ts` runs in the proxy runtime;
  `@t3-oss/env-nextjs` is edge-safe by design.

## B. lefthook pre-commit (keep ESLint)

- **Dep:** add `lefthook`.
- **New file `lefthook.yml`** — `pre-commit`:
  - `eslint --fix` on staged JS/TS files, `stage_fixed: true`.
  - `tsc --noEmit` (whole project; incremental).
- **package.json scripts:** add `"typecheck": "tsc --noEmit"`.
- **postinstall:** install hooks, guarded by `!process.env.CI` (mirrors template) so CI
  is unaffected. Documented for contributors.
- Tests are **not** in pre-commit (kept in CI / optional pre-push) to keep commits fast.

## C. E2E (merge PR #11 + #4, then write authenticated tests)

1. `git merge origin/feat/auto-login-backdoor` (PR #11) first. Resolve conflicts in
   `.env.example`, `lib/supabase/proxy-session.ts` (security-sensitive — review
   carefully, re-run PR #11 tests), `docs/deployment.md`, `docs/project-changelog.md`.
   Reconcile `.env.example` with the typed-env additions from A.
2. `git merge origin/claude/affectionate-euler-GeCkp` (PR #4). Resolve `package.json`,
   `.gitignore`, `README.md`. Take **only** the Playwright browser-install piece from
   `.claude` — do **not** overwrite the current Takumi `.claude/settings.json`; instead
   document `pnpm exec playwright install` (and keep the hook only if it does not clobber
   Takumi config).
3. `pnpm install` (rebuild lockfile) + `pnpm exec playwright install chromium`.
4. Reconcile `playwright.config.ts` with typed env: provide **schema-valid dummy env**
   (well-formed fake URL / anon key / datetime-with-offset) so the Playwright-managed
   build passes validation — do **not** use `SKIP_ENV_VALIDATION` (exercise validation
   too).
5. Write authenticated test **`e2e/kudos-board.spec.ts`**:
   - Playwright **setup project** navigates to
     `/auto-login?email=member-test@sun-asterisk.com&token=${AUTO_LOGIN_TOKEN}` and saves
     `storageState`.
   - Main project reuses `storageState`, opens `/sun-kudos`, asserts the board renders.
   - **Gate to skip when `AUTO_LOGIN_TOKEN` is unset** (authed test needs Supabase local
     + dev seed), so CI without Supabase stays green. Keep the unauthenticated redirect
     smoke test for CI.

## Error handling & risks

- **@t3-oss × zod v4 compat** → verify at install; fall back to zod v3 if it breaks.
- **`proxy-session.ts` merge conflict** is security-sensitive → review by hand, re-run
  PR #11's auth tests after resolving.
- **Typed env blocking the build** if a required var is missing → secrets are
  `optional`; required vars match what `.env.local` already provides.
- **`.claude/settings.json`** must not overwrite the Takumi configuration.
- **Authenticated E2E depends on Supabase local + dev seed** → gated/skipped when
  unavailable; CI limitation documented openly (not hidden).
- **lefthook postinstall** could surprise contributors → guarded by `!CI`, documented.

## Testing / definition of done

- **After A:** `pnpm build` (env validates), `pnpm test`, `pnpm typecheck` all green.
- **After B:** a trial commit triggers the hook running lint + typecheck.
- **After C:** `pnpm test` (incl. PR #11's ~288 tests) green; `pnpm test:e2e` — smoke
  (unauth) green everywhere, authenticated test green against Supabase local + seed.

## Open questions

- PR base: confirm final PR targets `feat/sun-kudos-live-board` vs `main` once the board
  branch's own merge timeline is known.
- Whether to also run `pnpm test` on a `pre-push` lefthook job (currently out of scope).
