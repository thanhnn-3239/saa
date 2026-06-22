# Viết Kudo Send-Dialog Implementation: Two-Track Execution & Critical Review Catches

**Date**: 2026-06-11 14:00
**Severity**: High (privacy breach + inoperable feature caught at review, not test)
**Component**: Kudos send-dialog UI, API mutation, database migration
**Status**: Resolved (pre-commit)

## What Happened

Executed the full takumi pipeline for send-dialog on `feat/viet-kudo-send-dialog` branch. Ran two tracks in true parallel: UI agent (Track A) built Tiptap editor + recipient field + board wiring in background; main thread (Track B) executed database migration (B1) + data layer (B2) concurrently. Track A completed first; no blocking merge point. Built 543 tests (all green). First review flagged **2 critical bugs the test suite missed**, forcing a full fix-and-re-review cycle.

## The Brutal Truth

This is the worst kind of false confidence: tests passing while core features are completely broken. The recipient-field dropdown never rendered—Gửi button stayed disabled for every real user interaction, yet tests passed because they tested validation logic in isolation, not the wired component. Worse: anonymous kudos exposed the sender's full identity across the feed API—a privacy breach hiding in plain sight in the hydration layer. We had 172 tests. None of them caught either issue. That's a scalding failure of test strategy.

The review phase is what actually verified the product worked. That's a red flag.

## Technical Details

**Migration (B1):** Added `kudos.title`, `kudos.anonymous_name` columns; dropped old `create_kudo()` signature to avoid PostgreSQL ambiguity (explicit `DROP FUNCTION` before recreate, no `CREATE OR REPLACE` overload). Verified via db reset + psql. Server body cap set to 10,000 raw HTML (client sends 2,000 text chars; markup inflation ~5x).

**Data layer (B2):** 5 new files (`create-kudo.ts`, `update-kudo-draft.ts`, etc.); mutation wired via POST `/api/kudos` following toggle precedent from planning. Settled the open question: direct API route, not RPC.

**UI (C1, Track A background agent):** Tiptap editor + container + board wiring + i18n. Agent returned `DONE_WITH_CONCERNS`: hashtag dropdown rendered with `fixed` positioning but no anchor coordinates (floating top-left, invisible). Orchestrator fixed it before review by anchoring the popover inside `HashtagField`.

**First review outcome (6/10 FIX-FIRST):**
1. **CRITICAL**: `recipient-field` declared `options` + `onSelect` props; never destructured or rendered the dropdown. `Gửi` button stayed disabled always. Tests passed because they tested `validateRecipient()` predicate (mocked), not component wiring.
2. **CRITICAL**: Anonymous kudos returned `sender: { id, fullName, avatarUrl }` in feed API response—full identity leak. Masked at hydration in `hydrateKudoCard()`, but shouldn't have leaked at all.
3. 5 MAJOR: imagePaths ownership validation missing, `javascript:` link hrefs unescaped, singleton Tiptap renderer (memory leak), blob URL lifecycle, dead placeholder file.
4. 5 MEDIUM: minor UX + i18n issues.

Fix implementer resolved all 11; second review: 9/10 SHIP (orchestrator added i18n to 4 stray aria-labels → W1 wave). Final test run: 543/543 green.

## What We Tried

- **Test isolation vs. integration:** Wrote 172 unit tests covering validation, mutation shape, response hydration. Missed the props-to-render path entirely. No test exercised "user picks recipient → clicks Gửi → mutation fires."
- **First review as safety net:** Worked, but barely. Reviewer manually traced React props and caught the recipient-field dead code + privacy hydration bug that 172 tests missed.
- **Anonymous kudos masking:** Initially masked only in one hydration function. Should have been masked at the API layer (single choke point).

## Root Cause Analysis

1. **Test suite tested predicates, not flows.** Tests verified `validateRecipient()` returns the right boolean; never verified that the recipient dropdown actually renders and its `onSelect` handler fires. Test framework captured component props but not component render logic.
2. **Privacy by assumption, not construction.** Code assumed "only hydration can see the raw sender ID"—but the API response was already the source of truth. Should have masked before serializing to JSON.
3. **Missing acceptance criteria.** Plan had "send dialog submits kudo" but no explicit "recipient field must be interactive and functional"; tests followed that gap.

## Lessons Learned

- **"Tests are green" is not a deployment signal.** It means the assertions you wrote passed. You didn't assert the user's actual workflow. Next time: require at least one E2E test per major user action (select recipient → submit) alongside unit tests.
- **Privacy by hydration is not privacy by design.** Masking at the response layer (single choke point, before JSON serialization) is stronger than masking in N rendering functions. One place to audit, one place to break.
- **Props declared but never used = code smell.** Reviewer caught `options` + `onSelect` sitting unused; props are a contract. Add a lint rule or require destructuring comment-out.
- **Review-driven bug finding is expensive.** We shipped 11 bugs into review and burned an entire fix cycle. Earlier spot-checks on critical paths (recipient field interaction, API response inspection) would have caught these in implementation.

## Next Steps

- User manually inspected the working tree (uncommitted). Ready to commit on user signal.
- Add flow-based tests to project-testing strategy: require at least one test per user action (end-to-end or integration-level), not just unit tests.
- Document "privacy by construction" in security guidelines: mask sensitive fields before serialization, not during rendering.
- Lint rule: flag unused component props (eslint custom).

---

**Status:** DONE
**Summary:** Parallel two-track execution succeeded, but review uncovered 2 critical bugs (inoperable recipient dropdown, privacy leak in feed response) that 172 passing tests missed—revealing test strategy gaps and enforcing a fix-and-re-review cycle before delivery.
