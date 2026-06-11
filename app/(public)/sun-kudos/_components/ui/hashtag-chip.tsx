/**
 * HashtagChip — a hashtag word rendered in the kudo cards.
 *
 * Design (C.3 / B.3): plain red text (#D4271D) at 16px, no pill chrome — sits on
 * the cream card. The selected/active variant (filter wiring) stays gold.
 * i18n: no localizable strings.
 */

interface HashtagChipProps {
  tag: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function HashtagChip({
  tag,
  active = false,
  onClick,
  className = "",
}: HashtagChipProps) {
  const base =
    "inline-flex items-center text-base font-semibold transition-colors duration-150";
  const activeStyle = "text-saa-gold-accent";
  const inactiveStyle = "text-[#D4271D] hover:text-[#D4271D]/80";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${active ? activeStyle : inactiveStyle} cursor-pointer ${className}`}
      >
        {tag}
      </button>
    );
  }

  return (
    <span className={`${base} ${active ? activeStyle : inactiveStyle} ${className}`}>
      {tag}
    </span>
  );
}
