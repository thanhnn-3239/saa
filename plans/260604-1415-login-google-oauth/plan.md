---
title: Login screen — Supabase Google OAuth (SAA 2025)
date: 2026-06-04
status: completed
mode: auto
package_manager: pnpm
blockedBy: []
blocks: [260604-1519-i18n-next-intl-setup]
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - { name: Login, screenId: GzbNeVGJHz }
---

# Blueprint — Login screen with Supabase Google OAuth

Implement the SAA 2025 Login screen: a branded hero ("ROOT FURTHER") with a Google
sign-in CTA, header (logo + VN/EN language switcher), background art, and footer.
Authentication uses **Supabase Auth Google provider** (builds on the existing
`@supabase/ssr` foundation), restricted to **@sun-asterisk.com** accounts.

## Context
- Builds on [260603-1716-nextjs-supabase-vercel-setup](../260603-1716-nextjs-supabase-vercel-setup/plan.md)
  (phases 01–04 done): Supabase clients (`lib/supabase/{client,server}.ts`), session
  refresh (`proxy.ts` + `lib/supabase/proxy-session.ts`). That plan deferred auth UI — this is it.
- MoMorph: Login `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz`
- Specs: 9 design items (A Header/A.1 Logo/A.2 Language · B Main/B.1 Key Visual/B.2 Welcome/B.3 Login · C Background · D Footer)
- Test cases: 17 (GUI layout, language control, login button states, access control, auth flow)
- Clarifications: [clarifications.md](clarifications.md)

## Critical Decisions (locked)
| Decision | Choice |
|----------|--------|
| Auth | Supabase Auth Google provider via existing `@supabase/ssr` setup |
| Domain restriction | Only `@sun-asterisk.com` emails; others signed out + error |
| Post-login redirect | `/` (homepage = main app) |
| Auth enforcement | In `proxy.ts`: authenticated → skip `/login`; unauthenticated on protected route → `/login` |
| Error UX | Redirect to `/login?error=<code>`, dismissible inline banner above button |
| i18n | UI-only switcher (VN/EN, default VN), mock behavior; real i18n deferred |
| OAuth flow | Full-page redirect via `/auth/callback` route handler (not popup) |

## ⚠️ Next.js 16 landmines (inherited)
- Session/middleware lives in `proxy.ts` (named export `proxy`, Node runtime) — NOT `middleware.ts`.
- `await cookies()` required in server helpers (already handled in `lib/supabase/server.ts`).
- Verify auth with `getClaims()`, never `getSession()`.
- Turbopack default; no custom webpack.

## Two-Track Phases
Track A (UI) and Track B (auth/logic) are **parallel-runnable** — no cross-track blocking.
Integration (phase-04) wires them together at the end.

| # | Track | Phase | Status | Depends on |
|---|-------|-------|--------|-----------|
| 01 | B | [Supabase Google OAuth + callback + domain guard](phase-01-supabase-google-oauth.md) | ✅ done | — |
| 02 | B | [proxy.ts auth enforcement](phase-02-proxy-auth-enforcement.md) | ✅ done | 01 |
| 03 | A | [Login screen UI (MoMorph design)](phase-03-login-ui.md) | ✅ done | — |
| 04 | — | [Integration + tests](phase-04-integration-and-tests.md) | ✅ done | 01,02,03 |

## Definition of Done
- [x] Clicking "Đăng nhập bằng Google" starts Supabase Google OAuth; success → `/`, non-`@sun-asterisk.com` → `/login?error=domain` with banner.
- [x] Authenticated users hitting `/login` are redirected to `/`; unauthenticated users on `/` are redirected to `/login`.
- [x] Login button shows loading (disabled + spinner) during auth; hover elevation per design.
- [x] Login UI matches MoMorph design (header logo + VN/EN switcher, hero, footer); switcher dropdown opens (mock VN/EN).
- [x] Tests cover access control, OAuth initiation, domain rejection, and key GUI/layout assertions from the 17 test cases.
