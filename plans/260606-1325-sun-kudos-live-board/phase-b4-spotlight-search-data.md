# Phase B4 — Spotlight + Search Data

**Track:** B (data/logic) · **Priority:** Medium · **Status:** ✅ done · **Depends on:** B1

## MoMorph refs
- Sun* Kudos - Live board: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ
- Clarifications: ../260606-1325-sun-kudos-live-board/clarifications.md

## Overview
Data for the **simplified Spotlight cloud** (B.7): the total KUDOS count ("388 KUDOS", B.7.1), the set of
recipient names sized by kudos-received, and the Sunner **search** (B.7.3, max 100 chars).

## Key insights
- Total count = `count(*)` of published kudos (B.7.1). Live via realtime.
- Cloud nodes = recipients with ≥1 received kudo; each node = `{ profileId, name, receivedCount }`; UI sizes font by `receivedCount`. Click → kudos detail (stub route in v1).
- Search = filter profiles by name (ilike), capped at 100 chars; empty input blocked with required message (test `9e689933`). Returns profile briefs to highlight/scroll-to in the cloud.

## Related code files
**Create**
- `lib/kudos/spotlight-queries.ts` — `getKudosTotal()`, `getSpotlightNodes(limit?)`, `searchSunners(term)`.
- `lib/kudos/use-spotlight.ts` — `useQuery` for total + nodes; `searchSunners` invoked on submit.
**Notes**
- `getSpotlightNodes`: `select recipient_id, count(*) from kudos where status='published' group by recipient_id` joined to profile name/avatar; cap to a sane max (e.g. 150) for layout.
- Validation (≤100 chars, non-empty) enforced both client (A3) and in `searchSunners` (defensive).

## Implementation steps
1. `getKudosTotal` (published count).
2. `getSpotlightNodes` (recipient aggregation + profile join, capped).
3. `searchSunners(term)` with length/empty guards (throw typed error for empty/over-long).
4. Hooks; expose loading/empty states for the cloud.
5. Build/typecheck.

## Todo
- [x] `getKudosTotal`
- [x] `getSpotlightNodes` (capped recipient aggregation)
- [x] `searchSunners` (≤100, non-empty guards)
- [x] spotlight hooks (total/nodes/search) + loading/empty states
- [x] Build/typecheck green

## Success criteria
- Total count matches seed; updates live on new kudo.
- Search returns matches; 101 chars rejected; empty blocked with required message.
- Empty data → spotlight empty state.

## Security
- Read-only; parameterized ilike; length-bound input.

## Next steps
C1 wires total/nodes/search into A3; realtime increments the count.
