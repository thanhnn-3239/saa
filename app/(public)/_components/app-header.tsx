import Image from "next/image";
import Link from "next/link";
import React from "react";
import { ROUTES } from "@/lib/navigation/routes";
import { HeaderNav } from "./header-nav";
import { MobileMenu } from "./mobile-menu";

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
  /** Accessible label for the mobile hamburger toggle. */
  menuToggleLabel: string;
}

export function AppHeader({ languageSwitcher, authControls, navLabels, menuToggleLabel }: AppHeaderProps) {
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

        {/* mm:I2167:9091;178:653 — Nav links; active tab follows the current pathname */}
        <HeaderNav navLabels={navLabels} />
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

        {/* Mobile-only hamburger + drawer (HeaderNav is hidden below md) */}
        <MobileMenu navLabels={navLabels} toggleLabel={menuToggleLabel} />
      </div>
    </header>
  );
}
