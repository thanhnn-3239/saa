import { getTranslations } from "next-intl/server";
import { LoginHeader } from "./_components/login-header";
import { LoginHero } from "./_components/login-hero";
import { GoogleLoginControl } from "./_components/google-login-control";
import { LoginErrorBanner } from "./_components/login-error-banner";
import { LoginFooter } from "./_components/login-footer";

/**
 * Login page — server component.
 * Reads `searchParams.error` (awaited, Next.js 16 async API) and passes
 * it to <LoginErrorBanner> so the orchestrator can wire OAuth redirects in phase-04.
 *
 * Full-screen layout:
 *   C — background art (mms_C_Keyvisual image + Cover gradient overlay)
 *   A — fixed header (logo + language switcher)
 *   B — main content (key visual + welcome text + login button)
 *   D — footer (copyright)
 */
interface LoginPageProps {
  searchParams: Promise<{ error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams;
  const t = await getTranslations("Login");

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ backgroundColor: "#00101A" }}
    >
      {/* C — Background art: mms_C_Keyvisual scene image.
           The Figma fill image for the keyvisual artwork (image 1) is not
           exported as a media asset (no Figma upload URL available).
           We render a deep dark-teal base that matches the left-side of the scene,
           which the Cover gradient then darkens further toward the bottom. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 75% 40%, #1a3a2a 0%, #0a2030 40%, #00101A 100%)",
        }}
      />

      {/* C — Dark gradient overlay (Cover rectangle) */}
      {/* Design: linear-gradient(0deg, #00101A 22.48%, rgba(0,19,32,0) 51.74%) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background:
            "linear-gradient(0deg, #00101A 22.48%, rgba(0, 19, 32, 0.00) 51.74%)",
        }}
      />

      {/* A — Header (fixed, z-20) */}
      <LoginHeader />

      {/* Main content wrapper — offset by header height (80px) */}
      <div className="relative z-10 flex min-h-screen flex-col" style={{ paddingTop: "80px" }}>
        {/* B — Hero: key visual + welcome text + login button */}
        <LoginHero
          welcomeLine1={t("welcomeLine1")}
          welcomeLine2={t("welcomeLine2")}
        >
          {/* Error banner above the login button */}
          <LoginErrorBanner code={error} />

          {/* B.3 — Login button wired to Supabase Google OAuth */}
          <GoogleLoginControl />
        </LoginHero>

        {/* D — Footer */}
        <div className="mt-auto">
          <LoginFooter text={t("footer")} />
        </div>
      </div>
    </div>
  );
}
