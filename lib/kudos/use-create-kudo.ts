"use client";

/**
 * Create-kudo mutation for the send dialog.
 *
 * Flow: validate+upload images (client → storage) → POST /api/kudos (RPC) →
 * invalidate every feed/highlight cache so the new kudo appears immediately
 * regardless of the active filter (realtime also delivers it to other viewers).
 *
 * Errors (ImageValidationError or RPC/route messages) surface through
 * mutation.error for the dialog to toast / map to fields.
 */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { uploadKudoImages } from "./upload-kudo-images";
import type { CreateKudoInput } from "./types";

interface CreateKudoResponse {
  id: string;
}

async function createKudo(input: CreateKudoInput): Promise<CreateKudoResponse> {
  const imagePaths = await uploadKudoImages(input.imageFiles);

  const res = await fetch("/api/kudos", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      recipientId: input.recipientId,
      title: input.title,
      bodyHtml: input.bodyHtml,
      hashtagIds: input.hashtagIds,
      imagePaths,
      isAnonymous: input.isAnonymous,
      anonymousName: input.isAnonymous ? input.anonymousName.trim() || null : null,
    }),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<CreateKudoResponse>;
}

export function useCreateKudo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createKudo,
    onSuccess: () => {
      // Prefix-match invalidation hits every filter variant of both lists.
      void queryClient.invalidateQueries({ queryKey: ["kudos", "feed"] });
      void queryClient.invalidateQueries({ queryKey: ["kudos", "highlight"] });
      void queryClient.invalidateQueries({ queryKey: ["kudos", "spotlight"] });
      void queryClient.invalidateQueries({ queryKey: ["kudos", "sidebar"] });
    },
  });
}
