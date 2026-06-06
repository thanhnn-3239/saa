# Phase C1 — Integration & verify login-state header

**Track:** — (integration) · **Status:** ✅ done · **Depends on:** A1, B1

## Overview
Wire the redesigned account menu (A1) into the now login-required app (B1) and verify the
header reflects login state end-to-end. Mostly verification — A1 and B1 touch different layers.

## Implementation steps
1. Confirm `app/(public)/layout.tsx` still renders `<AccountMenu email role />` inside `authControls`
   when `user` is present (no prop changes from A1). Guest branch is now effectively dead (proxy
   redirects guests) but kept as a defensive guard — leave it.
2. Confirm the new i18n keys (`Home.account.*`) resolve in both `vi` and `en` (no missing-key warnings).
3. Manual verify (run app — `pnpm dev`):
   - Logged out → visiting `/` redirects to `/login`.
   - Logged in (`@sun-asterisk.com`) → `/` shows header with plain user-icon button; click opens the
     dark dropdown (Profile w/ glow + person icon, Logout w/ chevron); non-admin has NO Admin Dashboard.
   - Click **Logout** → session cleared → lands on `/login`; revisiting `/` stays at `/login`.
   - Language switch VN/EN updates Profile/Logout labels.
4. `pnpm build` green.

## Related code files
- Read/verify: `app/(public)/layout.tsx`, `components/header/account-menu.tsx`, `app/(public)/_components/app-header.tsx`
- Read/verify: `messages/{vi,en}.json`, `lib/supabase/proxy-session.ts`

## Todo
- [x] Account menu renders + opens with redesigned styling when authenticated
- [x] Guest → `/login` redirect confirmed (manual: `/`, `/awards-information`, `/sun-kudos`, `/tieu-chuan-chung`, `/profile` all redirect)
- [x] Logout flow end-to-end → `/login`
- [x] i18n labels resolve (vi + en); `pnpm build` green

## Success criteria
- Logged-in header matches both frames; logout works; guests cannot reach any non-public route.

## Risk
- Hydration mismatch on the client AccountMenu → keep it `"use client"`, no SSR-only state. Low risk (unchanged contract).

## MoMorph refs:
- Dropdown-profile: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/z4sCl3_Qtk
- Homepage A1.8: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: ./clarifications.md
