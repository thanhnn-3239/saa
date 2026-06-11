"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/lib/navigation/routes";

// mm:I2167:9091;178:653 — Nav links (hidden on mobile, shown from md)
interface HeaderNavProps {
  /** i18n nav labels — resolved by the parent server component. */
  navLabels: {
    aboutSaa: string;
    awardInformation: string;
    kudos: string;
  };
}

const BASE_LINK_CLASSES =
  "flex items-center px-4 py-4 font-montserrat font-bold text-sm leading-5 tracking-[0.1px] no-underline transition-colors hover:opacity-80 whitespace-nowrap";

// mm:I2167:9091;186:1579 — active / selected state (gold text + underline + glow)
const ACTIVE_LINK_CLASSES =
  "text-saa-gold-accent border-b border-saa-gold-accent [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]";

const INACTIVE_LINK_CLASSES = "text-white rounded";

/**
 * Returns true when `pathname` is on the page `href` points to.
 * Home requires an exact match (every path starts with "/"); other routes
 * also match nested paths (e.g. "/sun-kudos/123" keeps Sun* Kudos active).
 */
function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HeaderNav({ navLabels }: HeaderNavProps) {
  const pathname = usePathname();

  const links = [
    // mm:I2167:9091;186:1579 — About SAA 2025
    { href: ROUTES.home, label: navLabels.aboutSaa },
    // mm:I2167:9091;186:1587 — Awards Information
    { href: ROUTES.awardsInfo, label: navLabels.awardInformation },
    // mm:I2167:9091;186:1593 — Sun* Kudos
    { href: ROUTES.kudos, label: navLabels.kudos },
  ];

  return (
    <nav className="hidden md:flex items-center gap-6">
      {links.map(({ href, label }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`${BASE_LINK_CLASSES} ${active ? ACTIVE_LINK_CLASSES : INACTIVE_LINK_CLASSES}`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
