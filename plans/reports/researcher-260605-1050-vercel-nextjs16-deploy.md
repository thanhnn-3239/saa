# Vercel Deployment — Next.js 16 Research Report

**Date:** 2026-06-05
**Sources:** Next.js official upgrade docs (v16.2.7), Vercel official docs (last updated 2026-03-02 / 2026-02-27), Supabase docs, next-intl 4.0 blog + GitHub discussions, community threads.

---

## Q1 — Zero-config? pnpm auto-detect?

**Verdict: YAGNI — no `vercel.json` needed.**

- Vercel auto-detects Next.js via presence of `next` in deps. Build command = `next build`, output = `.next`.
- pnpm detected automatically from `pnpm-lock.yaml` + `packageManager` field in `package.json`. Runs `pnpm install` by default. No config needed.
- App Router fully supported zero-config (Server Actions, RSC, SSR all wired automatically).
- No `vercel.json` or `vercel.ts` required. Adding one is YAGNI unless you need custom rewrites/headers/regions.

**Gotcha:** The project currently has no `vercel.json` — correct, leave it out.

Sources: [Vercel Next.js docs](https://vercel.com/docs/frameworks/full-stack/nextjs), [pnpm zero-config changelog](https://vercel.com/changelog/projects-using-pnpm-can-now-be-deployed-with-zero-configuration)

---

## Q2 — proxy.ts on Vercel

**Verdict: Works. Node runtime, no config needed. One known console warning.**

Key facts from official Next.js 16 upgrade docs:
- `proxy.ts` = Node.js runtime only. Edge runtime NOT supported and cannot be configured.
- Named export must be `proxy` (not `middleware`). Config key `matcher` still valid.
- Old `middleware.ts` still works on Vercel but deprecated; will be removed in a future release.
- Config flags renamed: `skipMiddlewareUrlNormalize` → `skipProxyUrlNormalize` (not used in this project).

**Known Vercel bug:** A community-reported bug ([Vercel Community #26005](https://community.vercel.com/t/bug-next-js-16-vercel-console-warning-about-middleware-missing/26005)) shows Vercel dashboard logs a console **warning** about "middleware missing" even when `proxy.ts` is present. Cosmetic only — proxy executes correctly. Vercel team acknowledged; patch expected.

**This project's `proxy.ts`:** Correct. Named export `proxy`, valid `matcher`, Node runtime. No changes needed.

**No gotcha vs. old middleware for Supabase session refresh** — session refresh is pure Node logic, no edge-only APIs used.

Sources: [Next.js 16 upgrade guide](https://nextjs.org/docs/app/guides/upgrading/version-16), [Renaming middleware to proxy](https://nextjs.org/docs/messages/middleware-to-proxy), [Vercel Community bug report](https://community.vercel.com/t/bug-next-js-16-vercel-console-warning-about-middleware-missing/26005)

---

## Q3 — Turbopack build on Vercel

**Verdict: Works zero-config. Turbopack is default in Next.js 16.**

- `next build` now uses Turbopack by default (stable since 16.0). No `--turbopack` flag needed (already default).
- Vercel detects Turbopack automatically — no config required.
- `turbopack` config moved from `experimental.turbopack` → top-level `turbopack` in `next.config.ts` (breaking change in 16).
- This project's `next.config.ts` has no `experimental.turbopack` — correct, nothing to migrate.
- `next-intl`'s `createNextIntlPlugin()` is explicitly documented as Turbopack-compatible (see comment in `next.config.ts`).

**Escape hatch if needed:** Set env var `NEXT_DISABLE_TURBOPACK=1` scoped to Production in Vercel dashboard → uses Webpack. Or add `--webpack` to build script. Only needed if a dep has custom webpack config conflicting with Turbopack.

**Risk:** If any dep injects a `webpack` callback into next config, the build will **fail** (Next 16 intentional behavior). Run `next build` locally once before first Vercel deploy to catch this.

Sources: [Next.js 16 upgrade guide §Turbopack](https://nextjs.org/docs/app/guides/upgrading/version-16#turbopack-by-default), [iloveblog.blog Turbopack fix](https://www.iloveblogs.blog/post/nextjs-16-disable-turbopack-production-build)

---

## Q4 — Env vars setup

**Verdict: Standard Vercel env var workflow. No surprises.**

### Setting vars
Dashboard: Project → Settings → Environment Variables → Add per scope (Production / Preview / Development).

CLI (once Vercel CLI installed):
```bash
npm i -g vercel   # Vercel CLI not installed locally — required first
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SECRET_KEY production   # server-only, no NEXT_PUBLIC_ prefix
```
Scope flags: `production`, `preview`, `development` (can combine).

### NEXT_PUBLIC_* behavior
- Inlined at **build time** — static string replacement in the JS bundle. Changing them requires a redeploy.
- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → exposed to browser. This is intentional for Supabase client-side usage. Anon key is safe to expose (it's rate-limited + RLS-protected).
- `SUPABASE_SECRET_KEY` (no prefix) → server-only, never in bundle.

### Verifying no secret leaked into client bundle
1. After build: `grep -r "your_secret_value" .next/static/` — should return nothing.
2. Or use Vercel's bundle analyzer, or check Network tab in DevTools for any JS chunk containing the value.
3. Use `server-only` package in any module that uses `SUPABASE_SECRET_KEY` — causes build error if accidentally imported in a Client Component.

Sources: [Vercel env docs](https://vercel.com/docs/environment-variables/sensitive-environment-variables), [Vercel Academy env+security](https://vercel.com/academy/nextjs-foundations/env-and-security), [Vercel environments](https://vercel.com/docs/deployments/environments)

---

## Q5 — next-intl 4.13 cookie-based locale in prod

**Verdict: Works. One Vercel-specific caching caveat — LOW risk for this use case.**

- Cookie-based locale without URL routing (`without-i18n-routing` setup) is the documented approach in next-intl 4.x. `createNextIntlPlugin()` auto-detects `./i18n/request.ts` — confirmed in project's `next.config.ts`.
- next-intl 4.0 changes: locale cookie is now a **session cookie** (expires on browser close). Only set when user switches locale ≠ accept-language header. `localeCookie: false` to disable.
- Turbopack-compatible: `createNextIntlPlugin()` officially supports Turbopack.

**Known Vercel caching issue** ([GitHub discussion #936](https://github.com/amannn/next-intl/discussions/936)):
> On statically rendered pages, Vercel's CDN returns `304 Not Modified` without `set-cookie` → `NEXT_LOCALE` cookie not updated if user hits page via a different locale path prefix.

**Impact on this project:** LOW — this project uses no URL-based locale routing (cookie-only). The 304 issue only affects locale prefix path changes. The cookie is correctly set and read from `NEXT_LOCALE` for all requests through `proxy.ts` → `i18n/request.ts` flow. No action needed.

Sources: [next-intl 4.0 announcement](https://next-intl.dev/blog/next-intl-4-0), [without-i18n-routing docs](https://next-intl-docs.vercel.app/docs/getting-started/app-router/without-i18n-routing), [GitHub #936](https://github.com/amannn/next-intl/discussions/936)

---

## Q6 — Preview deployments & OAuth redirect allow-list

**Verdict: Use wildcard pattern in Supabase + VERCEL_URL env var in code.**

### Supabase redirect URL allow-list
In Supabase Dashboard → Authentication → URL Configuration → Redirect URLs, add:

```
https://<your-project>.vercel.app/**            # production (exact)
https://*-<your-org>.vercel.app/**              # preview (wildcard)
```

Example for this project (assuming org slug `ssa` or similar):
```
https://ssa.vercel.app/**
https://*-ssa-team.vercel.app/**
```

Find exact org slug from any Vercel preview URL after first deploy.

**`**` (globstar)** matches any path including `/auth/callback`. Supabase supports this wildcard.

### Dynamic redirectTo in code
Vercel injects `VERCEL_URL` (not `NEXT_PUBLIC_`) containing the current deployment's hostname. Use it for `redirectTo`:
```ts
const redirectTo = process.env.NEXT_PUBLIC_SITE_URL          // prod: set manually
  ?? `https://${process.env.VERCEL_URL}`                     // preview: auto
```
Add `NEXT_PUBLIC_SITE_URL=https://ssa.vercel.app` for production env only.

**Production URL is stable** — the assigned `*.vercel.app` domain is permanent once set in project settings. Custom domain even more so.

### Google OAuth (Google Cloud Console)
Google OAuth does NOT support wildcards in Authorized Redirect URIs. Workarounds:
1. Add preview URLs manually per-deploy (impractical).
2. Point all preview OAuth through a stable production callback, then redirect internally (common pattern).
3. Use a separate Google OAuth client for dev/preview with `http://localhost:3000` + one stable preview domain.

**Recommended:** For development/preview, create a dedicated Google OAuth client. Keep production client strict with only `https://ssa.vercel.app/auth/callback`.

Sources: [Supabase redirect URLs docs](https://supabase.com/docs/guides/auth/redirect-urls), [Supabase GitHub discussion #2760](https://github.com/orgs/supabase/discussions/2760), [Vercel Community #6345](https://community.vercel.com/t/google-oauth-redirect-url-with-vercel-preview-urls-supabase/6345)

---

## Q7 — Node version

**Verdict: Compatible. Vercel default is Node 24 (LTS); `engines.node >=20.9.0` maps to Node 24.**

- Vercel 2026 defaults: **Node 24.x** (default), 22.x, 20.x available.
- Project's `engines.node: ">=20.9.0"` — semver range `>=20.9.0` maps to **latest 24.x** per Vercel's resolution table (picks highest available matching version).
- Next.js 16 requires Node >= 20.9.0 (official requirement). Node 24 satisfies this.
- No action needed. If you want to pin to Node 22 for stability, set `"node": "22.x"` in engines.

Sources: [Vercel Node.js versions docs](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [Node 24 LTS GA changelog](https://vercel.com/changelog/node-js-24-lts-is-now-generally-available-for-builds-and-functions)

---

## Deployment Checklist

```
[ ] Install Vercel CLI: npm i -g vercel
[ ] vercel login → link project: vercel link
[ ] Set env vars (dashboard or CLI):
    - NEXT_PUBLIC_SUPABASE_URL  (production + preview)
    - NEXT_PUBLIC_SUPABASE_ANON_KEY  (production + preview)
    - SUPABASE_SECRET_KEY  (production + preview, sensitive)
    - NEXT_PUBLIC_SITE_URL=https://<project>.vercel.app  (production only)
[ ] Supabase Dashboard → Auth → Redirect URLs: add wildcard preview pattern
[ ] Google Cloud Console: add production callback URL; create separate OAuth client for preview
[ ] Test local build first: pnpm build (catches Turbopack/webpack conflicts early)
[ ] Deploy: vercel --prod
[ ] Verify: grep secret values in .next/static/ → should be empty
```

---

## Trade-off Summary

| Topic | Decision | Risk |
|-------|----------|------|
| vercel.json | Skip (YAGNI) | Low — add only if custom routing needed |
| Turbopack | Default, no flag | Low — escape hatch: NEXT_DISABLE_TURBOPACK=1 |
| proxy.ts | Already correct | Low — cosmetic console warning on Vercel (known bug) |
| Node version | 24.x auto-selected | Low — compatible, stable LTS |
| OAuth previews | Separate Google client | Medium — manual setup per team member |
| Secret leak | Use server-only pkg | Low — verify with grep post-build |

---

## Unresolved Questions

1. **Vercel org slug for preview wildcard** — cannot know until first deploy. After deploy, check the preview URL format (`https://<hash>-<project>-<org>.vercel.app`) and update Supabase allow-list accordingly.
2. **`VERCEL_URL` in proxy.ts context** — Vercel injects `VERCEL_URL` as a build-time var (not `NEXT_PUBLIC_`), accessible server-side only. Confirm Supabase `redirectTo` construction happens server-side (in Route Handler, not Client Component). If it currently uses `window.location.origin` client-side, that works for prod but may need adjustment for preview.
3. **`@supabase/ssr` compatibility with Node 24** — no blocking issue found, but `@supabase/ssr ^0.10.3` was not explicitly verified against Node 24. Likely fine; flag if deploy fails with crypto/TLS errors.

---

**Status:** DONE
**Summary:** Next.js 16 on Vercel is genuinely zero-config for this stack. No `vercel.json` needed. proxy.ts, Turbopack, pnpm, and next-intl all work without additional configuration. Main action items are: (1) set env vars, (2) configure Supabase redirect URL wildcard after first deploy, (3) create separate Google OAuth client for preview environments. Install Vercel CLI first (`npm i -g vercel` — not installed locally).
