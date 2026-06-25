---
title: "Hệ thống giải — SAA 2025 Awards System page (/he-thong-giai)"
description: "Login-gated awards page: hero + 6 award cards + sticky scroll-spy nav + Kudos promo; replaces /awards-information."
status: completed
priority: P2
effort: 9h
branch: worktree-he-thong-giai
tags: [nextjs, app-router, i18n, momorph, awards, scroll-spy]
created: 2026-06-11
completed: 2026-06-11
blockedBy: []
blocks: []
---

# Hệ thống giải — SAA 2025 Awards System page

New route `/he-thong-giai` replacing the `/awards-information` stub. Login-gated.
Layout top→bottom: keyvisual hero → title block → two-column (sticky scroll-spy
left nav + 6 award info cards) → Sun* Kudos promo banner.

## MoMorph refs
- Hệ thống giải: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/zFYDgyj_pD
  (fileKey 9ypp4enmFmdK3YAFJLIu6C, screenId zFYDgyj_pD, figma node 313:8436)
- Clarifications: ./clarifications.md (7 authoritative decisions)

## Two-track shape (sk:plan / MoMorph)
Track A (UI) and Track B (logic) are **parallel-runnable** — NO blocks between them.
Integration phase consumes both. `tkm:takumi` will spawn Track A UI subagents at runtime.

```
Track A (UI) ─────────────────┐
  phase-01 (screen UI)        ├──► phase-05 (integration) ──► phase-06 (tests)
Track B (logic) ──────────────┘
  phase-02 routing+auth+nav
  phase-03 data config + i18n
  phase-04 scroll-spy behavior
```

## Phases
| # | Track | Phase | Status | Link |
|---|-------|-------|--------|------|
| 01 | A | UI: screen from Figma (cards, menu, hero, kudos banner) | completed | [phase-01](phase-01-ui-screen.md) |
| 02 | B | Routing, redirect, auth gating, header nav label | completed | [phase-02](phase-02-routing-auth-nav.md) |
| 03 | B | Award data config + i18n messages (vi/en) | completed | [phase-03](phase-03-data-config-i18n.md) |
| 04 | B | Scroll-spy + smooth-scroll navigation behavior | completed | [phase-04](phase-04-scroll-spy-behavior.md) |
| 05 | A+B | Integration: wire real data, nav, auth, anchors | completed | [phase-05](phase-05-integration.md) |
| 06 | — | Tests & verification (build/lint/i18n parity + 15 TC checklist) | completed | [phase-06](phase-06-tests-verification.md) |

## Key dependencies
- phase-05 depends on phase-01, phase-02, phase-03, phase-04 (all complete).
- phase-06 depends on phase-05.
- phase-02/03/04 are independent of each other AND of phase-01 (run in parallel).
- Track A (01) and Track B (02/03/04) MUST NOT block each other.

## Cross-cutting constraints
- Auth gating is FREE: `proxy-session.ts` allowlist already redirects all non-public
  paths to `/login`. Page adds `getSessionUser()` defense-in-depth only. No proxy edit.
- DRY: reuse existing `Home.awards.*` i18n keys + `AWARD_CATEGORIES` slugs (already match
  the 6 menu items). Add only NEW fields (quantity/value) + page-chrome strings.
- Styling: docs/styling-conventions.md — Tailwind tokens, no inline styles except
  runtime-computed. Files <200 lines (split components). Names kebab-case.
- i18n parity test (messages/messages.test.ts): vi.json/en.json key trees must match.
