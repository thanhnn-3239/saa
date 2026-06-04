"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { setLocale } from "@/lib/i18n/locale-actions";
import { LOCALES, resolveLocale, type Locale } from "@/lib/i18n/config";

/**
 * A.2 — Language Switcher (real i18n — ref design "Dropdown-ngôn ngữ").
 * Trigger shows the active locale's flag + code; the dropdown lists VN / EN with the
 * current one highlighted. Selecting one writes the NEXT_LOCALE cookie (server action)
 * then refreshes so all Server Components re-render in the chosen language.
 */

/** Locale → uppercase code shown in the UI (vi → VN, en → EN). */
const DISPLAY: Record<Locale, string> = { vi: "VN", en: "EN" };

/** Renders the flag for a given locale. */
function Flag({ locale }: { locale: Locale }) {
  return locale === "vi" ? <VNFlagIcon /> : <ENFlagIcon />;
}

export function LanguageSwitcher() {
  const locale = resolveLocale(useLocale());
  const t = useTranslations("Login");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    startTransition(async () => {
      await setLocale(next);
      router.refresh();
    });
  }

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
        className="flex cursor-pointer items-center justify-between rounded transition-colors duration-200 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/60 disabled:opacity-60"
        style={{ width: "108px", height: "56px", padding: "16px", gap: "2px" }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t("langSelectAria")}
      >
        <span className="flex items-center" style={{ gap: "4px" }}>
          <Flag locale={locale} />
          <span
            style={{
              fontFamily: "Montserrat, sans-serif",
              fontWeight: 700,
              fontSize: "16px",
              lineHeight: "24px",
              letterSpacing: "0.15px",
              color: "rgba(255, 255, 255, 1)",
              width: "25px",
              textAlign: "center",
            }}
          >
            {DISPLAY[locale]}
          </span>
        </span>
        <DownChevronIcon open={open} />
      </button>

      {/* Dropdown list */}
      {open && (
        <>
          {/* Backdrop to close on outside click */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <ul
            role="listbox"
            className="absolute right-0 top-full z-20 mt-2 overflow-hidden rounded-lg shadow-lg"
            style={{ border: "1px solid rgba(46, 57, 64, 1)", minWidth: "120px" }}
          >
            {LOCALES.map((loc) => {
              const isSelected = locale === loc;
              return (
                <li
                  key={loc}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => choose(loc)}
                  className={`flex h-14 cursor-pointer items-center gap-2 px-4 transition-colors ${
                    isSelected ? "bg-[#2E3940]" : "bg-[#0B0F12] hover:bg-white/10"
                  }`}
                >
                  <Flag locale={loc} />
                  <span
                    style={{
                      fontFamily: "Montserrat, sans-serif",
                      fontWeight: 700,
                      fontSize: "16px",
                      color: "rgba(255, 255, 255, 1)",
                    }}
                  >
                    {DISPLAY[loc]}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}

/** Inline VN flag SVG — from Figma MM_MEDIA_VN asset */
function VNFlagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath="url(#vn-clip)">
        <rect width="20" height="15" transform="translate(2 5)" fill="white" />
        <path fillRule="evenodd" clipRule="evenodd" d="M2 5V20H22V5H2Z" fill="#E31D1C" />
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12.0396 14.988L8.82029 17.0349L9.9001 13.4517L7.60389 11.1107L10.7696 11.0415L12.1702 7.50412L13.4465 11.0882L16.6047 11.1434L14.2314 13.5273L15.3396 16.9361L12.0396 14.988Z"
          fill="#FFD221"
        />
      </g>
      <defs>
        <clipPath id="vn-clip">
          <rect width="20" height="15" rx="2" fill="white" transform="translate(2 5)" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Inline UK (EN) flag SVG — Union Jack, used for the English option. */
function ENFlagIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <g clipPath="url(#en-clip)">
        <rect x="2" y="5" width="20" height="15" fill="#2E42A5" />
        {/* White diagonals */}
        <path d="M2 5L22 20M22 5L2 20" stroke="#F7FCFF" strokeWidth="3" />
        {/* Red diagonals */}
        <path d="M2 5L22 20M22 5L2 20" stroke="#F50100" strokeWidth="1.2" />
        {/* White cross */}
        <path d="M12 5V20M2 12.5H22" stroke="#F7FCFF" strokeWidth="4" />
        {/* Red cross */}
        <path d="M12 5V20M2 12.5H22" stroke="#F50100" strokeWidth="2.2" />
      </g>
      <defs>
        <clipPath id="en-clip">
          <rect x="2" y="5" width="20" height="15" rx="2" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

/** Inline down-chevron SVG — rotates when the menu is open. */
function DownChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        transition: "transform 200ms ease",
        transform: open ? "rotate(180deg)" : "rotate(0deg)",
      }}
    >
      <path d="M7 10L12 15L17 10H7Z" fill="white" />
    </svg>
  );
}
