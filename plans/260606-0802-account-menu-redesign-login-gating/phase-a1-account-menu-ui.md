# Phase A1 — Account menu UI (trigger + dropdown)

**Track:** A (UI) · **Status:** ✅ done · **Depends on:** — (parallel with B1)

Restyle the account control to match two frames. Activate `momorph-implement-design` for pixel
fidelity. Same component owns both frames (trigger + dropdown) — keep them in one phase to avoid
file conflicts.

## Goal
Account button + dropdown match the design; "Logout" works; labels via next-intl.

## Scope
- **Trigger** (Homepage A1.8): replace gold avatar + display-name + chevron with a **plain user-icon
  button ~40×40** (use design's user icon asset / inline SVG). Keep a11y: `aria-haspopup="menu"`,
  `aria-expanded`, `aria-label`.
- **Dropdown** (Dropdown-profile): dark rounded card (~16px radius, subtle border). Items:
  - **Profile** — label right-aligned-ish + **person icon on the RIGHT**, active/**glow** background (item ~119×56). → `ROUTES.profile`
  - **Admin Dashboard** — role-gated (`role === "admin"`), hidden otherwise. Keep `/admin` target invariant note from current code.
  - **Logout** — label + **chevron-right ›** icon; `<form action={signOut}>` (reuse existing action).
- **i18n**: add `Home.account.{profile,logout,adminDashboard,menuAria}` to `messages/vi.json` + `en.json`
  (literal "Profile"/"Logout" per design); replace hardcoded strings in component.

## Files
- Edit: `components/header/account-menu.tsx`, `app/(public)/_components/app-header.tsx` (if trigger markup moves)
- Edit: `messages/vi.json`, `messages/en.json`

## Out of scope
Auth policy (B1), profile page content, notification bell, real role system.

## Integration contract
Stays a client component; props `{ email, role }` unchanged. `signOut` import unchanged. Visual-validate vs both frames.

## Todo
- [x] Redesigned trigger: plain user-icon button ~40×40 (no gold avatar, no name pill)
- [x] Redesigned dropdown: dark rounded card with Profile (glow, icon right), Admin Dashboard (role-gated), Logout (chevron)
- [x] Labels via next-intl: `Home.account.{menuAria,profile,adminDashboard,logout}` added to vi.json + en.json
- [x] "Sign out" → "Logout" label; unused `email` prop removed
- [x] `app/(public)/layout.tsx` call site updated (removed email prop)
- [x] Tests updated: `account-menu.test.tsx` (new API, Logout label, role-gating, next-intl provider)

## MoMorph refs:
- Dropdown-profile: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/z4sCl3_Qtk
- Homepage A1.8 (account button): https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/i87tDx10uM
- Clarifications: ./clarifications.md
