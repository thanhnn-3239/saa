"use client";

import { useScrollSpy } from "./use-scroll-spy";
import { AwardInfoCard } from "./award-info-card";
import { HeroBanner } from "./hero-banner";
import { KudosPromoBanner } from "./kudos-promo-banner";
import { SectionNav } from "./section-nav";
import { TitleBlock } from "./title-block";

// ---------------------------------------------------------------------------
// Props — all data injected from the server page (no mock data here).
// ---------------------------------------------------------------------------

export interface NavItem {
  slug: string;
  label: string;
}

export interface AwardCardData {
  slug: string;
  title: string;
  description: string;
  imageSrc: string;
  quantityLabel: string;
  quantityValue: string;
  prizeLabel: string;
  prizeValue: string;
  prizeNote?: string;
  imageRight: boolean;
}

export interface KudosBannerData {
  label: string;
  title: string;
  description: string;
  ctaLabel: string;
  ctaHref: string;
  illustrationSrc: string;
}

interface HeThongGiaiScreenProps {
  eyebrow: string;
  pageTitle: string;
  navItems: NavItem[];
  awards: AwardCardData[];
  kudos: KudosBannerData;
}

export function HeThongGiaiScreen({
  eyebrow,
  pageTitle,
  navItems,
  awards,
  kudos,
}: HeThongGiaiScreenProps) {
  const slugs = navItems.map((n) => n.slug);
  const { activeSlug, scrollTo } = useScrollSpy(slugs);

  // Fall back to first slug until scroll-spy picks up an intersecting section.
  const resolvedActive = activeSlug ?? slugs[0] ?? "";

  return (
    // Background matches existing page: transparent (inherits saa-navy-darkest from layout)
    <div className="w-full">
      {/* Page padding container matching design 96px top/bottom, 144px sides */}
      <div className="w-full px-4 sm:px-8 lg:px-[144px] py-24 flex flex-col gap-[120px]">
        {/* Hero / KV section — mm:313:8450 */}
        <HeroBanner />

        {/* Title block — mm:313:8453 */}
        <TitleBlock eyebrow={eyebrow} title={pageTitle} />

        {/* Two-column awards section — mm:313:8458 */}
        {/* Desktop: sticky nav left (178px) + cards right (856px), gap-[80px] */}
        {/* Mobile: single column, nav hidden, cards stacked */}
        <div className="flex flex-row gap-[80px] items-start w-full">
          {/* Left: sticky nav (desktop only) */}
          <SectionNav
            items={navItems}
            activeSlug={resolvedActive}
            onSelect={scrollTo}
          />

          {/* Right: award cards list */}
          <div className="flex flex-col gap-[80px] flex-1 min-w-0">
            {awards.map((award) => (
              <AwardInfoCard
                key={award.slug}
                id={award.slug}
                title={award.title}
                description={award.description}
                imageSrc={award.imageSrc}
                quantityLabel={award.quantityLabel}
                quantityValue={award.quantityValue}
                prizeLabel={award.prizeLabel}
                prizeValue={award.prizeValue}
                prizeNote={award.prizeNote}
                imageRight={award.imageRight}
              />
            ))}
          </div>
        </div>

        {/* Sun* Kudos promo banner — mm:335:12023 */}
        <KudosPromoBanner
          label={kudos.label}
          title={kudos.title}
          description={kudos.description}
          ctaLabel={kudos.ctaLabel}
          ctaHref={kudos.ctaHref}
          illustrationSrc={kudos.illustrationSrc}
        />
      </div>
    </div>
  );
}
