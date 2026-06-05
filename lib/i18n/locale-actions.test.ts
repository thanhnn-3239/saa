import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { setLocale } from "./locale-actions";
import { LOCALE_COOKIE, type Locale } from "./config";

// Mock next/headers cookies
vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { cookies } from "next/headers";

const mockCookies = cookies as unknown as Mock;

describe("locale-actions", () => {
  let mockCookieStore: { set: Mock };

  beforeEach(() => {
    vi.clearAllMocks();
    mockCookieStore = {
      set: vi.fn(),
    };
    mockCookies.mockResolvedValue(mockCookieStore);
  });

  describe("setLocale", () => {
    it("sets NEXT_LOCALE cookie with 'en' value", async () => {
      await setLocale("en");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        LOCALE_COOKIE,
        "en",
        expect.objectContaining({
          path: "/",
          sameSite: "lax",
        })
      );
    });

    it("sets NEXT_LOCALE cookie with 'vi' value", async () => {
      await setLocale("vi");

      expect(mockCookieStore.set).toHaveBeenCalledWith(
        LOCALE_COOKIE,
        "vi",
        expect.objectContaining({
          path: "/",
          sameSite: "lax",
        })
      );
    });

    it("sets maxAge to 1 year (31536000 seconds)", async () => {
      await setLocale("en");

      const call = mockCookieStore.set.mock.calls[0];
      const options = call[2];
      expect(options.maxAge).toBe(31536000); // 365 days in seconds
    });

    it("ignores invalid locale and does not set cookie", async () => {
      await setLocale("fr" as unknown as Locale);

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("ignores invalid locale 'de' and does not set cookie", async () => {
      await setLocale("de" as unknown as Locale);

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("ignores invalid locale 'invalid' and does not set cookie", async () => {
      await setLocale("invalid" as unknown as Locale);

      expect(mockCookieStore.set).not.toHaveBeenCalled();
    });

    it("awaits cookies() before setting", async () => {
      await setLocale("en");

      expect(mockCookies).toHaveBeenCalled();
      // cookies() should be awaited, so it's called before set()
      expect(mockCookieStore.set).toHaveBeenCalled();
    });

    it("sets cookie path to '/' (site-wide)", async () => {
      await setLocale("vi");

      const call = mockCookieStore.set.mock.calls[0];
      const options = call[2];
      expect(options.path).toBe("/");
    });

    it("sets sameSite to 'lax' for CSRF protection", async () => {
      await setLocale("en");

      const call = mockCookieStore.set.mock.calls[0];
      const options = call[2];
      expect(options.sameSite).toBe("lax");
    });
  });

  describe("LOCALE_COOKIE constant", () => {
    it("is set to 'NEXT_LOCALE'", () => {
      expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
    });
  });
});
