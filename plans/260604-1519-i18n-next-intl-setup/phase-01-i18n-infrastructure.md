# Phase 01 — next-intl infrastructure (cookie-based, no routing)

## Context Links
- [plan.md](plan.md) · Research: `plans/reports/researcher-260604-1526-next-intl-no-routing.md`
- Files to read: `next.config.ts`, `app/layout.tsx`

## Overview
- **Priority:** Critical (blocks phase 02)
- **Status:** completed
- Install next-intl and stand up the no-routing setup: request config from `NEXT_LOCALE`
  cookie, plugin wrap, provider in root layout, message files, and a set-locale server action.

## Key Insights
- No middleware — `proxy.ts` untouched (no-routing mode).
- `cookies()` is async (Next 16) — await everywhere.
- Plugin with no arg auto-detects `./i18n/request.ts` (no `src/` in this repo).

## Related Code Files
- **Install:** `pnpm add next-intl` (4.13.x).
- **Create:** `lib/i18n/config.ts` — `export const LOCALES = ["vi","en"] as const; export const DEFAULT_LOCALE = "vi"; export const LOCALE_COOKIE = "NEXT_LOCALE";` + `type Locale`.
- **Create:** `i18n/request.ts` — `getRequestConfig`: `await cookies()`, read `LOCALE_COOKIE`, validate against `LOCALES` (fallback `DEFAULT_LOCALE`), return `{ locale, messages: (await import(\`../messages/${locale}.json\`)).default }`.
- **Create:** `lib/i18n/locale-actions.ts` — `"use server"`; `setLocale(locale: Locale)`: validate, `await cookies()` then `.set(LOCALE_COOKIE, locale, { path:"/", maxAge: 31536000, sameSite:"lax" })`.
- **Create:** `messages/vi.json`, `messages/en.json` — start with a `Login` namespace (filled in phase 02); same key tree in both.
- **Modify:** `next.config.ts` — `import createNextIntlPlugin from "next-intl/plugin"; const withNextIntl = createNextIntlPlugin(); export default withNextIntl(nextConfig);`
- **Modify:** `app/layout.tsx` — make `async`; `const locale = await getLocale(); const messages = await getMessages();` set `<html lang={locale}>`; wrap `{children}` in `<NextIntlClientProvider messages={messages}>`. Keep existing font classes + body classes.

## Implementation Steps
1. `pnpm add next-intl`.
2. Add `lib/i18n/config.ts` (locales, default, cookie name, `Locale` type).
3. Add `i18n/request.ts` using `getRequestConfig` (await cookies, validate, dynamic-import messages).
4. Wrap `next.config.ts` with `createNextIntlPlugin()`.
5. Convert `app/layout.tsx` to async server component with `getLocale`/`getMessages` + provider + dynamic `lang`. Do NOT drop the Geist font variables or body layout classes.
6. Create empty-but-valid `messages/vi.json` and `messages/en.json` (e.g. `{ "Login": {} }`).
7. Add `lib/i18n/locale-actions.ts` server action.
8. `pnpm exec tsc --noEmit` + `pnpm run build` — fix errors.

## Todo List
- [x] `pnpm add next-intl`
- [x] `lib/i18n/config.ts`
- [x] `i18n/request.ts`
- [x] `next.config.ts` plugin wrap
- [x] `app/layout.tsx` async + provider + dynamic lang
- [x] `messages/{vi,en}.json` scaffolds
- [x] `lib/i18n/locale-actions.ts`
- [x] Build + typecheck pass
- [x] Fixed `pnpm-workspace.yaml` allowBuilds (@parcel/watcher, @swc/core → true) that was breaking install/build/test

## Success Criteria
- App builds; root layout sets `<html lang>` from the cookie; provider available to all components.
- Setting `NEXT_LOCALE` cookie manually changes `getLocale()` result.

## Risk Assessment
- Plugin not detecting `i18n/request.ts` → if so, pass the explicit path to `createNextIntlPlugin("./i18n/request.ts")`.
- Layout edit breaking fonts/styles → preserve existing className wiring.

## Security Considerations
- Validate cookie value against `LOCALES` allow-list before use (no arbitrary import path).

## Next Steps
- Phase 02 fills message files and wires the switcher.
