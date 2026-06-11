---
title: Sun* Kudos Live Board — public board screen
date: 2026-06-06
status: completed
mode: hard
package_manager: pnpm
blockedBy: []
blocks: []
momorph:
  fileKey: 9ypp4enmFmdK3YAFJLIu6C
  screens:
    - { name: Sun* Kudos - Live board, screenId: MaZUn5xHXZ }
---

# Blueprint — Sun* Kudos Live Board

Build the **Sun\* Kudos Live Board** at `/sun-kudos` from the MoMorph design (64 specs, 41 test
cases): banner + "ghi nhận" input (A), Highlight Kudos carousel with hashtag/department filters (B),
simplified interactive Spotlight name-cloud (B.7), All Kudos infinite-scroll feed (C), and a right
sidebar with personal stats + leaderboards (D). Hearts/likes are the core interaction. Updates are
**live** via Supabase Realtime.

## Context
- Builds on completed: [homepage-saa](../260605-1529-homepage-saa/plan.md) (route group, header/footer,
  FAB, design tokens), [login-oauth](../260604-1415-login-google-oauth/plan.md), [i18n](../260604-1519-i18n-next-intl-setup/plan.md),
  [account-menu/login-gating](../260606-0802-account-menu-redesign-login-gating/plan.md). Replaces the
  `app/(public)/sun-kudos/page.tsx` coming-soon stub.
- MoMorph: `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/MaZUn5xHXZ` · [clarifications.md](clarifications.md)
- DB schema EXISTS (`supabase/migrations/20260604070000_schema.sql`): profiles, kudos, kudo_hashtags,
  kudo_images, hashtags, departments, badges, user_badges, secret_boxes, notifications, campaigns.
  **Missing: a likes/hearts table** → added in B1.
- ⚠️ Next.js 16: read `node_modules/next/dist/docs/` before coding. `proxy.ts` (not middleware),
  `cookies()` async, files at repo root (`app/`, `lib/`), Tailwind v4 `@theme` tokens in `app/globals.css`.

## Locked decisions (from clarification)
| Decision | Choice |
|----------|--------|
| Scope | **Board screen only**; send-dialog / detail / profile / secret-box = stubs |
| Hearts | `kudo_likes` table + toggle + credit-sender + one-per-user + no-self-like; **defer** special-day +2 |
| Live | **Supabase Realtime** (kudos + likes channels) |
| Spotlight | **Simplified cloud** (names sized by kudos received, search, click-to-detail; no pan/zoom physics) |
| Seed | **Include seed script** (sample profiles/kudos/likes/departments/secret-boxes/leaderboard) |
| Client data | **@tanstack/react-query** + Supabase realtime as cache update source |
| Carousel | `embla-carousel-react` · All-Kudos feed = cursor infinite scroll |

## Execution model (two parallel tracks)
Track A (UI) and Track B (data/logic) are **parallel-runnable — no cross-track blocking**. Within Track A,
A1 ships shared primitives first; A2–A5 then run in parallel. Integration (C1) wires UI → TanStack Query
hooks + realtime after both tracks land; tests (C2) follow.

## Phases
| # | Phase | Track | Status | Depends on |
|---|-------|-------|--------|-----------|
| B1 | [Data foundation: likes migration, RLS, views, TanStack provider, realtime helpers, seed](phase-b1-data-foundation.md) | B | ✅ done | — |
| B2 | [Feed & filters data: highlight top-5, all-kudos cursor query, hashtag/dept lists](phase-b2-feed-filters-data.md) | B | ✅ done | B1 |
| B3 | [Likes + stats logic: like toggle rules, stars tiers, sidebar stats, leaderboards](phase-b3-likes-stats-logic.md) | B | ✅ done | B1 |
| B4 | [Spotlight + search data: total count, recipient cloud aggregation, sunner search](phase-b4-spotlight-search-data.md) | B | ✅ done | B1 |
| A1 | [Board shell + Banner + shared primitives](phase-a1-board-shell-primitives.md) | A | ✅ done | — |
| A2 | [Highlight Kudos carousel + filters UI](phase-a2-highlight-carousel.md) | A | ✅ done | A1 (primitives) |
| A3 | [Spotlight cloud UI (simplified)](phase-a3-spotlight-cloud.md) | A | ✅ done | A1 (primitives) |
| A4 | [All Kudos feed + post card UI](phase-a4-all-kudos-feed.md) | A | ✅ done | A1 (primitives) |
| A5 | [Right sidebar: stats + leaderboards UI](phase-a5-sidebar-stats.md) | A | ✅ done | A1 (primitives) |
| C1 | [Integration: wire UI ↔ data, realtime, filters, auth, i18n](phase-c1-integration.md) | — | ✅ done | A2–A5, B2, B3, B4 |
| C2 | [Tests & validation](phase-c2-tests.md) | — | ✅ done | C1 |

