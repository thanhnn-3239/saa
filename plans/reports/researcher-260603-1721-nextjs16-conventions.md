# Next.js 16.2.x / React 19 Conventions — Project Setup Blueprint

**Date:** 2026-06-03 | **Scope:** Next.js 16.2.7 (confirmed in `package.json`)
**Sources:** Official Next.js 16 upgrade guide (v16.2.7, lastUpdated 2026-06-01), proxy.js API reference, local-development guide, deploying guide, with-docker example, web search cross-references.

---

## 1. Middleware: `proxy.ts` (NOT `middleware.ts`)

### Critical rename — `middleware.ts` is deprecated in Next.js 16.0.0

| Item | Value |
|---|---|
| **File name** | `proxy.ts` (or `proxy.js`) |
| **Location** | Project root or `src/` — same level as `app/` |
| **Old file** | `middleware.ts` → deprecated, still works but TS/lint errors |
| **Runtime** | **Node.js only** (Edge runtime is NOT supported in proxy; keep `middleware.ts` only if you need Edge) |

### Exact signature (TypeScript)

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Named export "proxy" (not "middleware")
export function proxy(request: NextRequest) {
  return NextResponse.next()
}

// Optional: use NextProxy type for concise typing (includes NextFetchEvent)
// import type { NextProxy } from 'next/server'
// export const proxy: NextProxy = (request, event) => { ... }

export const config = {
  matcher: [
    // Exclude static, image optimizations, metadata files
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
```

### For Supabase session refresh (typical pattern)

```ts
// proxy.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookies) => {
          cookies.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  await supabase.auth.getUser() // refreshes session cookie

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)',]
}
```

### Config flags renamed

| Old (Next.js 15) | New (Next.js 16) |
|---|---|
| `skipMiddlewareUrlNormalize` | `skipProxyUrlNormalize` |
| `experimental.middlewarePrefetch` | (check docs) |

**Codemod available:** `npx @next/codemod@canary middleware-to-proxy .`

---

## 2. `next.config.ts` — Current Recommended Shape

```ts
// next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Turbopack promoted from experimental.turbopack → top-level in Next.js 16
  turbopack: {
    // resolveAlias, rules, etc. — only if needed (YAGNI)
  },

  // React Compiler (optional, stable in 16 — increases compile time, use deliberately)
  // reactCompiler: true,

  // Turbopack FS cache (beta, dev-only speedup)
  // experimental: {
  //   turbopackFileSystemCacheForDev: true,
  // },

  // Cache Components (replaces experimental.dynamicIO + experimental.useCache)
  // cacheComponents: true,

  // Docker standalone (still valid, see Section 5)
  // output: 'standalone',

  // Images — defaults changed in 16
  // images: {
  //   minimumCacheTTL: 14400, // new default (was 60)
  //   remotePatterns: [...],  // use this; images.domains is deprecated
  // },
}

export default nextConfig
```

**Key changes from Next.js 15:**
- `experimental.turbopack` → `turbopack` (top-level)
- `experimental.dynamicIO` / `experimental.useCache` → `cacheComponents: true`
- `experimental.ppr` → removed; use `cacheComponents: true`
- `eslint: {}` option removed (use ESLint CLI directly)
- `serverRuntimeConfig` / `publicRuntimeConfig` removed (use env vars)
- `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize`

### Turbopack is now DEFAULT
- `next dev` and `next build` use Turbopack by default — no flags needed
- Custom `webpack` config causes `next build` to **fail** unless you pass `--webpack`
- To use Webpack for prod only: `"build": "next build --webpack"`

### `output: 'standalone'` — still valid, with a caveat
- Works in 16.x. Use for Docker prod builds.
- **Known bug in 16.1.x:** `serverExternalPackages` not copied into `.next/standalone/node_modules` when building with Turbopack (GitHub issue #88844). Workaround: use `--webpack` for prod builds or add external packages manually.

---

## 3. Environment Variables

**No change to the `NEXT_PUBLIC_*` client-exposure rule.** Still works the same way:

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co     # exposed to client bundle
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx                    # exposed to client bundle
DATABASE_URL=postgres://...                          # server-only
```

