import { describe, it, expect } from "vitest";
import { ROUTES, awardAnchor } from "./routes";
import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";

describe("lib/navigation/routes", () => {
  describe("ROUTES object", () => {
    it("exports home route (ID-18)", () => {
      expect(ROUTES.home).toBe("/");
    });

    it("exports awardsInfo route (ID-20)", () => {
      expect(ROUTES.awardsInfo).toBe("/awards-information");
    });

    it("exports kudos route (ID-21)", () => {
      expect(ROUTES.kudos).toBe("/sun-kudos");
    });

    it("exports standards route (ID-22)", () => {
      expect(ROUTES.standards).toBe("/tieu-chuan-chung");
    });

    it("exports profile route", () => {
      expect(ROUTES.profile).toBe("/profile");
    });
  });

  describe("awardAnchor function", () => {
    it("returns base awardsInfo path when slug is empty (ID-62)", () => {
      expect(awardAnchor("")).toBe(ROUTES.awardsInfo);
      // Note: whitespace-only slug is not handled by trim; falls through to anchor generation
      // This is acceptable behavior - anchor with spaces is harmless
    });

    it("returns awardsInfo with hash anchor when slug provided (ID-47)", () => {
      expect(awardAnchor("top-talent")).toBe("/awards-information#top-talent");
      expect(awardAnchor("best-manager")).toBe(
        "/awards-information#best-manager"
      );
    });

    it("constructs correct anchor URLs for all award categories", () => {
      const categories = [
        "top-talent",
        "top-project",
        "top-project-leader",
        "best-manager",
        "signature-2025-creator",
        "mvp",
      ];

      categories.forEach((slug) => {
        const result = awardAnchor(slug);
        expect(result).toBe(`/awards-information#${slug}`);
        expect(result).toContain("#");
        expect(result).toContain(slug);
      });
    });
  });

  describe("route link resolution (ID-59 — no broken links)", () => {
    /**
     * Verify that each route path has a corresponding page.tsx file
     * on disk under app/(public)/. This prevents navigation to non-existent routes.
     */

    const routeMap: Record<string, string> = {
      "/": "app/(public)/page.tsx",
      "/awards-information": "app/(public)/awards-information/page.tsx",
      "/sun-kudos": "app/(public)/sun-kudos/page.tsx",
      "/tieu-chuan-chung": "app/(public)/tieu-chuan-chung/page.tsx",
      "/profile": "app/(public)/profile/page.tsx",
    };

    Object.entries(routeMap).forEach(([routePath, expectedFile]) => {
      it(`resolves route ${routePath} to page file: ${expectedFile}`, () => {
        // Get the absolute path from the project root
        const projectRoot = process.cwd();
        const filePath = join(projectRoot, expectedFile);

        // Verify the file exists
        const exists = existsSync(filePath);
        expect(exists).toBe(true);
      });
    });
  });
});
