# MoMorph Blueprint: Hệ thống giải Awards Page — Two-Track Plan Finalized

**Date**: 2026-06-11 13:54
**Severity**: Medium
**Component**: Planning (MoMorph page, /he-thong-giai, no code yet)
**Status**: Resolved / Pending Execution

## What Happened

Completed full clarification protocol and planning for SAA 2025 awards system page. Fetched 22 specs + 15 test cases from MoMorph (screenId zFYDgyj_pD, fileKey 9ypp4enmFmdK3YAFJLIu6C). Resolved 7 ambiguities via decision protocol. Generated 6-phase MoMorph two-track plan (UI parallel to backend logic) in dedicated git worktree `he-thong-giai`.

## Key Decisions Locked

1. **Route Strategy**: /he-thong-giai replaces /awards-information stub. ROUTES.awardsInfo renamed + 301 redirect from old path.
2. **Auth Gating**: Login-required (proxy session check built-in). No special logic needed — existing allowlist in `proxy-session.ts` already redirects non-public paths to /login.
3. **Navigation UX**: Sticky left menu with IntersectionObserver scroll-spy. Removed on mobile (cards-only vertical layout).
4. **Data Source**: Static config array (lib/awards) + i18n messages (vi.json + en.json). No DB queries. Reuses existing AWARD_CATEGORIES slugs and Home.awards.* keys (DRY).
5. **"Chi tiết" Button**: Kudos banner link goes to /sun-kudos (same tab).
6. **i18n**: English auto-translated during implementation; award names stay English.

## Technical Plan Shape

**Track A (UI, momorph-implement-design runtime):**
- phase-01: Screen components from Figma design (hero, card grid, menu, kudos banner). Mock data direct from design. ≤30 lines phase file (minimal instruction).

**Track B (Backend/Logic, orchestrator-driven, parallel to A):**
- phase-02: Routing, auth, nav label binding.
- phase-03: Award data config + i18n keys.
- phase-04: Scroll-spy IntersectionObserver + smooth scroll wiring.

**Sequential Back-half:**
- phase-05: Integration — replace mock data, wire handlers, anchor nav.
- phase-06: Tests (build/lint/i18n parity + 15 TC checklist).

No cross-track blocks. Track A and B run free. Integration happens as outputs available.

## Risk Caught & Mitigated

**Route rename breaks lib/navigation/routes.test.ts**: Hard-asserts /awards-information path. Scoped into phase-02 fix (add new path case, deprecate old).

## Lessons & Why This Matters

1. **Auth Gating Was Free**: Spent 0 lines of code. Existing proxy session allowlist already handles redirect. Lesson: audit existing middleware before adding auth scaffolding.
2. **DRY Reuse Wins**: AWARD_CATEGORIES slugs already match 6 menu items. Home.awards.* i18n keys already exist. Adding only NEW fields (quantity/value) reduces scope. Lesson: full spec scan for existing assets saves 2-3h per feature.
3. **Clarification Protocol Prevents Rework**: 7 decisions locked upfront. No "wait, should menu be sticky?" mid-implementation. Lesson: structured ambiguity resolution is 100x better than ping-pong Slack debates.

## Next Steps

- Activate `/tkm:takumi` to spawn Track A UI subagent + begin Track B backend implementation (parallel).
- set-active-plan.cjs script missing (not in repo) — active-plan.json state not set. Not blocking; orchestrator tracks plan context via cmdline.
- Test route rename doesn't break supabase/proxy-session.ts logic — phase-02 owns validation.

---

**Status:** DONE
**Summary:** MoMorph two-track plan for Hệ thống giải page finalized with 7 locked decisions and risk mitigation. Ready for `/tkm:takumi` execution (UI and backend run parallel, integration phase follows).
