import Image from "next/image";
import Link from "next/link";

// mm:2167:9075
interface AwardCardProps {
  /** Resolved award title string (from i18n). */
  title: string;
  /** Resolved award description string (from i18n). */
  description: string;
  /** Path to the award overlay image relative to /public. */
  imageSrc: string;
  /** Full href for the card link (e.g. /awards-information#top-talent). */
  href: string;
  /** Resolved "Chi tiết" / "Details" CTA label (from i18n). */
  detailsCta: string;
}

export function AwardCard({
  title,
  description,
  imageSrc,
  href,
  detailsCta,
}: AwardCardProps) {
  return (
    // mm:2167:9075
    <Link
      href={href}
      className="flex flex-col gap-6 w-full group"
      style={{ textDecoration: "none" }}
    >
      {/* Picture with gold glow border */}
      {/* mm:I2167:9075;214:1019 */}
      <div
        className="relative w-full overflow-hidden"
        style={{
          aspectRatio: "1/1",
          borderRadius: "24px",
          border: "0.955px solid #FFEA9E",
          boxShadow: "0 4px 4px 0 rgba(0, 0, 0, 0.25), 0 0 6px 0 #FAE287",
          mixBlendMode: "screen",
        }}
      >
        {/* mm:I2167:9075;214:1019;81:2442 — card background */}
        <Image
          src="/homepage-saa/Award_BG.png"
          alt=""
          fill
          className="object-cover"
          style={{ borderRadius: "24px" }}
        />
        {/* Award name overlay image (centre of card) */}
        {/* mm:I2167:9075;214:1019;214:666 */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={imageSrc}
            alt={title}
            width={232}
            height={64}
            className="object-contain"
          />
        </div>
      </div>

      {/* Text content */}
      {/* mm:I2167:9075;214:1020 */}
      <div className="flex flex-col gap-1">
        {/* mm:I2167:9075;214:1021 — title */}
        <span
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "24px",
            lineHeight: "32px",
            color: "#FFEA9E",
            letterSpacing: 0,
          }}
        >
          {title}
        </span>
        {/* mm:I2167:9075;214:1022 — description */}
        <p
          className="line-clamp-2"
          style={{
            fontFamily: "Montserrat, sans-serif",
            fontWeight: 400,
            fontSize: "16px",
            lineHeight: "24px",
            color: "#fff",
            letterSpacing: "0.5px",
            margin: 0,
          }}
        >
          {description}
        </p>
        {/* mm:I2167:9075;214:1023 — details CTA */}
        <div
          className="flex items-center gap-1 transition-opacity group-hover:opacity-80"
          style={{ paddingTop: "16px" }}
        >
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              color: "#fff",
              letterSpacing: "0.15px",
            }}
          >
            {detailsCta}
          </span>
          {/* mm:I2167:9075;214:1023;186:1441 — arrow icon */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ color: "#fff" }}
            aria-hidden="true"
          >
            <path
              d="M7 17L17 7M17 7H7M17 7V17"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
