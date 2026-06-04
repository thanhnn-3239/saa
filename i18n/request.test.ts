import { describe, it, expect } from "vitest";
import { LOCALE_COOKIE, resolveLocale } from "@/lib/i18n/config";

/**
 * i18n/request.ts uses next-intl's getRequestConfig wrapper, which can't be
 * directly tested in unit tests. Instead, we test:
 * 1. The resolveLocale function (imported in request.ts) via config.test.ts
 * 2. The message files are properly structured via messages.test.ts
 * 3. Integration test: verify locale-actions works with the i18n system
 *
 * This test file documents the expected behavior of request.ts.
 */
describe("i18n/request integration", () => {
  describe("expected behavior", () => {
    it("should use LOCALE_COOKIE from config", () => {
      // This is documented in request.ts line 3
      expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
    });

    it("should use resolveLocale to normalize cookie values", () => {
      // request.ts line 11 uses resolveLocale
      expect(resolveLocale("vi")).toBe("vi");
      expect(resolveLocale("en")).toBe("en");
      expect(resolveLocale(undefined)).toBe("vi");
      expect(resolveLocale("invalid")).toBe("vi");
    });

    it("should default to Vietnamese when no cookie exists", () => {
      // request.ts default behavior: resolveLocale(undefined) returns "vi"
      expect(resolveLocale(undefined)).toBe("vi");
    });

    it("should respect valid locale cookies", () => {
      // request.ts reads cookie and passes to resolveLocale
      expect(resolveLocale("en")).toBe("en");
      expect(resolveLocale("vi")).toBe("vi");
    });

    it("should fall back to default for invalid cookies", () => {
      // request.ts: resolveLocale handles invalid values
      expect(resolveLocale("fr")).toBe("vi");
      expect(resolveLocale("de")).toBe("vi");
    });
  });

  describe("message loading", () => {
    it("should have Vietnamese messages available", async () => {
      const messagesVi = await import("../messages/vi.json").then(
        (m) => m.default
      );
      expect(messagesVi.Login).toBeDefined();
      expect(messagesVi.Login.loginButton).toBe("Đăng nhập bằng Google");
    });

    it("should have English messages available", async () => {
      const messagesEn = await import("../messages/en.json").then(
        (m) => m.default
      );
      expect(messagesEn.Login).toBeDefined();
      expect(messagesEn.Login.loginButton).toBe("Sign in with Google");
    });

    it("should load messages dynamically by locale", async () => {
      // request.ts line 15 does: await import(`../messages/${locale}.json`)
      const locale = "vi";
      const messages = await import(`../messages/${locale}.json`).then(
        (m) => m.default
      );
      expect(messages.Login).toBeDefined();
    });
  });
});
