# Phase 1 — Token Catalog: complete `@theme` in globals.css

**Priority:** Critical (everything depends on it) · **Status:** pending · **Depends:** —

## Goal
Make `app/globals.css` `@theme` the single source for every *repeated* design value the UI
actually renders. Mirror shipped values exactly — no visual change. This phase adds tokens
only; no component edits yet.

## Key insight
Current `@theme` is partly **wrong**: `--color-saa-gold: #c9a84c` is not what ships
(UI uses `#FFEA9E`/`#FAE287`/`#FFD221`). Some tokens already match (`#2e3940` border,
`#00101a` navy) — reuse those. The job is reconcile + complete, not rebuild.

## Token additions (mirror exact shipped values)

### Colors — golds (the drift, named not erased)
```css
--color-saa-gold-accent: #FFEA9E;   /* primary CTA / accent — most used (23×) */
--color-saa-gold-bright: #FAE287;   /* glow / bright accents (5×) */
--color-saa-gold-vivid:  #FFD221;   /* vivid highlight (2×) */
--color-saa-gold-border: #998C5F;   /* muted gold border (3×) */
/* --color-saa-gold: #c9a84c → KEEP but mark @deprecated in a comment; 2 live uses.
   Do NOT repoint to #FFEA9E (would shift pixels). Migrate-or-deprecate decided in Phase 3. */
```

### Colors — dark / surface (reconcile existing)
```css
/* reuse existing if value matches; add if missing */
--color-saa-navy-darkest: #00101a;  /* EXISTS, matches shipped #00101A ✓ reuse */
--color-saa-ink:          #101417;  /* header/footer base (add) */
--color-saa-navy-border:  #2e3940;  /* EXISTS, matches shipped #2E3940 ✓ reuse */
```

### Colors — error/red
```css
--color-saa-error:        #F50100;
/* rgba(227,29,28,*) / rgba(212,39,29,1) live only in deferred files (login banner) —
   add ONLY if a round-1 file uses them; otherwise leave for follow-up. Verify before adding. */
```

### Explicit alpha tokens (repeated rgba-opacity — byte-identical, NOT Tailwind /N)
Rationale: Tailwind's `/10` modifier compiles to `color-mix(in oklab, …)`, which is *visually*
but not *byte* identical to authored `rgba()`. To honor zero-visual-change, define explicit tokens
for the variants used 2+ times in round-1:
```css
--color-saa-gold-glass: rgba(255, 234, 158, 0.10);  /* gold @10% fill — 4× */
--color-saa-scrim-black: rgba(0, 0, 0, 0.25);       /* black @25% scrim — 4× */
```
One-off opacity variants (`rgba(255,234,158,0.20)`, `rgba(16,20,23,0.80)`, `rgba(10,16,20,0.55)`)
→ stay as arbitrary-value utilities in Phase 3 (`bg-[rgba(...)]`), NOT tokens. Used once each.

### Shadow token (repeated boxShadow — 2×)
```css
--shadow-saa-glow: 0 4px 4px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 #FAE287;
```
Enables `shadow-saa-glow` utility.

### Radius (reconcile + map to stock/tokens)
Existing `--radius-saa-button: 8px`, `--radius-saa-card: 12px` stay. Round-1 radii inventory:
`4px ×7, 8px ×3, 16px ×3, 100px ×3, 24px ×2, 55.579px ×1, 0 ×1`.
- `8px` → `rounded-saa-button` (existing token).
- `4px → rounded` · `16px → rounded-2xl` · `24px → rounded-3xl` · `100px → rounded-full` (stock Tailwind, exact).
- `55.579px` → one-off arbitrary `rounded-[55.579px]` in Phase 3. No new token.

## Typography — NO new tokens
Maps to stock Tailwind (verified exact): `16px/24px → text-base`, `24px/32px → text-2xl`,
`14px → text-sm`, `20px → text-xl`. One-offs `22px/45px/11px` → arbitrary `text-[22px]` etc.
Font via existing `--font-montserrat` (`font-montserrat`). Letter-spacing → `tracking-[0.15px]`.

## Related code files
- Modify: `app/globals.css` (only file touched this phase).

## Implementation steps
1. Read current `@theme` block; list which tokens already match shipped values.
2. Add the gold tokens, `--color-saa-ink`, alpha tokens, `--shadow-saa-glow` above.
3. Add a `/* @deprecated: not the shipped gold; remove after #c9a84c usages migrate */`
   comment above `--color-saa-gold`.
4. Group tokens with clear section comments (colors / alpha / shadow / radius).
5. `pnpm build` — confirm CSS compiles, no Tailwind `@theme` errors.

## Todo
- [ ] Reconcile existing tokens (note matches vs wrong)
- [ ] Add gold tokens (accent/bright/vivid/border)
- [ ] Add `--color-saa-ink`, error token (only if round-1 uses it — verify)
- [ ] Add explicit alpha tokens (gold-glass, scrim-black)
- [ ] Add `--shadow-saa-glow`
- [ ] Mark `--color-saa-gold` deprecated (keep value)
- [ ] `pnpm build` green

## Success criteria
- Every design value repeated ≥2× in round-1 files has a token.
- `pnpm build` passes; no visual change (no component edited yet).

## Risk
- Adding a token that *shifts* a value = silent regression. Mitigate: copy hex/rgba verbatim
  from source; never "round" or "normalize" a value.
- Over-tokenizing one-offs → token sprawl. Mitigate: 2+ uses = token, else arbitrary utility.

## Next
→ Phase 2 (convention doc references this catalog), then Phase 3 (refactor consumes tokens).
