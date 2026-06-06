# Phase 3 — Refactor Round-1 Files (mechanical, screenshot-gated)

**Priority:** High · **Status:** pending · **Depends:** 1, 2

## Goal
Replace static inline `style` values in the 8 heaviest files with Phase-1 tokens + Tailwind
utilities. **Purely mechanical. Zero visual change.** Each file is gated by a before/after
Playwright screenshot showing no diff.

## Files (in suggested order — heaviest/highest-traffic first)
1. `app/(public)/_components/homepage/hero-section.tsx` (23) — landing hero, most visible
2. `app/(public)/_components/the-le-panel.tsx` (32) — largest
3. `app/(public)/_components/homepage/kudos-section.tsx` (14)
4. `app/(public)/_components/floating-widget-button.tsx` (11)
5. `app/(public)/_components/app-header.tsx` (9)
6. `app/(public)/_components/app-footer.tsx` (9)
7. `app/(public)/_components/homepage/root-further-content.tsx` (8)
8. `app/(public)/_components/homepage/award-card.tsx` (8)

## Per-file refactor procedure (repeat for each)
1. **Capture baseline screenshot** (before any edit) of the page/section rendering this component,
   via Playwright MCP (`browser_navigate` to local dev URL → `browser_take_screenshot`).
   Dev server: `pnpm dev`. Save baseline named `<file>-before.png`.
2. **Map each inline value** using Phase-1 catalog + cheatsheet:
   - color → `text-*`/`bg-*`/`border-*` token utility
   - rgba opacity (repeated) → token utility; (one-off) → `bg-[rgba(...)]` arbitrary
   - fontSize/lineHeight → `text-base`/`text-2xl`/… ; `font-montserrat`; `tracking-[…]`
   - borderRadius → `rounded-saa-button`/`rounded`/`rounded-2xl`/`rounded-3xl`/`rounded-full`/`rounded-[55.579px]`
   - boxShadow (the glow) → `shadow-saa-glow`
   - layout (display/flex/gap/padding/position/z-index) → stock utilities (`flex flex-col gap-10 p-6 …`)
3. **Keep inline ONLY for runtime-dynamic values** (e.g. countdown-driven, computed). Add
   `// dynamic: <reason>` comment. (Lint-disable comment added in Phase 4 once rule exists.)
4. **Preserve `mm:` Figma comments** — they're traceability anchors; do not delete.
5. **Verify:** re-render, capture `<file>-after.png`, diff against baseline → MUST be identical
   (allow only sub-pixel AA noise). If diff: fix mapping (likely an alpha/color-mix mismatch or a
   gap/padding rounding) until zero.
6. `pnpm build` after each file (or batch) to catch type/JSX errors early.

## Gotchas (mirror = exact)
- `gap`/`padding` arbitrary px: stock Tailwind spacing is 4px-step; `gap:"40px"` = `gap-10` ✓,
  but `gap:"60px"` ≠ a default → use `gap-[60px]`. Don't snap to nearest step (that shifts pixels).
- `letterSpacing: 0` → `tracking-[0]` (Tailwind `tracking-normal` = `0em`, equivalent — either ok).
- `lineHeight:"24px"` with `text-base` already = 24px ✓; but `text-2xl` default line-height is
  32px = matches `24px/32px` ✓. Verify any non-default pairing → use `leading-[Npx]`.
- The dead `#c9a84c`: decide keep-as-`bg-saa-gold` (no change) vs migrate to `gold-accent`
  (visual shift). **Default: keep-as-is** to honor zero-visual-change; note for follow-up.

## Related code files
- Modify: the 8 files above. No new files.

## Todo
- [ ] hero-section.tsx — refactor + screenshot gate
- [ ] the-le-panel.tsx — refactor + screenshot gate
- [ ] kudos-section.tsx — refactor + screenshot gate
- [ ] floating-widget-button.tsx — refactor + screenshot gate
- [ ] app-header.tsx — refactor + screenshot gate
- [ ] app-footer.tsx — refactor + screenshot gate
- [ ] root-further-content.tsx — refactor + screenshot gate
- [ ] award-card.tsx — refactor + screenshot gate
- [ ] `pnpm build` green after all

## Success criteria
- Each file: only runtime-dynamic inline styles remain; before/after screenshots identical.
- `pnpm build` green.

## Risk
- **Silent visual regression** — the whole premise. Mitigate: no file ships without the
  screenshot gate; treat any visible diff as a bug, not "close enough".
- Arbitrary-value sprawl (`[60px]`, `[55.579px]`) — acceptable; still beats inline style for lint
  + consistency. Don't force into the spacing scale.
- Responsive classes already present (`sm: lg:`) must be preserved — don't drop breakpoints.

## Next
→ Phase 4 (guard + final verify).
