import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ROUTES } from "@/lib/navigation/routes";

/**
 * Shared "coming soon" placeholder for stub route pages.
 * Renders an i18n title and a back-to-home link so navigation is never broken.
 * Server component — no interactivity needed.
 */
export async function ComingSoon() {
  const t = await getTranslations("Home.comingSoonPage");

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-4"
      style={{ backgroundColor: "#00101a" }}
    >
      <h1
        className="text-center text-3xl font-bold text-white"
        style={{ fontFamily: "Montserrat, sans-serif" }}
      >
        {t("title")}
      </h1>
      <Link
        href={ROUTES.home}
        className="rounded-lg px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/10"
        style={{
          fontFamily: "Montserrat, sans-serif",
          color: "#c9a84c",
          border: "1px solid #c9a84c",
        }}
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
