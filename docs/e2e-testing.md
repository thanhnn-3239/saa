# End-to-End (E2E) testing — Playwright

This project has two test layers:

| Layer | Tool | Location | What it covers |
|---|---|---|---|
| Unit / component | Vitest + Testing Library | `app/`, `lib/`, `i18n/`, `messages/` | Pure logic, components in isolation (jsdom) |
| **End-to-end** | **Playwright** | **`e2e/`** | The real app in a real browser: routing, the proxy/auth redirect, SSR |

> The two suites never overlap — Vitest only picks up tests under
> `app/lib/i18n/messages`, Playwright only runs `e2e/`.

Playwright **starts the app itself** (see the `webServer` block in
`playwright.config.ts`): it runs `pnpm build && pnpm start` and waits for
`http://localhost:3000` before running tests. It injects **dummy Supabase env
vars**, so the current smoke test (`e2e/auth-redirect.spec.ts`, which checks
that an unauthenticated visitor is redirected to `/login`) needs **no backend
and no `.env.local`**.

---

## Option 1 — Docker (recommended, zero local setup) 🐳

Best for newcomers: no Node/browser/system-library setup. You only need Docker.

```bash
pnpm test:e2e:docker
# equivalent to:
# docker compose -f docker-compose.e2e.yml run --rm e2e
```

What it does: spins up the **official Playwright image**
(`mcr.microsoft.com/playwright`, Ubuntu, with Chromium + all OS libs
preinstalled), installs deps, and runs the suite. node_modules and `.next` live
in named volumes, so it builds its own Linux binaries and caches them between
runs.

Pass extra Playwright flags after the service name:

```bash
docker compose -f docker-compose.e2e.yml run --rm e2e \
  pnpm exec playwright test e2e/auth-redirect.spec.ts
```

> **Why a separate image and not `Dockerfile.dev`?** Playwright browsers are
> **not supported on Alpine** (our dev image is `node:24-alpine`). The official
> Playwright image is Ubuntu-based and ships matching browsers.
>
> **Version lock:** the image tag in `docker-compose.e2e.yml`
> (`v1.60.0-noble`) **must match** the `@playwright/test` version in
> `package.json`. Bump them together.

---

## Option 2 — Native (on your machine)

Prerequisites: Node ≥ 20.9 + pnpm (via `corepack enable`).

```bash
# 1. Install deps (once)
pnpm install

# 2. Install the Chromium browser Playwright drives (once)
pnpm exec playwright install chromium
#   On Linux, to also pull the OS libraries:
#   pnpm exec playwright install --with-deps chromium

# 3. Run the suite
pnpm test:e2e
```

> If you've opened a Claude Code session (web or local), the `SessionStart` hook
> at `.claude/hooks/session-start.sh` already ran steps 1–2 for you.

Useful variants:

```bash
pnpm test:e2e:ui                       # interactive UI mode (watch, time-travel)
pnpm exec playwright test --headed     # see the real browser
pnpm exec playwright test --debug      # step through with the inspector
pnpm exec playwright show-report       # open the last HTML report
```

---

## Reports & artifacts

- Console: the `list` reporter (a `github` reporter is added on CI).
- On failure, traces are written to `test-results/`; an HTML report (when
  generated) lands in `playwright-report/`.
- All of these are git-ignored (`test-results/`, `playwright-report/`,
  `blob-report/`, `playwright/.cache/`).

---

## Future: testing pages that require login

Login (Supabase Auth + Google OAuth, `@sun-asterisk.com` only) doesn't exist
yet. Real Google OAuth can't be automated, so when protected pages land we'll
use **Approach A — programmatic login + `storageState`** (already sketched in
`playwright.config.ts`):

1. A one-time **setup project** (`e2e/auth.setup.ts`) signs in a seeded test
   user against **local Supabase** using the `@supabase/ssr` browser client (so
   it writes the `sb-*-auth-token` cookie the proxy reads), then saves the
   session to `playwright/.auth/user.json`.
2. An **authenticated project** depends on `setup` and loads that
   `storageState`, so its tests start already logged in and skip the login UI.

Because those tests hit a real Supabase, they need the local stack running
(`pnpm db:start`) and a seeded user. Running them **in Docker** would also
require the container to reach the host's Supabase — add
`network_mode: host` (Linux) to the `e2e` service, or on macOS/Windows point
the Supabase URL at `host.docker.internal` and add the matching `extra_hosts`
(mirroring the note in `docker-compose.yml`).

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `browserType.launch: Executable doesn't exist` | Run `pnpm exec playwright install chromium` (native), or use Docker. |
| Browser/version mismatch in Docker | Make the image tag in `docker-compose.e2e.yml` match `@playwright/test` in `package.json`. |
| `Port 3000 is already in use` | Stop your dev server (`pnpm dev`) — Playwright starts its own, and locally it will reuse one that's already up. |
| Test-results owned by root after a Docker run | Expected (container runs as root); the dir is git-ignored. `sudo rm -rf test-results` to clean. |
