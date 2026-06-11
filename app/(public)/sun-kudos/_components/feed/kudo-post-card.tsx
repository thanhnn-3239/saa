"use client";
/**
 * KudoPostCard — Section C.3 card rendered in the All Kudos feed.
 *
 * Thin wrapper over {@link KudoCardBase} with the feed variant:
 *   image gallery, body clamp 5, all hashtags, no "Xem chi tiết".
 *
 * Design ref: Figma C.3_KUDO Post (componentId 256:5231).
 */

import { KudoCardBase } from "../ui/kudo-card-base";
import type { KudoCard } from "@/lib/kudos/types";

interface KudoPostCardProps {
  card: KudoCard;
  /** Server-injected origin (e.g. https://saa.sun-asterisk.com) for copy-link URL. */
  baseUrl: string;
  onLike?: (id: string) => void;
  /** Kept for call-site parity — copy is handled internally by CopyLinkButton. */
  onCopyLink?: (id: string) => void;
  onOpenProfile?: (profileId: string) => void;
  onOpenImage?: (kudoId: string, index: number) => void;
}

export function KudoPostCard({
  card,
  baseUrl,
  onLike,
  onOpenProfile,
  onOpenImage,
}: KudoPostCardProps) {
  return (
    <KudoCardBase
      card={card}
      baseUrl={baseUrl}
      showImages
      showViewDetail={false}
      showEdit
      bodyClamp={5}
      onLike={onLike}
      onOpenProfile={onOpenProfile}
      onOpenImage={onOpenImage}
    />
  );
}
