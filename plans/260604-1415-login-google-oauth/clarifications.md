# Clarifications — Login (Google OAuth)

## MoMorph refs
- Login: https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz

## Session 2026-06-04
- Q: How should Google OAuth be wired, and domain restriction? → A: Supabase Auth Google provider; restrict sign-in to @sun-asterisk.com, reject others with error.
- Q: Scope of VN/EN language switcher in this Login plan? → A: UI-only button + dropdown (VN/EN, default VN) with mock behavior; real i18n + dropdown screen deferred to a later plan.
- Q: Redirect target after login + where authenticated-redirect enforced? → A: Redirect to `/`; enforce "authenticated users skip /login" in existing proxy.ts.
- Q: How to show OAuth failure (denied consent, non-allowed domain, provider error)? → A: Redirect back to /login with error param; render dismissible inline banner above the button.

## Update 2026-06-04 (i18n now in scope)
- The "i18n deferred / UI-only switcher" decision is SUPERSEDED. Real i18n is implemented in a dedicated plan: [../260604-1519-i18n-next-intl-setup/plan.md](../260604-1519-i18n-next-intl-setup/plan.md) (next-intl, cookie-based), which replaces the mock switcher and translates this screen.
