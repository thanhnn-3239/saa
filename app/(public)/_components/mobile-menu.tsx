"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ROUTES } from "@/lib/navigation/routes";

// mm:I2167:9091 — Mobile nav (hamburger + drawer); shown below the `md` breakpoint
// where the horizontal <HeaderNav> is hidden.
interface MobileMenuProps {
  /** i18n nav labels — resolved by the parent server component. */
  navLabels: {
    aboutSaa: string;
    awardInformation: string;
    kudos: string;
  };
  /** Accessible label for the open/close toggle button. */
  toggleLabel: string;
}

const LINK_BASE =
  "block px-4 py-3 font-montserrat font-bold text-base leading-6 tracking-[0.1px] no-underline rounded transition-colors";
const LINK_ACTIVE =
  "text-saa-gold-accent bg-saa-gold-glass";
const LINK_INACTIVE = "text-white hover:bg-white/5";

function isActive(pathname: string, href: string): boolean {
  if (href === ROUTES.home) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function MobileMenu({ navLabels, toggleLabel }: MobileMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  const links = [
    { href: ROUTES.home, label: navLabels.aboutSaa },
    { href: ROUTES.awardsInfo, label: navLabels.awardInformation },
    { href: ROUTES.kudos, label: navLabels.kudos },
  ];

  // Close on Escape. (Navigation closes via each link's onClick handler.)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        aria-label={toggleLabel}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded text-white transition-colors hover:bg-white/10"
      >
        {open ? (
          // Close (X) icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M6 6l12 12M18 6L6 18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          // Hamburger icon
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M4 7h16M4 12h16M4 17h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop — tap to dismiss. Sits below the header (z-40 < header z-50). */}
          <div
            className="fixed inset-0 top-20 z-40 bg-black/50"
            aria-hidden="true"
            onClick={() => setOpen(false)}
          />
          {/* Drawer panel — slides under the fixed 80px header. */}
          <nav
            id={panelId}
            className="fixed left-0 right-0 top-20 z-40 flex flex-col gap-1 border-t border-saa-navy-border bg-[rgba(16,20,23,0.98)] px-4 py-4 [backdrop-filter:blur(8px)]"
          >
            {links.map(({ href, label }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`${LINK_BASE} ${active ? LINK_ACTIVE : LINK_INACTIVE}`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </>
      )}
    </div>
  );
}
