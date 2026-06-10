# Template Adoption Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Borrow three safe, additive things from the `sun-nextjs-template` into `ssa` — typed env validation, lefthook pre-commit hooks, and Playwright E2E (by integrating the two existing E2E PRs) — without changing the established toolchain (ESLint, pnpm, REST, root `app/`).

**Architecture:** Three sequential slices on one branch. **A** adds a `@t3-oss/env-nextjs` + zod schema (`lib/env.ts`), imported by `next.config.ts` for fail-fast validation, and migrates current `process.env.X!` call sites. **B** adds a `lefthook.yml` running `eslint --fix` + `tsc --noEmit` on pre-commit (keeps ESLint). **C** merges PR #11 (auto-login backdoor) then PR #4 (Playwright infra), migrates the merged files to typed env, reconciles `playwright.config.ts` with validation, adds authenticated tests via the `/auto-login` backdoor, and fixes PR #4's stale smoke test.

**Tech Stack:** Next.js 16.2.7, React 19, TypeScript 5, pnpm 11.5.1, ESLint 9 (flat config), Vitest 4, Supabase (SSR + service-role), `@t3-oss/env-nextjs` + zod 4, lefthook, `@playwright/test` 1.60.

---

## Pre-flight (already done — do not repeat)

- Worktree exists at `.claude/worktrees/template-adoption` on branch `feat/template-adoption`, based off **`origin/main`** (`7d7a48a`). **All work happens in this worktree.** (Originally scoped off the kudos feature branch, but that branch's board work is uncommitted and non-building, so we base off clean `main`. Consequence: on `main`, `next.config.ts` is minimal and `/sun-kudos` is a `ComingSoon` stub — Tasks 1 and 7 are written for that reality.)
- PR branches fetched and available locally:
  - PR #11 → `origin/feat/auto-login-backdoor` (auto-login backdoor, ~288 unit tests)
  - PR #4 → `origin/claude/affectionate-euler-GeCkp` (Playwright infra)
- Spec: `docs/superpowers/specs/2026-06-10-template-adoption-design.md`.

**Conventions:** commit messages use Conventional Commits, **no AI references** (project rule). Run all commands from the worktree root. Package manager is **pnpm** (never npm/yarn).

---

## File Structure

**Slice A — typed env:**
- Create: `lib/env.ts` — validated env schema + typed `env` export.
- Modify: `next.config.ts` — import `lib/env.ts` to validate at build start.
- Modify: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/event/config.ts` — `process.env.X!` → `env.X`.
- Modify: `package.json` — add `@t3-oss/env-nextjs`, `zod`.
- (NOTE: `lib/supabase/proxy-session.ts` migration is deferred to Task 4 — it is also edited by PR #11; migrating it now would create a merge conflict in Task 3.)

**Slice B — lefthook:**
- Create: `lefthook.yml` — pre-commit jobs (lint + typecheck).
- Modify: `package.json` — add `lefthook` dep, `typecheck` script, `postinstall` hook install.

**Slice C — E2E (integrate PRs + author tests):**
- Merge-in (PR #11): `app/auto-login/route.ts`, `lib/supabase/admin.ts`, `supabase/seeds/dev/seed.sql`, `tests/auth/auto-login.test.ts`, `lib/supabase/proxy-session.ts` (+ `.test.ts`), `.env.example`, `docs/*`, `plans/260606-1316-auto-login-backdoor/*`.
- Merge-in (PR #4): `playwright.config.ts`, `docker-compose.e2e.yml`, `e2e/auth-redirect.spec.ts`, `docs/e2e-testing.md`, `package.json` (scripts/dep), `.gitignore`, `README.md`.
- Modify (Task 4): `lib/supabase/admin.ts`, `app/auto-login/route.ts`, `lib/supabase/proxy-session.ts` → typed env.
- Modify (Task 6): `playwright.config.ts` → env passthrough + conditional auth projects.
- Create (Task 7): `e2e/auth.setup.ts`, `e2e/authenticated-access.authed.spec.ts`.
- Modify (Task 8): `e2e/auth-redirect.spec.ts` → match current `/`→`/login` behavior.
- Modify (Task 9): `docs/e2e-testing.md` → authenticated-test section.

---

## Task 1: Typed env validation (Slice A)

**Files:**
- Modify: `package.json` (add deps)
- Create: `lib/env.ts`
- Modify: `next.config.ts`
- Modify: `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/event/config.ts`

- [ ] **Step 1: Add dependencies**

Run:
```bash
pnpm add @t3-oss/env-nextjs@^0.13.11 zod@^4.4.3
```
Expected: both added to `dependencies`; lockfile updated; no peer-dep errors. If install reports a zod peer-range error from `@t3-oss/env-nextjs`, fall back: `pnpm add zod@^3.25.0` and continue (the schema below is compatible with both).

- [ ] **Step 2: Create `lib/env.ts`**

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

/**
 * Typed, validated environment variables (adopted from the T3 template pattern).
 * Imported by next.config.ts so validation runs fail-fast at build/dev start.
 * Run any command with SKIP_ENV_VALIDATION=1 to bypass (e.g. Docker image builds).
 *
 * GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET are intentionally NOT declared here:
 * they are consumed by the Supabase CLI via supabase/config.toml, never read by
 * app code. SUPABASE_EXTRA_SEEDS is likewise a Supabase-CLI-only var.
 */
export const env = createEnv({
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    // Service-role key. Optional: only the auto-login backdoor / admin client
    // needs it (Task 4). Absent in normal dev/build/CI.
    SUPABASE_SECRET_KEY: z.string().optional(),
    // Auto-login backdoor token (DEV ONLY). Empty/unset = backdoor disabled (404).
    AUTO_LOGIN_TOKEN: z.string().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    // ISO-8601 with timezone offset. Optional: the countdown degrades gracefully
    // when absent (lib/event/config.ts), so we keep it non-required but validate
    // the format when present.
    NEXT_PUBLIC_EVENT_DATETIME: z
      .string()
      .refine((v) => !Number.isNaN(new Date(v).getTime()), {
        message:
          "NEXT_PUBLIC_EVENT_DATETIME must be a valid ISO-8601 datetime with timezone offset",
      })
      .optional(),
  },
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    AUTO_LOGIN_TOKEN: process.env.AUTO_LOGIN_TOKEN,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_EVENT_DATETIME: process.env.NEXT_PUBLIC_EVENT_DATETIME,
  },
  emptyStringAsUndefined: true,
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
```

> If zod 4 emits a deprecation warning on `z.string().url()`, switch that line to `z.url()`. If you fell back to zod 3 in Step 1, keep `z.string().url()`.

- [ ] **Step 3: Import env in `next.config.ts`**

Add the import as the **first** line so validation runs before the config builds. On `main`, `next.config.ts` is minimal (no `images` block — that was kudos WIP), so only add the env import. Final file:

```ts
import "./lib/env"; // Fail-fast env validation at build/dev start.
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  /* config options here */
};

