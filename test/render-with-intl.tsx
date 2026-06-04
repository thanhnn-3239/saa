/**
 * Test helper: render components with NextIntlClientProvider
 * Uses real message files (messages/{locale}.json) for authentic translation testing.
 * Only use this for components that call next-intl hooks (useTranslations, useLocale, etc.).
 */

import React, { ReactElement } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { Locale } from "@/lib/i18n/config";

/** Import actual message catalogs */
import messagesVi from "@/messages/vi.json";
import messagesEn from "@/messages/en.json";

const messages: Record<Locale, Record<string, unknown>> = {
  vi: messagesVi,
  en: messagesEn,
};

interface RenderWithIntlOptions extends Omit<RenderOptions, "wrapper"> {
  locale?: Locale;
}

/**
 * Render a component wrapped in NextIntlClientProvider with real messages.
 * Defaults to "vi" locale.
 */
export function renderWithIntl(
  ui: ReactElement,
  { locale = "vi", ...options }: RenderWithIntlOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messages[locale]}>
      {children}
    </NextIntlClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
