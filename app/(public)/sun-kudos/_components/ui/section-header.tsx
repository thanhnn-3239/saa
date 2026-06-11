/**
 * SectionHeader — two-line design: small eyebrow text + large gold title.
 * Matches Figma pattern used by B.1_header, B.6_Header, C.1_Header.
 * i18n: eyebrow / title strings passed as props (callers hold i18n keys).
 */

interface SectionHeaderProps {
  /** Small text above the divider, e.g. "Sun* Annual Awards 2025" */
  eyebrow: string;
  /** Large gold title, e.g. "HIGHLIGHT KUDOS" */
  title: string;
  /** Optional children rendered to the right of the title (filter dropdowns) */
  actions?: React.ReactNode;
  className?: string;
}

export function SectionHeader({ eyebrow, title, actions, className = "" }: SectionHeaderProps) {
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Eyebrow */}
      <p className="font-montserrat font-bold text-2xl leading-8 text-white">{eyebrow}</p>

      {/* Divider */}
      <div className="h-px bg-saa-navy-border" />

      {/* Title row */}
      <div className="flex items-center justify-between gap-8 flex-wrap">
        <h2 className="font-montserrat font-bold text-[57px] leading-[64px] tracking-[-0.25px] text-saa-gold-accent">
          {title}
        </h2>
        {actions && <div className="flex items-center gap-4">{actions}</div>}
      </div>
    </div>
  );
}
