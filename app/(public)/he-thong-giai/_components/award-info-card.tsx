import Image from "next/image";

// mm:313:8467 — mms_D.1_Top talent (template for all 6 award info cards)
// Layout: image left (or right for even cards) + content right, separated by dividers.
// Contract matches integration spec exactly.

interface AwardInfoCardProps {
  /** Award title shown in gold (e.g. "Top Talent"). */
  title: string;
  /** Full description paragraph. */
  description: string;
  /** Path to the 336×336 award card image (background + name overlay). */
  imageSrc: string;
  /** Label for quantity row (e.g. "Số lượng giải thưởng:"). */
  quantityLabel: string;
  /** Value for quantity + unit (e.g. "10 Cá nhân"). */
  quantityValue: string;
  /** Label for prize row (e.g. "Giá trị giải thưởng:"). */
  prizeLabel: string;
  /** Prize amount string (e.g. "7.000.000 VNĐ"). */
  prizeValue: string;
  /** Optional note under prize (e.g. "cho mỗi giải thưởng"). */
  prizeNote?: string;
  /** When true, image is on the right side (alternating layout). */
  imageRight?: boolean;
  /** DOM id for scroll-spy target — same as slug. */
  id: string;
}

export function AwardInfoCard({
  title,
  description,
  imageSrc,
  quantityLabel,
  quantityValue,
  prizeLabel,
  prizeValue,
  prizeNote,
  imageRight = false,
  id,
}: AwardInfoCardProps) {
  const imageBlock = (
    // mm: Picture-Award instance — 336×336, mix-blend-mode: screen, gold glow
    // On mobile, image fills full width (aspect-square). On desktop, fixed 336px.
    <div
      className={[
        "relative w-full md:w-[336px] aspect-square md:h-[336px] shrink-0",
        "rounded-3xl border-[0.955px] border-saa-gold-accent",
        "shadow-saa-glow mix-blend-screen overflow-hidden",
      ].join(" ")}
    >
      <Image
        src={imageSrc}
        alt={title}
        fill
        className="object-cover rounded-3xl"
        sizes="(max-width: 768px) 100vw, 336px"
      />
    </div>
  );

  const contentBlock = (
    // mm: mms_D.1.2_Content — flex column with dividers
    <div className="flex flex-col gap-8 flex-1 min-w-0">
      {/* Section 1 — title + description */}
      <div className="flex flex-col gap-6">
        {/* Title row with target icon */}
        <div className="flex flex-row items-center gap-4">
          {/* Target icon */}
          <span className="shrink-0 text-saa-gold-accent" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="12"
                cy="12"
                r="9"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle
                cx="12"
                cy="12"
                r="5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </span>
          {/* mm:I313:8467;214:2530 — font-size:24px, gold */}
          <h2 className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent tracking-[0px] m-0">
            {title}
          </h2>
        </div>
        {/* mm:I313:8467;214:2531 — description, 16px, white, justified */}
        <p className="font-montserrat font-bold text-base leading-6 text-saa-text-primary tracking-[0.5px] m-0 text-justify">
          {description}
        </p>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-saa-navy-border" />

      {/* Section 2 — quantity */}
      <div className="flex flex-row items-center gap-4">
        {/* Diamond icon */}
        <span className="shrink-0 text-saa-gold-accent" aria-hidden="true">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 2L22 9L12 22L2 9L12 2Z"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {/* mm:I313:8467;214:2536 — quantity label, 24px gold */}
        <span className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent tracking-[0px]">
          {quantityLabel}
        </span>
        {/* Quantity value (number + unit) */}
        <span className="font-montserrat font-bold text-[36px] leading-[44px] text-saa-text-primary tracking-[0px] ml-2">
          {quantityValue}
        </span>
      </div>

      {/* Divider */}
      <div className="w-full h-px bg-saa-navy-border" />

      {/* Section 3 — prize value */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-row items-center gap-4">
          {/* License icon */}
          <span className="shrink-0 text-saa-gold-accent" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect
                x="3"
                y="4"
                width="18"
                height="16"
                rx="2"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path
                d="M7 9H17M7 13H13"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
          {/* mm:I313:8467;214:2544 — prize label, 24px gold */}
          <span className="font-montserrat font-bold text-2xl leading-8 text-saa-gold-accent tracking-[0px]">
            {prizeLabel}
          </span>
        </div>
        {/* mm:I313:8467;214:2546 — prize amount, 36px, white */}
        <span className="font-montserrat font-bold text-[36px] leading-[44px] text-saa-text-primary tracking-[0px]">
          {prizeValue}
        </span>
        {/* mm:I313:8467;214:2547 — prize note, 14px, white */}
        {prizeNote && (
          <span className="font-montserrat font-bold text-sm leading-5 text-saa-text-primary tracking-[0.1px]">
            {prizeNote}
          </span>
        )}
      </div>
    </div>
  );

  return (
    // mm:313:8467 — outer wrapper with bottom divider + scroll anchor
    <div
      id={id}
      className="flex flex-col gap-[80px] scroll-mt-[96px] w-full"
    >
      {/* Main row — image + content, alternating sides */}
      <div
        className={[
          "flex gap-10 items-start",
          "flex-col md:flex-row",
          imageRight ? "md:flex-row-reverse" : "",
        ].join(" ")}
      >
        {imageBlock}
        {contentBlock}
      </div>

      {/* Bottom divider */}
      <div className="w-full h-px bg-saa-navy-border" />
    </div>
  );
}
