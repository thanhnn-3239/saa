# Styling Conventions — SAA Kudos

**Stack:** Next.js 16 (App Router) + Tailwind CSS v4. Tokens live in `app/globals.css` under
`@theme inline { … }`. There is no `tailwind.config.js`.

---

## The rule

> Default to Tailwind utility classes + `@theme` tokens.
> Use inline `style={{}}` ONLY for values computed at runtime.

---

## Allowed: runtime-dynamic inline style

A value that cannot be expressed as a static class because it depends on JS state, props, or
data at render time.

```tsx
// dynamic: countdown bar width derived from live timer state
// eslint-disable-next-line react/forbid-dom-props
<div style={{ width: `${pct}%` }} />

// dynamic: JS-computed translateX from scroll position
// eslint-disable-next-line react/forbid-dom-props
<div style={{ transform: `translateX(${offset}px)` }} />
```

Both comments are required: `// dynamic: <reason>` explains intent; `// eslint-disable-next-line
react/forbid-dom-props` silences the ESLint guard (see [Enforcement](#enforcement)).

For custom components use `react/forbid-component-props` in the disable comment instead.

---

## Not allowed: static values

Any static color, spacing, radius, font, shadow, or layout value must use a utility class or
token — never a hardcoded inline style.

| Category | Bad | Good |
|----------|-----|------|
| Color | `style={{ color: "#FFEA9E" }}` | `text-saa-gold-accent` |
| Background | `style={{ background: "rgba(255,234,158,0.10)" }}` | `bg-saa-gold-glass` |
| Border radius | `style={{ borderRadius: "8px" }}` | `rounded-saa-button` |
| Shadow | `style={{ boxShadow: "0 4px …" }}` | `shadow-saa-glow` |
| Spacing | `style={{ gap: "40px" }}` | `gap-10` |
| Font | `style={{ fontFamily: "Montserrat" }}` | `font-montserrat` |

---

## Token catalog

All tokens defined in `app/globals.css → @theme inline`. Color tokens auto-generate
`bg-*`, `text-*`, and `border-*` utilities.

### Colors — navy backgrounds

| Token | Value | Example utilities |
|-------|-------|-------------------|
| `--color-saa-navy-darkest` | `#00101a` | `bg-saa-navy-darkest` |
| `--color-saa-navy-dark` | `#001320` | `bg-saa-navy-dark` |
| `--color-saa-navy-mid` | `#002133` | `bg-saa-navy-mid` |
| `--color-saa-navy-surface` | `#0b0f12` | `bg-saa-navy-surface` |
| `--color-saa-navy-elevated` | `#1a2a35` | `bg-saa-navy-elevated` |
| `--color-saa-navy-border` | `#2e3940` | `border-saa-navy-border` |
| `--color-saa-ink` | `#101417` | `bg-saa-ink` |

### Colors — gold

| Token | Value | Role |
|-------|-------|------|
| `--color-saa-gold-accent` | `#FFEA9E` | Primary CTA / accent — most used |
| `--color-saa-gold-bright` | `#FAE287` | Glow / bright accents |
| `--color-saa-gold-vivid` | `#FFD221` | Vivid highlight |
| `--color-saa-gold-border` | `#998C5F` | Muted gold border |

> **Deprecated — do not use for new work:** `--color-saa-gold #c9a84c`, `--color-saa-gold-light`,
> `--color-saa-gold-dark`. These are scheduled for removal after all `#c9a84c` usages migrate.

### Colors — alpha tokens

These tokens encode byte-exact `rgba` values. Do NOT use Tailwind's `/N` opacity modifier as a
substitute — `/N` compiles to `color-mix(in oklab, …)`, which produces a different result.

| Token | Value | Utility |
|-------|-------|---------|
| `--color-saa-gold-glass` | `rgba(255, 234, 158, 0.10)` | `bg-saa-gold-glass` |
| `--color-saa-scrim-black` | `rgba(0, 0, 0, 0.25)` | `bg-saa-scrim-black` |

### Colors — text on dark

| Token | Value | Utility |
|-------|-------|---------|
| `--color-saa-text-primary` | `rgba(255,255,255, 1.0)` | `text-saa-text-primary` |
| `--color-saa-text-secondary` | `rgba(255,255,255, 0.7)` | `text-saa-text-secondary` |
| `--color-saa-text-muted` | `rgba(255,255,255, 0.45)` | `text-saa-text-muted` |

### Colors — semantic

| Token | Value | Utility |
|-------|-------|---------|
| `--color-saa-error` | `#F50100` | `text-saa-error`, `bg-saa-error` |

### Shadow

| Token | Utility |
|-------|---------|
| `--shadow-saa-glow` | `shadow-saa-glow` |

### Border radius

| Token | Value | Utility |
|-------|-------|---------|
| `--radius-saa-card` | `12px` | `rounded-saa-card` |
| `--radius-saa-button` | `8px` | `rounded-saa-button` |

---

## Value → utility cheatsheet

### Font size

| px | Class |
|----|-------|
| 14 | `text-sm` |
| 16 | `text-base` |
| 20 | `text-xl` |
| 24 | `text-2xl` |
| one-off | `text-[Npx]` |

### Font family

| Family | Class |
|--------|-------|
| Montserrat | `font-montserrat` |

### Letter spacing

Use arbitrary: `tracking-[Npx]` (e.g. `tracking-[0.05em]`).

### Border radius

| Value | Class |
|-------|-------|
| 4px | `rounded` |
| 8px | `rounded-saa-button` |
| 12px | `rounded-saa-card` |
| 16px | `rounded-2xl` |
| 24px | `rounded-3xl` |
| 100px / pill | `rounded-full` |
| other | `rounded-[Npx]` |

### Spacing / gap

Values on the 4px grid map to Tailwind's scale (`gap-10` = 40px, `gap-4` = 16px, etc.).
Off-grid values use arbitrary: `gap-[60px]`.

### One-off rgba

Use arbitrary background: `bg-[rgba(0,0,0,0.6)]`. Reserve named tokens for values used 3+
times across the codebase.

---

## Gotchas

### Transition shorthand

Bare `transition-opacity` / `transition-colors` applies Tailwind defaults (150 ms,
`cubic-bezier(0.4, 0, 0.2, 1)`). To match a design that specifies `transition: X 200ms ease`,
write all three classes explicitly:

```html
transition-opacity duration-200 ease-[ease]
```

Dropping `duration-*` or `ease-[…]` silently mismatches the design's easing.

### Tailwind v4 + Turbopack `@theme` cache

After editing `@theme` tokens in `globals.css`, the dev server does NOT hot-reload new token
utilities. New `bg-saa-*` / `shadow-saa-*` classes render as transparent or nothing until the
`.next` cache is cleared:

```bash
# stop dev server, then:
rm -rf .next
pnpm dev
```

`pnpm build` (production) is always clean — this only affects local dev.

---

## Drift note — intentional gold split

`gold-accent`, `gold-bright`, and `gold-vivid` are three separate tokens that mirror the three
distinct shipped hex values in the MoMorph design. Do not collapse them during refactors.
Consolidation is a separate deliberate PR when/if design confirms the values converge.

---

## Enforcement

ESLint rule `react/forbid-dom-props` (+ `react/forbid-component-props`) is configured at **warn**
level in `eslint.config.mjs` (rule name `saa/inline-style-guard`). CI stays green; the warning
count decreases as files migrate. New inline `style` props that lack `// eslint-disable-next-line`
will surface as warnings in review.
