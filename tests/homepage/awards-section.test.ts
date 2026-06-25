import { describe, it, expect } from "vitest";
import { AWARD_CATEGORIES } from "@/lib/awards/categories";
import { awardAnchor } from "@/lib/navigation/routes";

describe("AwardsSection data (ID-15, ID-47–52, ID-62)", () => {
  it("AWARD_CATEGORIES has exactly 6 award entries", () => {
    expect(AWARD_CATEGORIES).toHaveLength(6);
  });

  it("every award category has required fields: slug, titleKey, descKey, imageSrc (ID-15, ID-47–52)", () => {
    AWARD_CATEGORIES.forEach((category) => {
      expect(category.slug).toBeDefined();
      expect(category.slug).toBeTypeOf("string");
      expect(category.titleKey).toBeDefined();
      expect(category.titleKey).toBeTypeOf("string");
      expect(category.descKey).toBeDefined();
      expect(category.descKey).toBeTypeOf("string");
      expect(category.imageSrc).toBeDefined();
      expect(category.imageSrc).toBeTypeOf("string");
    });
  });

  it("award slugs are URL-safe and match expected award categories", () => {
    const expectedSlugs = [
      "top-talent",
      "top-project",
      "top-project-leader",
      "best-manager",
      "signature-2025-creator",
      "mvp",
    ];

    const actualSlugs = AWARD_CATEGORIES.map((c) => c.slug);
    expect(actualSlugs).toEqual(expectedSlugs);
  });

  it("awardAnchor(slug) produces correct /awards-information#<slug> URLs (ID-62)", () => {
    AWARD_CATEGORIES.forEach((category) => {
      const anchor = awardAnchor(category.slug);
      expect(anchor).toBe(`/awards-information#${category.slug}`);
    });
  });

  it("awardAnchor with empty string returns base path /awards-information (ID-62)", () => {
    expect(awardAnchor("")).toBe("/awards-information");
  });

  it("awardAnchor with whitespace-only string returns base path /awards-information (ID-62, whitespace guard)", () => {
    expect(awardAnchor("   ")).toBe("/awards-information");
    expect(awardAnchor("\t")).toBe("/awards-information");
  });

  it("all image sources are valid paths starting with /homepage-saa/", () => {
    AWARD_CATEGORIES.forEach((category) => {
      expect(category.imageSrc).toMatch(/^\/homepage-saa\//);
      expect(category.imageSrc).toMatch(/\.png$/);
    });
  });

  it("titleKey and descKey follow consistent naming: camelCase", () => {
    AWARD_CATEGORIES.forEach((category) => {
      // Keys should not contain spaces or special chars
      expect(category.titleKey).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
      expect(category.descKey).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
    });
  });
});
