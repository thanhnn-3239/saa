import { describe, it, expect } from "vitest";
import { isAllowedEmail, ALLOWED_DOMAIN } from "./allowed-domain";

describe("isAllowedEmail", () => {
  describe("valid Sun* emails", () => {
    it("returns true for lowercase @sun-asterisk.com email", () => {
      expect(isAllowedEmail("user@sun-asterisk.com")).toBe(true);
    });

    it("returns true for mixed case @sun-asterisk.com email", () => {
      expect(isAllowedEmail("User@Sun-Asterisk.Com")).toBe(true);
    });

    it("returns true for uppercase @sun-asterisk.com email", () => {
      expect(isAllowedEmail("USER@SUN-ASTERISK.COM")).toBe(true);
    });

    it("returns true for email with numbers and dots", () => {
      expect(isAllowedEmail("first.last123@sun-asterisk.com")).toBe(true);
    });

    it("returns true for email with hyphens", () => {
      expect(isAllowedEmail("first-last@sun-asterisk.com")).toBe(true);
    });

    it("returns true for email with underscores", () => {
      expect(isAllowedEmail("first_last@sun-asterisk.com")).toBe(true);
    });
  });

  describe("invalid emails", () => {
    it("returns false for other domain", () => {
      expect(isAllowedEmail("user@gmail.com")).toBe(false);
    });

    it("returns false for similar but wrong domain", () => {
      expect(isAllowedEmail("user@notsun-asterisk.com")).toBe(false);
    });

    it("returns false for partial domain match", () => {
      expect(isAllowedEmail("user@sun-asterisk.org")).toBe(false);
    });

    it("returns false for missing domain", () => {
      expect(isAllowedEmail("user")).toBe(false);
    });

    it("returns false for undefined", () => {
      expect(isAllowedEmail(undefined)).toBe(false);
    });

    it("returns false for null", () => {
      expect(isAllowedEmail(null)).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isAllowedEmail("")).toBe(false);
    });

    it("returns false for just the domain", () => {
      expect(isAllowedEmail("@sun-asterisk.com")).toBe(false);
    });

    it("returns false for domain-like string without @", () => {
      expect(isAllowedEmail("sun-asterisk.com")).toBe(false);
    });
  });

  describe("ALLOWED_DOMAIN constant", () => {
    it("is set to sun-asterisk.com", () => {
      expect(ALLOWED_DOMAIN).toBe("sun-asterisk.com");
    });
  });
});
