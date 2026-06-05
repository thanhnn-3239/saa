"use client";

import { useState, useEffect, useRef } from "react";
import { getCountdown, type CountdownResult } from "./countdown";

/**
 * Client hook that ticks once per minute and returns a live CountdownResult.
 *
 * Hydration safety: the initial render on the client deliberately returns the
 * same stable "00/00/00 isValid:false" placeholder that the server would
 * render, avoiding a hydration mismatch. The real value is set after mount
 * via useEffect, which only runs on the client.
 *
 * Tick alignment: on mount the hook fires immediately, then schedules the
 * next tick at the start of the next calendar minute (wall-clock aligned) so
 * the countdown stays in sync with the system clock without drift.
 */

/** Stable placeholder used during SSR and the initial hydration render. */
const INITIAL: CountdownResult = {
  days: "00",
  hours: "00",
  minutes: "00",
  isExpired: false,
  isValid: false,
};

export function useCountdown(targetIso: string): CountdownResult {
  const [result, setResult] = useState<CountdownResult>(INITIAL);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Compute and apply immediately after mount.
    function tick() {
      setResult(getCountdown(targetIso, new Date()));
    }
    tick();

    // Align to the next minute boundary so ticks stay wall-clock aligned.
    const now = new Date();
    // Milliseconds remaining until the next whole minute.
    const msToNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    const timeout = setTimeout(() => {
      tick();
      // After the first aligned tick, switch to a regular 60s interval.
      intervalRef.current = setInterval(tick, 60_000);
    }, msToNextMinute);

    return () => {
      clearTimeout(timeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // Re-run if targetIso changes (e.g. env var hot-reload in dev).
  }, [targetIso]);

  return result;
}
