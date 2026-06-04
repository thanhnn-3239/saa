"use server";

import { cookies } from "next/headers";
import { LOCALE_COOKIE, LOCALES, type Locale } from "@/lib/i18n/config";

/**
 * Persists the chosen locale in the `NEXT_LOCALE` cookie. The client calls this,
 * then `router.refresh()` so all Server Components re-render in the new language.
 * Ignores unsupported values (defense against tampering).
 */
export async function setLocale(locale: Locale) {
  if (!LOCALES.includes(locale)) return;

  const store = await cookies();
  store.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365, // 1 year
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
