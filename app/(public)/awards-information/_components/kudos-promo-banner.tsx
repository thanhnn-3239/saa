import Image from "next/image";
import Link from "next/link";

// mm:335:12023 — mms_D1_Sunkudos
// 1152×500 dark card with background image, text content left, Kudos logo right.
// Hover lift effect on card.

interface KudosPromoBannerProps {
  /** Small label above title (e.g. "Phong trào ghi nhận"). */
  label: string;
  /** Large gold title (e.g. "Sun* Kudos"). */
  title: string;
  /** Description paragraph. */
  description: string;
  /** CTA button label (e.g. "Chi tiết"). */
  ctaLabel: string;
  /** CTA href — same-tab navigation (e.g. "/sun-kudos"). */
  ctaHref: string;
  /** Kudos background image src. */
  illustrationSrc: string;
}

export function KudosPromoBanner({
  label,
  title,
  description,
  ctaLabel,
  ctaHref,
  illustrationSrc,
}: KudosPromoBannerProps) {
  return (
    // mm:335:12023 — 1152×500, rounded-2xl, dark bg, hover lift
    <div className="relative w-full overflow-hidden rounded-2xl group motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-[ease] motion-safe:hover:-translate-y-1">
      {/* mm:I335:12023;313:8416 — background image */}
      <div className="absolute inset-0 rounded-2xl">
        <Image
          src={illustrationSrc}
          alt=""
          fill
          className="object-cover rounded-2xl"
          sizes="(max-width: 768px) 100vw, 1152px"
        />
        {/* Dark overlay to ensure text readability */}
        <div className="absolute inset-0 bg-[rgba(15,15,15,0.55)] rounded-2xl" />
      </div>

      {/* Content */}
      {/* mm:I335:12023;313:8415 — group */}
      <div className="relative z-[1] flex flex-col md:flex-row items-center justify-between gap-8 px-[65px] py-[45px] min-h-[500px]">
        {/* mm:I335:12023;313:8419 — mms_D2_Content, left side */}
        <div className="flex flex-col gap-8 max-w-[470px]">
          {/* Text block */}
          <div className="flex flex-col gap-4">
            {/* mm:I335:12023;313:8421 — label, 24px, white */}
            <span className="font-montserrat font-bold text-2xl leading-8 text-saa-text-primary tracking-[0px]">
              {label}
            </span>
            {/* mm:I335:12023;313:8422 — title, 57px, gold */}
            <span className="font-montserrat font-bold text-[36px] md:text-[57px] leading-[44px] md:leading-[64px] text-saa-gold-accent tracking-[-0.25px]">
              {title}
            </span>
            {/* mm:I335:12023;313:8423 — description, 16px, white, justified */}
            <p className="font-montserrat font-bold text-base leading-6 text-saa-text-primary tracking-[0.5px] m-0 text-justify whitespace-pre-line">
              {description}
            </p>
          </div>

          {/* mm:I335:12023;313:8426 — CTA button */}
          <Link
            href={ctaHref}
            className={[
              "inline-flex items-center gap-2 self-start",
              "px-4 py-4 rounded-saa-button",
              "bg-saa-gold-accent no-underline",
              "transition-opacity duration-200 ease-[ease] hover:opacity-90",
            ].join(" ")}
          >
            <span className="font-montserrat font-bold text-base leading-6 text-saa-navy-darkest tracking-[0.15px] whitespace-nowrap">
              {ctaLabel}
            </span>
            {/* mm:I335:12023;313:8426;186:1766 — Up/arrow icon */}
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-saa-navy-darkest shrink-0"
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
          </Link>
        </div>

        {/* mm:I335:12023;329:2948 — Kudos logo, right side */}
        <div className="shrink-0 flex items-center justify-center">
          <Image
            src="/homepage-saa/Logo_Kudos.svg"
            alt="Sun* Kudos"
            width={383}
            height={72}
            className="w-[280px] md:w-[383px] h-auto object-contain"
          />
        </div>
      </div>
    </div>
  );
}
