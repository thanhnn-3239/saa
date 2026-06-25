import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/navigation/routes";
import { CountdownLive } from "./countdown-live";

// mm:2167:9030 (hero / "Bìa" section)
export async function HeroSection() {
  const t = await getTranslations("Home");

  return (
    // mm:2167:9030
    <section
      className="relative w-full min-h-screen flex flex-col items-center justify-center py-24 bg-transparent"
    >
      {/* Keyvisual background — z-index:0, content gets z-index:1 */}
      {/* mm:2167:9027 */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* mm:2167:9028 */}
        <Image
          src="/homepage-saa/Keyvisual_BG.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        {/* Dark overlay */}
        {/* mm:2167:9029 */}
        <div className="absolute inset-0 bg-[rgba(10,16,20,0.55)]" />
      </div>

      {/* Centered content container */}
      <div className="mx-auto w-full px-4 sm:px-8 lg:px-[144px] relative z-[1] max-w-[1512px]">
        {/* mm:2167:9031 */}
        <div className="flex flex-col gap-10">
          {/* ROOT FURTHER logo */}
          {/* mm:2167:9032 */}
          <div>
            {/* mm:2788:12911 — max-w-full ensures it never overflows on narrow viewports */}
            <Image
              src="/homepage-saa/Root_Further_Logo.png"
              alt="Root Further"
              width={451}
              height={200}
              className="max-w-full h-auto object-contain"
              priority
            />
          </div>

          {/* Countdown + event info */}
          {/* mm:2167:9034 */}
          <div className="flex flex-col gap-4">
            {/* mm:2167:9035 — live countdown (client component) */}
            <CountdownLive />

            {/* Event info */}
            {/* mm:2167:9053 */}
            <div className="flex flex-col gap-2">
              {/* mm:2167:9054 */}
              <div className="flex flex-row flex-wrap items-center gap-[60px]">
                {/* mm:2167:9055 — date */}
                <div className="flex flex-row items-baseline gap-1">
                  {/* mm:2167:9056 */}
                  <span className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px]">
                    {t("eventInfo.dateLabel")}
                  </span>
                  {/* mm:2167:9057 */}
                  <span className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent tracking-[0]">
                    {t("eventInfo.dateValue")}
                  </span>
                </div>
                {/* mm:2167:9058 — venue */}
                <div className="flex flex-row items-baseline gap-1">
                  {/* mm:2167:9060 */}
                  <span className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px]">
                    {t("eventInfo.venueLabel")}
                  </span>
                  {/* mm:2167:9059 */}
                  <span className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent tracking-[0]">
                    {t("eventInfo.venueValue")}
                  </span>
                </div>
              </div>
              {/* mm:2167:9061 — livestream note */}
              <span className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.5px]">
                {t("eventInfo.livestream")}
              </span>
            </div>
          </div>

          {/* CTA buttons */}
          {/* mm:2167:9062 */}
          <div className="flex flex-row flex-wrap gap-10">
            {/* mm:2167:9063 — About Awards (primary gold) → awards-information */}
            <Link
              href={ROUTES.awardsInfo}
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90 p-4 px-6 rounded-saa-button bg-saa-gold-accent no-underline shrink-0"
            >
              <span className="font-montserrat font-bold text-base leading-6 text-saa-navy-darkest tracking-[0.15px] whitespace-nowrap">
                {t("about.sectionCta")}
              </span>
              {/* mm:I2167:9063;186:1766 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-saa-navy-darkest shrink-0"
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

            {/* mm:2167:9064 — About Kudos (secondary outlined) → sun-kudos */}
            <Link
              href={ROUTES.kudos}
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90 p-4 px-6 rounded-saa-button border border-saa-gold-border bg-saa-gold-glass no-underline shrink-0"
            >
              <span className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px] whitespace-nowrap">
                {t("kudos.sectionCta")}
              </span>
              {/* mm:I2167:9064;186:2761 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white shrink-0"
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
