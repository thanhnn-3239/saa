"use client";

import { useTranslations } from "next-intl";
import { NotificationIcon } from "./notification-icon";
import type { NotificationItem } from "@/lib/notifications/types";

export interface NotificationListItemProps {
  item: NotificationItem;
  onSelect: (item: NotificationItem) => void;
}

/** Format an ISO timestamp as DD/MM/YYYY (matches the mockup "26/11/2025"). */
function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd = d.getDate().toString().padStart(2, "0");
  const mm = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Compose the localized message for a notification type. */
function useMessage(item: NotificationItem): string {
  const t = useTranslations("Notifications");
  if (item.type === "rank_up") return t("rankUp", { sender: item.actorName });
  return t("kudoReceived", { sender: item.actorName });
}

export function NotificationListItem({ item, onSelect }: NotificationListItemProps) {
  const message = useMessage(item);
  const unread = !item.isRead;

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5 focus:outline-none focus-visible:bg-white/5"
    >
      <span className="mt-0.5 shrink-0 text-white/70">
        <NotificationIcon type={item.type} />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-montserrat ${unread ? "font-semibold text-white" : "text-white/70"}`}
        >
          {message}
        </span>
        <span className="mt-1 block text-xs text-white/40">{formatDate(item.createdAt)}</span>
      </span>
      {unread && (
        <span
          data-unread="true"
          aria-hidden="true"
          className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500"
        />
      )}
    </button>
  );
}
