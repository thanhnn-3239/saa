"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ROUTES } from "@/lib/navigation/routes";
import { useNotifications } from "@/lib/notifications/use-notifications";
import { useMarkRead } from "@/lib/notifications/use-mark-read";
import { NotificationListItem } from "@/components/notifications/notification-list-item";
import type { NotificationItem } from "@/lib/notifications/types";

export function NotificationsList() {
  const t = useTranslations("Notifications");
  const router = useRouter();
  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } = useNotifications(20);
  const { markOne, markAll } = useMarkRead();

  const items: NotificationItem[] = (data?.pages ?? []).flatMap((p) => p.items);

  function handleSelect(item: NotificationItem) {
    markOne(item.id);
    if (item.kudoId) router.push(`${ROUTES.kudos}?kudo=${item.kudoId}`);
  }

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="font-montserrat text-xl font-semibold text-white">
          {t("title")}
        </h1>
        <button
          type="button"
          onClick={() => markAll()}
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          {t("markAllRead")}
        </button>
      </div>

      {items.length === 0 ? (
        <p className="py-12 text-center text-sm text-white/45">{t("empty")}</p>
      ) : (
        <ul className="divide-y divide-white/5 overflow-hidden rounded-xl bg-[#1a2a35]">
          {items.map((item) => (
            <li key={item.id}>
              <NotificationListItem item={item} onSelect={handleSelect} />
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-white/15 px-4 py-2 text-sm text-white/80 transition-colors hover:bg-white/5 disabled:opacity-50"
          >
            {t("loadMore")}
          </button>
        </div>
      )}
    </section>
  );
}
