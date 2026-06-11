"use client";
/**
 * HighlightCard — single card in the B.2 carousel.
 *
 * Thin wrapper over {@link KudoCardBase} with the highlight variant:
 *   no images, body clamp 3, ≤5 hashtags (+N), "Xem chi tiết",
 *   carousel center/side scaling via `active`.
 *
 * Design ref: Figma B.3 instance (componentId 256:5231 variant).
 */

import { KudoCardBase } from "../ui/kudo-card-base";
import type { KudoCard } from "@/lib/kudos/types";

interface HighlightCardProps {
  card: KudoCard;
  /** Whether this card is the center/active card in the carousel. */
  active?: boolean;
  /** Server-injected origin (e.g. https://saa.sun-asterisk.com) for copy-link URL. */
  baseUrl: string;
  onLike?: (id: string) => void;
  /** Kept for call-site parity — copy is handled internally by CopyLinkButton. */
  onCopyLink?: (id: string) => void;
  onViewDetail?: (id: string) => void;
  onOpenProfile?: (profileId: string) => void;
}

export function HighlightCard({
  card,
  active = false,
  baseUrl,
  onLike,
  onViewDetail,
  onOpenProfile,
}: HighlightCardProps) {
  return (
    <KudoCardBase
      card={card}
      baseUrl={baseUrl}
      active={active}
      showImages={false}
      showViewDetail
      bodyClamp={3}
      maxHashtags={5}
      onLike={onLike}
      onViewDetail={onViewDetail}
      onOpenProfile={onOpenProfile}
    />
  );
}
