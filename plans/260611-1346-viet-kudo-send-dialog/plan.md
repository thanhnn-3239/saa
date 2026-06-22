---
title: "Viết Kudo — send-kudos modal"
description: "Modal to compose and send a kudo (recipient, title, rich body, hashtags, images, anonymous) wired into the Sun* Kudos board."
status: completed
priority: P2
effort: 16h
branch: feat/viet-kudo-send-dialog
mode: standard
package_manager: pnpm
blockedBy: []
blocks: []
tags: [sun-kudos, modal, tiptap, supabase, next16]
created: 2026-06-11
completed: 2026-06-11
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screen: "Viết Kudo"
  screenId: ihQ26W78P2
---

# Viết Kudo — send-kudos modal

Modal "Gửi lời cám ơn và ghi nhận đến đồng đội" opened from the Kudos board banner. Fields: recipient (autocomplete, single, exclude self), title (required, card title), Tiptap rich body (≤2000, sanitized HTML), hashtags (1..5 existing-only), images (0..5, jpg/png/webp ≤5MB), anonymous toggle (+ optional alias). On submit: upload images → `create_kudo` RPC → toast + close; board auto-updates via existing Supabase Realtime.

## Phases

| # | Phase | Track | Depends on | Status |
|---|-------|-------|-----------|--------|
| A1 | [Modal UI (static, mock data)](phase-a1-viet-kudo-modal-ui.md) | A | — | done |
| B1 | [DB migration: title + anonymous_name](phase-b1-db-migration-title-anonymous-name.md) | B | — | done |
| B2 | [Send-kudo data layer](phase-b2-send-kudo-data-layer.md) | B | B1 | done |
| C1 | [Integration (wire modal + Tiptap + submit + board render)](phase-c1-integration.md) | A+B | A1, B2 | done |
| C2 | [Tests](phase-c2-tests.md) | — | C1 | done |

Track A (A1) and Track B (B1→B2) are parallel-runnable — no cross-track blocks. C1 integrates both.

## Context

- Builds on **260606-1325-sun-kudos-live-board** — this feature was its explicit out-of-scope stub: `onOpenSendDialog` (noop at `kudos-board.tsx:256`) is the integration point.
- Resolves the open "title" question from **260610-1011-kudos-ui-fidelity** — design's "IDOL GIỎI TRẺ" card title now backed by real `kudos.title` column (`KudoCard.title` is already declared dormant in `types.ts:43`).
- Clarifications (authoritative): `clarifications.md`.
- MoMorph screen "Viết Kudo": https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/ihQ26W78P2

## Locked decisions

| # | Decision |
|---|----------|
| 1 | Add `kudos.title` (required in form, ≤100) → renders as card title on board |
| 2 | Tiptap editor; store sanitized HTML in `kudos.body` (≤2000); board renders sanitized HTML |
| 3 | Add `kudos.anonymous_name` (nullable); checkbox reveals optional alias input; board shows alias or "Ẩn danh" |
| 4 | Hashtags: existing-only picker from `hashtags` table (no create-new) |
| 5 | Mention visual-only (no notifications); images jpg/png/webp ≤5MB max 5; self-kudo blocked (DB check + search self-exclusion) |

## Key dependencies

- New packages: `@tiptap/react @tiptap/starter-kit @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-placeholder` (+ `@tiptap/suggestion`), `isomorphic-dompurify`.
- Reuse: `searchSunners` (`lib/kudos/spotlight-queries.ts`), `getHashtags`/`/api/kudos/filters`, storage bucket `kudo-images`, `create_kudo` RPC, Realtime, `_components/ui/*` primitives, `kudo-card-base.tsx`.
- ⚠️ Next.js 16 breaking changes — read `node_modules/next/dist/docs/` before coding (async `cookies()`, `proxy.ts` not middleware).

## Out of scope

Notifications on mention; kudo detail page; create-new hashtag; secret box; edit/delete kudo.

## Outcome & Deviations

**Status:** All phases completed on 2026-06-11. Feature shipped with review cycle closure.

**A1 (Modal UI):** 10 presentational components + send-kudo-types.ts + index.ts in `_components/send-dialog/` + 11 SVGs in `public/viet-kudo/`. Later `kudo-body-editor-placeholder` deleted during C1 review fixes.

**B1 (DB Migration):** `supabase/migrations/20260611070000_kudo_title_anonymous_name.sql` created + applied clean via `supabase db reset`. New `create_kudo` signature verified via psql. Old 6-param signature dropped; explicit grant added. **Deviation:** server body guard set to 10000 raw HTML chars (not 2000) — client enforces 2000 TEXT chars; HTML markup from Tiptap inflates raw length.

**B2 (Data Layer):** All files created: `use-recipient-search.ts` (internal 300ms debounce), `use-hashtag-options.ts`, `upload-kudo-images.ts`, `sanitize-html.ts`, `use-create-kudo.ts`. Types/hydrate/queries edited (buildKudoSelect/spotlight-queries excludeUserId, spotlight route excludeSelf=1). **Deviations:** (1) Mutation pattern = API route (`POST app/api/kudos/route.ts`) following toggle-like precedent, not client-direct RPC. (2) Highlight candidate selects did not need title columns (only buildKudoSelect did). (3) Orphan-image policy = accept orphan in private bucket; documented in upload helper.

**C1 (Integration):** Tiptap editor (kudo-editor.tsx + kudo-editor-suggestion.ts + kudo-mention-list.tsx), community-standards-modal, send-kudo-dialog-container (366 lines accepted over-200 guideline), board wiring, card-base anonymous alias + sanitized HTML body, i18n vi+en under `Home.kudosPage.sendDialog`, prose styles in globals.css.

**C2 (Tests):** 6 new test files, 172 new tests (then +6 anonymous-masking = 543 total), 543/543 pass. Build + lint clean.

**Review cycle:** First review 6/10 FIX-FIRST (2 critical: recipient dropdown not rendered; anonymous sender identity leak in JSON). All 11 findings fixed (C1, C2, H1–H5, M1–M4) + W1 follow-up (4 aria-labels i18n'd). Re-review: 9/10 SHIP. Reports: `plans/reports/reviewer-260611-viet-kudo-send-dialog.md`, `plans/reports/tester-260611-viet-kudo-send-dialog.md`.

**Accepted/deferred items:** M5 (partial-upload orphans documented, no action), L1 (ProfileBrief duplication lib types vs send-kudo-types, accepted), L2 (double-trim, acceptable).
