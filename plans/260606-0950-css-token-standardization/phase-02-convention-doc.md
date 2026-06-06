# Phase 2 — Styling Convention Doc

**Priority:** High · **Status:** pending · **Depends:** 1

## Goal
Write `docs/styling-conventions.md` — the rule that guides Phase 3 and all future styling.
Doc lands BEFORE refactor so it's the reference; the ESLint guard that enforces it lands in
Phase 4 (after the bulk refactor, so warnings aren't drowned out by not-yet-migrated files).

## Content (concise, KISS)
1. **The rule (one line):** Default to Tailwind utility classes + `@theme` tokens. Use inline
   `style={{}}` ONLY for values computed at runtime.
2. **When inline `style` IS allowed** (the allowlist intent):
   - Runtime-dynamic values: countdown widths, progress %, JS-computed transforms/positions,
     values from props/state/data that can't be known at build time.
   - Mark each with `// dynamic: <reason>` + `eslint-disable-next-line` (rule name from Phase 4).
3. **When inline `style` is NOT allowed:** any static color, spacing, radius, font, shadow,
   layout (flex/grid/gap) → use utility or token.
4. **Token catalog** — table of the tokens from Phase 1 with the utility class each enables
   (e.g. `--color-saa-gold-accent` → `bg-saa-gold-accent` / `text-saa-gold-accent`).
5. **Value→utility cheatsheet** (the common maps): `fontSize 16px → text-base`,
   `24px → text-2xl`, `borderRadius 8px → rounded-saa-button`, etc. (from Phase 1).
6. **Drift note:** golds intentionally split into 3 tokens mirroring shipped values; consolidation
   is a future deliberate PR — do not "fix" by collapsing during refactor.

## Related code files
- Create: `docs/styling-conventions.md`
- (Reference only, no edit) `app/globals.css`

## Implementation steps
1. Draft doc with sections above; keep under docs.maxLoc (800) — aim ~120 lines.
2. Cross-link from `docs/code-standards.md` if it exists (add a one-line pointer), else skip.
3. No code change → no build needed; proofread for accuracy against Phase-1 tokens.

## Todo
- [ ] Write `docs/styling-conventions.md` (rule, allow/deny, token table, cheatsheet, drift note)
- [ ] Add pointer from code-standards doc if present

## Success criteria
- Doc states the rule unambiguously, lists every Phase-1 token + its utility, and the
  dynamic-style exception with the `eslint-disable` convention.

## Risk
- Doc drifts from actual tokens. Mitigate: generate the token table directly from the final
  Phase-1 `@theme`, not from memory.

## Next
→ Phase 3 (refactor follows this convention).
