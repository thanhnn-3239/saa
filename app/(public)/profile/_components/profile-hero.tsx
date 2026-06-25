/**
 * ProfileHero — region A: keyvisual background band + identity block.
 *
 * Layout from Figma (362:5052 mms_A_Info):
 *   - A.1: circular Avatar (200px, 4px white border) — centered above the fold
 *   - A.2: name (36px gold, Montserrat 700) + department dot + HeroTitlePill
 *   - A.3: "Bộ sưu tập icon của tôi" label + IconCollection row
 *
 * Keyvisual: Figma asset URL was null — reusing public/sun-kudos/kv-hero.png
 * (same feather/peacock graphic as the Kudos board hero). Gradient overlay is
 * applied on top so the profile identity block remains readable.
 *
 * ProfileHeader is the canonical type from lib/profile/types (not a local copy).
 * heroTier is pre-computed by getProfileHeader() — used directly, no re-derivation.
 *
 * Design ref: 362:5052 (mms_A_Info), 1210:12622 (Keyvisual).
 */

"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Avatar } from "@/app/(public)/sun-kudos/_components/ui/avatar";
import { HeroTitlePill } from "@/app/(public)/sun-kudos/_components/ui/hero-title-pill";
import { IconCollection } from "./icon-collection";
import type { ProfileHeader } from "@/lib/profile/types";
import type { IconBadge } from "@/lib/profile/types";

export type { ProfileHeader };

interface ProfileHeroProps {
  header: ProfileHeader;
  badges: IconBadge[];
}

export function ProfileHero({ header, badges }: ProfileHeroProps) {
  const t = useTranslations("Profile");
  // heroTier is pre-computed server-side by getProfileHeader() — use directly.
  const heroTier = header.heroTier;

  return (
    <section className="relative w-full" style={{ minHeight: 652 }}>
      {/* Keyvisual background band — 512px tall */}
      <div
        className="absolute inset-x-0 top-0 w-full overflow-hidden"
        style={{ height: 512 }}
        aria-hidden="true"
      >
        {/* Keyvisual image — same asset as Kudos board hero (Figma asset URL was null) */}
        <Image
          src="/sun-kudos/kv-hero.png"
          alt=""
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
        />
        {/* Gradient overlay matching Figma Cover (linear-gradient 8deg, #00101A 8.6% → transparent 37.25%) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(8deg, #00101A 8.6%, rgba(0, 19, 32, 0.00) 37.25%)",
            zIndex: 1,
          }}
        />
        {/* Bottom fade to blend into the page background */}
        <div
          className="absolute inset-x-0 bottom-0"
          style={{
            height: 120,
            background: "linear-gradient(to bottom, transparent, #00101A)",
            zIndex: 2,
          }}
        />
      </div>

      {/* Identity block — centered horizontally, overlays the keyvisual */}
      <div
        className="relative flex flex-col items-center"
        style={{ paddingTop: 184, zIndex: 3 }}
      >
        {/* A.1 — Avatar: 200px circle, 4px white border */}
        <div
          className="shrink-0"
          style={{
            border: "4px solid #FFF",
            borderRadius: "50%",
            lineHeight: 0,
          }}
        >
          <Avatar src={header.avatarUrl} alt={header.fullName} size={200} />
        </div>

        {/* A.2 — Name + department + hero title pill */}
        <div className="flex flex-col items-center gap-2 mt-8">
          {/* Name — 36px, gold, Montserrat 700 */}
          <h1
            className="font-montserrat font-bold text-saa-gold-accent text-center"
            style={{ fontSize: 36, lineHeight: "44px" }}
          >
            {header.fullName}
          </h1>

          {/* Department + separator dot + hero title */}
          <div className="flex items-center gap-2.5">
            {header.departmentName && (
              <>
                <span
                  className="font-montserrat font-bold text-white"
                  style={{ fontSize: 22, lineHeight: "28px" }}
                >
                  {header.departmentName}
                </span>
                {heroTier && (
                  <span
                    className="rounded-full bg-saa-text-muted/40"
                    style={{ width: 4, height: 4 }}
                    aria-hidden="true"
                  />
                )}
              </>
            )}

            {heroTier && (
              <HeroTitlePill tierKey={heroTier.key} label={heroTier.label} />
            )}
          </div>
        </div>

        {/* A.3 — Icon collection section. w-full + px-4 bound the badge row to
            the viewport so IconCollection's flex-wrap can reflow on mobile. */}
        {badges.length > 0 && (
          <div className="flex flex-col items-center gap-4 mt-8 w-full px-4">
            <span
              className="font-montserrat font-bold text-white text-center"
              style={{ fontSize: 22, lineHeight: "28px" }}
            >
              {t("iconCollectionHeading")}
            </span>
            <IconCollection badges={badges} className="w-full" />
          </div>
        )}
      </div>
    </section>
  );
}
