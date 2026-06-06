# 2026-06-06 — Consultation + Blueprint: CSS Token Standardization (issue #8)

## What
Brainstorm consultation on issue #8 (reduce inline styles → Tailwind v4 `@theme` tokens),
then a sealed implementation blueprint. No code changed — planning only.

## Workshop read (the real state)
- 165 inline `style` usages across 23 files (heaviest: the-le-panel 32, hero 23, kudos 14).
- **Decisive finding:** `@theme` tokens don't match shipped UI — `--color-saa-gold: #c9a84c`
  but components render `#FFEA9E`/`#FAE287`/`#FFD221`. The tokens describe a palette the UI
  doesn't use. That reframed the problem from "inline vs utility" to "tokens aren't the source
  of truth yet."
- All components Figma/MoMorph-generated (`mm:` node IDs) → inline values are baked-in design.
- Typography signature (`fontFamily: Montserrat…`) repeated 55×, maps cleanly to stock Tailwind.

## Decisions sealed (via AskUserQuestion)
1. Token source = **mirror current render** (zero visual change; drift named, not erased).
2. Scope = `@theme` + convention doc + refactor top 8 files + lint-warn guard.
3. Enforcement = ESLint **warn** (not error).
4. Shared UI primitives = **deferred**.

## Craft call made
For repeated rgba-opacity variants, use **explicit alpha tokens**, not Tailwind's `/N` modifier —
`/N` compiles to `color-mix(oklab)`, which isn't byte-identical to authored `rgba()`. Honoring the
zero-visual-change promise required this. Screenshot gate per file backs it up.

## Output
- Consultation record: `plans/reports/brainstorm-260606-0950-css-token-standardization.md`
- Blueprint: `plans/260606-0950-css-token-standardization/` (plan + 4 phases)

## Lesson
"Standardize CSS" looked like a mechanical cleanup; the hidden complexity was that the existing
tokens were *wrong*, so the first real decision was which artifact is authoritative — the tokens
or the shipped pixels. Surfacing that fork before touching code is what the consultation bought.

## Open follow-ups
- Palette consolidation (collapse gold drift to one token) — deliberate visual PR, later.
- Shared UI primitives + remaining 15 files.
- Decide keep-vs-migrate for the 2 `#c9a84c` live uses (leaning keep+deprecate).
