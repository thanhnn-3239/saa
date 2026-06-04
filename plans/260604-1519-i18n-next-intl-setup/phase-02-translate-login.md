# Phase 02 — Translate Login + wire language switcher

## Context Links
- [plan.md](plan.md) · depends on [phase-01](phase-01-i18n-infrastructure.md)
- Files: `app/login/page.tsx`, `app/login/_components/*`
- MoMorph: Login `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/GzbNeVGJHz`,
  Dropdown-ngôn ngữ `https://momorph.ai/files/9ypp4enmFmdK3YAFJLIu6C/screens/hUyaaugye2`

## Overview
- **Priority:** Critical
- **Status:** completed
- Extract all Login strings into the `Login` namespace (vi + en), replace hardcoded text
  with `t()`, and make the language switcher actually change locale via the set-locale action.

## Strings to externalize (Login namespace)
| Key | vi | en (translate) |
|-----|----|----|
| `welcomeLine1` | "Bắt đầu hành trình của bạn cùng SAA 2025." | "Begin your journey with SAA 2025." |
| `welcomeLine2` | "Đăng nhập để khám phá!" | "Sign in to explore!" |
| `loginButton` | "Đăng nhập bằng Google" | "Sign in with Google" |
| `loginButtonAria` | "Đăng nhập bằng Google" | "Sign in with Google" |
| `footer` | "Bản quyền thuộc về Sun* © 2025" | "Copyright © 2025 Sun*" |
| `error.domain` | "Tài khoản không thuộc miền @sun-asterisk.com. Vui lòng dùng tài khoản Sun*." | "This account is not on the @sun-asterisk.com domain. Please use your Sun* account." |
| `error.oauth` | "Lỗi xác thực Google. Vui lòng thử lại." | "Google authentication error. Please try again." |
| `error.access_denied` | "Bạn đã từ chối đăng nhập. Vui lòng thử lại." | "You declined sign-in. Please try again." |
| `error.generic` | "Đăng nhập thất bại. Vui lòng thử lại." | "Sign-in failed. Please try again." |
| `langSelectAria` | "Chọn ngôn ngữ" | "Select language" |
| `closeError` | "Đóng thông báo lỗi" | "Close error message" |

> EN copy above is a reasonable translation; confirm with product if official wording exists (see Unresolved).

## Related Code Files
- **Modify:** `messages/vi.json` + `messages/en.json` — add the `Login` namespace above.
- **Modify:** `app/login/page.tsx` — `const t = await getTranslations("Login")`; pass strings down or let leaf client components use `useTranslations`. Note: `searchParams.error` → banner reads the message by code.
- **Modify:** `app/login/_components/login-hero.tsx` — welcome lines via `useTranslations("Login")` (make it a client component OR pass translated strings as props from the server page; prefer passing props to keep it server-friendly — DRY/KISS).
- **Modify:** `app/login/_components/login-button.tsx` — label + aria via `useTranslations` (already a client component).
- **Modify:** `app/login/_components/login-error-banner.tsx` — replace the local `ERROR_MESSAGES` map with `useTranslations("Login")` keyed by `error.${code}` (fallback `error.generic`). Keep dismiss + render-nothing-without-code behavior.
- **Modify:** `app/login/_components/login-footer.tsx` — footer text via translations.
- **Rewrite:** `app/login/_components/language-switcher.tsx` — replace mock `useState(selected)` with:
  - `const locale = useLocale();` (current locale → drives flag + code)
  - on option click: `startTransition(async () => { await setLocale(code); router.refresh(); })` then close menu
  - keep the design styling from the prior fix (cursor-pointer, VN/EN flags, highlighted selected row, chevron rotate). Selected row = `locale === code`.

## Implementation Steps
1. Fill `messages/vi.json` / `messages/en.json` with the `Login` namespace (identical key tree).
2. Server page: `getTranslations`; decide prop-drill vs leaf `useTranslations` per component (client leaves use the hook).
3. Update each Login component to consume translations; remove hardcoded VN strings and the banner's inline message map.
4. Rewrite language switcher to use `useLocale()` + `setLocale` action + `router.refresh()` (via `useTransition`); map `vi`↔`VN`, `en`↔`EN` for display (locale codes are lowercase `vi/en`; UI shows `VN/EN`).
5. `pnpm exec tsc --noEmit` + `pnpm run build`; manual check: switch EN → whole page (welcome, button, footer, error banner) renders English and flag shows UK; reload keeps EN.

## Todo List
- [x] `messages/{vi,en}.json` Login namespace filled
- [x] page + hero + button + footer + banner use `t()`
- [x] Banner inline message map removed (now translations)
- [x] Language switcher uses real locale + setLocale + router.refresh
- [x] Display mapping vi↔VN / en↔EN; selected row reflects actual locale
- [x] Build + typecheck pass; manual switch verified

## Success Criteria
- No hardcoded VN strings remain in `app/login/**`.
- Switching to EN re-renders the full Login screen in English and persists across reload; switching back to VN works.
- Switcher flag/code reflects the active locale.

## Risk Assessment
- Making `login-hero` a client component just for `t()` → prefer passing translated strings as props from the server page to avoid unnecessary client boundary (KISS).
- Locale code casing mismatch (`vi/en` vs display `VN/EN`) → centralize the display map in the switcher.

## Security Considerations
- `setLocale` validates against `LOCALES` (done in phase 01) — banner/error codes still render as plain text via `t()`.

## Unresolved
- Official EN marketing copy for the welcome lines — using a reasonable translation unless product provides exact wording.
