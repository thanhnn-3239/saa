"use client";
/**
 * SidebarStats — Section D.1: stats block for the authenticated user.
 *
 * Design ref: Figma D.1_Thống kê tổng quat (2940:13489).
 * Renders 5 labeled stat rows + "Mở quà" button (D.1.8, stub).
 * Border: 1px solid #998C5F, bg: #00070C, border-radius: 17px.
 *
 * Stats from Figma D.1.2–D.1.7:
 *   - Số Kudos bạn nhận được
 *   - Số Kudos bạn đã gửi
 *   - Số tim bạn nhận được
 *   - (divider)
 *   - Số Secret Box bạn đã mở
 *   - Số Secret Box chưa mở
 *   - Mở Secret Box button
 *
 * i18n strings (Home.kudosPage.sidebar.*):
 *   kudosReceived    → "Số Kudos bạn nhận được:"
 *   kudosSent        → "Số Kudos bạn đã gửi:"
 *   heartsReceived   → "Số tim bạn nhận được:"
 *   secretBoxOpened  → "Số Secret Box bạn đã mở:"
 *   secretBoxUnopened → "Số Secret Box chưa mở:"
 *   openGift         → "Mở Secret Box"
 */

import { useTranslations } from "next-intl";
import type { SidebarStats } from "@/lib/kudos/types";

interface SidebarStatsProps {
  stats: SidebarStats;
  /** Opens the Secret Box gift flow (stub in v1). */
  onOpenGift?: () => void;
}

interface StatRowProps {
  label: string;
  value: number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 w-full">
      <span className="font-montserrat font-bold text-[22px] leading-7 text-white text-left flex-1">
        {label}
      </span>
      <span className="font-montserrat font-bold text-[32px] leading-10 text-saa-gold-accent tabular-nums shrink-0">
        {value}
      </span>
    </div>
  );
}

export function SidebarStatsBlock({ stats, onOpenGift }: SidebarStatsProps) {
  const t = useTranslations("Home.kudosPage.sidebar");

  return (
    <div
      className="flex flex-col gap-2.5 p-6 rounded-[17px]"
      style={{
        background: "#00070C",
        border: "1px solid #998C5F",
      }}
    >
      {/* D.1 inner content */}
      <div className="flex flex-col gap-4 items-center w-full">
        {/* D.1.2 */}
        <StatRow label={t("kudosReceived")} value={stats.kudosReceived} />

        {/* D.1.3 */}
        <StatRow label={t("kudosSent")} value={stats.kudosSent} />

        {/* D.1.4 — hearts received, with the 🔥 x2 multiplier badge (design node 3241:14882) */}
        <div className="flex items-center justify-between gap-2 w-full">
          <span className="font-montserrat font-bold text-[22px] leading-7 text-white text-left flex-1">
            {t("heartsReceived")}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Flame x2 multiplier badge */}
            <span className="flex items-center gap-0.5 text-saa-gold-accent" aria-label="x2">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M12.963 2.286a.75.75 0 00-1.071-.136 9.742 9.742 0 00-3.539 6.176 7.547 7.547 0 01-1.705-1.715.75.75 0 00-1.152-.082A9 9 0 1015.68 4.534a7.46 7.46 0 01-2.717-2.248z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="font-montserrat font-bold text-sm leading-none">x2</span>
            </span>
            <span className="font-montserrat font-bold text-[32px] leading-10 text-saa-gold-accent tabular-nums">
              {stats.heartsReceived}
            </span>
          </div>
        </div>

        {/* D.1.5 — divider */}
        <div className="w-full h-px bg-saa-navy-border" />

        {/* D.1.6 */}
        <StatRow
          label={t("secretBoxOpened")}
          value={stats.secretBoxes.total - stats.secretBoxes.unopened}
        />

        {/* D.1.7 */}
        <StatRow label={t("secretBoxUnopened")} value={stats.secretBoxes.unopened} />

        {/* D.1.8 — "Mở Secret Box" button (stub) */}
        <button
          type="button"
          onClick={onOpenGift}
          className="flex items-center justify-center gap-2 w-full py-4 px-4 rounded-[8px] bg-saa-gold-accent font-montserrat font-bold text-[22px] leading-7 text-saa-navy-darkest hover:bg-saa-gold-bright transition-colors duration-200 mt-2"
        >
          {t("openGift")}
          {/* Filled gift icon — design D.1.8 places it AFTER the text */}
          <svg
            width="24"
            height="24"
            viewBox="0 0 20 20"
            fill="currentColor"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 110 4h-5V9a1 1 0 10-2 0v1H4a2 2 0 110-4h1.17C5.06 5.687 5 5.35 5 5zm4 1V5a1 1 0 10-1 1h1zm3 0a1 1 0 10-1-1v1h1z"
              clipRule="evenodd"
            />
            <path d="M9 11H3v5a2 2 0 002 2h4v-7zM11 18h4a2 2 0 002-2v-5h-6v7z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
