# Implementer Report — Account Menu UI

**Task:** Redesign `AccountMenu` component to match two MoMorph design frames
**Status:** DONE
**Date:** 2026-06-06

---

## Files Modified

| File | Lines | Change |
|------|-------|--------|
| `components/header/account-menu.tsx` | 234 | Full redesign — trigger + dropdown |

No other files were touched.

---

## Component Structure

### Trigger (Homepage A1.8 — screenId `i87tDx10uM`)
- Plain `<button>` 40×40px, `padding: 10px`
- Border: `1px solid #998C5F`, `border-radius: 4px`, transparent background
- Contains single `<PersonIcon size={20} />` (inline SVG — no external asset needed; `public/homepage-saa/` had no `User_Profile.svg`)
- `aria-label={t("account.menuAria")}`, `aria-haspopup="menu"`, `aria-expanded={open}`
- Gold avatar circle, display-name text, and chevron removed

### Dropdown (Dropdown-profile — screenId `z4sCl3_Qtk`)
- `<ul role="menu">` anchored `right-0 top-full mt-2 z-20`
- Container: `background: #00070C`, `border: 1px solid #998C5F`, `border-radius: 8px`, `padding: 6px`, `minWidth: 131px`

#### Profile item
- `<Link href={ROUTES.profile}>`, closes menu on click
- Layout: `flexbox justify-content: space-between` — label LEFT, `<PersonIcon />` RIGHT
- Active/glow: `background: rgba(255, 234, 158, 0.10)`, `border-radius: 4px`, `height: 56px`, `padding: 16px`
- Text: `font-family: Montserrat`, `font-size: 16px`, `font-weight: 700`, `color: #FFF`
- Glow text-shadow: `0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287`, `letter-spacing: 0.15px`
- Label: `t("account.profile")`

#### Admin Dashboard item (role-gated)
- Rendered only when `role === "admin"` — hidden otherwise
- `<Link href="/admin">`, closes menu on click
- Same font/color tokens as Profile; no icon (not in design)
- Preserves code comment: `/admin must NOT live under app/(public)` — proxy must enforce auth
- Label: `t("account.adminDashboard")`

#### Logout item
- `<form action={signOut}><button type="submit">` — reuses existing `signOut` action
- Layout: `flexbox justify-content: space-between` — label LEFT, `<ChevronRightIcon />` RIGHT
- `height: 56px`, `padding: 16px`, transparent background
- Same font tokens: `Montserrat 700 16px #FFF 0.15px`
- Label: `t("account.logout")`

---

## Design Tokens Used

| Token | Value | Source |
|-------|-------|--------|
| Container background | `#00070C` | `--Details-Container-2` |
| Container border | `1px solid #998C5F` | `--Details-Border` |
| Container radius | `8px` | node `666:9601` |
| Container padding | `6px` | node `666:9601` |
| Trigger border | `1px solid #998C5F` | node `I2167:9091;186:1597` |
| Trigger radius | `4px` | node `I2167:9091;186:1597` |
| Trigger size | `40×40px`, `padding: 10px` | node `I2167:9091;186:1597` |
| Profile item bg (active) | `rgba(255, 234, 158, 0.10)` | node `I666:9601;563:7844` |
| Item height | `56px` | nodes `I666:9601;563:7844`, `I666:9601;563:7868` |
| Item padding | `16px` | nodes `I666:9601;563:7844`, `I666:9601;563:7868` |
| Item radius | `4px` | node styles |
| Text color | `#FFF` | `--Details-Text-Secondary-1` |
| Font family | `Montserrat` | all text nodes |
| Font size | `16px` | all text nodes |
| Font weight | `700` | all text nodes |
| Text glow (Profile) | `0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287` | node `I666:9601;563:7844;186:1497` |
| Letter spacing | `0.15px` | all text nodes |

---

## Props Contract (unchanged)

```ts
interface AccountMenuProps {
  email: string;   // still accepted, not rendered (design has no display-name)
  role?: string;   // "admin" shows Admin Dashboard item
}
```

`email` prop is destructured as `_email` (unused in UI per new design) — preserves the external API contract without breaking callers.

---

## Accessibility Preserved

- `aria-haspopup="menu"` on trigger
- `aria-expanded={open}` on trigger
- `aria-label={t("account.menuAria")}` on trigger (was hardcoded, now i18n)
- `role="menu"` on `<ul>`, `role="none"` on `<li>`, `role="menuitem"` on interactive children
- Escape closes + returns focus to trigger (`triggerRef.current?.focus()`)
- Outside-click backdrop (`fixed inset-0`) closes menu
- All interactive items are native `<a>` or `<button>` — keyboard focusable by default

---

## i18n

All English strings replaced with `useTranslations("Home")` keys:

| Key | Value (en) |
|-----|-----------|
| `t("account.menuAria")` | "Account menu" |
| `t("account.profile")` | "Profile" |
| `t("account.adminDashboard")` | "Admin Dashboard" |
| `t("account.logout")` | "Logout" |

No `messages/*.json` files were modified (keys already existed).

---

## Deviations

1. **Line count 234 vs 200 guideline** — inline style objects for Figma design tokens account for ~60 lines. Extracting to a CSS module would reduce this but adds a file. Given YAGNI, kept inline.
2. **`email` prop unused in UI** — new design has no display-name text. Renamed to `_email` to signal intentional non-use while preserving the external API contract. Callers (`app-header.tsx`) need no change.
3. **No `User_Profile.svg` found** in `public/homepage-saa/` — used inline SVG person icon (same shape as the original `PersonIcon`). Visually matches the design's `MM_MEDIA_User Profile` node.

---

## Type Check

```
pnpm exec tsc --noEmit → exit 0, no output
```
