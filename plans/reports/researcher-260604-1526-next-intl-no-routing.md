# Research Report: next-intl Without i18n Routing — Next.js 16 + React 19

**Date:** 2026-06-04
**Scope:** next-intl cookie-based locale (no URL prefix), App Router RSC, Next.js 16.2.7, React 19.2.4, TypeScript, pnpm.

---

## Sources Consulted

1. [next-intl official docs — without-i18n-routing](https://next-intl.dev/docs/getting-started/app-router/without-i18n-routing)
2. [next-intl docs — Request configuration](https://next-intl.dev/docs/usage/configuration)
3. [npm: next-intl registry metadata](https://www.npmjs.com/package/next-intl) (via npm info)
4. [Aurora Scharff — Next.js 16 use cache + next-intl](https://aurorascharff.no/posts/implementing-nextjs-16-use-cache-with-next-intl-internationalization/)
5. [GitHub issue #1334 — Change locale without-i18n-routing](https://github.com/amannn/next-intl/issues/1334)
6. [GitHub discussion #1096 — Switch locale from client without routing](https://github.com/amannn/next-intl/discussions/1096)
7. [Next.js Launchpad — App Router i18n guide 2026](https://nextjslaunchpad.com/article/nextjs-internationalization-next-intl-app-router-i18n-guide)

---

## 1. Version & Install

**Current stable:** `next-intl@4.13.0`

**Peer deps (from npm registry):**
```
next:   ^12 || ^13 || ^14 || ^15 || ^16   ✓ Next 16.2.7 supported
react:  ^16.8 || ^17 || ^18 || >=19.0-rc || ^19  ✓ React 19.2.4 supported
```

No peer-dep caveats. Install:

```bash
pnpm add next-intl
```

---

## 2. No-Routing Setup — File by File

### File structure (no `[locale]` segment, no middleware)

```
messages/
  vi.json
  en.json
src/
  i18n/
    request.ts          ← getRequestConfig lives here
  app/
    layout.tsx
    page.tsx
next.config.ts
```

---

### `messages/vi.json` and `messages/en.json`

```json
{
  "HomePage": {
    "title": "Xin chào thế giới!"
  }
}
```

Namespaced by component/feature. Both files must have identical key structure.

---

### `src/i18n/request.ts`

This is where locale is read from the cookie. `cookies()` is **async** in Next.js 15+/16 — must `await`.

```typescript
import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['vi', 'en'] as const;
type Locale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: Locale = 'vi';

export default getRequestConfig(async () => {
  const store = await cookies();                          // await required (Next 16)
  const raw = store.get('NEXT_LOCALE')?.value;
  const locale: Locale =
    raw && SUPPORTED_LOCALES.includes(raw as Locale)
      ? (raw as Locale)
      : DEFAULT_LOCALE;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
```

**Notes:**
- The file is auto-discovered at `src/i18n/request.ts` or project root. No path arg needed unless moved.
- `getRequestConfig` receives a `requestLocale` param (for routing mode) — ignored here; we read cookie directly.
- No `setRequestLocale` call needed here (that's for routing mode + static rendering). In no-routing mode pages are **dynamic by default** because `cookies()` is a dynamic API.

---

### `next.config.ts`

```typescript
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();
// If request.ts is NOT at src/i18n/request.ts, pass the path:
// const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const nextConfig: NextConfig = {
  // your existing config
};

export default withNextIntl(nextConfig);
```

**Turbopack:** `createNextIntlPlugin` works with Turbopack (default in Next 16 dev). No special flag needed — the plugin sets up RSC transforms that are Turbopack-compatible.

---

### `src/app/layout.tsx`

```typescript
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

**Notes:**
- `getLocale()` and `getMessages()` are async server helpers — reads from `getRequestConfig` output.
- `NextIntlClientProvider` without explicit `messages` prop uses `getMessages()` automatically in v4, but passing `messages` explicitly is fine and safe.
- No `[locale]` param in layout — this is the flat no-routing structure.

---

## 3. Using Translations

### Server Components (async)

```typescript
import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations('HomePage');     // await required
  return <h1>{t('title')}</h1>;
}
```

Can also scope to namespace: `getTranslations({ locale: 'vi', namespace: 'HomePage' })`.

### Client Components (sync hook)

```typescript
'use client';
import { useTranslations } from 'next-intl';

export function MyClientComponent() {
  const t = useTranslations('HomePage');           // sync, no await
  return <p>{t('title')}</p>;
}
```

`useTranslations` works in Client Components because `NextIntlClientProvider` provides the messages via React context.

---

## 4. Locale Switching (No Routing — Cookie Pattern)

This is the critical piece. **No URL change, no redirect** — just update the `NEXT_LOCALE` cookie and refresh the React tree.

### Canonical pattern (as confirmed by next-intl maintainer in discussion #1096):

**Option A — Client Component (simplest, recommended for our case):**

```typescript
'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(locale: string) {
    // Set cookie directly from client
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();   // re-runs Server Components with new cookie
    });
  }

  return (
    <button onClick={() => switchLocale(currentLocale === 'vi' ? 'en' : 'vi')} disabled={isPending}>
      {currentLocale === 'vi' ? 'EN' : 'VI'}
    </button>
  );
}
```

**Option B — Server Action (more controlled, avoids JS cookie setting):**

```typescript
// src/actions/locale.ts
'use server';
import { cookies } from 'next/headers';

export async function setLocale(locale: string) {
  const store = await cookies();   // await required (Next 16)
  store.set('NEXT_LOCALE', locale, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });
}
```

```typescript
// LocaleSwitcher.tsx
'use client';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setLocale } from '@/actions/locale';

export function LocaleSwitcher({ currentLocale }: { currentLocale: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function switchLocale(locale: string) {
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <button onClick={() => switchLocale(currentLocale === 'vi' ? 'en' : 'vi')} disabled={isPending}>
      {currentLocale === 'vi' ? 'EN' : 'VI'}
    </button>
  );
}
```

**Recommendation: Option B (Server Action).** Reasons:
- Cookie is set via `Set-Cookie` response header (server-side), not `document.cookie`.
- More secure (HttpOnly flag can be added if needed).
- No JS cookie library dependency.
- `router.refresh()` re-fetches layout + all Server Components, reading the new cookie.

**Caching caveat:** `router.refresh()` invalidates client-side RSC cache and re-runs the segment. This is sufficient for no-routing mode. `revalidatePath` is NOT needed — `router.refresh()` alone works since we're not dealing with PPR or ISR on these routes.

---

## 5. Gotchas — Next 16 / Turbopack / No-Routing

| # | Gotcha | Impact | Fix |
|---|--------|--------|-----|
| 1 | `cookies()` is async in Next 15+/16 | `getRequestConfig` crashes if not awaited | Always `await cookies()` before `.get()` |
| 2 | `cookies()` opts page into dynamic rendering | All pages using next-intl become dynamic (no static export) | Acceptable for most apps; for static: use routing mode + `setRequestLocale` |
| 3 | No middleware required | No `proxy.ts` changes needed | Confirmed: without-i18n-routing mode needs zero middleware |
| 4 | `setRequestLocale` is for routing mode only | In no-routing mode, calling it has no effect / irrelevant | Do NOT call it; pages are dynamic because `cookies()` runs |
| 5 | `dynamic = 'force-dynamic'` | NOT needed — `cookies()` in `getRequestConfig` already forces dynamic | Don't add it; it's redundant |
| 6 | Turbopack compatibility | Plugin works with Turbopack dev server in Next 16 | No extra config needed |
| 7 | Next 16 `proxy.ts` rename | next-intl does NOT use middleware in no-routing mode | Existing `proxy.ts` for Supabase is unaffected |
| 8 | `router.refresh()` + Vercel CDN cache | On Vercel, cached routes may return 304 without re-running `getRequestConfig` | Ensure routes are not statically cached; dynamic rendering avoids this |
| 9 | `params` is a Promise in Next 16 | If you add locale to any param, must `await params` | Already required by Next 16 conventions |
| 10 | `next/root-params` (Next 16.2+) | Future API to avoid `setRequestLocale` overhead — not needed in no-routing mode | Track for future optimization |

---

## Summary Recommendation

**Use no-routing mode.** It is the simplest fit:
- No middleware, no `[locale]` segment, no `generateStaticParams`.
- Single `src/i18n/request.ts` reads `NEXT_LOCALE` cookie.
- Pages are dynamically rendered — acceptable given Supabase auth already forces dynamic.
- Locale switch = Server Action sets cookie + `router.refresh()`.
- Install: `pnpm add next-intl` (v4.13.0, fully compatible).

---

## Unresolved Questions

1. **TypeScript message type-safety**: Official approach requires `global.d.ts` with `interface AppConfig { Messages: ... }` declaration — not covered in this report. Worth adding for IDE autocompletion.
2. **SSG pages**: If any route needs static export in the future, no-routing mode + `cookies()` will block it. Would require migration to routing mode or alternative locale source (e.g., `Accept-Language` header fallback).
3. **Cookie security flags**: Whether to add `HttpOnly` to `NEXT_LOCALE`. Setting `HttpOnly` would prevent client-side JS from reading the cookie (Option A wouldn't work), but Option B (server action) would still work. Decision pending on security requirements.
4. **`revalidatePath` vs `router.refresh()`**: Some community reports suggest `router.refresh()` alone may have edge cases on Vercel with aggressive caching. Needs validation in staging.
