# Phase B1 — Foundation & public access (Track B · logic)

**MoMorph refs:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM · Clarifications: clarifications.md

## Overview
- **Priority:** Critical (unblocks B2/B3/B4 + C1)
- **Status:** todo
- Establish the public-homepage foundation: make `/` reachable by guests, scaffold the public
  route-group layout + shared header/footer slots, design tokens/fonts, env var, i18n key namespace.

## Key insights
- Current `proxy.ts` + `lib/supabase/proxy-session.ts` redirect **all** unauthenticated users to `/login`
  except `/login` and `/auth/callback`. `/` is currently protected → must allow `/` as public.
- ⚠️ Next.js 16: logic lives in `proxy.ts` (Node runtime), `cookies()` is async, **no `src/`**.
  Read `node_modules/next/dist/docs/` before editing routing/proxy.
- next-intl is cookie-based (no URL locale prefix) — do **not** add locale segments. Add keys to
  `messages/vi.json` + `messages/en.json` under a new `Home` namespace.

## Requirements
- Functional: guests can load `/`; authenticated users still allowed; `/login` still redirects
  authenticated users away (existing behavior preserved).
- Non-functional: no regression to existing auth/redirect tests; defense-in-depth domain check intact.

## Architecture
- Public route group: `app/(public)/layout.tsx` renders `<AppHeader>` + `<AppFooter>` around `{children}`.
  Homepage = `app/(public)/page.tsx` (move/replace current `app/page.tsx`). Stub pages (B4) join this group.
- Auth control rendering decided server-side: layout/page reads Supabase session via
  `lib/supabase/server.ts` and passes `authControls` (or null) into `AppHeader`.

## Related code files
- Modify: `proxy.ts`, `lib/supabase/proxy-session.ts` (PUBLIC_PATHS allowlist incl. `/` + stub routes),
  `app/page.tsx` (relocate to public group), `.env.example`, `messages/{vi,en}.json`.
- Create: `app/(public)/layout.tsx`, `app/(public)/page.tsx`, design-token additions in `app/globals.css`.
- Read: `lib/supabase/server.ts`, existing `app/layout.tsx`, login `_components` for style patterns.

## Implementation steps
1. Read Next.js 16 proxy/routing docs + existing `proxy-session.ts`.
2. Add `/` (and B4 stub paths) to the public allowlist so guests aren't redirected; keep `/login`
   authenticated-user redirect. Verify the unauthenticated-protected-route behavior still holds for
   any future private route.
3. Create `app/(public)/layout.tsx` with header/footer slots; resolve session server-side; relocate homepage into the group.
4. Add `NEXT_PUBLIC_EVENT_DATETIME` to `.env.example` (sample ISO-8601) + note for Vercel.
5. Add fonts (Montserrat etc. per design) via `next/font`; extend Tailwind v4 tokens / `globals.css` for the dark SAA palette + gold accent.
6. Scaffold `Home` i18n namespace keys (placeholders) in `messages/vi.json` + `en.json`.

## Todo
- [x] Read NK16 docs; audit proxy allowlist
- [x] Make `/` public (proxy + session), preserve existing redirects
- [x] Public route group + layout + homepage relocation (deleted `app/page.tsx`, created `app/(public)/layout.tsx` + `app/(public)/page.tsx`)
- [x] Env var + fonts + design tokens (Montserrat, SAA dark palette + gold accent)
- [x] `Home` i18n namespace scaffold (keys added to `messages/{vi,en}.json`)
- [x] Security fix: `/profile` removed from `PUBLIC_PATHS` (authenticated-only, per reviewer H1)

## Status
✅ **Completed** (2026-06-05). `/` public to guests via `proxy.ts`; `/login` still redirects authenticated users. `app/(public)/` route group created with shared header/footer layout.

## Success criteria
- ✅ Guest GET `/` → 200 (no redirect). Authenticated GET `/login` → still redirects to `/`.
- ✅ `pnpm build` + `pnpm lint` pass; existing auth tests green (250/250 total).
- ✅ Route conflict resolved: `app/page.tsx` deleted; canonical homepage is `app/(public)/page.tsx`.

## Security
- Only whitelist genuinely public paths. Auth-only data/controls gated server-side, never leaked to guests.

## Next steps
- Unblocks B2, B3, B4.