// No path arg: auto-detects ./i18n/request.ts. Works with Turbopack.
const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
```

- [ ] **Step 4: Migrate `lib/supabase/client.ts`**

```ts
import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";

/**
 * Supabase client for use in Client Components (browser).
 * Reads the public URL + anon key (safe to expose).
 */
export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

- [ ] **Step 5: Migrate `lib/supabase/server.ts`**

Replace the two `process.env...!` arguments with `env.NEXT_PUBLIC_SUPABASE_URL` and `env.NEXT_PUBLIC_SUPABASE_ANON_KEY`, and add `import { env } from "@/lib/env";` at the top. The `createServerClient(...)` call becomes:

```ts
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
```
(leave the rest of the file unchanged)

- [ ] **Step 6: Migrate `lib/event/config.ts`**

Replace the first non-comment line `const raw = process.env.NEXT_PUBLIC_EVENT_DATETIME ?? "";` with:

```ts
import { env } from "@/lib/env";

const raw = env.NEXT_PUBLIC_EVENT_DATETIME ?? "";
```
(keep the rest — `isValid` / `targetIso` — unchanged)

- [ ] **Step 7: Verify build + types + unit tests pass**

Run:
```bash
pnpm typecheck 2>/dev/null || pnpm exec tsc --noEmit
pnpm build
pnpm test
```
Expected: `tsc` clean; `pnpm build` succeeds (env validates against `.env.local`); all existing unit tests pass. (`typecheck` script is added in Task 2 — until then use `pnpm exec tsc --noEmit`.)

