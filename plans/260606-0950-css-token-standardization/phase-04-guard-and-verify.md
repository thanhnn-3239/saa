# Phase 4 — ESLint Warn Guard + Final Verify

**Priority:** Medium · **Status:** pending · **Depends:** 3

## Goal
Add a lint rule that nudges devs away from new inline styles (WARN, not error), then verify the
whole change: `pnpm build` + `pnpm lint` green. Guard lands last so its warnings are mostly the
*deferred* files (expected) + genuine dynamic styles (disabled), not noise from work-in-progress.

## Guard implementation (`eslint.config.mjs`)
Flat config (Tailwind v4 / Next project uses `eslint.config.mjs`). Add `react/forbid-dom-props`
and `react/forbid-component-props` for `style` at **warn**:
```js
// inside the rules block of the relevant config object
"react/forbid-dom-props": ["warn", { forbid: [{ propName: "style",
  message: "Use Tailwind utility + @theme token. Inline style only for runtime-dynamic values — add eslint-disable-next-line with a // dynamic: reason. See docs/styling-conventions.md" }] }],
"react/forbid-component-props": ["warn", { forbid: [{ propName: "style",
  message: "Prefer className + tokens; see docs/styling-conventions.md" }] }],
```
Notes:
- Requires `eslint-plugin-react` (verify it's already a dep — Next lint usually pulls it; if not,
  add it). Confirm the plugin is registered in the flat config before adding rules.
- WARN means CI stays green; the rule is a nudge + progress signal (warning count ↓ as files migrate).
- `next/image` etc. unaffected — rule targets `style` prop only.

## Dynamic-style exceptions
For the runtime-dynamic inline styles kept in Phase 3, add above each:
```jsx
// dynamic: countdown width computed at runtime
// eslint-disable-next-line react/forbid-dom-props
```
Keep these few and documented.

## Related code files
- Modify: `eslint.config.mjs`
- Possibly: `package.json` (only if `eslint-plugin-react` missing)
- Touch-ups: round-1 files (add eslint-disable comments to remaining dynamic styles)

## Implementation steps
1. Inspect `eslint.config.mjs` — confirm react plugin present + where rules go.
2. Add the two `forbid-*` rules at warn.
3. `pnpm lint` — expect warnings on deferred files + any un-disabled dynamic styles. Add
   `eslint-disable` to legit dynamic ones in round-1 files. Deferred-file warnings are EXPECTED
   (documented as the opportunistic backlog) — do not silence them globally.
4. `pnpm build` — confirm green.
5. Final screenshot sweep of homepage + the public pages → confirm zero visual regression overall.

## Todo
- [ ] Confirm eslint-plugin-react available + flat-config wiring
- [ ] Add `forbid-dom-props` + `forbid-component-props` (warn) for `style`
- [ ] Add `eslint-disable` + `// dynamic:` to legit dynamic styles in round-1 files
- [ ] `pnpm lint` green (warnings only, no errors)
- [ ] `pnpm build` green
- [ ] Final visual sweep — no regression

## Success criteria
- `pnpm lint` exits clean (warnings allowed, zero errors); `pnpm build` green.
- New inline `style` in any file triggers a warning pointing to the convention doc.
- Homepage + public pages visually identical to pre-change.

## Risk
- Rule fires on legit dynamic styles → noise. Mitigate: documented `eslint-disable` convention.
- If `forbid-dom-props` not granular enough, fall back to a documented convention only (per the
  "lint warning" decision, a warn-level rule is the target — don't escalate to error).

## Next
- Open follow-up issue: shared UI primitives (Button/Text) + remaining 15 files + palette
  consolidation (collapse gold drift to one token — deliberate visual decision).
