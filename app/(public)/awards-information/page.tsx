/**
 * Hệ thống giải — page root (Server Component).
 *
 * Auth model:
 *   Primary gate: proxy.ts PUBLIC_PATHS allowlist — /awards-information is NOT listed,
 *   so every unauthenticated request is redirected to /login by the middleware.
 *   getSessionUser() below is defense-in-depth only (mirrors sun-kudos pattern).
 *
 * Data flow:
 *   Resolves translations (HeThongGiai + Home.awards namespaces) + AWARD_CATEGORIES
 *   → builds typed props → passes to HeThongGiaiScreen (client composition).
 */

import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { getSessionUser } from "@/lib/auth/get-session-user";
import { AWARD_CATEGORIES } from "@/lib/awards/categories";
import { ROUTES } from "@/lib/navigation/routes";
import {
  HeThongGiaiScreen,
  type AwardCardData,
  type NavItem,
} from "./_components/he-thong-giai-screen";

export const metadata: Metadata = {
  title: "Hệ thống giải",
};

export default async function HeThongGiaiPage() {
  // Defense-in-depth: proxy already blocks guests, but we guard here too.
  await getSessionUser();

  const [t, tHome] = await Promise.all([
    getTranslations("HeThongGiai"),
    getTranslations("Home.awards"),
  ]);

  const navItems: NavItem[] = AWARD_CATEGORIES.map((c) => ({
    slug: c.slug,
    label: t(`nav.${c.navKey}` as Parameters<typeof t>[0]),
  }));

  const awards: AwardCardData[] = AWARD_CATEGORIES.map((c) => ({
    slug: c.slug,
    title: tHome(c.titleKey as Parameters<typeof tHome>[0]),
    description: tHome(c.descKey as Parameters<typeof tHome>[0]),
    imageSrc: c.imageSrc,
    quantityLabel: t("fields.quantityLabel"),
    quantityValue: t(c.quantityKey as Parameters<typeof t>[0]),
    prizeLabel: t("fields.valueLabel"),
    prizeValue: t(c.valueKey as Parameters<typeof t>[0]),
    imageRight: c.imageRight,
  }));

  return (
    <main>
      <HeThongGiaiScreen
        eyebrow={t("eyebrow")}
        pageTitle={t("pageTitle")}
        navItems={navItems}
        awards={awards}
        kudos={{
          label: t("kudos.label"),
          title: t("kudos.title"),
          description: t("kudos.description"),
          ctaLabel: t("kudos.cta"),
          ctaHref: ROUTES.kudos,
          illustrationSrc: "/homepage-saa/Kudos_Background.png",
        }}
      />
    </main>
  );
}
