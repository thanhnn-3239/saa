# Phase 04 — Integration: route, prefetch, i18n

**Priority:** High · **Status:** done · **blockedBy:** 01, 02, 03

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: ../clarifications.md

## Goal
Replace the `/profile` stub with the real page: resolve the session user, prefetch data (Track B) into the Track A UI, wire the Sent/Received toggle + infinite scroll, and add i18n.

## Context links
- Pattern to copy: `app/(public)/sun-kudos/page.tsx` (HydrationBoundary + dehydrated QueryClient prefetch) — see reuse map ../../reports/Explore-260625-1436-profile-page-mapping.md
- Layout auto-wraps `AppHeader`/`AppFooter` via `app/(public)/layout.tsx`

## Architecture / data flow
1. `app/(public)/profile/page.tsx` (server): `getSessionUser()` → if none, redirect to login. Parallel-fetch `getProfileHeader`, `getSidebarStats`, `getIconCollection`, and first `getFeedPage(viewer, { profileId: user, direction: "sent" })`.
2. Server-render `ProfileHero` + `IconCollection` (static). Prefetch stats + feed into a `QueryClient`, dehydrate, wrap interactive parts in `<HydrationBoundary>`.
3. `profile-content.tsx` (client): holds `direction` state (default "sent"), renders stats card + `ProfileAwardsHeader` (toggle) + `ProfileFeed`. Toggling direction re-runs the feed query (query-key includes direction; resets pagination).
4. Feed label counts from `SidebarStats.kudosSent` / `kudosReceived` → "Đã gửi (N)" / "Đã nhận (N)".

## Requirements
- Delete `<ComingSoon />`; render real page.
- Add `Profile` namespace to `messages/vi.json` + `messages/en.json` (page title, stat labels — reuse board sidebar labels if shared, toggle labels, icon-collection heading "Bộ sưu tập icon của tôi", empty states). Server: `getTranslations("Profile")`; client: `useTranslations("Profile")`.
- Keyvisual background asset: reuse existing public asset or add under `public/`.
- Responsive: matches board breakpoints.

## Related code files
- Modify: `app/(public)/profile/page.tsx`, `messages/vi.json`, `messages/en.json`
- Create: `app/(public)/profile/_components/profile-content.tsx`
- Read: `app/(public)/sun-kudos/page.tsx`, `app/(public)/sun-kudos/_components/kudos-board.tsx`

## Todo
- [x] Session resolution + login redirect
- [x] Parallel server prefetch (header, stats, icons, feed page 1)
- [x] HydrationBoundary + dehydrated QueryClient (copy board pattern)
- [x] `profile-content.tsx`: direction state, toggle, infinite scroll
- [x] Dropdown label shows live sent/received counts
- [x] `Profile` i18n namespace (vi + en)
- [x] Stub removed; `pnpm typecheck` + `pnpm lint` clean; `pnpm build` succeeds

## Success criteria
- `/profile` renders hero, icon collection, stats, awards header, feed for the logged-in user.
- Toggle switches feed sender↔recipient; counts correct; infinite scroll loads more.
- Unauthenticated → redirected to login.

## Security
- profileId always the session user (server-derived). No client-supplied user id reaches the query.
