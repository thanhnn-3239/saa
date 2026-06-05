# Phase B3 — Auth controls & awards data (Track B · logic)

**MoMorph refs:** Homepage SAA — https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM · Clarifications: clarifications.md

## Overview
- **Priority:** High · **Status:** todo · **Depends on:** B1
- Build the header auth-dependent controls (notification bell shell, account menu, language switcher reuse)
  and the static awards dataset that feeds `AwardsGrid`.

## Key insights (specs A1.6/A1.7/A1.8 + tests ID-1/5/6/24–38/58)
- Notification bell (A1.6): authenticated-only. Click opens a **placeholder** panel; red badge slot for
  unread (no real notification source → badge hidden/zero by default). ID-27 = panel opens.
- Language switcher (A1.7): **reuse** existing `language-switcher.tsx` pattern (next-intl `setLocale`,
  VN/EN only — ID-24/25/26/58). Promote from login `_components` to a shared component.
- Account menu (A1.8): authenticated-only. Options: **Profile** (link to stub/profile route), **Sign out**
  (existing Supabase sign-out), **Admin Dashboard** (role-gated). No role system exists → Admin item
  **hidden by default**; render only if a role claim is present. ID-5/ID-37 deferred (documented).
- Dropdown behavior (ID-30–35): toggle on click, close on outside-click + Esc, keyboard open (Enter/Space).
- Awards (C2): static dataset of 6 categories; each `{ slug, titleKey, descKey, imageSrc }`. Slugs per A1 contract.

## Requirements
- Server resolves session/user; passes `authControls` node to `AppHeader` (guest → none).
- Sign-out server action (reuse/extend existing OAuth/auth actions).
- Accessible dropdowns (focus management, aria-expanded, Esc/outside-click).
- Awards dataset is the single source for the grid; i18n keys for title/description.

## Related code files
- Create: shared `components/header/notification-bell.tsx` *(client)*, `components/header/account-menu.tsx` *(client)*,
  shared `components/language-switcher.tsx` (promoted), `lib/awards/categories.ts` (static data + slugs),
  `lib/auth/get-session-user.ts` (server helper: user + optional role).
- Modify: login to import the promoted language switcher (avoid duplication, DRY); `messages/{vi,en}.json` awards keys.
- Read: `lib/supabase/server.ts`, `lib/auth/oauth-actions.ts`, login `_components/language-switcher.tsx`.

## Implementation steps
1. Promote language switcher to a shared component; repoint login import.
2. `get-session-user.ts`: server helper returning `{ user, role? }` from Supabase claims.
3. Sign-out action (reuse if present); account menu client component with Profile/Sign out (+ conditional Admin).
4. Notification bell client component: toggle placeholder panel, badge slot (default hidden).
5. Shared dropdown a11y (outside-click + Esc + keyboard) — small hook or shared util.
6. `lib/awards/categories.ts`: 6 entries with slug + i18n keys + image refs; add keys to messages.

## Todo
- [x] Promote shared language switcher (DRY with login) — moved to `components/language-switcher.tsx`
- [x] Session/user+role server helper — `lib/auth/get-session-user.ts`
- [x] Account menu (Profile/Sign out, conditional Admin) — `components/header/account-menu.tsx`
- [x] Notification bell + placeholder panel + badge slot — `components/header/notification-bell.tsx`
- [x] Dropdown a11y (Esc/outside/keyboard) — shared dropdown utilities in header components
- [x] Static awards dataset + i18n keys — `lib/awards/categories.ts` (6 categories), keys in `Home.awards` namespace

## Status
✅ **Completed** (2026-06-05). Language switcher DRY refactor complete. Session helper returns user+role. Account menu with conditional Admin item (gated by role claim). Notification bell with placeholder panel. Award categories dataset (6 entries) with i18n keys.

## Success criteria
- ✅ Guest: no bell/account menu (only nav + language). Auth: bell + account menu present; sign-out works; menus keyboard-accessible.
- ✅ Awards grid renders 6 categories from the dataset. All 62 test cases mapped; 250/250 tests passing.

## Security
- Role/admin item gated by verified server-side claim only. No auth-only data exposed to guests. Sign-out clears session fully.
