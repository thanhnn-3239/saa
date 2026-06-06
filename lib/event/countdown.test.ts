import { describe, it, expect } from "vitest";
import { getCountdown, pad2 } from "./countdown";

// Fixed "now" used across all tests for determinism.
const NOW = new Date("2025-10-01T10:00:00+07:00");

describe("pad2", () => {
  it("pads single digits", () => {
    expect(pad2(0)).toBe("00");
    expect(pad2(1)).toBe("01");
    expect(pad2(9)).toBe("09");
  });

  it("leaves two-digit numbers unchanged", () => {
    expect(pad2(10)).toBe("10");
    expect(pad2(59)).toBe("59");
    expect(pad2(99)).toBe("99");
  });

  it("clamps negative numbers to 00", () => {
    expect(pad2(-1)).toBe("00");
  });
});

describe("getCountdown", () => {
  it("returns isValid:false for empty targetIso", () => {
    const result = getCountdown("", NOW);
    expect(result.isValid).toBe(false);
    expect(result.isExpired).toBe(false);
    expect(result.days).toBe("00");
    expect(result.hours).toBe("00");
    expect(result.minutes).toBe("00");
  });

  it("returns isValid:false for whitespace-only targetIso", () => {
    const result = getCountdown("   ", NOW);
    expect(result.isValid).toBe(false);
  });

  it("returns isValid:false for an unparseable string (ID-60)", () => {
    const result = getCountdown("not-a-date", NOW);
    expect(result.isValid).toBe(false);
    expect(result.isExpired).toBe(false);
  });

  it("returns isExpired:true and zeros when target is in the past (ID-41/42)", () => {
    const past = "2025-01-01T00:00:00+07:00";
    const result = getCountdown(past, NOW);
    expect(result.isValid).toBe(true);
    expect(result.isExpired).toBe(true);
    expect(result.days).toBe("00");
    expect(result.hours).toBe("00");
    expect(result.minutes).toBe("00");
  });

  it("returns isExpired:true and zeros when target equals now (ID-41)", () => {
    const result = getCountdown(NOW.toISOString(), NOW);
    expect(result.isExpired).toBe(true);
    expect(result.isValid).toBe(true);
  });

  it("returns correct days/hours/minutes for a future target (ID-40)", () => {
    // NOW = 2025-10-01 10:00 +07  →  target = 2025-12-26 18:30 +07
    // Diff ≈ 86 days 8 hours 30 minutes
    const target = "2025-12-26T18:30:00+07:00";
    const result = getCountdown(target, NOW);
    expect(result.isValid).toBe(true);
    expect(result.isExpired).toBe(false);
    expect(result.days).toBe("86");
    expect(result.hours).toBe("08");
    expect(result.minutes).toBe("30");
  });

  it("zero-pads single-digit values (ID-40)", () => {
    // 1 day, 2 hours, 3 minutes ahead of NOW
    const target = new Date(NOW.getTime() + (1 * 86400 + 2 * 3600 + 3 * 60) * 1000);
    const result = getCountdown(target.toISOString(), NOW);
    expect(result.days).toBe("01");
    expect(result.hours).toBe("02");
    expect(result.minutes).toBe("03");
  });

  it("handles exactly 1 minute remaining", () => {
    const target = new Date(NOW.getTime() + 60_000);
    const result = getCountdown(target.toISOString(), NOW);
    expect(result.days).toBe("00");
    expect(result.hours).toBe("00");
    expect(result.minutes).toBe("01");
    expect(result.isExpired).toBe(false);
  });

  it("floors partial minutes — does not round up (ID-39 per-minute tick)", () => {
    // 59 seconds remaining — should show 00 minutes (not 01)
    const target = new Date(NOW.getTime() + 59_000);
    const result = getCountdown(target.toISOString(), NOW);
    expect(result.minutes).toBe("00");
    expect(result.isExpired).toBe(false);
  });

  it("handles timezone offsets correctly — ISO-8601 offset respected (ID-57)", () => {
    // Target expressed in UTC+0; NOW is UTC+7. Both should produce the same diff.
    const targetUtc = "2025-10-02T03:00:00Z"; // = 2025-10-02 10:00 +07 → exactly 24h from NOW
    const result = getCountdown(targetUtc, NOW);
    expect(result.days).toBe("01");
    expect(result.hours).toBe("00");
    expect(result.minutes).toBe("00");
    expect(result.isExpired).toBe(false);
  });
});