- [ ] **Step 8: Verify fail-fast behavior (manual, no commit)**

Run:
```bash
NEXT_PUBLIC_SUPABASE_URL= pnpm build 2>&1 | head -20
```
Expected: build **fails** with a `@t3-oss/env-nextjs` "Invalid environment variables" error naming `NEXT_PUBLIC_SUPABASE_URL`. This confirms validation works. (Re-run a normal `pnpm build` after, or just proceed.)

- [ ] **Step 9: Commit**

```bash
git add lib/env.ts next.config.ts lib/supabase/client.ts lib/supabase/server.ts lib/event/config.ts package.json pnpm-lock.yaml
git commit -m "feat(env): add typed env validation with @t3-oss/env-nextjs + zod"
```

---

## Task 2: lefthook pre-commit hooks (Slice B)

**Files:**
- Modify: `package.json` (dep + scripts)
- Create: `lefthook.yml`

- [ ] **Step 1: Add lefthook dependency**

Run:
```bash
pnpm add -D lefthook@^2.1.6
```
Expected: `lefthook` in `devDependencies`; lockfile updated.

- [ ] **Step 2: Add `typecheck` + `postinstall` scripts to `package.json`**

In the `"scripts"` block, add `typecheck` (after `lint`) and `postinstall` (after the last script). The scripts block becomes:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "db:start": "supabase start",
    "db:stop": "supabase stop",
    "db:reset": "supabase db reset",
    "db:status": "supabase status",
    "dev:docker": "docker compose up --build",
    "postinstall": "node -e \"if (!process.env.CI) require('child_process').execSync('lefthook install', {stdio: 'inherit'})\""
  },
```

- [ ] **Step 3: Create `lefthook.yml`**

```yaml
# Git hooks (adopted from the sun-nextjs-template). Installed by the package.json
# postinstall script; skipped on CI (postinstall guards on !process.env.CI).
# Keeps ESLint — does NOT switch to Biome.
pre-commit:
  parallel: false
  jobs:
    - name: lint
      glob: "*.{ts,tsx,js,jsx,mjs,cjs}"
      run: pnpm exec eslint --fix {staged_files}
      stage_fixed: true
    - name: typecheck
      run: pnpm typecheck
