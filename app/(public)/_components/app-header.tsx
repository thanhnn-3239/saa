import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ROUTES } from "@/lib/navigation/routes";

// mm:2167:9091
interface AppHeaderProps {
  /** LanguageSwitcher component — always rendered (guest + authed). */
  languageSwitcher?: React.ReactNode;
  /** NotificationBell + AccountMenu — rendered for authenticated users only. */
  authControls?: React.ReactNode;
  /** i18n nav labels — resolved by the parent server component. */
  navLabels: {
    aboutSaa: string;
    awardInformation: string;
    kudos: string;
  };
}

export function AppHeader({ languageSwitcher, authControls, navLabels }: AppHeaderProps) {
  return (
    // mm:2167:9091
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-8 lg:px-36 h-20 gap-4 bg-[rgba(16,20,23,0.80)] [backdrop-filter:blur(8px)]"
    >
      {/* Left: logo + nav */}
      {/* mm:I2167:9091;186:2166 */}
      <div className="flex items-center gap-16 shrink-0">
        {/* mm:I2167:9091;178:1033 — Logo → home */}
        <Link href={ROUTES.home} className="flex shrink-0">
          {/* mm:I2167:9091;178:1033;178:1030 */}
          <Image
            src="/homepage-saa/Logo.png"
            alt="Sun* Annual Awards"
            width={52}
            height={48}
            className="object-contain"
            priority
          />
        </Link>

        {/* mm:I2167:9091;178:653 — Nav links (hidden on mobile, shown from md) */}
        <nav className="hidden md:flex items-center gap-6">
          {/* mm:I2167:9091;186:1579 — About SAA 2025 (active / selected state) */}
          <Link
            href={ROUTES.home}
            className="flex items-center px-4 py-4 font-montserrat font-bold text-sm leading-5 text-saa-gold-accent tracking-[0.1px] no-underline border-b border-saa-gold-accent transition-colors hover:opacity-80 whitespace-nowrap [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
          >
            {navLabels.aboutSaa}
          </Link>

          {/* mm:I2167:9091;186:1587 — Awards Information */}
          <Link
            href={ROUTES.awardsInfo}
            className="flex items-center px-4 py-4 font-montserrat font-bold text-sm leading-5 text-white tracking-[0.1px] no-underline rounded transition-colors hover:opacity-80 whitespace-nowrap"
          >
            {navLabels.awardInformation}
          </Link>

          {/* mm:I2167:9091;186:1593 — Sun* Kudos */}
          <Link
            href={ROUTES.kudos}
            className="flex items-center px-4 py-4 font-montserrat font-bold text-sm leading-5 text-white tracking-[0.1px] no-underline rounded transition-colors hover:opacity-80 whitespace-nowrap"
          >
            {navLabels.kudos}
          </Link>
        </nav>
      </div>

      {/* Right: language switcher + auth controls */}
      {/* mm:I2167:9091;186:1601 */}
      <div className="flex items-center gap-2 shrink-0">
        {/* mm:I2167:9091;186:1696 — Language switcher (replaces static "VN" placeholder) */}
        {languageSwitcher}

        {/* Auth controls slot — renders nothing when undefined (guest) */}
        {/* mm:I2167:9091;186:2101;186:2020;186:1420 Noti.svg — notification bell */}
        {/* mm:I2167:9091;186:1597;186:1420 User_Profile.svg — user avatar */}
        {authControls}
      </div>
    </header>
  );
}
