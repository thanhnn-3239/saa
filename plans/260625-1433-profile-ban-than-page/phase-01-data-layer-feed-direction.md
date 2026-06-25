# Phase 01 — Feed sent/received + profileId filter (Track B)

**Priority:** High · **Status:** done · **blockedBy:** none (parallel with Track A)

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: ../clarifications.md

## Goal
Extend the existing kudos feed query so it can be scoped to one user as **sender** (Sent) or **recipient** (Received), without forking `getFeedPage`. Powers the profile's C.3 "Đã gửi (5)" dropdown + D feed.

## Context links
- Reuse map: ../../reports/Explore-260625-1436-profile-page-mapping.md
- `lib/kudos/types.ts` (KudosFilter line ~147), `lib/kudos/queries.ts` (`buildKudoSelect` ~33, `getFeedPage`), `lib/kudos/use-kudos-feed.ts`, `app/api/kudos/feed` route handler

## Key insight
`getFeedPage(viewerId, filter, cursor)` already exists. `viewerId` = who is looking (for like-state). Add the **subject** as a separate axis so we never confuse viewer vs subject. For self-only profile, subject === viewer, but keep them distinct for future reuse + security.

## Requirements
1. Extend `KudosFilter`:
   ```ts
   export interface KudosFilter {
     hashtag: string | null;
     departmentId: number | null;
     direction?: "sent" | "received"; // profile feed only; undefined = global board
     profileId?: string;              // subject user; undefined = global board
   }
   ```
2. `buildKudoSelect` / `getFeedPage`: when `profileId` set, add `.eq("sender_id", profileId)` for `direction==="sent"`, `.eq("recipient_id", profileId)` for `direction==="received"` (default "received" if direction omitted but profileId set). Board path (no profileId) unchanged.
3. Keep `status` filter = published only (consistent with board).
4. Feed API route: accept `direction` query param. **Derive `profileId` from the session user server-side** (self-only) — do NOT read profileId from the client. Reject if no session.
5. `use-kudos-feed.ts` (or a thin `useProfileFeed` wrapper): include `direction` in the query key so toggling Sent/Received resets pagination (same pattern as hashtag/department per the 2026-06-06 clarification).

## Related code files
- Modify: `lib/kudos/types.ts`, `lib/kudos/queries.ts`, `app/api/kudos/feed/route.ts`, `lib/kudos/use-kudos-feed.ts`
- Create: (optional) `lib/profile/use-profile-feed.ts` thin wrapper if board hook is too board-specific

## Todo
- [x] Add `direction` + `profileId` to `KudosFilter`
- [x] Branch `buildKudoSelect`/`getFeedPage` on `profileId`/`direction` (sender_id vs recipient_id)
- [x] Feed API: parse `direction`, derive `profileId` from session, 401 if unauth
- [x] Query-key includes `direction`; pagination resets on toggle
- [x] `pnpm typecheck` clean

## Success criteria
- Board feed behavior byte-identical when `profileId` undefined.
- `getFeedPage(viewer, { profileId: U, direction: "sent" })` returns only kudos where `sender_id = U`; `"received"` only `recipient_id = U`.
- Cursor pagination works per direction.

## Security
- profileId server-derived from session; client cannot request another user's feed (self-only scope).
