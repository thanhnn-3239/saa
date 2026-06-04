# Research Report: Supabase + Next.js 16 App Router + Vercel — Foundation Setup

**Date:** 2026-06-03 | **Researcher:** researcher agent
**Packages confirmed:** `@supabase/ssr@0.10.3`, `@supabase/supabase-js@2.107.0`
**Project:** `agentic-coding-live-demo` (pg major 17, API port 54321, DB port 54322)

---

## Sources Consulted

- [Supabase SSR Client Docs](https://supabase.com/docs/guides/auth/server-side/creating-a-client) — official
- [Supabase Next.js SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs) — official
- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs) — official
- [Migrating from Auth Helpers to SSR](https://supabase.com/docs/guides/auth/server-side/migrating-to-ssr-from-auth-helpers) — official
- [Supabase API Keys](https://supabase.com/docs/guides/api/api-keys) — official
- [Supabase CLI Local Dev](https://supabase.com/docs/guides/local-development/cli/getting-started) — official
- [Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) — official
- [Vercel+Supabase Integration](https://vercel.com/marketplace/supabase) — official
- [Supabase+Vercel Blog Post](https://supabase.com/blog/using-supabase-with-vercel) — official
- [GitHub Discussion: New API Keys](https://github.com/orgs/supabase/discussions/40300) — community/maintainer
- [Vercel Next.js+Supabase Template](https://vercel.com/templates/next.js/supabase) — official
- [Supabase Docker Networking Discussion](https://github.com/orgs/supabase/discussions/36296) — community

---

## 1. `@supabase/ssr` — Client Helpers + Middleware

### Deprecation Confirmation

**Yes — `@supabase/auth-helpers-nextjs` is officially superseded by `@supabase/ssr`.** The migration doc instructs uninstalling `@supabase/auth-helpers-nextjs` and replacing with `@supabase/ssr`. The auth-helpers packages are no longer actively developed; `@supabase/ssr` is the current standard for all frameworks.

### Install

```bash
pnpm add @supabase/supabase-js @supabase/ssr
```

### File: `lib/supabase/client.ts` (Client Component helper)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
```

`createBrowserClient` uses a singleton internally — calling `createClient()` multiple times is safe; only one instance is created per browser context.

### File: `lib/supabase/server.ts` (Server Component / Server Action / Route Handler helper)

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Components cannot set cookies — middleware handles this
          }
        },
      },
    }
  );
}
```

> **Note:** `cookies()` is async in Next.js 15+. The `try/catch` in `setAll` is intentional — Server Components throw when attempting to write cookies. Middleware (below) owns the actual cookie write.

### File: `middleware.ts` (Session refresh — REQUIRED)

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Write to both request (for Server Components) and response (for browser)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // CRITICAL: use getClaims() not getSession() in server code
  // getSession() is unauthenticated (reads cookie without JWT verification)
  // getClaims() validates JWT against published public keys — secure
  await supabase.auth.getClaims();

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

**Why middleware is mandatory:** Next.js Server Components cannot write cookies. The middleware runs before every request, refreshes the auth token, and propagates the refreshed cookie to both the `request` (for Server Components to read) and the `response` (sent back to browser).

---

## 2. Environment Variables — Current Names

### The Rename Situation (Important)

Supabase introduced new API key formats (`sb_publishable_xxx`, `sb_secret_xxx`) in 2025, replacing legacy JWT-based `anon` and `service_role` keys. New projects created after the rollout **may not have** legacy keys at all. Legacy keys remain valid until **end of 2026**.

| Env Var | Where | Value |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + Server | Your project URL (unchanged) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client + Server | Replaces `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `SUPABASE_SECRET_KEY` | Server only (never expose) | Replaces `SUPABASE_SERVICE_ROLE_KEY` |

**Official quickstart (`supabase.com/docs/guides/getting-started/quickstarts/nextjs`) now uses `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.** The Vercel marketplace integration (as of mid-2025) still injects `NEXT_PUBLIC_SUPABASE_ANON_KEY` — there is an open GitHub issue ([#38984](https://github.com/supabase/supabase/issues/38984)) to add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`. Until the integration is updated, rename after import or add manually.

### `.env.local` (local dev)

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<anon key from `supabase status`>
SUPABASE_SECRET_KEY=<service_role key from `supabase status`>
```

### `.env.production` / Vercel env vars (cloud)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SECRET_KEY=sb_secret_xxx   # Vercel: mark as "Server" scope only
```

**Rule:** `SUPABASE_SECRET_KEY` must never have `NEXT_PUBLIC_` prefix. In Vercel dashboard: set it to "Server" environment only.

---

## 3. Supabase CLI Local Dev Workflow

### Start the local stack

```bash
supabase start
```

First run: pulls Docker images (~4 GB, one-time). Subsequent runs are fast.

### `supabase status` output (your project, port 54321/54322)

```
API URL:         http://127.0.0.1:54321
GraphQL URL:     http://127.0.0.1:54321/graphql/v1
DB URL:          postgresql://postgres:postgres@127.0.0.1:54322/postgres
Studio URL:      http://127.0.0.1:54323
Inbucket URL:    http://127.0.0.1:54324
Publishable key: sb_publishable_eyJ...   (or anon key for older CLI)
Secret key:      sb_secret_eyJ...        (or service_role key)
```

Run `supabase status` at any time to retrieve keys — no need to hard-code them in this guide.

### Port map for this project

| Service | URL |
|---|---|
| PostgREST API | `http://127.0.0.1:54321` |
| PostgreSQL | `127.0.0.1:54322` |
| Supabase Studio | `http://127.0.0.1:54323` |
| Inbucket (email) | `http://127.0.0.1:54324` |
| Analytics | `54327` |
| DB Pooler | `54329` |

### Next.js reaching local Supabase — networking

**Case A: Next.js running on host (not in Docker)**
Use `http://127.0.0.1:54321` directly — no issue.

**Case B: Next.js running in a Docker container** (separate from Supabase CLI stack)
The Supabase CLI manages its own Docker network internally. Your Next.js container cannot reach `127.0.0.1:54321` (that's the host loopback, not visible inside a container).

Two options:

**Option 1 — `host.docker.internal` (simplest, cross-platform on macOS/Windows; Linux requires extra_hosts)**
```yaml
# docker-compose.yml for Next.js container
services:
  nextjs:
    build: .
    extra_hosts:
      - "host.docker.internal:host-gateway"   # Linux only; macOS/Windows automatic
    environment:
      NEXT_PUBLIC_SUPABASE_URL: http://host.docker.internal:54321
```

**Option 2 — Use `network_mode: host` for the Next.js container (Linux only)**
```yaml
services:
  nextjs:
    build: .
    network_mode: host
```
Then `http://127.0.0.1:54321` works as expected.

**Option 3 — Shared Docker network + Supabase self-hosted compose** (most complex; only if running Supabase via `docker compose` directly, not via CLI). The Supabase CLI manages its own internal network named `supabase_${project_id}_default`. You can attach your Next.js container to it and address Kong as `supabase_kong_${project_id}:8000`. Avoid this path unless you need it.

**Recommendation for this project:** Since the repo doesn't have a `docker-compose.yml` yet and is early-stage, run Next.js on the **host** (`pnpm dev`) alongside `supabase start`. Only containerize Next.js if CI/CD requires it. If containerizing, use `host.docker.internal` + `extra_hosts: ["host.docker.internal:host-gateway"]` on Linux.

---

## 4. Migrations Workflow

### Local cycle

```bash
# Create a new migration
supabase migration new <descriptive_name>
# → creates supabase/migrations/<timestamp>_<descriptive_name>.sql

# Edit the generated SQL file, then apply to local DB
supabase db reset
# → drops and recreates local DB, applies all migrations in order, runs seed.sql
```

**Your seed config** (`config.toml` lines 62–63):
```toml
sql_paths = ["./seeds/common/*.sql", "env(SUPABASE_EXTRA_SEEDS)"]
```
Seeds in `supabase/seeds/common/*.sql` run automatically on `db reset`. Set `SUPABASE_EXTRA_SEEDS` env var to point to additional seed files (e.g., for dev-specific fixtures).

### Link to Supabase Cloud project

```bash
supabase link --project-ref <project-ref>
# project-ref = the string in your Supabase project URL: https://supabase.com/dashboard/project/<project-ref>
```

This stores credentials in `~/.supabase/` (not committed to git). Required once per developer machine.

### Push migrations to production

```bash
supabase db push
# Applies any unapplied migrations from supabase/migrations/ to the linked remote project
```

**Never edit the remote schema directly** — `db push` compares migration history and will error on drift.

### CI/CD (Vercel/GitHub Actions)

Recommended: run `supabase db push` in a GitHub Actions workflow triggered on merge to `main`, using `SUPABASE_ACCESS_TOKEN` and `SUPABASE_PROJECT_ID` secrets. Do not run `db push` from Vercel build hooks — migrations are data-layer operations separate from app deploys.

```yaml
# .github/workflows/migrate.yml (minimal)
- run: npx supabase db push
  env:
    SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
    SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

---

## 5. Vercel Deployment

### Vercel + Supabase Integration (Marketplace)

**Yes, it exists:** [vercel.com/marketplace/supabase](https://vercel.com/marketplace/supabase)

What it does:
- Links your Supabase project to a Vercel project
- Auto-injects 13 env vars (including DB connection strings, anon key, service role key) to all environments
- Auto-updates Supabase Auth redirect URIs when Vercel preview URLs are created

**Env vars injected by integration (as of 2025):**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     ← still uses old name
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
SUPABASE_URL
SUPABASE_JWT_SECRET
POSTGRES_URL
POSTGRES_PRISMA_URL
POSTGRES_URL_NON_POOLING
POSTGRES_USER / HOST / PASSWORD / DATABASE
```

**Gap:** The integration does NOT inject `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Since the official quickstart now uses `PUBLISHABLE_KEY`, you need to either:
1. Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` manually in Vercel dashboard (pointing to same value as `NEXT_PUBLIC_SUPABASE_ANON_KEY` until your project migrates to new keys)
2. Or keep code using `NEXT_PUBLIC_SUPABASE_ANON_KEY` (still valid until 2026)

**Pragmatic recommendation for new project:** Use `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in code (forward-compatible). Add it manually in Vercel for now. When the integration is updated, remap it.

### Preview vs Production env vars

In Vercel dashboard: Settings → Environment Variables
- Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to **Production + Preview + Development** (same Cloud project is fine for a small project; use Supabase Branching for separate preview DBs)
- Set `SUPABASE_SECRET_KEY` to **Production + Preview** only, **Server** scope

For Preview isolation: Supabase Branching creates a separate DB per branch, integrates with GitHub/Vercel. Opt-in feature; not needed for foundation.

### `vercel.ts` vs `vercel.json`

The official Vercel docs (2025) recommend `vercel.ts` (TypeScript config) over `vercel.json` for type safety. For a **standard Next.js App Router project with no custom routes or rewrites**, neither file is required. Next.js is auto-detected.

Add `vercel.ts` only if you need:
- Custom headers/redirects/rewrites
- Build command overrides
- Multi-region edge config

For this project at foundation stage: **skip `vercel.ts` entirely**.

---

## 6. Gotchas — Containerized Next.js + Supabase CLI

| Gotcha | Detail |
|---|---|
| `127.0.0.1` unreachable from container | Use `host.docker.internal` or `network_mode: host` (Linux). |
| Auth callback URLs | `config.toml` has `site_url = http://localhost:3000`. If Next.js container uses a different hostname inside Docker, update `additional_redirect_urls`. |
| Cookie domain mismatch | If Next.js and Supabase API have different effective origins in dev, cookies won't be sent. Keep both on `localhost`/`127.0.0.1` with same port scheme. |
| `supabase status` key format | CLI v2 (latest) outputs `sb_publishable_xxx` / `sb_secret_xxx` for new projects. Older CLI versions output raw JWT strings. Update CLI if you see JWT strings. |
| `getClaims()` vs `getSession()` | **Always use `supabase.auth.getClaims()` on server** — `getSession()` does not validate JWT signatures and trusts whatever is in the cookie (insecure). |
| `cookies()` async in Next.js 15+ | The server client helper must `await cookies()` (shown in snippet above). Forgetting this causes build errors. This project runs Next.js 16 → same requirement. |
| Seed env var `SUPABASE_EXTRA_SEEDS` | `config.toml` references `env(SUPABASE_EXTRA_SEEDS)` — if the env var is not set, `supabase db reset` may warn or skip. Set it to an empty string or a valid path. |
| `supabase start` requires Docker running | Docker Desktop or Docker Engine must be active. CLI does not auto-start Docker. |

---

## Recommended File Structure

```
lib/
  supabase/
    client.ts      ← createBrowserClient wrapper (client components)
    server.ts      ← createServerClient wrapper (server components, actions, route handlers)
middleware.ts      ← session refresh (top-level, beside app/)
.env.local         ← local keys (gitignored)
.env.example       ← template with placeholders (committed)
supabase/
  config.toml      ← already exists
  migrations/      ← SQL files (committed)
  seeds/
    common/        ← already exists
```

---

## Unresolved Questions

1. **Vercel integration PUBLISHABLE_KEY gap:** When will the Vercel integration be updated to inject `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`? Track [issue #38984](https://github.com/supabase/supabase/issues/38984). Until then, manual addition required.
2. **`SUPABASE_EXTRA_SEEDS` in config.toml:** What additional seeds are expected? The env var is referenced but no value set — will this cause `db reset` warnings in CI?
3. **Next.js 16 specific breaking changes for Supabase:** Research focused on Next.js 15+ patterns. Next.js 16 (currently in use) may have further async API changes. The `await cookies()` pattern and middleware API appear unchanged from 15→16 based on available data, but the `node_modules/next/dist/docs/` directory (per AGENTS.md instruction) should be checked before writing any Next.js-specific code.
4. **Supabase Branching for preview environments:** Not covered — relevant when the project has a staging/preview DB per PR. Evaluate when preview parity becomes a requirement.
