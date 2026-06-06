/**
 * Pure countdown logic — no side effects, no Date.now() inside.
 * `now` is injected so this is fully unit-testable and SSR-safe.
 */

export interface CountdownResult {
  /** Days remaining, 2-digit zero-padded string (e.g. "03"). */
  days: string;
  /** Hours remaining within the final day, 2-digit zero-padded. */
  hours: string;
  /** Minutes remaining within the final hour, 2-digit zero-padded. */
  minutes: string;
  /** True when target has been reached or passed. */
  isExpired: boolean;
  /**
   * False when targetIso is missing/unparseable. When false, all digit
   * fields are "00" and isExpired is false — callers should hide or
   * disable the countdown rather than showing invalid data.
   */
  isValid: boolean;
}

/** Zero-pad a non-negative integer to at least 2 digits. */
export function pad2(n: number): string {
  return String(Math.max(0, Math.floor(n))).padStart(2, "0");
}

/** Zeroed-out result used for expired or invalid states. */
const ZEROS: Pick<CountdownResult, "days" | "hours" | "minutes"> = {
  days: "00",
  hours: "00",
  minutes: "00",
};

/**
 * Compute remaining time between `now` and the ISO-8601 `targetIso`.
 *
 * Units: whole DAYS, then remaining HOURS, then remaining MINUTES.
 * Seconds are intentionally dropped (timer ticks per minute).
 *
 * @param targetIso - ISO-8601 string with timezone offset.
 * @param now       - Current moment (injected — do not use Date.now() here).
 */
export function getCountdown(targetIso: string, now: Date): CountdownResult {
  if (!targetIso || !targetIso.trim()) {
    return { ...ZEROS, isExpired: false, isValid: false };
  }

  const target = new Date(targetIso);
  if (!Number.isFinite(target.getTime())) {
    return { ...ZEROS, isExpired: false, isValid: false };
  }

  const diffMs = target.getTime() - now.getTime();

  if (diffMs <= 0) {
    return { ...ZEROS, isExpired: true, isValid: true };
  }

  // Floor to whole minutes to avoid showing a partial minute.
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  return {
    days: pad2(days),
    hours: pad2(hours),
    minutes: pad2(minutes),
    isExpired: false,
    isValid: true,
  };
}
