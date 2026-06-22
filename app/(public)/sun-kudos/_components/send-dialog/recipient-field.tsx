/**
 * recipient-field.tsx
 *
 * "Người nhận*" row — label + search input with dropdown chevron.
 * Design: mms_B — label 22px bold navy, input white bg border #998C5F radius 8px height 56px.
 * Static/presentational: no real dropdown logic (C1 wires suggestions).
 */

import Image from "next/image";
import { useTranslations } from "next-intl";
import type { ProfileBrief } from "./send-kudo-types";

interface RecipientFieldProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selected: ProfileBrief | null;
  onSelect: (profile: ProfileBrief) => void;
  /** Clears the current selection so the user can search again. */
  onClearSelected?: () => void;
  options: ProfileBrief[];
  error?: string;
}

export function RecipientField({
  searchTerm,
  onSearchChange,
  selected,
  onSelect,
  onClearSelected,
  options,
  error,
}: RecipientFieldProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  return (
    <div className="flex flex-row items-center gap-4 w-full">
      {/* Label: mms_B.1_Title — 22px bold #00101A */}
      <div className="flex flex-row items-center gap-[2px] shrink-0 w-[146px]">
        <span
          className="font-montserrat font-bold text-[#00101A] leading-7"
          style={{ fontSize: 22 }}
        >
          {t("recipientLabel")}
        </span>
        <span
          className="font-bold text-[#CF1322] leading-5"
          style={{ fontFamily: "Noto Sans JP, sans-serif", fontSize: 16 }}
        >
          *
        </span>
      </div>

      {/* Search input: mms_B.2_Search — white bg, border #998C5F, radius 8, height 56 */}
      <div className="flex-1 relative">
        <div
          className="flex flex-row items-center justify-between w-full bg-white border border-[#998C5F] rounded-lg px-6 h-14"
          style={{ borderRadius: 8 }}
        >
          {selected ? (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {selected.avatarUrl && (
                <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                  <Image
                    src={selected.avatarUrl}
                    alt={selected.name}
                    fill
                    className="object-cover"
                    sizes="24px"
                  />
                </div>
              )}
              <span className="font-montserrat font-bold text-[#00101A] text-base truncate flex-1">
                {selected.name}
              </span>
              {/* Clear button — lets user search again */}
              <button
                type="button"
                aria-label={t("ariaClearRecipient")}
                onClick={() => { onSearchChange(""); onClearSelected?.(); }}
                className="shrink-0 text-[#999999] hover:text-[#CF1322] transition-colors focus-visible:outline-none"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ) : (
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={t("recipientPlaceholder")}
              className="flex-1 bg-transparent font-montserrat font-bold text-base text-[#999999] placeholder:text-[#999999] outline-none leading-6 tracking-[0.15px]"
            />
          )}
          {/* Chevron down icon */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/viet-kudo/Down.svg"
            alt=""
            aria-hidden="true"
            width={24}
            height={24}
            className="shrink-0 ml-2"
          />
        </div>

        {/* Recipient suggestion dropdown — shown while typing, hidden once selected */}
        {searchTerm.length > 0 && !selected && options.length > 0 && (
          <div className="absolute top-full left-0 mt-1 z-20 bg-white border border-[#998C5F] rounded-lg shadow-lg max-h-48 overflow-y-auto w-full">
            {options.map((profile) => (
              <button
                key={profile.id}
                type="button"
                onClick={() => onSelect(profile)}
                className="w-full flex items-center gap-3 text-left px-4 py-2 font-montserrat text-sm font-bold text-[#00101A] hover:bg-[rgba(153,140,95,0.10)] transition-colors"
              >
                {profile.avatarUrl && (
                  <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0">
                    <Image
                      src={profile.avatarUrl}
                      alt={profile.name}
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                )}
                <span className="truncate">{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Inline error */}
        {error && (
          <p className="mt-1 text-sm font-montserrat text-[#CF1322]">{error}</p>
        )}
      </div>
    </div>
  );
}
