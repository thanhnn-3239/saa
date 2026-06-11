"use client";
/**
 * LeaderboardList — Section D.3: ranked list of sunners.
 *
 * Design ref: Figma D.3_10 SUNNER nhận quà (2940:13510).
 * Renders up to 10 items: rank badge + avatar + name + score description.
 * Empty state: from i18n Home.kudosPage.leaderboard.empty.
 * Border: 1px solid #998C5F, bg: #00070C, border-radius: 17px.
 *
 * i18n strings (Home.kudosPage.leaderboard.*):
 *   empty          → "Chưa có dữ liệu"
 *   profileAria    → "Xem hồ sơ {name}"
 */

import { useTranslations } from "next-intl";
import { Avatar } from "../ui/avatar";
import { EmptyState } from "../ui/empty-state";
import type { LeaderboardItem } from "@/lib/kudos/types";

interface LeaderboardListProps {
  title: string;
  items: LeaderboardItem[];
  /** Description template for the score, e.g. "kudos nhận được" */
  scoreLabel?: string;
  onOpenProfile?: (profileId: string) => void;
}

export function LeaderboardList({
  title,
  items,
  scoreLabel = "kudos",
  onOpenProfile,
}: LeaderboardListProps) {
  const t = useTranslations("Home.kudosPage.leaderboard");

  return (
    <div
      className="flex flex-col gap-2.5 p-6 pl-6 pr-4 rounded-[17px]"
      style={{
        background: "#00070C",
        border: "1px solid #998C5F",
      }}
    >
      {/* Title */}
      <h3 className="font-montserrat font-bold text-sm text-saa-gold-accent uppercase tracking-wide leading-5 mb-2">
        {title}
      </h3>

      {items.length === 0 ? (
        <EmptyState message={t("empty")} className="py-8" />
      ) : (
        /* Scrollable list with CSS-styled scrollbar (thin, gold/navy themed) */
        <ol className="scrollbar-saa flex flex-col gap-2 max-h-[360px] overflow-y-auto pr-1">
          {items.map((item) => (
            <li key={item.profile.id}>
              <button
                type="button"
                onClick={() => onOpenProfile?.(item.profile.id)}
                className="flex items-center gap-3 w-full text-left hover:bg-white/5 rounded-lg px-2 py-1.5 transition-colors"
                aria-label={t("profileAria", { name: item.profile.fullName })}
              >
                {/* Rank badge */}
                <span
                  className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full font-montserrat font-bold text-xs"
                  style={{
                    background:
                      item.rank === 1
                        ? "#FFD221"
                        : item.rank === 2
                        ? "#C0C0C0"
                        : item.rank === 3
                        ? "#CD7F32"
                        : "rgba(255,255,255,0.1)",
                    color: item.rank <= 3 ? "#00101A" : "#fff",
                  }}
                >
                  {item.rank}
                </span>

                {/* Avatar */}
                <Avatar
                  src={item.profile.avatarUrl}
                  alt={item.profile.fullName}
                  size={32}
                />

                {/* Name + gift label */}
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="font-montserrat font-bold text-sm text-white truncate leading-5">
                    {item.profile.fullName}
                  </span>
                  <span className="text-xs text-saa-gold-border truncate">
                    {item.score} {scoreLabel}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
