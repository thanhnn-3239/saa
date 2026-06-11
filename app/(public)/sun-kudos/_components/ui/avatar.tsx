/**
 * Avatar primitive — circular image with fallback initials.
 * Used by kudo cards, leaderboard tiles, and the spotlight cloud.
 */
import Image from "next/image";

interface AvatarProps {
  src: string | null;
  alt: string;
  /** Display size in px (width = height). Default 40. */
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className = "" }: AvatarProps) {
  const initials = alt
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-saa-navy-elevated ${className}`}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${size}px`}
        />
      ) : (
        <span
          className="select-none font-montserrat font-bold text-saa-gold-accent"
          style={{ fontSize: Math.max(10, size * 0.35) }}
        >
          {initials}
        </span>
      )}
    </div>
  );
}
