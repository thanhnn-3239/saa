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
      className="mx-auto w-full max-w-[1224px]"
    >
      {/* mm:I3390:10349;313:8415 — SunKudos group with bg image
          Mobile: auto height (content drives height).
          Desktop: fixed 500px as per Figma. */}
      <div className="relative overflow-hidden w-full min-h-[320px] lg:h-[500px] rounded-2xl">
        {/* mm:I3390:10349;313:8416 — background image */}
        <Image
          src="/homepage-saa/Kudos_Background.png"
          alt=""
          fill
          className="object-cover rounded-2xl"
        />
        {/* Dark overlay to ensure readability */}
        <div className="absolute inset-0 bg-[#0F0F0F] opacity-60 rounded-2xl" />

        {/* mm:I3390:10349;329:2948 — Sun* Kudos logo (desktop only, top-right) */}
        <div className="hidden lg:block absolute top-[215px] right-16">
          <Image
            src="/homepage-saa/Logo_Kudos.svg"
            alt="Sun* Kudos Logo"
            width={364}
            height={72}
            className="object-contain"
          />
        </div>

        {/* mm:I3390:10349;313:8419 — content block.
            Mobile: relative, full-width, padding-based layout.
            Desktop (lg): absolute, Figma-exact left:64px top:46px width:457px height:408px. */}
        <div
          className="
            relative z-10 flex flex-col justify-center gap-8
            px-6 py-10
            lg:absolute lg:top-[46px] lg:left-[64px] lg:w-[457px] lg:h-[408px] lg:px-0 lg:py-0
          "
        >
          {/* mm:I3390:10349;313:8420 */}
          <div className="flex flex-col gap-4">
            {/* mm:I3390:10349;313:8421 — section label */}
            <span className="font-montserrat font-bold text-2xl leading-8 text-white tracking-[0]">
              {t("sectionLabel")}
            </span>

            {/* mm:I3390:10349;313:8422 — section title
                Mobile: 36px to fit within ~300px content width.
                Desktop: 57px as per Figma. */}
            <h2
              className="text-[36px] leading-[44px] lg:text-[57px] lg:leading-[64px] font-montserrat font-bold text-saa-gold-accent tracking-[-0.25px] m-0"
            >
              {t("title")}
            </h2>

            {/* mm:I3390:10349;313:8423 — description */}
            <p className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.5px] text-justify m-0">
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
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90 p-4 rounded bg-saa-gold-accent no-underline"
            >
              <span className="font-montserrat font-bold text-base leading-6 text-saa-navy-darkest tracking-[0.15px]">
                {t("detailsCta")}
              </span>
              {/* mm:I3390:10349;313:8426;186:1766 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-saa-navy-darkest"
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
