# Phase 01 — Foundation: admin client + PUBLIC_PATHS + env

**Priority:** Critical (enabling) · **Status:** done · **Depends on:** —

Small enabling phase: the service-role client the route needs, the proxy
correction that makes the route reachable, and the env var that gates it.

## Files

- **Create** `lib/supabase/admin.ts` — service-role Supabase client.
- **Modify** `lib/supabase/proxy-session.ts` — add `/auto-login` to `PUBLIC_PATHS`.
- **Modify** `.env.example` — add `AUTO_LOGIN_TOKEN` with DEV-ONLY warning.

## Steps

### 1. `lib/supabase/admin.ts` (service-role client)

Plain `@supabase/supabase-js` client (NOT `@supabase/ssr` — no cookies; this is for
admin operations only). Uses `SUPABASE_SECRET_KEY` (the `service_role` key) — its
**first real use in code** (see `docs/deployment.md` footnote ¹, update there).

```ts
import { createClient } from "@supabase/supabase-js";

/**
 * Supabase service-role ("admin") client. Bypasses RLS — server-only.
 * "admin" = service_role key, NOT the app's `admin` profile role.
 * Used by the auto-login backdoor to look up users and mint magiclink sessions.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
```

### 2. `proxy-session.ts` — make the route reachable

```ts
const PUBLIC_PATHS = new Set(["/login", "/auth/callback", "/auto-login"]);
```

Without this, `updateSession` redirects unauthenticated `/auto-login` requests to
`/login` before the handler runs. The route's own token gate is the security
boundary; making the path public just lets the handler execute.

### 3. `.env.example`

```
# ---- Auto-login backdoor for test/E2E (DEV ONLY) ----
# Set a random secret string to ENABLE GET /auto-login. Empty = disabled (404).
# Requests must carry this token (header x-auto-login-token or ?token=).
# WARNING: NEVER set this on production (Vercel) — anyone with the token could
# log in as any internal user. Reuses SUPABASE_SECRET_KEY for the service-role client.
AUTO_LOGIN_TOKEN=
```

## Todo

- [x] Create `lib/supabase/admin.ts`
- [x] Add `/auto-login` to `PUBLIC_PATHS`
- [x] Add `AUTO_LOGIN_TOKEN` block to `.env.example`
- [x] Update `docs/deployment.md` footnote ¹ (SUPABASE_SECRET_KEY now used)
- [x] `pnpm lint` clean, `pnpm build` compiles

## Success criteria

`createAdminClient()` importable; `/auto-login` no longer redirected by the proxy
(verify via phase-02 / proxy test in phase-04); `.env.example` documents the gate.
