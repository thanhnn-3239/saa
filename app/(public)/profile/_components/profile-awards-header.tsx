"use client";
/**
 * ProfileAwardsHeader — region C: awards section header with Sent/Received toggle.
 *
 * Layout from Figma (362:5084 mms_C_Header Giải thưởng):
 *   C.1: "Sun* Annual Awards 2025" — 24px white, Montserrat 700
 *   Divider: 1px solid #2E3940
 *   C.2: "KUDOS" — 57px gold, Montserrat 700, tracking -0.25px
 *   C.3: FilterDropdown trigger — "Đã gửi (N)" / "Đã nhận (N)", default Sent
 *
 * FilterDropdown reuse: we pass a flat options array and map direction to value.
 * The "All" option from FilterDropdown is hidden via controlled value — we always
 * pass a non-null value so the trigger shows the selected direction label.
 *
 * Design ref: 362:5087 Frame 488 — "KUDOS" + dropdown in a row, space-between.
 */

import { useTranslations } from "next-intl";

import { FilterDropdown } from "@/app/(public)/sun-kudos/_components/ui/filter-dropdown";
import type { FeedDirection } from "@/lib/profile/use-profile-feed";

interface ProfileAwardsHeaderProps {
  direction: FeedDirection;
  sentCount: number;
  receivedCount: number;
  onDirectionChange: (direction: FeedDirection) => void;
}

export function ProfileAwardsHeader({
  direction,
  sentCount,
  receivedCount,
  onDirectionChange,
}: ProfileAwardsHeaderProps) {
  const t = useTranslations("Profile");
  const options = [
    { value: "sent", label: `${t("sentLabel")} (${sentCount})` },
    { value: "received", label: `${t("receivedLabel")} (${receivedCount})` },
  ];

  return (
    <div className="flex flex-col gap-0 w-full">
      {/* C.1 — "Sun* Annual Awards 2025" */}
      <h2
        className="font-montserrat font-bold text-white"
        style={{ fontSize: 24, lineHeight: "32px" }}
      >
        Sun* Annual Awards 2025
      </h2>

      {/* Divider — 1px solid #2E3940 */}
      <div
        className="w-full mt-3"
        style={{ height: 1, background: "#2E3940" }}
        aria-hidden="true"
      />

      {/* C.2 "KUDOS" + C.3 toggle — row, space-between, mt-4 */}
      <div className="flex items-center justify-between mt-4">
        {/* C.2 — "KUDOS" heading */}
        <span
          className="font-montserrat font-bold text-saa-gold-accent"
          style={{ fontSize: 57, lineHeight: "64px", letterSpacing: "-0.25px" }}
        >
          KUDOS
        </span>

        {/* C.3 — Sent/Received toggle built on FilterDropdown.
             showAll={false}: this is a binary toggle, no "All / clear" option. */}
        <FilterDropdown
          label={
            options.find((o) => o.value === direction)?.label ??
            `${t("sentLabel")} (${sentCount})`
          }
          options={options}
          value={direction}
          showAll={false}
          onChange={(val) => {
            if (val === "sent" || val === "received") {
              onDirectionChange(val);
            }
          }}
        />
      </div>
    </div>
  );
}
