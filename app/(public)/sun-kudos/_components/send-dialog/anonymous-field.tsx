/**
 * anonymous-field.tsx
 *
 * "Gửi ẩn danh" checkbox row + conditional alias input.
 * Design: mms_G — 24×24 checkbox border #999 radius 4, label 22px bold #999.
 * When checked: an alias text input appears (not in original mms_G design node,
 * confirmed in clarifications: anonymous_name is optional when checkbox is on).
 */

import { useTranslations } from "next-intl";

interface AnonymousFieldProps {
  isAnonymous: boolean;
  onIsAnonymousChange: (value: boolean) => void;
  anonymousName: string;
  onAnonymousNameChange: (value: string) => void;
}

export function AnonymousField({
  isAnonymous,
  onIsAnonymousChange,
  anonymousName,
  onAnonymousNameChange,
}: AnonymousFieldProps) {
  const t = useTranslations("Home.kudosPage.sendDialog");
  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Checkbox row */}
      <div className="flex flex-row items-center gap-4">
        {/* Custom checkbox: 24×24, border #999, radius 4, white bg */}
        <button
          type="button"
          role="checkbox"
          aria-checked={isAnonymous}
          onClick={() => onIsAnonymousChange(!isAnonymous)}
          className="shrink-0 flex items-center justify-center bg-white border border-[#999999] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#998C5F] transition-colors duration-150"
          style={{ width: 24, height: 24, borderRadius: 4 }}
        >
          {isAnonymous && (
            <svg
              width="14"
              height="11"
              viewBox="0 0 14 11"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M1 5L5.5 9.5L13 1"
                stroke="#00101A"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>

        {/* Label */}
        <span
          className="font-montserrat font-bold text-[#999999] leading-7"
          style={{ fontSize: 22 }}
        >
          {t("anonymousLabel")}
        </span>
      </div>

      {/* Conditional alias input — appears when checked */}
      {isAnonymous && (
        <div className="flex flex-row items-center gap-4 w-full">
          {/* Spacer to align under label */}
          <div className="shrink-0" style={{ width: 24 }} />
          <div className="flex-1">
            <input
              type="text"
              value={anonymousName}
              onChange={(e) => onAnonymousNameChange(e.target.value)}
              placeholder={t("anonymousNamePlaceholder")}
              maxLength={50}
              className="w-full bg-white border border-[#998C5F] rounded-lg px-6 h-12 font-montserrat font-bold text-base text-[#00101A] placeholder:text-[#999999] outline-none leading-6 tracking-[0.15px] focus:border-[#00101A] transition-colors duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}
