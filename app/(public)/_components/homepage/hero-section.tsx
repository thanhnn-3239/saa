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
      className="relative w-full"
      style={{
        minHeight: "100vh",
        background: "transparent",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "96px 0",
      }}
    >
      {/* Keyvisual background — z-index:0, content gets z-index:1 */}
      {/* mm:2167:9027 */}
      <div
        className="absolute inset-0"
        style={{ pointerEvents: "none", zIndex: 0 }}
      >
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
        <div
          className="absolute inset-0"
          style={{ background: "rgba(10,16,20,0.55)" }}
        />
      </div>

      {/* Centered content container */}
      <div
        className="mx-auto w-full px-4 sm:px-8 lg:px-[144px]"
        style={{ maxWidth: "1512px", position: "relative", zIndex: 1 }}
      >
        {/* mm:2167:9031 */}
        <div
          className="flex flex-col"
          style={{ gap: "40px" }}
        >
          {/* ROOT FURTHER logo */}
          {/* mm:2167:9032 */}
          <div>
            {/* mm:2788:12911 — max-w-full ensures it never overflows on narrow viewports */}
            <Image
              src="/homepage-saa/Root_Further_Logo.png"
              alt="Root Further"
              width={451}
              height={200}
              className="max-w-full h-auto"
              style={{ objectFit: "contain" }}
              priority
            />
          </div>

          {/* Countdown + event info */}
          {/* mm:2167:9034 */}
          <div className="flex flex-col" style={{ gap: "16px" }}>
            {/* mm:2167:9035 — live countdown (client component) */}
            <CountdownLive />

            {/* Event info */}
            {/* mm:2167:9053 */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              {/* mm:2167:9054 */}
              <div className="flex flex-row flex-wrap" style={{ gap: "60px", alignItems: "center" }}>
                {/* mm:2167:9055 — date */}
                <div className="flex flex-row items-baseline" style={{ gap: "4px" }}>
                  {/* mm:2167:9056 */}
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#fff",
                      letterSpacing: "0.15px",
                    }}
                  >
                    {t("eventInfo.dateLabel")}
                  </span>
                  {/* mm:2167:9057 */}
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "24px",
                      lineHeight: "32px",
                      color: "#FFEA9E",
                      letterSpacing: 0,
                    }}
                  >
                    {t("eventInfo.dateValue")}
                  </span>
                </div>
                {/* mm:2167:9058 — venue */}
                <div className="flex flex-row items-baseline" style={{ gap: "4px" }}>
                  {/* mm:2167:9060 */}
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      lineHeight: "24px",
                      color: "#fff",
                      letterSpacing: "0.15px",
                    }}
                  >
                    {t("eventInfo.venueLabel")}
                  </span>
                  {/* mm:2167:9059 */}
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "24px",
                      lineHeight: "32px",
                      color: "#FFEA9E",
                      letterSpacing: 0,
                    }}
                  >
                    {t("eventInfo.venueValue")}
                  </span>
                </div>
              </div>
              {/* mm:2167:9061 — livestream note */}
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#fff",
                  letterSpacing: "0.5px",
                }}
              >
                {t("eventInfo.livestream")}
              </span>
            </div>
          </div>

          {/* CTA buttons */}
          {/* mm:2167:9062 */}
          <div className="flex flex-row flex-wrap" style={{ gap: "40px" }}>
            {/* mm:2167:9063 — About Awards (primary gold) → awards-information */}
            <Link
              href={ROUTES.awardsInfo}
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{
                padding: "16px 24px",
                borderRadius: "8px",
                backgroundColor: "#FFEA9E",
                textDecoration: "none",
                flexShrink: 0,
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
                  whiteSpace: "nowrap",
                }}
              >
                {t("about.sectionCta")}
              </span>
              {/* mm:I2167:9063;186:1766 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#00101A", flexShrink: 0 }}
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
              className="inline-flex items-center gap-2 transition-opacity hover:opacity-90"
              style={{
                padding: "16px 24px",
                borderRadius: "8px",
                border: "1px solid #998C5F",
                background: "rgba(255, 234, 158, 0.10)",
                textDecoration: "none",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "Montserrat, sans-serif",
                  fontWeight: 700,
                  fontSize: "16px",
                  lineHeight: "24px",
                  color: "#fff",
                  letterSpacing: "0.15px",
                  whiteSpace: "nowrap",
                }}
              >
                {t("kudos.sectionCta")}
              </span>
              {/* mm:I2167:9064;186:2761 — arrow icon */}
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ color: "#fff", flexShrink: 0 }}
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
