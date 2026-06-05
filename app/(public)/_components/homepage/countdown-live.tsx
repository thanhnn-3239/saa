"use client";

import { useTranslations } from "next-intl";
import { useCountdown } from "@/lib/event/use-countdown";
import { targetIso } from "@/lib/event/config";
import { CountdownTimer } from "./countdown-timer";

/**
 * Live countdown wrapper — client component.
 *
 * Feeds `useCountdown` (ticks per minute, wall-clock aligned) into the
 * presentational `CountdownTimer`. Passes label strings from the `Home`
 * i18n namespace so the timer labels update when the locale changes.
 *
 * Hydration safety: `useCountdown` returns stable 00/00/00 on the first
 * render (matching server output) and updates via useEffect after mount,
 * so there is no hydration mismatch.
 *
 * Graceful fallback: if `NEXT_PUBLIC_EVENT_DATETIME` is missing or
 * unparseable, `useCountdown` returns isValid:false and all digits show
 * "00". `showComingSoon` is false when the event is expired OR invalid.
 */
export function CountdownLive() {
  const t = useTranslations("Home.countdown");
  const { days, hours, minutes, isExpired, isValid } = useCountdown(targetIso);

  // Show "Coming soon" only while the event is in the future and the env var is valid.
  const showComingSoon = isValid && !isExpired;

  return (
    <CountdownTimer
      days={Number(days)}
      hours={Number(hours)}
      minutes={Number(minutes)}
      showComingSoon={showComingSoon}
      labelDays={t("days")}
      labelHours={t("hours")}
      labelMinutes={t("minutes")}
      labelComingSoon={t("comingSoon")}
    />
  );
}
