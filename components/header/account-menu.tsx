"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { signOut } from "@/lib/auth/sign-out-action";
import { ROUTES } from "@/lib/navigation/routes";

interface AccountMenuProps {
  /** Display name or email shown in the trigger button. */
  email: string;
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
 * Admin Dashboard item is ONLY shown when role === "admin" (ID-5/ID-37
 * deferred — hidden until a real role system exists).
 */
export function AccountMenu({ email, role }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const isAdmin = role === "admin";

  // Close on Escape key.
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

  // Derive a short display label from the email (part before @).
  const displayName = email.split("@")[0] ?? email;

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${displayName}`}
        className="flex items-center gap-2 rounded-full px-3 py-1.5 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        {/* Avatar circle */}
        <span
          className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold uppercase"
          style={{ backgroundColor: "#c9a84c", color: "#00101a" }}
          aria-hidden="true"
        >
          {displayName.charAt(0)}
        </span>
        <span
          className="hidden max-w-[120px] truncate text-sm font-semibold text-white sm:block"
          style={{ fontFamily: "Montserrat, sans-serif" }}
        >
          {displayName}
        </span>
        <ChevronIcon open={open} />
      </button>

      {/* Outside-click backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Dropdown menu */}
      {open && (
        <ul
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl shadow-2xl"
          style={{
            backgroundColor: "#1a2a35",
            border: "1px solid rgba(46, 57, 64, 1)",
          }}
        >
          {/* Profile link */}
          <li role="none">
            <Link
              href={ROUTES.profile}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:bg-white/10"
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
            >
              <PersonIcon />
              Profile
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
                className="flex items-center gap-3 px-4 py-3 text-sm text-white transition-colors hover:bg-white/10 focus:outline-none focus-visible:bg-white/10"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
              >
                <DashboardIcon />
                Admin Dashboard
              </Link>
            </li>
          )}

          {/* Divider */}
          <li role="none">
            <div aria-hidden="true" style={{ height: "1px", backgroundColor: "rgba(46, 57, 64, 1)" }} />
          </li>

          {/* Sign out */}
          <li role="none">
            <form action={signOut}>
              <button
                type="submit"
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-3 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus-visible:bg-white/10"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 600 }}
              >
                <SignOutIcon />
                Sign out
              </button>
            </form>
          </li>
        </ul>
      )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={{
        transition: "transform 200ms ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M7 10L12 15L17 10H7Z" fill="white" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"
        fill="currentColor"
        className="text-white/70"
      />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
        fill="currentColor"
        className="text-white/70"
      />
    </svg>
  );
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5-5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"
        fill="currentColor"
        className="text-white/70"
      />
    </svg>
  );
}
