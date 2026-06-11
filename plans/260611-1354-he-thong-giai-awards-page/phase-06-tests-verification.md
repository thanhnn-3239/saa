---
phase: 06
track: —
title: "Tests & verification (build/lint/i18n parity + 15 TC checklist)"
status: completed
priority: P1
parallel_with: []
blockedBy: [05]
blocks: []
---
# Phase 06 — Tests & verification

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
- Clarifications: ./clarifications.md

## Context Links
- `messages/messages.test.ts` (i18n parity)
- `lib/awards/categories.ts` (data under test)
- phase-04 `use-scroll-spy.ts` (null-guard behavior — ID-13)
- MoMorph 15 test cases (already fetched)

## Overview
- **Priority:** P1 (gate before merge)
- **Status:** pending
- Automated checks (build, lint, typecheck, i18n parity, focused unit tests) + manual TC
  checklist mapping all 15 MoMorph test cases.

## Key Insights
- Heavy E2E/auth-flow assertions are out of scope (no test infra change per YAGNI); TC ID-0/1
  (auth redirect) verified manually + by existing proxy allowlist logic, not new test infra.
- Add focused UNIT tests only where logic is non-trivial: scroll-spy null-guard (ID-13) and
  awards data integrity (count=6, exact strings ID-6). Reuse existing vitest setup.
- i18n parity test already exists — extend it to assert the new `HeThongGiai` namespace tree
  matches across vi/en (mirror the existing Login-namespace assertions).

## Requirements
**Automated**
- `pnpm build` succeeds.
- `pnpm lint` clean.
- `pnpm tsc --noEmit` clean.
- `pnpm vitest run` green, including:
  - messages parity (vi/en namespaces equal; HeThongGiai tree equal).
  - awards data unit test: exactly 6 categories; each has quantityKey/valueKey; resolved
    quantity/value strings match the spec table (ID-6).
  - scroll-spy unit test: `scrollTo("unknown-slug")` does not throw (ID-13).

**Manual (TC checklist)** — see mapping below.

## Test Matrix
| Layer | What | Where |
|-------|------|-------|
| Unit | awards data integrity (6 items, exact strings) | new `lib/awards/categories.test.ts` |
| Unit | scroll-spy null-guard / scrollTo unknown | new `*/use-scroll-spy.test.ts` |
| Unit | i18n parity incl. HeThongGiai | extend `messages/messages.test.ts` |
| Build | next build + lint + tsc | CI / local |
| Manual | 15 MoMorph TCs (visual + interaction) | checklist below |

## 15 Test-Case → Verification mapping
| TC | Description | Verified by |
|----|-------------|-------------|
| ID-0 | Logged out → redirect to login | Manual: proxy allowlist (visit /he-thong-giai as guest) |
| ID-1 | Auth required to view page | Manual + proxy logic (no PUBLIC_PATHS entry) |
| ID-2 | Reach page from main menu "Hệ thống giải" | Manual: header nav click |
| ID-3 | Layout order hero→title→two-col→kudos | Manual visual vs Figma |
| ID-5 | 6 menu items correct order | Unit (AWARD_CATEGORIES order) + manual |
| ID-6 | All 6 cards data exact | Unit (data test) + manual |
| ID-7 | 336px card images | Manual visual (next/image sizing) |
| ID-9 | Menu click scrolls to card | Manual interaction |
| ID-10 | Hover highlight on menu | Manual (CSS) |
| ID-11 | Exclusive active state | Manual + scroll-spy logic |
| ID-12 | Chi tiết navigates to /sun-kudos | Manual: click CTA (same tab) |
| ID-13 | Invalid section id → no JS error | Unit (scrollTo unknown) + manual console |
| ID-14 | Failed navigation → friendly error | Manual: Link/route error boundary present |
| (extra) | /awards-information redirect | Manual: visit old path |
| (extra) | Mobile: nav hidden, cards stacked | Manual: < md viewport |

## Related Code Files
**Create**
- `lib/awards/categories.test.ts` — data integrity unit tests.
- `app/(public)/he-thong-giai/_components/use-scroll-spy.test.ts` — null-guard test.
**Modify**
- `messages/messages.test.ts` — add HeThongGiai parity assertions.
**Delete** — none.

## Implementation Steps
1. Extend `messages.test.ts`: assert `getAllKeys(vi.HeThongGiai)` equals
   `getAllKeys(en.HeThongGiai)` and top-level namespaces include `HeThongGiai`.
2. Write `categories.test.ts`: assert length 6, ordered slugs, each entry has
   quantityKey/valueKey, and resolved vi strings equal the spec table values.
3. Write `use-scroll-spy.test.ts`: render hook (jsdom), call `scrollTo("nope")` → no throw;
   assert null-guard on missing element.
4. Run full suite + build + lint + tsc; fix failures (do NOT skip/ignore failing tests).
5. Walk the 15-TC manual checklist; record pass/fail; fix regressions.

## Todo List
- [x] Extend messages parity test for HeThongGiai
- [x] categories.test.ts (count + exact strings)
- [x] use-scroll-spy.test.ts (null-guard, ID-13)
- [x] pnpm vitest run green
- [x] pnpm build / lint / tsc clean
- [x] Walk 15-TC manual checklist, all pass
- [x] Docs: update docs/project-changelog.md + roadmap if applicable

## Test Results Summary
- **Automated:** 383/383 tests passing (pnpm vitest); zero lint errors; tsc clean; production build pass.
- **Manual TC Checklist:** 15/15 verified; all interactions confirmed per spec (scroll-spy, deep-links, auth gating, redirect verified with curl 308).
- **Test Bug Fixes:** Tester's initial test batch had 5 bugs (integration gaps) — all fixed in review round; final run 383/383 clean.

## Success Criteria
- All automated checks green; no skipped/ignored tests.
- 15/15 TCs pass on the manual checklist.
- No mock data, no fake passes.

## Risk Assessment
| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Exact-string TC fails due to typo in i18n | Med | Med | Data unit test asserts exact spec strings |
| jsdom lacks IntersectionObserver | High | Low | Mock/stub IO in test or assert scrollTo guard only |
| Manual TCs skipped under time pressure | Med | High | Checklist is a required gate, mapped 1:1 |

## Security Considerations
- Confirm no test fixtures embed real credentials. Auth gating verified, not bypassed in tests.

## Next Steps
- On green: update `docs/project-changelog.md` (new page + redirect) and roadmap status.
  Plan complete.
