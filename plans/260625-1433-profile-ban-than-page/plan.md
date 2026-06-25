---
title: "Profile bản thân — my-profile page (/profile)"
status: completed
created: 2026-06-25
completed: 2026-06-25
blockedBy: []
blocks: []
buildsOn: [260606-1325-sun-kudos-live-board, 260611-1354-he-thong-giai-awards-page, 260611-1346-viet-kudo-send-dialog]
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screenId: 3FoIx6ALVb
  url: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
---

# Blueprint — Profile bản thân (/profile)

Fill the existing `/profile` stub (`<ComingSoon />`) with the logged-in user's profile page for SAA 2025: profile hero (avatar, name, hero tier, icon collection), Secret-Box stats card, an Awards header with a Sent/Received filter, and the user's kudos feed. **Heavily reuses** components and data from the completed Sun* Kudos board.

## Context
- MoMorph: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb (28 specs, mostly draft; 0 test cases)
- Reuse map: `plans/reports/Explore-260625-1436-profile-page-mapping.md`
- Decisions: `clarifications.md` (authoritative)
- Stub to replace: `app/(public)/profile/page.tsx`

## Scope (decided)
- **Self only** at `/profile` (current user). Components written userId-parameterizable; other-user profiles deferred.
- Secret Box: **display only** — counts + button placeholder; open flow deferred.
- Icon collection: **full badge catalog**, owned=color / locked=gray.
- Feed: **Sent/Received toggle**, default Sent. Read-only profile (no edit/upload).

## Two-track shape (parallel-runnable; integration merges them)
Track A (UI) and Track B (data) have **no `blockedBy` between them** — both runnable in parallel under `tkm:takumi`. Integration (phase-04) depends on both.

| Phase | Track | Title | Status | blockedBy |
|-------|-------|-------|--------|-----------|
| [01](phase-01-data-layer-feed-direction.md) | B | Feed sent/received + profileId filter | done | — |
| [02](phase-02-profile-data-and-icon-collection.md) | B | Profile data + icon collection query | done | — |
| [03](phase-03-profile-ui-composition.md) | A | Profile UI composition (Figma) | done | — |
| [04](phase-04-integration-route-prefetch-i18n.md) | — | Integration: route, prefetch, i18n | done | 01, 02, 03 |
| [05](phase-05-tests.md) | — | Tests (unit + component + e2e/visual) | done | 04 |

## Key reuse targets (already on disk)
- UI: `KudoPostCard`/`KudoCardBase`, `Avatar`, `HeroTitlePill`, `HeartButton`, `CopyLinkButton`, `HashtagChip`, `FilterDropdown`, `SidebarStatsBlock` (all under `app/(public)/sun-kudos/_components/`)
- Data: `getSidebarStats(userId)` (all 6 stats), `getFeedPage(viewerId, filter, cursor)`, `useKudosFeed`, `getHeroTier`
- Layout: `AppHeader` / `AppFooter` (auto-wrapped by `app/(public)/layout.tsx`)
- Auth: `getSessionUser()` (`lib/auth/get-session-user.ts`)
- DB: `profiles`, `kudos`, `kudo_likes`, `secret_boxes`, `user_badges`, `badges`; views `profile_kudo_stats`, `kudo_heart_counts`

## Net-new work
- Extend `KudosFilter` with `direction` + `profileId`; extend `getFeedPage`/feed API to scope by sender/recipient.
- `lib/profile/queries.ts`: `getProfileHeader`, `getIconCollection` (catalog ∪ owned).
- Profile UI: hero, icon-collection row, awards header w/ sent/received toggle, profile feed list + content wrapper.
- `Profile` i18n namespace; replace the stub page; server prefetch + infinite scroll.

## Risks
- DRY pressure: don't fork `KudoCardBase` — reuse via props. Keep `getFeedPage` one function (add params, don't duplicate).
- Self-only security: feed `profileId` must be derived from session server-side, never trusted from the client.
