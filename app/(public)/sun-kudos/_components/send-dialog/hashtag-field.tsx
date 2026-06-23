/**
 * hashtag-field.tsx
 *
 * "Hashtag*" row — label + an inline wrapping list of ALL hashtag options as
 * toggle pills (matches the production saa.sun-asterisk.vn editor, verified live):
 *   - unselected pill: white bg, #999999 text, 1px #998C5F border, rounded-full
 *   - selected pill:   #FFEA9E bg, #00101A text, #FFEA9E border (borderless look)
 *   - max 5 selected — clicking a 6th unselected pill is a no-op (parent guards)
 *   - "Tối đa 5" note below the pills
 */

import { useTranslations } from "next-intl";
import type { HashtagBrief } from "./send-kudo-types";

interface HashtagFieldProps {
  /** All selectable hashtags (existing taxonomy). */
  options: HashtagBrief[];
  /** Currently selected hashtags. */
  selected: HashtagBrief[];
  /** Toggle a hashtag on/off. */
  onToggle: (tag: HashtagBrief) => void;
  error?: string;
  max?: number;
}

export function HashtagField({
  options,
  selected,
  onToggle,
  error,
  max = 5,
}: HashtagFieldProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  const selectedIds = new Set(selected.map((s) => s.id));
  const atMax = selected.length >= max;

  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 w-full">
      {/* Label — stacks above the pills on mobile. */}
      <div className="flex flex-row items-center gap-[2px] shrink-0 sm:w-[108px] sm:pt-[10px]">
        <span
          className="font-montserrat font-bold text-[#00101A] leading-7 text-lg sm:text-[22px]"
        >
          {t("hashtagLabel")}
        </span>
        <span
          className="font-bold text-[#CF1322] leading-5"
          style={{ fontFamily: "Noto Sans JP, sans-serif", fontSize: 16 }}
        >
          *
        </span>
      </div>

      {/* Toggle-pill list + note + error */}
      <div className="flex flex-col flex-1 gap-2">
        <div className="flex flex-row flex-wrap items-center gap-2">
          {options.map((tag) => {
            const isSelected = selectedIds.has(tag.id);
            // Disable (no-op) only unselected pills once the cap is reached.
            const disabled = !isSelected && atMax;
            return (
              <button
                key={tag.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onToggle(tag)}
                className={[
                  "h-10 px-4 py-2 rounded-full border transition-colors duration-150",
                  "font-montserrat text-sm font-medium",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F]",
                  isSelected
                    ? "bg-[#FFEA9E] border-[#FFEA9E] text-[#00101A]"
                    : "bg-white border-[#998C5F] text-[#999999] hover:bg-[rgba(153,140,95,0.06)]",
                  disabled ? "cursor-not-allowed" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {tag.name}
              </button>
            );
          })}
        </div>

        {/* "Tối đa 5" note */}
        <span className="font-montserrat text-xs text-[#999999]">
          {t("hashtagMax")}
        </span>

        {/* Inline error */}
        {error && (
          <p className="text-sm font-montserrat text-[#CF1322]">{error}</p>
        )}
      </div>
    </div>
  );
}
