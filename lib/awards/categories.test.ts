import { describe, it, expect } from "vitest";
import { AWARD_CATEGORIES } from "./categories";
import messagesVi from "@/messages/vi.json";
import messagesEn from "@/messages/en.json";

/**
 * Award categories data integrity tests.
 * Validates that AWARD_CATEGORIES has exactly 6 items with correct ordering,
 * and that all referenced i18n keys resolve to expected strings.
 */
describe("lib/awards/categories", () => {
  it("has exactly 6 award categories", () => {
    expect(AWARD_CATEGORIES).toHaveLength(6);
  });

  it("categories are in the correct order", () => {
    const slugs = AWARD_CATEGORIES.map((c) => c.slug);
    expect(slugs).toEqual([
      "top-talent",
      "top-project",
      "top-project-leader",
      "best-manager",
      "signature-2025-creator",
      "mvp",
    ]);
  });

  it("each category has quantityKey and valueKey", () => {
    for (const category of AWARD_CATEGORIES) {
      expect(category.quantityKey).toBeDefined();
      expect(category.valueKey).toBeDefined();
      expect(typeof category.quantityKey).toBe("string");
      expect(typeof category.valueKey).toBe("string");
    }
  });

  it("resolves Vietnamese i18n strings for each category", () => {
    // Values match vi.json HeThongGiai.awards exactly (plan spec table is authoritative).
    const expectedValues: Record<string, { quantity: string; value: string }> =
      {
        "top-talent": {
          quantity: "10 Đơn vị",
          value: "7.000.000 VNĐ/giải",
        },
        "top-project": {
          quantity: "02 Tập thể",
          value: "15.000.000 VNĐ/giải",
        },
        "top-project-leader": {
          quantity: "03 Cá nhân",
          value: "7.000.000 VNĐ",
        },
        "best-manager": {
          quantity: "01 Cá nhân",
          value: "10.000.000 VNĐ",
        },
        "signature-2025-creator": {
          quantity: "01",
          value: "5.000.000 VNĐ (cá nhân) / 8.000.000 VNĐ (tập thể)",
        },
        mvp: {
          quantity: "01",
          value: "15.000.000 VNĐ",
        },
      };

    for (const category of AWARD_CATEGORIES) {
      const expected = expectedValues[category.slug];

      // Keys are relative to HeThongGiai namespace (e.g. "awards.top-talent.quantity").
      const quantityParts = category.quantityKey.split(".");
      let quantityVal: unknown = messagesVi.HeThongGiai;
      for (const part of quantityParts) {
        quantityVal = (quantityVal as Record<string, unknown>)[part];
      }
      expect(quantityVal).toBe(expected.quantity);

      // Resolve value string
      const valueParts = category.valueKey.split(".");
      let valueVal: unknown = messagesVi.HeThongGiai;
      for (const part of valueParts) {
        valueVal = (valueVal as Record<string, unknown>)[part];
      }
      expect(valueVal).toBe(expected.value);
    }
  });

  it("resolves English i18n strings for each category (parity check)", () => {
    for (const category of AWARD_CATEGORIES) {
      // Verify English values exist (exact strings may differ, but keys must resolve).
      // Keys are relative to HeThongGiai namespace.
      const quantityParts = category.quantityKey.split(".");
      let quantityVal: unknown = messagesEn.HeThongGiai;
      for (const part of quantityParts) {
        quantityVal = (quantityVal as Record<string, unknown>)[part];
      }
      expect(quantityVal).toBeDefined();
      expect(typeof quantityVal).toBe("string");

      const valueParts = category.valueKey.split(".");
      let valueVal: unknown = messagesEn.HeThongGiai;
      for (const part of valueParts) {
        valueVal = (valueVal as Record<string, unknown>)[part];
      }
      expect(valueVal).toBeDefined();
      expect(typeof valueVal).toBe("string");
    }
  });

  it("each category has a valid slug, image, and nav key", () => {
    for (const category of AWARD_CATEGORIES) {
      expect(category.slug).toMatch(/^[a-z0-9-]+$/);
      expect(category.imageSrc).toMatch(/\.(png|jpg|jpeg|webp)$/i);
      expect(category.navKey).toBeDefined();
      expect(typeof category.navKey).toBe("string");
      expect(category.navKey.length).toBeGreaterThan(0);
    }
  });

  it("imageRight alternates correctly (starts false)", () => {
    const imageRights = AWARD_CATEGORIES.map((c) => c.imageRight);
    expect(imageRights).toEqual([false, true, false, true, false, true]);
  });
});
