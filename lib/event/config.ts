/**
 * SAA event datetime configuration.
 * Reads NEXT_PUBLIC_EVENT_DATETIME (ISO-8601 with timezone offset, e.g.
 * 2025-12-26T18:30:00+07:00) and validates it. Safe to import on both
 * server and client because of the NEXT_PUBLIC_ prefix.
 */

const raw = process.env.NEXT_PUBLIC_EVENT_DATETIME ?? "";

/**
 * True when the env var is present and parses to a finite Date.
 * A missing or unparseable value degrades gracefully — countdown shows 00s.
 */
export const isValid: boolean =
  raw.trim().length > 0 && Number.isFinite(new Date(raw).getTime());

/**
 * The event datetime as an ISO-8601 string (as-is from the env var).
 * Consumers must check `isValid` before using this value.
 */
export const targetIso: string = raw.trim();
