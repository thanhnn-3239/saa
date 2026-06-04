# Phase 02 — Supabase Clients & Proxy Session

**Priority:** High · **Status:** pending · **Depends on:** 01

Install `@supabase/ssr` and create the three integration points for Next.js 16 App Router:
a browser client, a server client, and a **`proxy.ts`** (the Next.js 16 replacement for
`middleware.ts`) that refreshes the auth session on every request.

## Key Insights (verified)
- `@supabase/auth-helpers-nextjs` is **deprecated** → use `@supabase/ssr` (`0.10.x`) + `@supabase/supabase-js`.
- Server helpers must `await cookies()` (Next.js 16 removed sync access).
- **Next.js 16: session-refresh logic goes in `proxy.ts` with `export function proxy`, NOT `middleware.ts`.**
  Supabase's published snippet targets `middleware.ts` — we transplant it into `proxy.ts`.
- Verify auth server-side with `supabase.auth.getClaims()` (verifies JWT), never `getSession()`.
- The `setAll` cookie pattern must write to BOTH the request and the response object.

## Related Code Files
**Create:**
- `lib/supabase/client.ts` — browser client
- `lib/supabase/server.ts` — server client (RSC / route handlers / server actions)
- `lib/supabase/proxy-session.ts` — shared `updateSession(request)` helper
- `proxy.ts` (project root) — Next.js 16 proxy that calls `updateSession`
**Modify:** `package.json` (deps)

## Implementation Steps
1. **Install:** `pnpm add @supabase/supabase-js @supabase/ssr`
2. **`lib/supabase/client.ts`** (browser / Client Components):
   ```ts
   import { createBrowserClient } from '@supabase/ssr'

   export function createClient() {
     return createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     )
   }
   ```
3. **`lib/supabase/server.ts`** (Server Components / Route Handlers / Server Actions):
   ```ts
   import { createServerClient } from '@supabase/ssr'
   import { cookies } from 'next/headers'

   export async function createClient() {
     const cookieStore = await cookies() // Next.js 16: async

     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return cookieStore.getAll()
           },
           setAll(cookiesToSet) {
             try {
               cookiesToSet.forEach(({ name, value, options }) =>
                 cookieStore.set(name, value, options),
               )
             } catch {
               // called from a Server Component — safe to ignore; proxy refreshes the session
             }
           },
         },
       },
     )
   }
   ```
4. **`lib/supabase/proxy-session.ts`** — the session-refresh helper (Supabase's `updateSession`,
   adapted; uses `getClaims()`):
   ```ts
   import { createServerClient } from '@supabase/ssr'
   import { NextResponse, type NextRequest } from 'next/server'

   export async function updateSession(request: NextRequest) {
     let response = NextResponse.next({ request })

     const supabase = createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll() {
             return request.cookies.getAll()
           },
           setAll(cookiesToSet) {
             cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
             response = NextResponse.next({ request })
             cookiesToSet.forEach(({ name, value, options }) =>
               response.cookies.set(name, value, options),
             )
           },
         },
       },
     )

     // IMPORTANT: do not run code between client creation and getClaims().
     await supabase.auth.getClaims()
     return response
   }
   ```
5. **`proxy.ts`** (project root) — Next.js 16 entrypoint:
   ```ts
   import type { NextRequest } from 'next/server'
   import { updateSession } from '@/lib/supabase/proxy-session'

   export async function proxy(request: NextRequest) {
     return await updateSession(request)
   }

   export const config = {
     matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
   }
   ```
6. **Path alias:** confirm `tsconfig.json` maps `@/*` to project root (the scaffold sets this).
7. **Compile check:** `pnpm run build` — must pass (no `middleware.ts` should exist; verify `proxy.ts` is picked up).

## Todo
- [ ] `pnpm add @supabase/supabase-js @supabase/ssr`
- [ ] `lib/supabase/client.ts`, `server.ts`, `proxy-session.ts`
- [ ] root `proxy.ts` with matcher
- [ ] `pnpm run build` passes

## Success Criteria
- Build compiles; `proxy.ts` recognized by Next.js 16 (no edge-runtime errors).
- No `@supabase/auth-helpers-*` anywhere; no sync `cookies()` calls.

## Security Considerations
- Only the anon/publishable key is exposed via `NEXT_PUBLIC_*`. `SUPABASE_SECRET_KEY` stays server-only.
- All data access is gated by RLS (Phase 03), not by client trust.

## Risks
- **proxy vs middleware:** if `proxy.ts` isn't honored, confirm Next version ≥16 and run codemod
  `npx @next/codemod@canary middleware-to-proxy .` as fallback. Do NOT keep both files.
