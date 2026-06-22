/**
 * title-field.tsx
 *
 * "Danh hiệu*" row — label + text input with helper text below.
 * Design: Frame 552 — label 22px bold, input white border #998C5F radius 8 height 56,
 * helper text 16px bold #999 (two lines).
 */

import { useTranslations } from "next-intl";

interface TitleFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function TitleField({ value, onChange, error }: TitleFieldProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  return (
    <div className="flex flex-col w-full" style={{ gap: 0 }}>
      {/* Row: label + input */}
      <div className="flex flex-row items-center gap-4 w-full">
        {/* Label: Title — 22px bold #00101A */}
        <div className="flex flex-row items-center gap-[2px] shrink-0 w-[146px]">
          <span
            className="font-montserrat font-bold text-[#00101A] leading-7"
            style={{ fontSize: 22 }}
          >
            {t("titleLabel")}
          </span>
          <span
            className="font-bold text-[#CF1322] leading-5"
            style={{ fontFamily: "Noto Sans JP, sans-serif", fontSize: 16 }}
          >
            *
          </span>
        </div>

        {/* Input: white bg, border #998C5F, radius 8, height 56 */}
        <div className="flex-1">
          <div
            className="flex flex-row items-center justify-between w-full bg-white border border-[#998C5F] rounded-lg px-6 h-14"
            style={{ borderRadius: 8 }}
          >
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={t("titlePlaceholder")}
              maxLength={100}
              className="flex-1 bg-transparent font-montserrat font-bold text-base text-[#00101A] placeholder:text-[#999999] outline-none leading-6 tracking-[0.15px]"
            />
          </div>
        </div>
      </div>

      {/* Helper text: 16px bold #999 — offset to align under input (skip label width) */}
      <div className="flex flex-row w-full">
        <div className="shrink-0" style={{ width: "calc(146px + 16px)" }} />
        <div className="flex-1">
          <p
            className="mt-1 font-montserrat font-bold text-base leading-6 tracking-[0.15px] text-[#999999] whitespace-pre-line"
          >
            {t("titleHelper")}
          </p>
          {error && (
            <p className="mt-1 text-sm font-montserrat text-[#CF1322]">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