## Key dependencies
- New deps: `@tanstack/react-query`, `embla-carousel-react`. New migration: `kudo_likes` + views + RLS.
- Supabase Realtime must be enabled on `kudos` + `kudo_likes` (publication). next-intl namespace `Kudos`.
- No new env vars expected.

## Out of scope (explicit)
Send-kudos compose dialog, kudos detail page, profile page, secret-box "Mở quà" flow, admin special-day
config, notifications backend. These remain stubs/coming-soon and need their own designs/plans.

## Outcome & Deviations

**Status:** Fully implemented and shipped — all 334 tests pass, build green, reviewer final score 8.5/10 SHIP.

**Execution summary:**
- **Data (B1–B4):** Migration `20260606000000_kudo_likes.sql` (77 LOC), seed (40 kudos, 12 profiles), 17 server/client data files created; 19 unit tests pass.
- **UI (A1–A5):** 19 components across banner, carousel, spotlight, feed, sidebar; all structured, presentational; visual validation vs Figma frame PASS (layout, typography, colors, spacing).
- **Integration (C1):** Real hooks wired, realtime channels (kudos + kudo_likes), filters, auth, i18n (44 keys in `Home.kudosPage` namespace), server prefetch+dehydrate; 2 critical fixes applied (REPLICA IDENTITY FULL, baseUrl threading).
- **Tests (C2):** 45 new tests (unit + component), 100% business-rule coverage (stars tiers, like guards, pagination, search validation); 334 total tests pass; build succeeds.

**Key deviations from blueprint:**
1. **REST route handlers exposed:** Track B implementations exposed API routes under `app/api/kudos/**` (feed, highlight, filters, like, sidebar, spotlight) for direct client consumption — an implementation detail that aligns with the route handler layer and simplifies the client-server boundary. All routes tested and properly gated.
2. **i18n namespace:** Kudos strings live under `Home.kudosPage` (not top-level `Kudos`) to maintain project i18n structure. All 44 keys present in both `messages/vi.json` and `messages/en.json`.
3. **getRecentPromotions approximation:** Implements "boundary snapshot" — queries profiles at tier thresholds (10/20/50 kudos received) sorted by most-recent kudo timestamp. Documented as v1 limitation (exact tier-crossing events would require a history table, out of scope).
4. **Spotlight Pan/Zoom button:** Renders as a visible control; v1 behavior is a no-op (no physics/force-directed layout — simplified cloud uses font-size scaling only).
5. **KV banner background:** S3 presigned URL expired before download; banner renders with CSS gradient fallback (`#00101A linear-gradient`) per Figma spec. Real image asset deferred to asset pipeline.

**Pre-deploy validation (open):**
- Migration `20260606000000_kudo_likes.sql` + seed require `supabase db reset` smoke-test on a live DB to verify:
  - `DO $$ … IF NOT EXISTS` realtime publication guard applies without error
  - `ALTER TABLE kudo_likes REPLICA IDENTITY FULL` sets successfully (required for realtime DELETE payloads)
  - `GRANT SELECT` on views to `authenticated`/`anon` resolves (critical for first-load success)
  - Seed produces consistent TOP-5 kudos by heart count
- **Foreign-key hint verification:** `profile_kudo_stats_profile_id_fkey` PostgREST join hint name must match actual constraint; verify with `\d profile_kudo_stats` on live DB before first deploy. If constraint name differs, spotlight and sidebar queries will return PostgREST 4xx (not silent data error — easy to diagnose).
- **Realtime payload shape:** Verify `kudo_likes` INSERT events include `{ kudo_id, user_id }` and DELETE events include full `old` row data (requires REPLICA IDENTITY FULL). If old row is missing, live heart-count decrements for other viewers will skip.

**Documented stubs (intentional, tracked as separate plans):**
- `onViewDetail` → kudos detail page (not designed)
- `onOpenProfile` → profile page (not designed)
- `onOpenImage` → lightbox/gallery (not designed)
- `onOpenSendDialog` → send-kudos dialog (not designed)
- `onOpenGift` → secret-box gift flow (not designed); renders as a toast placeholder in v1
- Special-day +2 hearts rule → deferred (column exists, always 1 for v1; admin config and trigger logic out of scope)
