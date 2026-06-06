import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/navigation/routes";

// mm:3390:10349
export async function KudosSection() {
  const t = await getTranslations("Home.kudos");

  return (
    // mm:3390:10349
    <section
      id="kudos"
      className="mx-auto w-full"
      style={{ maxWidth: "1224px" }}
    >
      {/* mm:I3390:10349;313:8415 — SunKudos group with bg image
          Mobile: auto height (content drives height).
          Desktop: fixed 500px as per Figma. */}
      <div
        className="relative overflow-hidden w-full min-h-[320px] lg:h-[500px]"
        style={{ borderRadius: "16px" }}
      >
        {/* mm:I3390:10349;313:8416 — background image */}
        <Image
          src="/homepage-saa/Kudos_Background.png"
          alt=""
          fill
          className="object-cover"
          style={{ borderRadius: "16px" }}
        />
        {/* Dark overlay to ensure readability */}
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: "#0F0F0F",
            opacity: 0.6,
            borderRadius: "16px",
          }}
        />

        {/* mm:I3390:10349;329:2948 — Sun* Kudos logo (desktop only, top-right) */}
        <div className="hidden lg:block absolute" style={{ top: "215px", right: "64px" }}>
          <Image
            src="/homepage-saa/Logo_Kudos.svg"
            alt="Sun* Kudos Logo"
            width={364}
            height={72}
            style={{ objectFit: "contain" }}
          />
        </div>

        {/* mm:I3390:10349;313:8419 — content block.
            Mobile: relative, full-width, padding-based layout.
            Desktop (lg): absolute, Figma-exact left:64px top:46px width:457px height:408px. */}
        <div
          className="
            relative z-10 flex flex-col justify-center
            px-6 py-10
            lg:absolute lg:top-[46px] lg:left-[64px] lg:w-[457px] lg:h-[408px] lg:px-0 lg:py-0
          "
          style={{ gap: "32px" }}
        >
          {/* mm:I3390:10349;313:8420 */}
          <div className="flex flex-col" style={{ gap: "16px" }}>
            {/* mm:I3390:10349;313:8421 — section label */}
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
              {t("sectionLabel")}
            </span>

            {/* mm:I3390:10349;313:8422 — section title
                Mobile: 36px to fit within ~300px content width.
                Desktop: 57px as per Figma. */}
            <h2
              className="text-[36px] leading-[44px] lg:text-[57px] lg:leading-[64px]"
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                color: "#FFEA9E",
                letterSpacing: "-0.25px",
                margin: 0,
              }}
            >
              {t("title")}
            </h2>

            {/* mm:I3390:10349;313:8423 — description */}
            <p
              style={{
                fontFamily: "Montserrat, sans-serif",
                fontWeight: 700,
                fontSize: "16px",
                lineHeight: "24px",
                color: "#fff",
                letterSpacing: "0.5px",
                textAlign: "justify",
                margin: 0,
              }}
            >
              <strong>{t("highlight")}</strong>
              {"\n"}
              {t("description")}
            </p>
          </div>

          {/* mm:I3390:10349;313:8424 — CTA */}
          <div>
            {/* mm:I3390:10349;313:8426 — Chi tiết button → sun-kudos */}
            <Link
              href={ROUTES.kudos}
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{
                padding: "16px",
                borderRadius: "4px",
                backgroundColor: "#FFEA9E",
                textDecoration: "none",
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#00101A",
                  letterSpacing: "0.15px",
                }}
              >
                {t("detailsCta")}
              </span>
              {/* mm:I3390:10349;313:8426;186:1766 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#00101A" }}
                aria-hidden="true"
              >
                <path
                  d="M7 17L17 7M17 7H7M17 7V17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
