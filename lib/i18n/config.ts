/**
 * i18n configuration — cookie-based locale, no URL routing.
 * The UI shows uppercase codes (VN/EN) but the locale values are lowercase (vi/en).
 */
export const LOCALES = ["vi", "en"] as const;
export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export type Locale = (typeof LOCALES)[number];

/** Narrow an arbitrary string to a supported Locale, else the default. */
export function resolveLocale(value?: string | null): Locale {
  return LOCALES.includes(value as Locale) ? (value as Locale) : DEFAULT_LOCALE;
}