```

- [ ] **Step 4: Install the hooks**

Run:
```bash
pnpm exec lefthook install
```
Expected: "lefthook installed" / a `.git/hooks/pre-commit` is written. (In the worktree, hooks install into the shared `.git`.)

- [ ] **Step 5: Verify the hook fires on commit**

Run:
```bash
git add lefthook.yml package.json pnpm-lock.yaml
git commit -m "chore(hooks): add lefthook pre-commit (eslint --fix + tsc --noEmit)"
```
Expected: the commit triggers lefthook, runs the `lint` and `typecheck` jobs, both pass, and the commit completes. If lint/typecheck fail, fix the reported issues and re-commit (do not `--no-verify`).

---

## Task 3: Merge PR #11 — auto-login backdoor (Slice C.1)

**Files:** brings in `app/auto-login/route.ts`, `lib/supabase/admin.ts`, `supabase/seeds/dev/seed.sql`, `tests/auth/auto-login.test.ts`, and edits `lib/supabase/proxy-session.ts` (+ `.test.ts`), `.env.example`, `docs/*`, `plans/*`.

- [ ] **Step 1: Merge the PR #11 branch**

Run:
```bash
git merge --no-ff origin/feat/auto-login-backdoor -m "merge: token-gated auto-login backdoor for test/E2E (PR #11)"
```
Expected: **a clean merge** — PR #11 branched from the current `main` HEAD (`7d7a48a`), so no conflicts are expected. Inspect with `git status`; if there are unexpected conflicts, resolve per Step 2.

- [ ] **Step 2: Resolve expected conflicts**

Resolve each conflicted file by **keeping both sides' intent** (union), not picking one blindly:
- `lib/supabase/proxy-session.ts` — Task 1 did NOT touch this file, so it should merge cleanly. If conflicted, take PR #11's version (adds `"/auto-login"` to `PUBLIC_PATHS` + comments); it still uses `process.env...!` here — that is migrated in Task 4.
- `.env.example` — take PR #11's superset (adds `AUTO_LOGIN_TOKEN`, `SUPABASE_EXTRA_SEEDS`, the `SUPABASE_SECRET_KEY` comment). Keep all current sections (Supabase, Google, SAA Event).
- `docs/deployment.md`, `docs/project-changelog.md` — keep both sides' additions.
- `lib/supabase/proxy-session.test.ts` — keep both sides' test cases (union of `describe`/`it` blocks).
- New files (`app/auto-login/route.ts`, `lib/supabase/admin.ts`, `supabase/seeds/dev/seed.sql`, `tests/auth/auto-login.test.ts`, `plans/260606-1316-auto-login-backdoor/*`) — no conflict; accept as added.

After resolving, run:
```bash
git add -A
```

- [ ] **Step 3: Rebuild lockfile + verify PR #11's unit tests pass**

Run:
```bash
pnpm install
pnpm test
```
Expected: all unit tests pass, including `tests/auth/auto-login.test.ts` and `lib/supabase/proxy-session.test.ts` (PR #11 reported ~288 passing). If any fail due to the merge, fix per the failure (do not delete tests).

- [ ] **Step 4: Complete the merge commit**

If the merge paused for conflicts:
```bash
git commit --no-edit
```
Expected: merge commit created. (A clean merge in Step 1 already committed.)

---

## Task 4: Migrate merged files to typed env (Slice C.1 cont.)

**Files:**
- Modify: `lib/supabase/admin.ts`, `app/auto-login/route.ts`, `lib/supabase/proxy-session.ts`

- [ ] **Step 1: Migrate `lib/supabase/admin.ts`**

Use typed env and fail safe when the secret key is absent (the route's try/catch turns the throw into a 404):

```ts
import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";

/**
 * Supabase service-role ("admin") client. Bypasses RLS — server-only.
 * "admin" = service_role key, NOT the app's `admin` profile role.
 * Used by the auto-login backdoor to look up users and mint magiclink sessions.
 *
 * Plain `@supabase/supabase-js` (NOT `@supabase/ssr`): no cookies are involved.
 */
export function createAdminClient() {
  const secretKey = env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is required for the admin client");
  }
  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
```

- [ ] **Step 2: Migrate `app/auto-login/route.ts` token read**

Add `import { env } from "@/lib/env";` to the import block, and change the disabled-check line inside `GET`:

```ts
  // 1. Disabled unless a token is configured. Don't reveal the route exists.
  const expected = env.AUTO_LOGIN_TOKEN;
  if (!expected) return notFound();
