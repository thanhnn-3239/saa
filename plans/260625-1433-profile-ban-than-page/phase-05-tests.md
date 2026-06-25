# Phase 05 — Tests

**Priority:** Medium · **Status:** done · **blockedBy:** 04

## MoMorph refs
- Profile bản thân: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/3FoIx6ALVb
- Clarifications: ../clarifications.md

## Goal
Verify the final profile page: data layer correctness, icon-collection logic, the Sent/Received toggle, and a visual/e2e pass. No test cases existed in MoMorph (0 found) — derive from clarifications + design.

## Test matrix
### Unit (Vitest)
- `getFeedPage` with `{ profileId, direction: "sent" }` → only `sender_id` matches; `"received"` → only `recipient_id`; no `profileId` → board behavior unchanged.
- `getIconCollection` → length == catalog size; `owned` true only for `user_badges` rows; 0 owned → all gray.
- `getProfileHeader` → heroTier derived from kudosReceived (boundaries 1/10/20/50); 0 kudos → null tier.
- Feed query-key includes `direction` (pagination resets on toggle).

### Component (Testing Library)
- `IconCollection`: renders owned in color, locked grayscale.
- `ProfileAwardsHeader`: default Sent selected; toggling fires `onDirectionChange`; label shows count.
- `ProfileFeed`: renders `KudoPostCard` list; HeartButton disabled when viewer is sender (Sent feed).

### E2E / visual (Playwright)
- Authenticated `/profile` renders hero + stats + feed; unauth → login redirect.
- Toggle Sent→Received swaps feed content.
- Visual snapshot vs Figma frame (reuse board's visual-test harness if present).

## Todo
- [x] Unit tests for feed direction + icon collection + hero tier
- [x] Component tests for icon collection, awards header toggle, feed
- [x] E2E: render, auth redirect, toggle
- [x] `pnpm test` + `pnpm test:e2e` green (no skipped/failing)

## Success criteria
- All tests pass; no fake data/mocks used to force a pass. Coverage on new `lib/profile/*` and feed-direction branch.
