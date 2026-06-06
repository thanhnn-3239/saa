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
      className="w-full flex flex-wrap items-center justify-between gap-4 px-4 sm:px-8 lg:px-[90px] py-10 border-t border-saa-navy-border"
    >
      {/* Left: logo + nav links */}
      {/* mm:I5001:14800;342:1407 */}
      <div className="flex flex-wrap items-center gap-8 lg:gap-[80px]">
        {/* mm:I5001:14800;342:1408 — Logo → home */}
        <Link href={ROUTES.home} className="shrink-0">
          {/* mm:I5001:14800;342:1408;178:1030 */}
          <Image
            src="/homepage-saa/Logo.png"
            alt="Sun* Annual Awards"
            width={69}
            height={64}
            className="object-contain"
          />
        </Link>

        {/* mm:I5001:14800;342:1409 — Nav links */}
        <nav className="hidden sm:flex items-center flex-wrap gap-6">
          {/* mm:I5001:14800;342:1410 — About SAA 2025 */}
          <Link
            href={ROUTES.home}
            className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px] no-underline whitespace-nowrap transition-opacity hover:opacity-80"
          >
            {t("aboutSaa")}
          </Link>

          {/* mm:I5001:14800;342:1411 — Award Information (highlighted) */}
          <Link
            href={ROUTES.awardsInfo}
            className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px] no-underline bg-saa-gold-glass p-4 whitespace-nowrap transition-opacity hover:opacity-80 [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
          >
            {t("awardInformation")}
          </Link>

          {/* mm:I5001:14800;342:1412 — Sun* Kudos */}
          <Link
            href={ROUTES.kudos}
            className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px] no-underline whitespace-nowrap transition-opacity hover:opacity-80"
          >
            {t("kudos")}
          </Link>

          {/* mm:I5001:14800;1161:9487 — Tiêu chuẩn chung */}
          <Link
            href={ROUTES.standards}
            className="font-montserrat font-bold text-base leading-6 text-white tracking-[0.15px] no-underline whitespace-nowrap transition-opacity hover:opacity-80"
          >
            {t("standards")}
          </Link>
        </nav>
      </div>

      {/* Right: copyright */}
      {/* mm:I5001:14800;342:1413 */}
      <span className="font-montserrat font-bold text-base leading-6 text-white tracking-[0] whitespace-nowrap shrink-0">
        {t("copyright")}
      </span>
    </footer>
  );
}
