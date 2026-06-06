# Brainstorm — CSS Token Standardization (issue #8)

- Date: 2026-06-06
- Issue: https://github.com/thanhnn-3239/saa/issues/8
- Status: design sealed, pending blueprint

## The commission

Reduce inline `style` usage, drive styling through Tailwind v4 `@theme` tokens consistently. Project is Tailwind v4 (CSS `@theme`, no `tailwind.config.js`), components Figma/MoMorph-generated with baked-in inline design values.

### Measured state (workshop read)
- 165 inline styles across 23 files. Heaviest: the-le-panel (32), hero-section (23), kudos-section (14), floating-widget-button (11), app-header (9), app-footer (9), root-further-content (8), award-card (8).
- **Token drift = the real problem:** globals.css defines `--color-saa-gold: #c9a84c` but UI renders `#FFEA9E` (×12), `#FAE287` (×5), `#FFD221` (×2) + rgba variants. Defined tokens describe a palette the UI doesn't use. Some tokens DO match shipped values (`#2e3940` border, `#00101a` navy).
- Typography: `fontFamily: "Montserrat"…` block repeated ×55 with near-identical size/weight/line-height.
- No `components/ui/` primitives. eslint.config.mjs present.

## Decisions (sealed via consultation)

| Fork | Choice |
|---|---|
| Token source of truth | **Mirror current render** — zero visual change; drift named as distinct tokens, not erased |
| Scope this round | **Convention + tokens + top files + guard** |
| Enforcement | **Lint warning** (not error) |
| Shared UI primitives | **Defer to follow-up** |

## Agreed direction

1. **Token layer (globals.css @theme):** reconcile existing tokens (reuse matching, deprecate wrong `#c9a84c`); add real golds as distinct tokens (`gold-accent #FFEA9E`, `gold-bright #FAE287`, `gold-vivid #FFD221`, `gold-border #998C5F`); dark/error tokens; **explicit alpha tokens** for repeated rgba-opacity variants (byte-identical, avoids Tailwind `/N` color-mix drift); map `borderRadius:"8px"` to existing `rounded-saa-button`.
2. **Typography:** no new tokens — maps to stock Tailwind (`text-base`, `text-2xl`, `font-montserrat`, `tracking-[…]`).
3. **Convention:** new `docs/styling-conventions.md` — utility+token default, inline only for runtime-dynamic values, token catalog + when-to-use table.
4. **Round-1 refactor:** top 8 files (~69% of inline styles). Acceptance = before/after Playwright screenshot, zero diff.
5. **Guard:** `react/forbid-dom-props` + `forbid-component-props` for `style` at warn, with documented `eslint-disable` convention for dynamic styles.
6. **Deferred:** Button/Text primitives; remaining 15 files opportunistic under guard.

## What to watch
- Zero-visual-change promise only as strong as the screenshot gate — no file ships without pre/post comparison.
- "Mirror" must not drift into "consolidate" — drift stays until a deliberate later PR.
- `#c9a84c` token: migrate its 2 uses or mark deprecated — never leave ambiguous.
- Tailwind v4 opacity modifier (`color-mix oklab`) ≠ manual rgba byte-for-byte — handled by explicit alpha tokens.

## Success criteria
- `@theme` covers all repeated design values; round-1 files retain only truly-dynamic inline styles.
- `pnpm build` + `pnpm lint` green; screenshots identical pre/post for each round-1 file.
- Convention doc merged; lint-warn rule active.

## Next steps
- Commission `/tkm:create-plan` with this record as context (phased: tokens → convention+guard → per-file refactor with screenshot gate).
- Follow-up issue for primitives + remaining 15 files.

## Unresolved questions
- Exact alpha-token naming scheme (e.g. `--color-saa-gold-accent-50`) — decide in plan.
- Whether to migrate the 2 `#c9a84c` uses to `gold-accent` (slight visual change) or keep + deprecate (no change). Leaning keep+deprecate to honor zero-visual-change.