```
(leave every other line of the route unchanged)

- [ ] **Step 3: Migrate `lib/supabase/proxy-session.ts`**

Add `import { env } from "@/lib/env";` at the top, and change the `createServerClient` arguments:

```ts
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
```
(keep `PUBLIC_PATHS` with `"/auto-login"` and everything else unchanged)

- [ ] **Step 4: Verify types + unit tests**

Run:
```bash
pnpm typecheck
pnpm test
```
Expected: clean types; all unit tests pass (auto-login + proxy-session tests use mocks for env-dependent values — if any test stubs `process.env`, confirm it still passes; fix the stub to set the same vars `lib/env.ts` reads if needed).

- [ ] **Step 5: Commit**

```bash
git add lib/supabase/admin.ts app/auto-login/route.ts lib/supabase/proxy-session.ts
git commit -m "refactor(env): migrate auto-login + proxy-session to typed env"
```

---

## Task 5: Merge PR #4 — Playwright infra (Slice C.2)

**Files:** brings in `playwright.config.ts`, `docker-compose.e2e.yml`, `e2e/auth-redirect.spec.ts`, `docs/e2e-testing.md`, and edits `package.json`, `.gitignore`, `README.md`. **PR #4's `.claude/**` changes are intentionally dropped** (Takumi owns `.claude`).

- [ ] **Step 1: Merge the PR #4 branch**

Run:
```bash
git merge --no-ff origin/claude/affectionate-euler-GeCkp -m "merge: Playwright E2E infrastructure (PR #4)"
```
Expected: stops with conflicts. PR #4 branched from `b2fd341` (2 commits behind `main`), so expect **minor** conflicts in `package.json`, `.gitignore`, `README.md` (and possibly `.claude/*`). `playwright.config.ts`, `docker-compose.e2e.yml`, `e2e/*`, `docs/e2e-testing.md` are new files (no conflict).

- [ ] **Step 2: Resolve `package.json` (union of scripts + deps)**

Keep all scripts from both sides. The `"scripts"` block must contain (order not critical): the existing scripts, the Task 2 additions (`typecheck`, `postinstall`), **and** PR #4's `test:e2e`, `test:e2e:ui`, `test:e2e:docker`:

```json
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:docker": "docker compose -f docker-compose.e2e.yml run --rm e2e",
```
And `devDependencies` must contain `@playwright/test` **plus** the Task 1/2 additions (`@t3-oss/env-nextjs`, `zod` in deps; `lefthook` in devDeps):
```json
    "@playwright/test": "^1.60.0",
```

- [ ] **Step 3: Resolve `.gitignore`**

Keep the current `# claude` rule (`/.claude/*`) **as-is** — do NOT adopt PR #4's `!/.claude/settings.json` / `!/.claude/hooks/` un-ignores (Takumi config stays ignored). DO add PR #4's `# playwright` block:

```gitignore
# playwright
/test-results/
/playwright-report/
/blob-report/
/playwright/.cache/
/playwright/.auth/
```
(Note: `/playwright/.auth/` added — the authed storageState lives there; Task 7.)

- [ ] **Step 4: Drop PR #4's `.claude/**` changes**

If the merge staged any `.claude/` files from PR #4, revert them to the current branch's versions:
```bash
git checkout --ours -- .claude 2>/dev/null || true
git rm -r --cached --ignore-unmatch .claude/hooks/session-start.sh
git checkout HEAD -- .claude/settings.json 2>/dev/null || true
```
Goal: `.claude/settings.json` stays the Takumi version; no `session-start.sh` is committed. Playwright browser install is documented manually (Task 9).

- [ ] **Step 5: Resolve `README.md`**

Keep both sides — retain the current README content and add PR #4's E2E testing section/links.

- [ ] **Step 6: Stage, install, finish merge**

```bash
git add -A
pnpm install
git commit --no-edit
```
Expected: merge commit created; lockfile now includes `@playwright/test`.

- [ ] **Step 7: Install the Chromium browser**

```bash
pnpm exec playwright install chromium
```
Expected: Chromium downloaded for Playwright. (No commit — this is local tooling state.)

---

## Task 6: Reconcile `playwright.config.ts` with typed env + add auth projects (Slice C.3)

**Files:**
- Modify: `playwright.config.ts`

**Why:** (1) typed env now requires `NEXT_PUBLIC_SUPABASE_URL` to be a valid URL — PR #4's dummy `http://localhost:54321` passes, but the build also reads other vars; pass them through from the real environment when present so the authenticated test can hit a real local Supabase. (2) Add a conditional `setup` + `chromium-auth` project pair, enabled only when `AUTO_LOGIN_TOKEN` is set, so CI without Supabase runs only the smoke test.

- [ ] **Step 1: Replace `playwright.config.ts` with the reconciled version**

```ts
import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 *
 * Tests live in `e2e/`. Playwright boots the Next.js app via the `webServer`
 * block, so `pnpm test:e2e` is one command.
 *
 * Env: the app's proxy refreshes a Supabase session on every request, and typed
 * env validation (lib/env.ts) runs at build. We PASS THROUGH the real env when
 * present (so authenticated tests reach a local Supabase) and fall back to
 * schema-valid dummies otherwise (smoke test contacts no backend).
 *
 * Authenticated projects (`setup` + `chromium-auth`) only exist when
 * AUTO_LOGIN_TOKEN is set — they need local Supabase + the dev seed. Without it,
 * only the unauthenticated smoke test runs (keeps CI green).
 */
