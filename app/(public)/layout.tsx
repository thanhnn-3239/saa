import React from "react";
import { getTranslations } from "next-intl/server";
import { AppHeader } from "./_components/app-header";
import { AppFooter } from "./_components/app-footer";
import { FloatingWidgetButton } from "./_components/floating-widget-button";
import { NotificationBell } from "@/components/header/notification-bell";
import { AccountMenu } from "@/components/header/account-menu";
import { LanguageSwitcher } from "@/components/language-switcher";
import { getSessionUser } from "@/lib/auth/get-session-user";

/**
 * Public route-group layout (Server Component).
 * Resolves the session and passes auth controls to AppHeader when authenticated.
 * Guests see nav + language switcher only (no bell / account menu).
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, t] = await Promise.all([
    getSessionUser(),
    getTranslations("Home"),
  ]);

  const languageSwitcher = (
    <LanguageSwitcher ariaLabel={t("nav.langSelectAria")} />
  );

  const authControls = user ? (
    <>
      <NotificationBell />
      <AccountMenu role={user.role} />
    </>
  ) : null;

  return (
    <div
      className="relative min-h-screen flex flex-col"
      style={{ backgroundColor: "#101417", color: "#fff" }}
    >
      {/* Fixed header — language switcher always visible; auth controls gated */}
      <AppHeader
        languageSwitcher={languageSwitcher}
        authControls={authControls}
        navLabels={{
          aboutSaa: t("nav.aboutSaa"),
          awardInformation: t("nav.awardInformation"),
          kudos: t("nav.kudos"),
        }}
      />

      {/* Page content — padded top to clear fixed header */}
      <div className="flex-1" style={{ paddingTop: "80px" }}>
        {children}
      </div>

      {/* Footer */}
      <AppFooter />

      {/* Fixed floating widget button */}
      <FloatingWidgetButton />
    </div>
  );
}
