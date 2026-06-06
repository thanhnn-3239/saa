"use client";

import { useState, useEffect, useRef } from "react";

/**
 * Notification bell — authenticated-only header control.
 * Clicking the bell toggles a placeholder panel. The red badge slot is
 * rendered but hidden by default (no real notification source exists yet).
 *
 * Keyboard: Enter/Space open the panel; Escape closes it.
 * Outside-click: closes the panel via a backdrop overlay.
 */
export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on Escape key.
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative">
      {/* Bell trigger button */}
      <button
        ref={buttonRef}
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <BellIcon />
        {/* Badge slot — hidden until a real notification count exists */}
        <span
          aria-hidden="true"
          className="absolute right-1.5 top-1.5 hidden h-2 w-2 rounded-full bg-red-500"
        />
      </button>

      {/* Outside-click backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Placeholder notification panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications panel"
          className="absolute right-0 top-full z-20 mt-2 w-72 rounded-xl shadow-2xl"
          style={{
            backgroundColor: "#1a2a35",
            border: "1px solid rgba(46, 57, 64, 1)",
          }}
        >
          {/* TODO(i18n): stub — localize when feature is built */}
          <div className="px-4 py-3 text-sm font-semibold text-white/80"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Thông báo
          </div>
          <div
            className="px-4 py-6 text-center text-sm text-white/45"
            style={{ fontFamily: "Montserrat, sans-serif" }}
          >
            Chưa có thông báo mới.
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill="currentColor"
        className="text-white"
      />
    </svg>
  );
}