const PORT = 3000;
const baseURL = `http://localhost:${PORT}`;
const authEnabled = !!process.env.AUTO_LOGIN_TOKEN;

const authProjects = authEnabled
  ? [
      { name: "setup", testMatch: /.*\.setup\.ts/ },
      {
        name: "chromium-auth",
        testMatch: /.*\.authed\.spec\.ts/,
        dependencies: ["setup"],
        use: {
          ...devices["Desktop Chrome"],
          storageState: "playwright/.auth/user.json",
        },
      },
    ]
  : [];

export default defineConfig({
  testDir: "./e2e",
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["github"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      // The default project never runs the setup file or the authed specs.
      testIgnore: [/.*\.setup\.ts/, /.*\.authed\.spec\.ts/],
      use: { ...devices["Desktop Chrome"] },
    },
    ...authProjects,
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      // Pass through real env when present; schema-valid dummies otherwise.
      NEXT_PUBLIC_SUPABASE_URL:
        process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://localhost:54321",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "e2e-placeholder-anon-key",
      NEXT_PUBLIC_EVENT_DATETIME:
        process.env.NEXT_PUBLIC_EVENT_DATETIME ?? "2025-12-26T18:30:00+07:00",
      // Server-only; needed only for authenticated runs (empty = disabled/safe).
      SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY ?? "",
      AUTO_LOGIN_TOKEN: process.env.AUTO_LOGIN_TOKEN ?? "",
    },
  },
});
```

- [ ] **Step 2: Verify config parses (smoke run, no Supabase)**

Run:
```bash
pnpm exec playwright test --list
```
Expected: lists tests for the `chromium` project only (since `AUTO_LOGIN_TOKEN` is unset), including `e2e/auth-redirect.spec.ts`. No `setup`/`chromium-auth` projects shown.

- [ ] **Step 3: Commit**

```bash
git add playwright.config.ts
git commit -m "test(e2e): reconcile playwright config with typed env + conditional auth projects"
```

---

## Task 7: Authenticated E2E — setup + protected-page access test (Slice C.3 cont.)

> **Base note:** on `main`, `/sun-kudos` is a `ComingSoon` stub, so the authenticated test targets the real protected homepage `/` (and confirms `/sun-kudos` is reachable when logged in). The point of this task is proving the `/auto-login` backdoor mints a session that the proxy honors on protected routes.

**Files:**
- Create: `e2e/auth.setup.ts`
- Create: `e2e/authenticated-access.authed.spec.ts`

**Prerequisite for running (not for committing):** local Supabase up with the dev seed, and the backdoor enabled:
```bash
pnpm db:start
SUPABASE_EXTRA_SEEDS=./seeds/dev/seed.sql pnpm db:reset   # seeds admin-test/member-test/member01..08
# then export the real values for the test run:
export AUTO_LOGIN_TOKEN=dev-e2e-secret
export SUPABASE_SECRET_KEY=$(pnpm -s db:status | awk '/service_role key/ {print $NF}')
export NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
export NEXT_PUBLIC_SUPABASE_ANON_KEY=$(pnpm -s db:status | awk '/anon key/ {print $NF}')
```

- [ ] **Step 1: Create `e2e/auth.setup.ts`**

```ts
import { test as setup, expect } from "@playwright/test";

const AUTH_FILE = "playwright/.auth/user.json";

/**
 * One-time login for authenticated E2E. Hits the token-gated /auto-login
 * backdoor (PR #11) to mint a REAL Supabase session for a seeded member, then
 * saves storage state for the `chromium-auth` project to reuse.
 *
 * This file only runs when AUTO_LOGIN_TOKEN is set (the config only includes the
 * `setup` project then), so the env reads below are always defined at runtime.
 */
