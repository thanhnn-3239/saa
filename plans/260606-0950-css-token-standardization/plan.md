---
title: CSS token standardization — reduce inline styles, Tailwind v4 theme tokens
status: completed
created: 2026-06-06
issue: https://github.com/thanhnn-3239/saa/issues/8
mode: fast (design pre-sealed via brainstorm consultation)
blockedBy: []
blocks: []
---

# Blueprint — CSS Token Standardization (issue #8)

Reduce 165 inline `style` usages across 23 files; drive styling through Tailwind v4
`@theme` tokens + utilities. **Principle: MIRROR CURRENT RENDER — zero visual change.**
Drift is *named* as distinct tokens, not erased.

Sealed design: [brainstorm report](../reports/brainstorm-260606-0950-css-token-standardization.md) (authoritative).

## Locked decisions (from consultation)
- **Token source** = mirror current render. Zero visual change. Drift kept as distinct tokens.
- **Scope** = complete `@theme` + convention doc + refactor top 8 files + lint-warn guard.
- **Enforcement** = ESLint `style` rule at **warn** (not error), `eslint-disable` for dynamic.
- **Shared UI primitives** = DEFERRED to follow-up.

## Phases
| # | Phase | Status | Depends |
|---|-------|--------|---------|
| 1 | [Token catalog — complete `@theme`](phase-01-token-catalog.md) | ✅ completed | — |
| 2 | [Convention doc](phase-02-convention-doc.md) | ✅ completed | 1 |
| 3 | [Refactor round-1 files (8) + screenshot gate](phase-03-refactor-round1.md) | ✅ completed | 1, 2 |
| 4 | [ESLint warn guard + verify (build/lint)](phase-04-guard-and-verify.md) | ✅ completed | 3 |

## Round-1 files (≈114 / 165 inline styles, ~69%)
the-le-panel (32) · hero-section (23) · kudos-section (14) · floating-widget-button (11) ·
app-header (9) · app-footer (9) · root-further-content (8) · award-card (8)

## Out of scope (deferred follow-up)
- Shared UI primitives (Button, Text/Heading, SectionContainer).
- Remaining 15 files (login/_components, components/header, language-switcher, coming-soon) —
  migrate opportunistically; covered by the lint-warn guard once it lands.
- Palette consolidation (collapsing gold drift) — deliberate later PR, NOT this round.

## Key dependencies / constraints
- Tailwind v4: theme in `app/globals.css` `@theme` block, NO `tailwind.config.js`.
- pnpm. `pnpm build` + `pnpm lint` must be green at the end.
- Acceptance bar per refactored file: before/after Playwright screenshot, zero visual diff.

## Success criteria
- `@theme` covers all repeated design values; round-1 files retain only truly-dynamic inline styles.
- Convention doc merged; ESLint warn guard active.
- `pnpm build` + `pnpm lint` green; screenshots identical pre/post for each round-1 file.

## Session notes (2026-06-06 — delivered)
- **Result:** all 8 round-1 files migrated — ZERO inline `style` props remain. −642 net lines. `pnpm build` PASS, 275/275 tests, lint 0 errors / 54 warnings (deferred files, expected). Live Playwright screenshot gate @1512w confirmed zero visual change (homepage, FAB pill, Thể lệ panel).
- **⚠ Tailwind v4 + Turbopack `@theme` cache gotcha:** changing `@theme` tokens does NOT regenerate utilities on HMR or even a plain `next dev` restart — only wiping the `.next` build cache forces it. Mid-session this looked like a regression (new token utilities rendered transparent) until cache wipe. Production `pnpm build` is always clean. **Devs editing `@theme` must wipe the build cache.** (Documented in docs/styling-conventions.md.)
- **Reviewer fixes applied:** restored `duration-200 ease-[ease]` on 6 FAB/panel buttons (matched original inline `200ms ease` — bare `transition-*` defaults to 150ms cubic-bezier); hero content `z-[1]` (was `z-10`). Header/footer links were already `transition-* hover:opacity-80` in the original — left unchanged.
- **Deferred follow-up (new issue):** shared UI primitives (Button/Text); remaining 15 files (login/_components, components/header, language-switcher, coming-soon) — covered by the lint-warn guard; palette consolidation (collapse gold drift `#FFEA9E`/`#FAE287`/`#FFD221` to one token — deliberate visual PR).
