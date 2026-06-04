import { describe, it, expect } from "vitest";
import { resolveLocale, LOCALES, DEFAULT_LOCALE } from "./config";

describe("i18n/config", () => {
  describe("resolveLocale", () => {
    it("returns 'vi' when passed 'vi'", () => {
      expect(resolveLocale("vi")).toBe("vi");
    });

    it("returns 'en' when passed 'en'", () => {
      expect(resolveLocale("en")).toBe("en");
    });

    it("returns default locale when passed undefined", () => {
      expect(resolveLocale(undefined)).toBe(DEFAULT_LOCALE);
      expect(resolveLocale(undefined)).toBe("vi");
    });

    it("returns default locale when passed null", () => {
      expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
      expect(resolveLocale(null)).toBe("vi");
    });

    it("returns default locale when passed empty string", () => {
      expect(resolveLocale("")).toBe(DEFAULT_LOCALE);
    });

    it("returns default locale when passed invalid locale", () => {
      expect(resolveLocale("fr")).toBe(DEFAULT_LOCALE);
      expect(resolveLocale("de")).toBe(DEFAULT_LOCALE);
      expect(resolveLocale("invalid")).toBe(DEFAULT_LOCALE);
    });

    it("returns default locale when passed uppercase locale", () => {
      expect(resolveLocale("VI")).toBe(DEFAULT_LOCALE);
      expect(resolveLocale("EN")).toBe(DEFAULT_LOCALE);
    });

    it("is case-sensitive (vi and EN are invalid)", () => {
      expect(resolveLocale("Vi")).toBe(DEFAULT_LOCALE);
      expect(resolveLocale("En")).toBe(DEFAULT_LOCALE);
    });
  });

  describe("LOCALES constant", () => {
    it("includes 'vi' and 'en'", () => {
      expect(LOCALES).toContain("vi");
      expect(LOCALES).toContain("en");
    });

    it("has exactly 2 locales", () => {
      expect(LOCALES).toHaveLength(2);
    });
  });

  describe("DEFAULT_LOCALE constant", () => {
    it("is set to 'vi'", () => {
      expect(DEFAULT_LOCALE).toBe("vi");
    });

    it("is included in LOCALES", () => {
      expect(LOCALES).toContain(DEFAULT_LOCALE);
    });
  });
});
