import { describe, it, expect } from "vitest";
import { ROUTES } from "@/lib/navigation/routes";

describe("ROUTES verification (ID-59)", () => {
  it("ROUTES object contains all expected navigation paths", () => {
    expect(ROUTES).toEqual({
      home: "/",
      awardsInfo: "/he-thong-giai",
      kudos: "/sun-kudos",
      standards: "/tieu-chuan-chung",
      profile: "/profile",
    });
  });

  it("home route points to /", () => {
    expect(ROUTES.home).toBe("/");
  });

  it("awardsInfo route points to /he-thong-giai", () => {
    expect(ROUTES.awardsInfo).toBe("/he-thong-giai");
  });

  it("kudos route points to /sun-kudos", () => {
    expect(ROUTES.kudos).toBe("/sun-kudos");
  });

  it("standards route points to /tieu-chuan-chung", () => {
    expect(ROUTES.standards).toBe("/tieu-chuan-chung");
  });

  it("profile route points to /profile", () => {
    expect(ROUTES.profile).toBe("/profile");
  });
});
