import { getTranslations } from "next-intl/server";
import { AWARD_CATEGORIES } from "@/lib/awards/categories";
import { awardAnchor } from "@/lib/navigation/routes";
import { AwardCard } from "./award-card";

// mm:2167:9068
export async function AwardsSection() {
  const t = await getTranslations("Home.awards");

  return (
    // mm:2167:9068
    <section
      id="awards"
      className="mx-auto w-full"
      style={{ maxWidth: "1224px" }}
    >
      {/* mm:2167:9069 — section header */}
      <div
        className="flex flex-col"
        style={{ gap: "16px", marginBottom: "80px" }}
      >
        {/* mm:2167:9070 — eyebrow label */}
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 700,
            fontSize: "24px",
            lineHeight: "32px",
            color: "#fff",
            letterSpacing: 0,
          }}
        >
          {t("sectionCta")}
        </span>

        {/* mm:2167:9071 — divider */}
        <div
          style={{
            width: "100%",
            height: "1px",
            backgroundColor: "#2E3940",
          }}
        />

        {/* mm:2167:9072 — section title */}
        <div style={{ paddingTop: "16px" }}>
          {/* mm:2167:9073 — responsive font: scales down on mobile/tablet so the
              57px design size doesn't overflow narrow viewports. */}
          <h2
            className="m-0 font-montserrat font-bold tracking-[-0.25px] text-[32px] leading-[40px] sm:text-[40px] sm:leading-[48px] lg:text-[57px] lg:leading-[64px]"
            style={{ color: "#FFEA9E" }}
          >
            {t("sectionTitle")}
          </h2>
        </div>
      </div>

      {/* mm:5005:14974 — awards grid: 3 cols desktop, 2 cols tablet/mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8 sm:gap-x-[80px] sm:gap-y-[80px]">
        {AWARD_CATEGORIES.map((category) => (
          <AwardCard
            key={category.slug}
            title={t(category.titleKey as Parameters<typeof t>[0])}
            description={t(category.descKey as Parameters<typeof t>[0])}
            imageSrc={category.imageSrc}
            href={awardAnchor(category.slug)}
            detailsCta={t("detailsCta")}
          />
        ))}
      </div>
    </section>
  );
}
