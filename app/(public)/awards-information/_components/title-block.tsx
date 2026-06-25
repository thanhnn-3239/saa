// mm:313:8453 — mms_A_Title hệ thống giải thưởng
interface TitleBlockProps {
  /** Small eyebrow text above the main title (e.g. "Sun* Annual Awards 2025") */
  eyebrow: string;
  /** Main large gold title (e.g. "Hệ thống giải thưởng SAA 2025") */
  title: string;
}

export function TitleBlock({ eyebrow, title }: TitleBlockProps) {
  return (
    // mm:313:8453
    <div className="flex flex-col gap-4 w-full">
      {/* mm:313:8454 — eyebrow, font-size:24px, white, centered */}
      <span className="font-montserrat font-bold text-2xl leading-8 text-saa-text-primary text-center tracking-[0px]">
        {eyebrow}
      </span>

      {/* mm:313:8455 — divider line */}
      <div className="w-full h-px bg-saa-navy-border" />

      {/* mm:313:8456 — title row, centered */}
      <div className="flex flex-row items-center justify-center gap-8">
        {/* mm:313:8457 — font-size:57px, gold */}
        <h1 className="font-montserrat font-bold text-[32px] md:text-[57px] leading-[40px] md:leading-[64px] text-saa-gold-accent tracking-[-0.25px] text-left m-0">
          {title}
        </h1>
      </div>
    </div>
  );
}