setup("authenticate via /auto-login backdoor", async ({ page }) => {
  const token = process.env.AUTO_LOGIN_TOKEN as string;
  const email = "member-test@sun-asterisk.com";

  await page.goto(`/auto-login?email=${encodeURIComponent(email)}&token=${token}`);

  // The backdoor 307-redirects to "/" with a real session cookie; the proxy then
  // lets the authed user through (no bounce to /login).
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/login$/);

  await page.context().storageState({ path: AUTH_FILE });
});
```

- [ ] **Step 2: Create `e2e/authenticated-access.authed.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

/**
 * Authenticated E2E. Runs in the `chromium-auth` project, which reuses the
 * storage state saved by e2e/auth.setup.ts — so the page starts already logged
 * in as the seeded member-test user.
 *
 * Verifies a logged-in user reaches protected pages (no /login bounce),
 * exercising the full authed stack: proxy session check → SSR render. On `main`,
 * `/sun-kudos` is a ComingSoon stub, so the content assertion targets the real
 * homepage `/`; `/sun-kudos` is only checked for "not redirected to /login".
 */
test("a logged-in member sees the protected homepage", async ({ page }) => {
  await page.goto("/");

  // Not bounced to /login — the session from auth.setup.ts is honored.
  await expect(page).toHaveURL(/\/$/);
  await expect(page).not.toHaveURL(/\/login$/);

  // The authenticated chrome (header) and page content render.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
});

test("a logged-in member can reach /sun-kudos (not bounced to /login)", async ({
  page,
}) => {
  await page.goto("/sun-kudos");

  await expect(page).toHaveURL(/\/sun-kudos$/);
  await expect(page).not.toHaveURL(/\/login$/);
});
```

- [ ] **Step 3: Run the authenticated suite (with Supabase up + env from the prerequisite)**

Run:
```bash
pnpm exec playwright test --project=setup --project=chromium-auth
```
Expected: `setup` logs in and writes `playwright/.auth/user.json`; `chromium-auth` loads `/` and `/sun-kudos` and the assertions pass. If `/auto-login` returns 404, recheck `AUTO_LOGIN_TOKEN` is exported and the dev seed ran (the `member-test` user must exist).

> If a running local Supabase is not available in this environment, create + commit the two files and verify only that `AUTO_LOGIN_TOKEN=x pnpm exec playwright test --list` shows the `setup` and `chromium-auth` projects. Note in the report that the live authed run was deferred (documented prerequisite).

- [ ] **Step 4: Commit**

```bash
git add e2e/auth.setup.ts e2e/authenticated-access.authed.spec.ts
git commit -m "test(e2e): authenticated protected-page access via auto-login backdoor"
```

---

## Task 8: Fix the stale smoke test (Slice C.3 cont.)

**Files:**
- Modify: `e2e/auth-redirect.spec.ts`

**Why:** PR #4's smoke test assumes `/` is public, but the current branch made the app login-required (`proxy.ts` matches `/`, `PUBLIC_PATHS` excludes it) — a guest at `/` is redirected to `/login`. Update the test to assert current behavior.

- [ ] **Step 1: Replace `e2e/auth-redirect.spec.ts`**

```ts
import { test, expect } from "@playwright/test";

/**
 * Smoke E2E for the proxy auth gate (proxy.ts → lib/supabase/proxy-session.ts).
 *
 * Exercises the full stack — server boot, proxy session refresh, routing — end
 * to end, without a real Supabase backend. The proxy is allowlist-based: only
 * PUBLIC_PATHS (/login, /auth/callback, /auto-login) are reachable by guests;
 * everything else (including "/") 307-redirects to /login.
 */

test("redirects an unauthenticated visitor from / to /login", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/login$/);
  // The login screen renders its Google OAuth button.
  await expect(page.getByRole("button").first()).toBeVisible();
});

