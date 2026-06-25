import Image from "next/image";

// mm:I313:8467;214:2525 — mms_D.1.1_Picture-Award (336×336)
// Two layers, exactly as the Figma design composes it:
//   1. mm_media_Award-Thumb-Background — the shared glowing gold ring + pedestal
//      tile (public/homepage-saa/Award_BG.png), same art for all 6 awards
//   2. mm_media_Award-Name-* — the per-award gold name label, overlaid in the
//      ring (e.g. /homepage-saa/Top_Talent.png), contained (no crop/zoom)

interface AwardTrophyProps {
  /** Gold award-name label PNG (transparent bg), e.g. /homepage-saa/Top_Talent.png. */
  imageSrc: string;
  /** Award title — used as the image alt text. */
  title: string;
}

export function AwardTrophy({ imageSrc, title }: AwardTrophyProps) {
  return (
    <div className="relative w-full md:w-[336px] aspect-square md:h-[336px] shrink-0">
      {/* Shared ring/pedestal/glow tile (square asset → fills the square box). */}
      <Image
        src="/homepage-saa/Award_BG.png"
        alt=""
        fill
        className="object-contain"
        sizes="(max-width: 768px) 100vw, 336px"
      />

      {/* Per-award gold name label, centred inside the ring (ring sits slightly
          above the tile centre, so nudge the label up to match). */}
      <div className="absolute inset-x-0 top-[43%] -translate-y-1/2 flex justify-center px-[24%]">
        <Image
          src={imageSrc}
          alt={title}
          width={232}
          height={64}
          className="w-auto max-w-full h-auto max-h-[44px] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          sizes="(max-width: 768px) 50vw, 170px"
        />
      </div>
    </div>
  );
}