### Breaking: `serverRuntimeConfig` / `publicRuntimeConfig` removed
Use env vars directly. For runtime (not build-time) reads in Server Components:

```ts
import { connection } from 'next/server'

export default async function Page() {
  await connection() // forces runtime read (not bundled at build time)
  const config = process.env.RUNTIME_CONFIG
  return <p>{config}</p>
}
```

**No other env loading behavior changes in 16.**

---

## 4. Docker — Local Dev (Hot Reload)

**Official recommendation:** The Next.js docs explicitly state: prefer local dev (`pnpm dev`) over Docker on Mac/Windows. Docker filesystem on non-Linux causes HMR to take seconds to minutes.

If Docker local dev is required (e.g., Linux CI, team standardization):

```dockerfile
# Dockerfile.dev
FROM node:24-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11

# Copy manifests first for layer caching
COPY package.json pnpm-lock.yaml ./
RUN pnpm install

# Source mounted via volume — do NOT COPY src
EXPOSE 3000

CMD ["pnpm", "dev"]
```

```yaml
# compose.dev.yml
services:
  web:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - .:/app                          # mount source
      - /app/node_modules               # exclude host node_modules
      - /app/.next                      # exclude build artifacts
    environment:
      - WATCHPACK_POLLING=true          # REQUIRED: Docker doesn't emit FS events
      - CHOKIDAR_USEPOLLING=true        # belt-and-suspenders for legacy watchers
      - NODE_ENV=development
    env_file:
      - .env.local
```

### Hot-reload gotchas in Docker
| Issue | Fix |
|---|---|
| No HMR on file save | `WATCHPACK_POLLING=true` env var (Turbopack uses watchpack) |
| Slow HMR on Mac/Windows | Use Linux host or native dev |
| `node_modules` conflicts | Named volume `/app/node_modules` in compose |
| `.next` stale builds | Named volume `/app/.next` in compose |
| Turbopack dev outputs to `.next/dev` | Don't confuse with `.next/` prod output |

**Node version:** Node 24-slim is fine (Next.js 16 min is Node 20.9). `node:24-slim` is the current recommended base per the official with-docker example.

---

## 5. Docker — Production Build (Standalone)

Multi-stage Dockerfile from the official `with-docker` example (Node 24-slim):

```dockerfile
# Dockerfile
FROM node:24-slim AS base

# ---- deps stage ----
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
RUN npm install -g pnpm@11 && pnpm install --frozen-lockfile

# ---- builder stage ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm install -g pnpm@11 && pnpm build

# ---- runner stage (minimal) ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy standalone output
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

**Required in `next.config.ts`:**
```ts
const nextConfig: NextConfig = {
  output: 'standalone',
}
```

**Caveat (16.1.x Turbopack bug):** If using `serverExternalPackages`, use `pnpm build --webpack` until the Turbopack standalone bug (#88844) is resolved. For 16.2.x — verify by checking if `node_modules` in `.next/standalone` has your external packages.

**Note:** Since the project deploys to Vercel, this Dockerfile is secondary / for self-hosting only.

---

## 6. Other Breaking Changes Relevant to Fresh Full-Stack Setup

### Async APIs — fully synchronous access removed (hard break)

```ts
// BROKEN in Next.js 16 — synchronous access removed
const cookieStore = cookies()
const headersList = headers()

// CORRECT
const cookieStore = await cookies()
const headersList = await headers()

// params and searchParams in page/layout — must await
export default async function Page({ params }: PageProps) {
  const { slug } = await params  // params is now Promise<{slug: string}>
}
```

Run `npx next typegen` to auto-generate `PageProps`, `LayoutProps`, `RouteContext` helpers.

### Caching model — opt-in by default

- All dynamic code executes at request time by default (no implicit caching)
- New `"use cache"` directive for explicit caching (stable in 16)
- `cacheComponents: true` enables Cache Components (replaces PPR)

```ts
// Route-level cache
'use cache'
import { cacheLife, cacheTag } from 'next/cache'  // unstable_ prefix removed

export default async function Page() {
  cacheLife('hours')
  cacheTag('products')
  // ...
}
```

### `revalidateTag` requires second argument

```ts
// DEPRECATED — TS error in 16
revalidateTag('posts')