test("redirects an unauthenticated visitor from a protected route to /login", async ({
  page,
}) => {
  await page.goto("/sun-kudos");

  await expect(page).toHaveURL(/\/login$/);
});
```

- [ ] **Step 2: Run the smoke suite (no Supabase needed)**

Run:
```bash
unset AUTO_LOGIN_TOKEN SUPABASE_SECRET_KEY NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY
pnpm test:e2e
```
Expected: the `chromium` project runs both smoke cases and passes; no auth projects run (token unset). The app builds with the dummy env from the webServer block.

- [ ] **Step 3: Commit**

```bash
git add e2e/auth-redirect.spec.ts
git commit -m "test(e2e): fix smoke test to match login-required homepage behavior"
```

---

## Task 9: Docs, final verification, and PR (Slice C.3 cont.)

**Files:**
- Modify: `docs/e2e-testing.md`

- [ ] **Step 1: Update `docs/e2e-testing.md` authenticated section**

Replace the "future authenticated tests" / Approach-A placeholder wording with the now-implemented setup. Add a section documenting:
- The `setup` + `chromium-auth` projects gated on `AUTO_LOGIN_TOKEN`.
- The local prerequisite commands (from Task 7's prerequisite block: `pnpm db:start`, the `SUPABASE_EXTRA_SEEDS=... pnpm db:reset` seed, exporting `AUTO_LOGIN_TOKEN` + Supabase keys).
- That Chromium is installed via `pnpm exec playwright install chromium` (PR #4's `.claude` session hook was intentionally not adopted; Takumi owns `.claude`).
- That CI runs only the unauthenticated smoke test (no Supabase), and this is by design.

Keep the existing native/Docker run instructions.

- [ ] **Step 2: Full verification sweep**

Run:
```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e        # smoke only (no token exported)
pnpm build
```
Expected: every command green. Then optionally, with Supabase up + env exported (Task 7 prerequisite):
```bash
pnpm test:e2e        # now also runs setup + chromium-auth
```
Expected: authenticated test green too.

- [ ] **Step 3: Commit docs**

```bash
git add docs/e2e-testing.md
git commit -m "docs(e2e): document authenticated tests via auto-login backdoor"
```

- [ ] **Step 4: Push and open the PR**

```bash
git push -u origin feat/template-adoption
gh pr create --base main --title "feat: adopt typed env, lefthook, and Playwright E2E from template" --body "Adopts three safe-additive template practices into ssa.

## Slices
- **Typed env** (\`lib/env.ts\`, @t3-oss/env-nextjs + zod) — fail-fast validation, migrated call sites.
- **lefthook** pre-commit — eslint --fix + tsc --noEmit (keeps ESLint, not Biome).
- **Playwright E2E** — integrates PR #11 (auto-login backdoor) + PR #4 (Playwright infra); adds an authenticated protected-page-access test; fixes the stale smoke test to the login-required homepage behavior.

Supersedes PRs #4 and #11 (their commits are merged in here).

Spec: docs/superpowers/specs/2026-06-10-template-adoption-design.md
Plan: docs/superpowers/plans/2026-06-10-template-adoption.md"
```
Expected: PR URL printed. Mention in the PR that #4 and #11 can be closed in favor of this.

---

## Self-Review

**Spec coverage:** worktree/sequencing → Pre-flight; A typed env → Task 1 (+ Task 4 for merged files); B lefthook → Task 2; C merge PR #11 → Task 3, merge PR #4 → Task 5, playwright/typed-env reconcile → Task 6, authed tests → Task 7, stale smoke test fix → Task 8, docs + DoD → Task 9. The spec's "migrate admin.ts/auto-login (from PR #11)" is covered in Task 4 (after the merge), with proxy-session.ts deferred from Task 1 to avoid a merge conflict — documented in both places. ✓

**Placeholder scan:** no TBD/TODO; every code/config step shows full content; every command lists expected output. ✓

**Type/name consistency:** `env` export used consistently (`@/lib/env`); `createAdminClient` signature unchanged for callers; storageState path `playwright/.auth/user.json` matches between `auth.setup.ts`, the `chromium-auth` project, and the `.gitignore` entry; authed spec named `*.authed.spec.ts` matches the project `testMatch`/`testIgnore`. ✓

**Open items (carried from spec):** PR base is `main` (worktree is based off `main`); optional `pre-push` test job not included (out of scope). The kudos board's latest UI (uncommitted on the feature branch) is intentionally not part of this branch — the authed E2E targets the protected homepage instead of the `/sun-kudos` stub.
