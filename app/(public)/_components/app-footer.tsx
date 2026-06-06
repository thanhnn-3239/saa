import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/navigation/routes";

// mm:5001:14800
export async function AppFooter() {
  const t = await getTranslations("Home.footer");

  return (
    // mm:5001:14800
    <footer
      className="w-full flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 lg:px-[90px] py-10"
      style={{
        borderTop: "1px solid #2E3940",
      }}
    >
      {/* Left: logo + nav links */}
      {/* mm:I5001:14800;342:1407 */}
      <div className="flex flex-wrap items-center gap-8 lg:gap-[80px]">
        {/* mm:I5001:14800;342:1408 — Logo → home */}
        <Link href={ROUTES.home} style={{ flexShrink: 0 }}>
          {/* mm:I5001:14800;342:1408;178:1030 */}
          <Image
            src="/homepage-saa/Logo.png"
            alt="Sun* Annual Awards"
            width={69}
            height={64}
            style={{ objectFit: "contain" }}
          />
        </Link>

        {/* mm:I5001:14800;342:1409 — Nav links */}
        <nav className="hidden sm:flex items-center flex-wrap" style={{ gap: "24px" }}>
          {/* mm:I5001:14800;342:1410 — About SAA 2025 */}
          <Link
            href={ROUTES.home}
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#fff",
              letterSpacing: "0.15px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t("aboutSaa")}
          </Link>

          {/* mm:I5001:14800;342:1411 — Award Information (highlighted) */}
          <Link
            href={ROUTES.awardsInfo}
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#fff",
              letterSpacing: "0.15px",
              textDecoration: "none",
              backgroundColor: "rgba(255, 234, 158, 0.10)",
              padding: "16px",
              borderRadius: "0",
              textShadow: "0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287",
              whiteSpace: "nowrap",
            }}
          >
            {t("awardInformation")}
          </Link>

          {/* mm:I5001:14800;342:1412 — Sun* Kudos */}
          <Link
            href={ROUTES.kudos}
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#fff",
              letterSpacing: "0.15px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t("kudos")}
          </Link>

          {/* mm:I5001:14800;1161:9487 — Tiêu chuẩn chung */}
          <Link
            href={ROUTES.standards}
            className="transition-opacity hover:opacity-80"
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#fff",
              letterSpacing: "0.15px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            {t("standards")}
          </Link>
        </nav>
      </div>

      {/* Right: copyright */}
      {/* mm:I5001:14800;342:1413 */}
      <span
        style={{
          fontFamily: "Montserrat Alternates, Montserrat, sans-serif",
          fontWeight: 700,
          fontSize: "16px",
          lineHeight: "24px",
          color: "#fff",
          letterSpacing: 0,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {t("copyright")}
      </span>
    </footer>
  );
}
