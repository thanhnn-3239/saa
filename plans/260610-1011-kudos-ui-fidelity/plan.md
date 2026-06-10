---
title: "Sun* Kudos Live Board — UI Fidelity Fixes"
description: "Align 4 board components (search, filter trigger, kudo cards, sidebar secret box) to the Figma design."
status: completed
priority: P2
effort: 4h
branch: feat/sun-kudos-live-board
tags: [sun-kudos, ui, fidelity, frontend, tailwind]
created: 2026-06-10
completed: 2026-06-10
---

# Sun* Kudos Live Board — UI Fidelity Fixes

Close 4 design-fidelity gaps found by brainstorm diff analysis. Design ref: screenId `MaZUn5xHXZ`, fileKey `9ypp4enmFmdK3YAFJLIu6C`.

**Source analysis:** [`plans/reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md`](../reports/brainstorm-260610-1011-kudos-ui-fidelity-diffs.md)

## Context
- Page is OAuth-gated; verify in-browser by logging in locally (`localhost:3000/sun-kudos`) after each phase.
- Next.js App Router — read `node_modules/next/dist/docs/` before non-trivial code (per AGENTS.md).
- Tailwind v4 `@theme` tokens in `app/globals.css` (`saa-gold-*`, `saa-navy-*`). Reuse tokens, no raw hex unless design demands.
- Tests: `tests/sun-kudos/`. Add/adjust component tests where behavior changes.

## Phases (independent — runnable in any order / parallel)

| # | Phase | Effort | Status | File |
|---|-------|--------|--------|------|
| 1 | Search input double-✕ fix | trivial (~20m) | done | [phase-01](phase-01-search-double-x.md) |
| 2 | Filter dropdown closed trigger | small (~40m) | done | [phase-02](phase-02-filter-trigger.md) |
| 3 | Unify highlight + feed kudo cards | moderate (~2h) | done | [phase-03](phase-03-unify-kudo-cards.md) |
| 4 | Sidebar secret-box block | small (~40m) | done | [phase-04](phase-04-sidebar-secretbox.md) |

## Key dependencies
- None between phases (each touches distinct files). Phase 3 is the only structural refactor.
- Shared UI primitives in `app/(public)/sun-kudos/_components/ui/` (avatar, heart-button, hashtag-chip, hero-title-pill, copy-link-button, stars-indicator) are reused — do not fork them.

## Out of scope / deferred (open questions)
- **"IDOL GIỎI TRẺ" title** on cards — no backing data column (`kudos` table has no title/category; `awards` catalog not FK'd). Needs product/data decision before rendering.
- **Feed owner edit-pencil** — owner-only action; not among the 4 reported issues. Confirm scope before adding.

## Definition of done
All 4 phases pass their success criteria, `pnpm build` + `pnpm lint` clean, `tests/sun-kudos/` green, and visual parity confirmed against design in-browser.

## Outcome
All 4 phases implemented and verified. **Tester report** (`tester-260610-1030-kudos-ui-fidelity.md`): 341 tests green, `pnpm build` clean. **Reviewer report** (`reviewer-260610-1030-kudos-ui-fidelity.md`): 8/10, 0 critical/major, 3 minor (all non-actionable). **Smoke test**: New `kudo-card-base.test.tsx` (7 tests) validates variant wiring. Visual parity confirmed against design across all 4 components.
