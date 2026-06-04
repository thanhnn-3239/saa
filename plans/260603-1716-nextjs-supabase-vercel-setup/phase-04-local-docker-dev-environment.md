# Phase 04 — Local Docker Dev Environment

**Priority:** High · **Status:** pending · **Depends on:** 02 (parallel with 03)

Containerize the **Next.js dev server** with Docker Compose. The Supabase backend stays under the
**Supabase CLI** (its own Docker stack); the app container reaches it via `host.docker.internal`.
Two commands start dev: `supabase start` (host) + `docker compose up` (app).

## Key Insights (verified)
- User chose: **CLI backend + app container** (not a single self-hosted compose). Don't reinvent Supabase's stack.
- On **Linux**, containers reach host ports via `host.docker.internal` only if you add
  `extra_hosts: ["host.docker.internal:host-gateway"]`. Supabase API is on host port `54321`.
- HMR in Docker needs polling: set `WATCHPACK_POLLING=true` (and `CHOKIDAR_USEPOLLING=true`).
  Linux performance is acceptable (the Mac/Windows HMR warning is less severe here).
- Mount source as a bind volume but keep `node_modules` and `.next` as **named volumes** (anonymous
  volumes) so the host OS / arch mismatch doesn't clobber container-installed deps.
- The browser loads `NEXT_PUBLIC_SUPABASE_URL` → that must be reachable from the **browser** (host),
  i.e. `http://127.0.0.1:54321`. Server-side fetches inside the container also use `127.0.0.1:54321`
  via `network_mode`/extra_hosts. Simplest: keep the public URL `http://127.0.0.1:54321` for the
  browser, and rely on `host.docker.internal` only for server-internal calls if needed. See step 3 note.

## Outcome (implemented + verified 2026-06-04)
- **Base image:** `node:24-alpine` + `libc6-compat` (lighter than slim; sharp loads under musl).
- **Networking:** `network_mode: host` (Linux) — verified container reaches Supabase at `127.0.0.1:54321` (HTTP 200) and serves `:3000`.
- **Trimmed local Supabase** (set in `supabase/config.toml`): `db, kong/api(rest), auth, realtime, storage, studio` (+pg-meta).
  Disabled: `edge_runtime, analytics, vector, inbucket, db.pooler`. Studio kept for DB GUI/review.
  Re-enable any by flipping `enabled = true` in `config.toml` + `supabase stop && supabase start`.
- **Two-command dev flow:** `pnpm db:start` (6 Supabase containers via CLI) → `pnpm dev:docker` (app container).
- Note: trimming removed Studio GUI (use `psql` or re-enable) and imgproxy (re-enable if Storage image transforms are needed).

## Related Code Files
**Create:** `Dockerfile.dev`, `docker-compose.yml`, `.dockerignore`
**Modify:** `package.json` (add `dev:docker` convenience script), `README.md`

## Implementation Steps
1. **`.dockerignore`:**
   ```
   node_modules
   .next
   .git
   npm-debug.log
   .env.local
   Dockerfile*
   docker-compose*
   ```
2. **`Dockerfile.dev`** (dev server, Node 24, pnpm via corepack):
   ```dockerfile
   FROM node:24-slim
   RUN corepack enable
   WORKDIR /app
   COPY package.json pnpm-lock.yaml ./
   RUN pnpm install --frozen-lockfile
   COPY . .
   EXPOSE 3000
   ENV WATCHPACK_POLLING=true
   ENV CHOKIDAR_USEPOLLING=true
   CMD ["pnpm", "dev"]
   ```
3. **`docker-compose.yml`:**
   ```yaml
   services:
     web:
       build:
         context: .
         dockerfile: Dockerfile.dev
       ports:
         - "3000:3000"
       volumes:
         - .:/app
         - /app/node_modules
         - /app/.next
       env_file:
         - .env.local
       extra_hosts:
         - "host.docker.internal:host-gateway"
       environment:
         WATCHPACK_POLLING: "true"
   ```
   **Note on the Supabase URL:** `NEXT_PUBLIC_SUPABASE_URL` is consumed by the **browser** (running
   on the host), so `http://127.0.0.1:54321` is correct there. Server Components fetch from inside
   the container — `127.0.0.1` there points at the container, not the host. Two clean options:
   - (a) Keep `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321` for the browser AND run the web
     container with `network_mode: "host"` (Linux only) so the container's `127.0.0.1` == host. Simplest on Linux.
   - (b) Or set a separate server-side base URL `SUPABASE_INTERNAL_URL=http://host.docker.internal:54321`
     and have `lib/supabase/server.ts` prefer it when set. Slightly more code.
   **Recommendation (Linux):** option (a) `network_mode: "host"` — drop the `ports` mapping when using it.
4. **Convenience script** in `package.json`:
   ```json
   "dev:docker": "docker compose up --build"
   ```
   Document the two-step flow: `pnpm db:start` then `pnpm dev:docker`.
5. **Verify:** `supabase start` → fill `.env.local` from `supabase status` → `docker compose up` →
   open `http://localhost:3000/notes` → seeded rows render → edit a file → HMR reflects the change.

## Todo
- [ ] `.dockerignore`, `Dockerfile.dev`, `docker-compose.yml`
- [ ] Decide networking: `network_mode: host` (Linux, recommended) vs `host.docker.internal`
- [ ] `dev:docker` script + README two-step flow
- [ ] Full smoke: containerized app reads local Supabase, HMR works

## Success Criteria
- `docker compose up` serves the app on `:3000`, reading from the local Supabase stack.
- Source edits hot-reload inside the container.

## Risks
- **`127.0.0.1` confusion** between container and host is the #1 failure — resolve via step-3 networking choice.
- **Slow installs** rebuilding image on every dep change — acceptable for dev; pnpm cache mounts optional later.
- **`.env.local` not loaded:** confirm `env_file` path and that it's filled from `supabase status`.
