"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { useUnreadCount } from "@/lib/notifications/use-unread-count";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { useMarkRead } from "@/lib/notifications/use-mark-read";
import { useNotificationsRealtime } from "@/lib/notifications/use-notifications-realtime";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

const PREVIEW_LIMIT = 5;

/**
 * Notification bell — authenticated-only header control.
 * Badge shows the live unread count; opening shows a preview of recent
 * notifications with "mark all read" and a "view all" link to /notifications.
 */
export function NotificationBell() {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useNotificationsRealtime();
  const { data: unread } = useUnreadCount();
  const { data } = useNotifications(PREVIEW_LIMIT);
  const { markOne, markAll } = useMarkRead();

  const items: NotificationItem[] = data?.pages?.[0]?.items ?? [];
  const unreadCount = unread ?? 0;

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    // Close when a pointer press lands outside the bell + panel. mousedown
    // (not click) mirrors FilterDropdown and fires before focus/navigation.
    function onPointerDown(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function handleSelect(item: NotificationItem) {
    markOne(item.id);
    setOpen(false);
    if (item.kudoId) {
      router.push(`${ROUTES.kudos}?kudo=${item.kudoId}`);
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        ref={buttonRef}
        type="button"
        aria-label={t("bellAria")}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={t("panelAria")}
          className="absolute right-0 top-full z-20 mt-2 w-80 overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: "#1a2a35", border: "1px solid rgba(46, 57, 64, 1)" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="font-montserrat text-sm font-semibold text-white">
              {t("title")}
            </span>
            <button
              type="button"
              onClick={() => markAll()}
              className="text-xs text-white/60 transition-colors hover:text-white"
            >
              {t("markAllRead")}
            </button>
          </div>

          {items.length === 0 ? (
            <div className="font-montserrat px-4 py-6 text-center text-sm text-white/45">
              {t("empty")}
            </div>
          ) : (
            <ul className="max-h-96 divide-y divide-white/5 overflow-y-auto">
              {items.map((item) => (
                <li key={item.id}>
                  <NotificationListItem item={item} onSelect={handleSelect} />
                </li>
              ))}
            </ul>
          )}

          <Link
            href={ROUTES.notifications}
            className="block border-t border-white/5 px-4 py-3 text-center text-sm text-white/70 transition-colors hover:bg-white/5 hover:text-white"
          >
            {t("viewAll")}
          </Link>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
        fill="currentColor"
        className="text-white"
      />
    </svg>
  );
}
