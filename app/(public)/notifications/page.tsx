/**
 * /notifications — full notifications list (Server Component).
 * Prefetches the first page into a dehydrated QueryClient so the client list
 * hydrates without a loading flash, mirroring app/(public)/sun-kudos/page.tsx.
 */
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { makeQueryClient } from "@/lib/query/query-client";
import { getNotificationsPage } from "@/lib/notifications/queries";
import { notificationsKey } from "@/lib/notifications/query-keys";
import { NotificationsList } from "./_components/notifications-list";

export default async function NotificationsPage() {
  const queryClient = makeQueryClient();

  await queryClient.prefetchInfiniteQuery({
    queryKey: [...notificationsKey, 20],
    queryFn: () => getNotificationsPage({ cursor: null, limit: 20 }),
    initialPageParam: null as number | null,
  });

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <NotificationsList />
    </HydrationBoundary>
  );
}