// CORRECT
revalidateTag('posts', 'max')  // stale-while-revalidate

// For immediate expiry — use updateTag in Server Actions instead
import { updateTag } from 'next/cache'
updateTag('user-123')
```

### Parallel routes require `default.js`

All `@slot` parallel routes **must** have a `default.js` — build fails without it:

```tsx
// app/@modal/default.tsx
export default function Default() { return null }
```

### AMP removed, `next lint` removed

- AMP APIs fully gone — `useAmp`, `config = { amp: true }`, etc.
- `next lint` command removed; use `eslint` CLI directly
- `next build` no longer runs linting

### ESLint flat config required

`@next/eslint-plugin-next` defaults to ESLint Flat Config. If using `.eslintrc` legacy format, migrate to `eslint.config.js` (ESLint v9+ flat config).

### Image defaults changed

| Setting | Old default | New default |
|---|---|---|
| `minimumCacheTTL` | 60s | 14400s (4h) |
| `imageSizes` | includes `16` | `16` removed |
| `qualities` | all | `[75]` only |
| `maximumRedirects` | unlimited | 3 |

### `.next/dev` separate from `.next/`

`next dev` now outputs to `.next/dev/` (separate from `next build` output). Turbopack traces: `.next/dev/trace-turbopack`.

### React 19.2 features (stable)

- `<ViewTransition>` for animated page transitions
- `useEffectEvent` hook
- `<Activity>` component
- React Compiler support is stable (not on by default; enable with `reactCompiler: true`)

---

## Summary Ranking (What Matters Most for Fresh Setup)

1. **Rename `middleware.ts` → `proxy.ts`**, rename export `middleware` → `proxy`. Run codemod.
2. **All `cookies()`, `headers()`, `params`, `searchParams` must be `await`-ed** — hard break.
3. **`next.config.ts`**: move `experimental.turbopack` → `turbopack`, remove deprecated flags.
4. **`NEXT_PUBLIC_*` env rule unchanged** — safe.
5. **Local dev in Docker on Mac/Windows** — avoid; use native. If needed, `WATCHPACK_POLLING=true`.
6. **Production Docker** — `output: 'standalone'` still valid; check Turbopack+standalone bug for 16.1.x.
7. **Parallel route slots need `default.js`** — add upfront or builds fail.
8. **`revalidateTag` needs second arg**, `cacheLife`/`cacheTag` stable (drop `unstable_` prefix).

---

## Sources

- [Next.js 16 Upgrade Guide](https://nextjs.org/docs/app/guides/upgrading/version-16) — official, v16.2.7, updated 2026-06-01
- [proxy.js API Reference](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) — official, v16.2.7, updated 2026-06-01
- [Local Development Guide](https://nextjs.org/docs/app/guides/local-development) — official
- [Deploying Guide](https://nextjs.org/docs/app/getting-started/deploying) — official
- [with-docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker) — official, Node 24-slim
- [Turbopack standalone bug #88844](https://github.com/vercel/next.js/issues/88844) — GitHub issue
- [Next.js 16.2 Turbopack blog](https://nextjs.org/blog/next-16-2-turbopack) — official

---

## Unresolved Questions

1. **Supabase SSR package compatibility with `proxy.ts`**: `@supabase/ssr` was written for `middleware.ts`. Verify the package has been updated to use `proxy` exports or if a wrapper is needed. Check `@supabase/ssr` changelog for Next.js 16 support.
2. **Turbopack standalone bug status in 16.2.7**: Issue #88844 was filed for 16.1.x. Unconfirmed whether 16.2.x fixed it. Test `serverExternalPackages` + `output: 'standalone'` + Turbopack before committing to that combination.
3. **`next-intl` middleware → proxy rename**: The search results flagged a `fix-next-intl-nextjs-16-proxy-fix` blog. If i18n is planned, verify `next-intl` version compatibility.
4. **Docker + Turbopack FS polling**: Turbopack's watcher behavior in Docker containers is less documented than Webpack's. `WATCHPACK_POLLING=true` should work but needs validation on the target platform.
