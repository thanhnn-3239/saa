# 2026-06-06 — Takumi: CSS Token Standardization (issue #8)

Branch `refactor/css-token-standardization` · commit `184804a` · status: committed (not pushed).

## What shipped
8 highest-traffic components migrated from inline `style` → Tailwind v4 `@theme` token + utility classes. **−642 net lines.** `@theme` expanded (golds, ink, error, explicit alpha tokens, shadow-glow), `--color-saa-gold #c9a84c` deprecated. ESLint warn guard (`react/forbid-dom-props` + `forbid-component-props` for `style`). New `docs/styling-conventions.md`.

Verified: `pnpm build` PASS · 275/275 tests · lint 0 errors / 54 warnings (deferred files, expected) · live Playwright screenshot gate @1512w = zero visual diff (homepage, FAB pill, Thể lệ panel).

## The hard part — a false regression that was real verification working
Mid-refactor the FAB pill + hero CTA rendered **transparent** instead of gold. The screenshot gate caught it. Chased it down:
- Class `bg-saa-gold-accent` was correctly applied, but computed `rgba(0,0,0,0)`.
- Stock utilities (`rounded-full`, `w-[106px]`) worked; **pre-existing** `@theme` tokens generated; only **newly-added** tokens didn't.
- **Root cause: Tailwind v4 + Turbopack does not regenerate utilities when `@theme` tokens change** — not on HMR, not on a plain `next dev` restart. Only wiping the `.next` build cache forces it. Production `pnpm build` is always clean.

A plain server restart did NOT fix it (Turbopack reused `.next/cache`); a cache wipe did. The implementer's code was correct the whole time — the dev server was lying. Lesson: when a Tailwind v4 `@theme` change "doesn't apply," wipe the build cache before suspecting the code.

## What the screenshot gate could NOT catch
Reviewer flagged it: bare `transition-opacity`/`transition-colors` default to 150ms cubic-bezier, but the originals were `200ms ease`. Static-frame screenshots don't capture animation timing. Fixed 6 FAB/panel buttons with `duration-200 ease-[ease]`. (Header/footer links were already Tailwind `transition-*` in the original — left alone; the reviewer over-flagged those.)

## Process notes
- Login-required gating now covers all routes → had to temporarily relax `PUBLIC_PATHS` so guest Playwright could screenshot the marketing pages; reverted via `git checkout` before commit (never committed).
- project-manager subagent died on a transient socket error; completed the plan reconciliation directly rather than re-spawn.

## Deferred (follow-up issue)
Shared UI primitives (Button/Text); remaining 15 files (login/_components, components/header, language-switcher, coming-soon — covered by the warn guard); palette consolidation (collapse gold drift to one token — deliberate visual PR).
