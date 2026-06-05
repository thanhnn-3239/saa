"use client";

/**
 * Login-specific language switcher wrapper.
 * Re-exports the shared LanguageSwitcher component, supplying the login
 * namespace aria-label so callers in this route don't need to change.
 */

import { useTranslations } from "next-intl";
import { LanguageSwitcher as SharedLanguageSwitcher } from "@/components/language-switcher";

export function LanguageSwitcher() {
  const t = useTranslations("Login");
  return <SharedLanguageSwitcher ariaLabel={t("langSelectAria")} />;
}
