"use client";

/**
 * Optimistic like/unlike mutation for a single kudo card.
 *
 * On toggle:
 *   1. Immediately patches heartTotal + liked in both feed and highlight caches.
 *   2. Calls POST|DELETE /api/kudos/[id]/like.
 *   3. On error, rolls back all patched cache entries.
 *   4. On settle, invalidates affected query keys so the server value wins.
 *
 * Disabled when senderId === currentUserId (cannot like own kudo).
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { kudosFeedKey } from "./use-kudos-feed";
import { highlightKudosKey } from "./use-highlight-kudos";
import type { KudoCard, KudosFilter } from "./types";
import type { KudosPage } from "./queries";

interface ToggleLikeArgs {
  kudoId: string;
  currentlyLiked: boolean;
  /** The active filter so we can patch the right cache entries. */
  filter: KudosFilter;
}

interface LikeResponse {
  liked: boolean;
  heartTotal: number;
}

// ---------------------------------------------------------------------------
// Cache patch helpers
// ---------------------------------------------------------------------------

/** Apply a delta to a single KudoCard inside an infinite-query page list. */
function patchFeedCache(
  pages: KudosPage[],
  kudoId: string,
  patch: (card: KudoCard) => KudoCard,
): KudosPage[] {
  return pages.map((page) => ({
    ...page,
    items: page.items.map((card) =>
      card.id === kudoId ? patch(card) : card,
    ),
  }));
}

/** Apply a delta to a single KudoCard in the highlight array. */
function patchHighlightCache(
  cards: KudoCard[],
  kudoId: string,
  patch: (card: KudoCard) => KudoCard,
): KudoCard[] {
  return cards.map((card) => (card.id === kudoId ? patch(card) : card));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToggleLike(currentUserId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      kudoId,
      currentlyLiked,
    }: ToggleLikeArgs): Promise<LikeResponse> => {
      const method = currentlyLiked ? "DELETE" : "POST";
      const res = await fetch(`/api/kudos/${kudoId}/like`, { method });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? `HTTP ${res.status}`,
        );
      }
      return res.json() as Promise<LikeResponse>;
    },

    onMutate: async ({ kudoId, currentlyLiked, filter }) => {
      // Cancel any in-flight refetches that would overwrite the optimistic update.
      await Promise.all([
        queryClient.cancelQueries({ queryKey: kudosFeedKey(filter) }),
        queryClient.cancelQueries({ queryKey: highlightKudosKey(filter) }),
      ]);

      // Snapshot previous values for rollback.
      const prevFeed = queryClient.getQueryData<{ pages: KudosPage[] }>(
        kudosFeedKey(filter),
      );
      const prevHighlight = queryClient.getQueryData<KudoCard[]>(
        highlightKudosKey(filter),
      );

      // Optimistic delta.
      const delta = currentlyLiked ? -1 : +1;
      const patchCard = (card: KudoCard): KudoCard => ({
        ...card,
        liked: !currentlyLiked,
        heartTotal: Math.max(0, card.heartTotal + delta),
      });

      // Patch feed cache.
      if (prevFeed) {
        queryClient.setQueryData<{ pages: KudosPage[] }>(
          kudosFeedKey(filter),
          (old) =>
            old
              ? { ...old, pages: patchFeedCache(old.pages, kudoId, patchCard) }
              : old,
        );
      }

      // Patch highlight cache.
      if (prevHighlight) {
        queryClient.setQueryData<KudoCard[]>(
          highlightKudosKey(filter),
          (old) => (old ? patchHighlightCache(old, kudoId, patchCard) : old),
        );
      }

      return { prevFeed, prevHighlight };
    },

    onError: (_err, { filter }, context) => {
      // Rollback both caches on error.
      const ctx = context as
        | {
            prevFeed?: { pages: KudosPage[] };
            prevHighlight?: KudoCard[];
          }
        | undefined;

      if (ctx?.prevFeed !== undefined) {
        queryClient.setQueryData(kudosFeedKey(filter), ctx.prevFeed);
      }
      if (ctx?.prevHighlight !== undefined) {
        queryClient.setQueryData(highlightKudosKey(filter), ctx.prevHighlight);
      }
    },

    onSettled: (_data, _err, { filter }) => {
      // Invalidate so the server value reconciles after optimistic update.
      void queryClient.invalidateQueries({ queryKey: kudosFeedKey(filter) });
      void queryClient.invalidateQueries({
        queryKey: highlightKudosKey(filter),
      });
    },

    // Disable mutation when no user or when trying to like own kudo.
    // The caller passes the kudo's senderId to determine this; we expose
    // a helper so UI can gate the button without invoking mutate.
  });
}

/**
 * Returns true when the heart button should be disabled for a given kudo.
 * A null currentUserId means unauthenticated (should not occur — board is
 * login-gated, but guard defensively).
 */
export function isLikeDisabled(
  senderId: string,
  currentUserId: string | null,
): boolean {
  return currentUserId === null || senderId === currentUserId;
}
