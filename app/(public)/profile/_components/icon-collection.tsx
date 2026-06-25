/**
 * IconCollection — "Bộ sưu tập icon của tôi" (region B2–B7).
 *
 * Renders a horizontal row of icon badge slots.
 * owned=true  → full-color badge image (circular, 64px).
 * owned=false → grayscale / dark placeholder (#323231) with white border.
 *
 * Design ref: mms_A.3_Huy Hiệu (362:5064).
 * Each slot: 80×64px INSTANCE, inner circle 64×64px, border 2px solid #FFF, border-radius 100px.
 *
 * IconBadge is re-exported from lib/profile/types — canonical source of truth.
 */

import Image from "next/image";
import type { IconBadge } from "@/lib/profile/types";
export type { IconBadge } from "@/lib/profile/types";

interface IconCollectionProps {
  badges: IconBadge[];
  className?: string;
}

function BadgeSlot({ badge }: { badge: IconBadge }) {
  // imageUrl is "" when no image is set in the DB (canonical type: string, not null)
  const hasImage = badge.owned && badge.imageUrl !== "";
  return (
    <div
      className="flex flex-col items-center justify-center shrink-0"
      style={{ width: 80, height: 64 }}
      title={badge.description ?? badge.name}
    >
      <div
        className="relative flex items-center justify-center overflow-hidden"
        style={{
          width: 64,
          height: 64,
          borderRadius: "100px",
          border: "2px solid #FFF",
          background: hasImage ? "transparent" : "#323231",
        }}
      >
        {hasImage ? (
          <Image
            src={badge.imageUrl}
            alt={badge.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          /* Locked state: dark gray placeholder — no image rendered */
          <span className="sr-only">{badge.name} (locked)</span>
        )}
      </div>
    </div>
  );
}

export function IconCollection({ badges, className = "" }: IconCollectionProps) {
  if (!badges.length) return null;

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {badges.map((badge) => (
        <BadgeSlot key={badge.id} badge={badge} />
      ))}
    </div>
  );
}
