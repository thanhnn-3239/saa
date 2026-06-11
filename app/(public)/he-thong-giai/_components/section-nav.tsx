"use client";

// mm:313:8459 — mms_C_Menu list
// Presentational-only; parent provides activeSlug + onSelect callback from scroll-spy.
// Sticky on desktop, hidden on mobile (hidden md:block).

interface NavItem {
  slug: string;
  label: string;
}

interface SectionNavProps {
  items: NavItem[];
  activeSlug: string;
  onSelect: (slug: string) => void;
}

export function SectionNav({ items, activeSlug, onSelect }: SectionNavProps) {
  return (
    // mm:313:8459 — sticky, desktop only
    <nav
      aria-label="Giải thưởng navigation"
      className="hidden md:flex flex-col gap-4 sticky top-[96px] w-[178px] shrink-0 self-start"
    >
      {items.map((item) => {
        const isActive = item.slug === activeSlug;
        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => onSelect(item.slug)}
            aria-current={isActive ? "true" : undefined}
            className={[
              "flex flex-row items-center gap-1 p-4 rounded text-left w-full",
              "font-montserrat font-bold text-sm leading-5 tracking-[0.25px]",
              "transition-colors duration-200 ease-[ease]",
              isActive
                ? // mm:313:8460 active state — gold, underline, glow text-shadow
                  "text-saa-gold-accent underline decoration-saa-gold-accent [text-shadow:0_4px_4px_rgba(0,0,0,0.25),0_0_6px_#FAE287]"
                : // inactive state — white, hover highlight
                  "text-saa-text-primary hover:bg-saa-gold-glass hover:text-saa-gold-accent",
            ].join(" ")}
          >
            {/* Target icon (24×24 SVG inline) */}
            <span
              aria-hidden="true"
              className={[
                "inline-block w-6 h-6 shrink-0",
                isActive ? "text-saa-gold-accent" : "text-saa-text-secondary",
              ].join(" ")}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
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
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
