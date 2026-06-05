import { describe, it, expect } from "vitest";
import messagesVi from "./vi.json";
import messagesEn from "./en.json";

/**
 * Message parity test — ensures vi.json and en.json have identical key trees.
 * Guards against missing translations or extra keys in one language.
 */
describe("message files parity", () => {
  /**
   * Recursively extract all keys from a nested object.
   * Returns a Set of dot-notation paths (e.g., "Login.error.domain").
   */
  function getAllKeys(obj: Record<string, unknown>, prefix = ""): Set<string> {
    const keys = new Set<string>();

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Recurse into nested objects
        getAllKeys(value as Record<string, unknown>, fullKey).forEach((k) => keys.add(k));
      } else {
        // Leaf node
        keys.add(fullKey);
      }
    }

    return keys;
  }

  it("vi.json and en.json have identical top-level namespaces", () => {
    const viNamespaces = Object.keys(messagesVi).sort();
    const enNamespaces = Object.keys(messagesEn).sort();

    expect(viNamespaces).toEqual(enNamespaces);
  });

  it("vi.json and en.json have the same Login keys", () => {
    const viKeys = getAllKeys(messagesVi.Login);
    const enKeys = getAllKeys(messagesEn.Login);

    expect(viKeys).toEqual(enKeys);
  });

  it("Login namespace has required error messages", () => {
    const viLoginKeys = getAllKeys(messagesVi.Login);

    expect(viLoginKeys).toContain("error.domain");
    expect(viLoginKeys).toContain("error.oauth");
    expect(viLoginKeys).toContain("error.access_denied");
    expect(viLoginKeys).toContain("error.generic");
  });

  it("Login namespace has required UI text keys", () => {
    const viLoginKeys = getAllKeys(messagesVi.Login);

    expect(viLoginKeys).toContain("welcomeLine1");
    expect(viLoginKeys).toContain("welcomeLine2");
    expect(viLoginKeys).toContain("loginButton");
    expect(viLoginKeys).toContain("footer");
    expect(viLoginKeys).toContain("langSelectAria");
    expect(viLoginKeys).toContain("closeError");
  });

  it("vi.json has Vietnamese content for loginButton", () => {
    expect(messagesVi.Login.loginButton).toBe("Đăng nhập bằng Google");
  });

  it("en.json has English content for loginButton", () => {
    expect(messagesEn.Login.loginButton).toBe("Sign in with Google");
  });

  it("vi.json has Vietnamese content for domain error", () => {
    expect(messagesVi.Login.error.domain).toContain("sun-asterisk.com");
    expect(messagesVi.Login.error.domain).toMatch(/Tài khoản|miền/);
  });

  it("en.json has English content for domain error", () => {
    expect(messagesEn.Login.error.domain).toContain("sun-asterisk.com");
    expect(messagesEn.Login.error.domain).toMatch(/account|domain/);
  });

  it("no extra keys in vi.json that don't exist in en.json", () => {
    const viKeys = getAllKeys(messagesVi.Login);
    const enKeys = getAllKeys(messagesEn.Login);

    const extraInVi = Array.from(viKeys).filter((k) => !enKeys.has(k));
    expect(extraInVi).toHaveLength(0);
  });

  it("no extra keys in en.json that don't exist in vi.json", () => {
    const viKeys = getAllKeys(messagesVi.Login);
    const enKeys = getAllKeys(messagesEn.Login);

    const extraInEn = Array.from(enKeys).filter((k) => !viKeys.has(k));
    expect(extraInEn).toHaveLength(0);
  });
});
