# Phase 02 — Profile data + icon collection query (Track B)

**Priority:** High · **Status:** done · **blockedBy:** none (parallel with Track A)

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: ../clarifications.md

## Goal
Provide the read-only data for the profile hero (A) and icon collection (B2–B7). Stats card (B) reuses existing `getSidebarStats` — no new query.

## Context links
- Reuse map: ../../reports/Explore-260625-1436-profile-page-mapping.md
- Existing: `lib/kudos/sidebar-queries.ts` (`getSidebarStats`), `lib/kudos/hero-title.ts` (`getHeroTier`), `lib/auth/get-session-user.ts`
- DB: `profiles`, `badges` (id, name, image_url, description, weight), `user_badges` (user_id, badge_id), view `profile_kudo_stats`

## Key insight (spec A)
> "Lấy thông tin của user đang đăng nhập. Bộ sưu tập icon của tôi tuân theo icon mở được trong Secret box. Nếu chưa có icon nào thì để icon xám."
Icon collection = **full badge catalog**; owned badges colored, others gray (per clarification).

## Requirements
1. Create `lib/profile/queries.ts`:
   - `getProfileHeader(userId): Promise<ProfileHeader>` — full_name, avatar_url, role, department name, + `kudosReceived` (from `profile_kudo_stats`) → derive `heroTier` via `getHeroTier(kudosReceived)`.
   - `getIconCollection(userId): Promise<IconBadge[]>` — `select * from badges order by weight`, plus owned ids from `user_badges where user_id`; map each → `{ id, name, imageUrl, description, owned: boolean }`. Order by weight; design shows 6 — render all catalog rows (gray placeholders are the locked ones).
2. Add types `ProfileHeader`, `IconBadge` to `lib/profile/types.ts` (or extend `lib/kudos/types.ts` if cohesive). Reuse `SidebarStats` for the stats card.
3. All server-safe (no client secrets). Subject = session user (self-only).

## Related code files
- Create: `lib/profile/queries.ts`, `lib/profile/types.ts`
- Read for context: `lib/kudos/sidebar-queries.ts`, `lib/kudos/hero-title.ts`, `lib/kudos/hydrate.ts` (avatar URL helper `kudo-image-url.ts`)

## Todo
- [x] `getProfileHeader(userId)` returns profile + heroTier
- [x] `getIconCollection(userId)` returns full catalog with `owned` flag, ordered by weight
- [x] Types defined; `pnpm typecheck` clean
- [x] Handles 0 owned badges (all gray) and 0 stats gracefully

## Success criteria
- Icon collection length == badges catalog size; `owned` true only for rows in `user_badges`.
- Hero tier matches `getHeroTier(kudosReceived)`; null tier (0 kudos) renders no pill.

## Security
- Subject userId = session user only. No arbitrary-user lookups exposed.
