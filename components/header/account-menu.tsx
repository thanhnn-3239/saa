"use client";

import { useState, useEffect, useRef, type CSSProperties } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { signOut } from "@/lib/auth/sign-out-action";
import { ROUTES } from "@/lib/navigation/routes";

/** Highlightable rows in the dropdown. */
type MenuKey = "profile" | "admin" | "logout";

interface AccountMenuProps {
  /**
   * User role from JWT custom claims. When "admin", an Admin Dashboard item
   * is shown. Undefined (default) hides it — no role system exists yet.
   */
  role?: string;
}

/**
 * Account menu — authenticated-only header control.
 *
 * Accessibility:
 * - Toggle on click; close on outside-click or Escape.
 * - Keyboard open via Enter/Space (native button behaviour).
 * - aria-expanded reflects open state; aria-haspopup="menu" on trigger.
 * - Menu items are <a>/<button> so they receive focus in tab order.
 * - Focus returns to trigger on Escape close.
 *
 * Highlight: one row is "selected" (cream glow, per the Dropdown-profile design).
 * Defaults to Profile when opened, and follows mouse hover / keyboard focus so the
 * highlight moves to whichever row the user is on. Leaving the menu restores Profile.
 *
 * Admin Dashboard item is ONLY shown when role === "admin" (ID-5/ID-37
 * deferred — hidden until a real role system exists).
 */
export function AccountMenu({ role }: AccountMenuProps) {
  const t = useTranslations("Home");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<MenuKey>("profile");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isAdmin = role === "admin";

  // Close on Escape key, return focus to trigger.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Shared row style. The active row gets the cream glow (design's selected state);
  // inactive rows are transparent. `extra` carries element-specific overrides.
  function rowStyle(key: MenuKey, extra?: CSSProperties): CSSProperties {
    const isActive = active === key;
    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 4,
      padding: 16,
      height: 56,
      borderRadius: 4,
      fontFamily: "Montserrat, sans-serif",
      fontSize: 16,
      fontWeight: 700,
      color: "#FFF",
      letterSpacing: "0.15px",
      textDecoration: "none",
      cursor: "pointer",
      background: isActive ? "rgba(255, 234, 158, 0.10)" : "transparent",
      textShadow: isActive ? "0 4px 4px rgba(0,0,0,0.25), 0 0 6px #FAE287" : "none",
      ...extra,
    };
  }

  const itemClass =
    "transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/50";

  return (
    <div className="relative">
      {/* Trigger — plain 40×40 user-icon button per Homepage A1.8 */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          // Opening: reset the highlight to the Profile default.
          if (!open) setActive("profile");
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("account.menuAria")}
        style={{
          width: 40,
          height: 40,
          padding: 10,
          border: "1px solid #998C5F",
          borderRadius: 4,
          background: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <PersonIcon />
      </button>

      {/* Outside-click backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown menu — Dropdown-profile frame design.
          onMouseLeave restores the Profile default highlight. */}
      {open && (
        <ul
          role="menu"
          onMouseLeave={() => setActive("profile")}
          className="absolute right-0 top-full z-20 mt-2"
          style={{
            background: "#00070C",
            border: "1px solid #998C5F",
            borderRadius: 8,
            padding: 6,
            minWidth: 131,
          }}
        >
          {/* Profile — person icon on the right */}
          <li role="none">
            <Link
              href={ROUTES.profile}
              role="menuitem"
              onClick={() => setOpen(false)}
              onMouseEnter={() => setActive("profile")}
              onFocus={() => setActive("profile")}
              className={itemClass}
              style={rowStyle("profile")}
            >
              <span>{t("account.profile")}</span>
              <PersonIcon />
            </Link>
          </li>

          {/* Admin Dashboard — only when role === "admin".
              INVARIANT: /admin must NOT live under the app/(public) route group
              (that layout has no auth redirect). Place it in a protected route so
              the proxy enforces auth; otherwise it would be publicly reachable. */}
          {isAdmin && (
            <li role="none">
              <Link
                href="/admin"
                role="menuitem"
                onClick={() => setOpen(false)}
                onMouseEnter={() => setActive("admin")}
                onFocus={() => setActive("admin")}
                className={itemClass}
                style={rowStyle("admin")}
              >
                <span>{t("account.adminDashboard")}</span>
              </Link>
            </li>
          )}

          {/* Logout — label + chevron-right icon on the right.
              NOTE: do NOT close the menu in onClick — setOpen(false) would unmount
              this <form> before its server action dispatches, cancelling the logout.
              The signOut action redirects to /login, which closes the menu naturally. */}
          <li role="none">
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                onMouseEnter={() => setActive("logout")}
                onFocus={() => setActive("logout")}
                className={itemClass}
                style={rowStyle("logout", {
                  width: "100%",
                  border: "none",
                  textAlign: "left",
                })}
              >
                <span>{t("account.logout")}</span>
                <ChevronRightIcon />
              </button>
            </form>
          </li>
        </ul>
      )}
    </div>
  );
}

/**
 * Person icon — used in both the trigger (20px) and the Profile menu item right-side.
 * Matches MM_MEDIA_User Profile from the design.
 */
function PersonIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path
        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
        fill="white"
      />
    </svg>
  );
}

/** Chevron-right (›) icon — shown on the RIGHT of the Logout menu item. */
function ChevronRightIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M9 6L15 12L9 18" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
