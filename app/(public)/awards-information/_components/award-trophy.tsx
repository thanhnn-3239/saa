import Image from "next/image";

// mm:I313:8467;214:2525 — mms_D.1.1_Picture-Award (336×336)
// The Figma design composites a glowing gold ring + pedestal on a dark tile
// (node "mm_media_Award-Thumb-Background") with the award name overlaid on top.
// That ring/pedestal art is a vector-rendered Figma component, not a downloadable
// raster, so it is reproduced here in CSS + SVG. Only the gold name label is a
// real asset (e.g. /homepage-saa/Top_Talent.png) — overlaid with object-contain.

interface AwardTrophyProps {
  /** Gold award-name label PNG (transparent bg), e.g. /homepage-saa/Top_Talent.png. */
  imageSrc: string;
  /** Award title — used as the image alt text. */
  title: string;
}

export function AwardTrophy({ imageSrc, title }: AwardTrophyProps) {
  return (
    // Dark tile: mirrors the design's 336×336 thumb — gold border + outer glow.
    <div
      className={[
        "relative w-full md:w-[336px] aspect-square md:h-[336px] shrink-0",
        "rounded-3xl border border-saa-gold-accent/50 overflow-hidden",
        "shadow-saa-glow",
        // Navy radial spotlight behind the ring (brighter centre → dark edges).
        "bg-[radial-gradient(circle_at_50%_44%,#013049_0%,#001725_55%,#00101a_78%)]",
      ].join(" ")}
    >
      {/* Glowing gold ring, centred slightly above the middle to leave room for the pedestal. */}
      <div
        className={[
          "absolute left-1/2 top-[44%] -translate-x-1/2 -translate-y-1/2",
          "w-[74%] aspect-square rounded-full border-2 border-saa-gold-bright",
          "[box-shadow:0_0_22px_3px_rgba(250,226,135,0.45),inset_0_0_22px_3px_rgba(250,226,135,0.28)]",
        ].join(" ")}
      >
        {/* Award name label, contained inside the ring (no crop/zoom). */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={title}
            width={232}
            height={64}
            className="w-auto max-w-[74%] h-auto max-h-[40%] object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.55)]"
            sizes="(max-width: 768px) 60vw, 200px"
          />
        </div>
      </div>

      {/* Pedestal — concentric gold ellipses suggesting a 3D podium. */}
      <svg
        viewBox="0 0 200 56"
        className="absolute left-1/2 bottom-[7%] -translate-x-1/2 w-[58%] h-auto drop-shadow-[0_0_10px_rgba(250,226,135,0.35)]"
        fill="none"
        aria-hidden="true"
      >
        <ellipse cx="100" cy="28" rx="92" ry="17" stroke="#FFEA9E" strokeWidth="2" opacity="0.85" />
        <ellipse cx="100" cy="30" rx="66" ry="12" stroke="#FAE287" strokeWidth="1.5" opacity="0.7" />
        <ellipse cx="100" cy="31" rx="40" ry="7" fill="#FFEA9E" opacity="0.18" />
      </svg>
    </div>
  );
}
