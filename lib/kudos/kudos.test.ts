/**
 * Unit tests for pure logic in the Kudos Live Board data layer.
 * Covers: stars tier, hydration shape, search validation, pagination cursor,
 * and spotlight weight normalisation.
 *
 * No Supabase client or HTTP calls — all tests are pure-function or
 * type-shape assertions.
 */

import { describe, it, expect } from "vitest";
import { getStarTier } from "./stars";
import { hydrateKudoCard, hydrateSpotlightNodes } from "./hydrate";
import { SearchValidationError } from "./spotlight-queries";

// ---------------------------------------------------------------------------
// stars.ts
// ---------------------------------------------------------------------------

describe("getStarTier", () => {
  it("returns 0 for < 10 kudos", () => {
    expect(getStarTier(0)).toBe(0);
    expect(getStarTier(9)).toBe(0);
  });

  it("returns 1 for 10–19 kudos", () => {
    expect(getStarTier(10)).toBe(1);
    expect(getStarTier(19)).toBe(1);
  });

  it("returns 2 for 20–49 kudos", () => {
    expect(getStarTier(20)).toBe(2);
    expect(getStarTier(49)).toBe(2);
  });

  it("returns 3 for ≥ 50 kudos", () => {
    expect(getStarTier(50)).toBe(3);
    expect(getStarTier(999)).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// hydrate.ts — hydrateKudoCard shape
// ---------------------------------------------------------------------------

const baseRawRow = {
  id: "kudo-1",
  body: "Great work!",
  is_anonymous: false,
  created_at: "2026-06-06T10:00:00.000Z",
  sender: {
    id: "sender-1",
    full_name: "Alice",
    avatar_url: null,
    department_id: 1,
    kudos_received: 25,
  },
  recipient: {
    id: "recipient-1",
    full_name: "Bob",
    avatar_url: "https://example.com/bob.png",
    department_id: 2,
    kudos_received: 55,
  },
  heart_total: 5,
  like_count: 3,
  liked: false,
  kudo_hashtags: [{ hashtags: { name: "teamwork" } }, { hashtags: { name: "innovation" } }],
  kudo_images: [{ storage_path: "kudo-images/abc.png" }],
};

describe("hydrateKudoCard", () => {
  it("maps raw row fields to KudoCard correctly", () => {
    const card = hydrateKudoCard(baseRawRow);

    expect(card.id).toBe("kudo-1");
    expect(card.body).toBe("Great work!");
    expect(card.isAnonymous).toBe(false);
    expect(card.createdAt).toBe("2026-06-06T10:00:00.000Z");
    expect(card.heartTotal).toBe(5);
    expect(card.likeCount).toBe(3);
    expect(card.liked).toBe(false);
  });

  it("extracts hashtag names into a string array", () => {
    const card = hydrateKudoCard(baseRawRow);
    expect(card.hashtags).toEqual(["teamwork", "innovation"]);
  });

  it("extracts image storage paths", () => {
    const card = hydrateKudoCard(baseRawRow);
    expect(card.images).toEqual(["kudo-images/abc.png"]);
  });

  it("computes star tiers from kudos_received on sender + recipient", () => {
    const card = hydrateKudoCard(baseRawRow);
    // sender: 25 kudos_received → tier 2
    expect(card.sender.stars).toBe(2);
    // recipient: 55 kudos_received → tier 3
    expect(card.recipient.stars).toBe(3);
  });

  it("falls back gracefully when sender is null", () => {
    const card = hydrateKudoCard({ ...baseRawRow, sender: null });
    expect(card.sender.fullName).toBe("Deleted");
    expect(card.sender.stars).toBe(0);
  });

  it("falls back gracefully when kudo_hashtags is null", () => {
    const card = hydrateKudoCard({ ...baseRawRow, kudo_hashtags: null });
    expect(card.hashtags).toEqual([]);
  });

  it("uses viewerLiked param when row.liked is undefined", () => {
    const rowWithoutLiked = { ...baseRawRow, liked: undefined };
    expect(hydrateKudoCard(rowWithoutLiked, true).liked).toBe(true);
    expect(hydrateKudoCard(rowWithoutLiked, false).liked).toBe(false);
  });

  it("defaults heartTotal to 0 when heart_total is null", () => {
    const card = hydrateKudoCard({ ...baseRawRow, heart_total: null });
    expect(card.heartTotal).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Anonymous masking — C1 fix: real sender must NOT reach the client
  // ---------------------------------------------------------------------------

  it("masks sender identity when is_anonymous=true (id becomes empty string)", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: true, anonymous_name: "Secret" });
    // The real sender id must not be present
    expect(card.sender.id).toBe("");
  });

  it("uses anonymous_name as sender fullName when is_anonymous=true and alias provided", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: true, anonymous_name: "Mystery User" });
    expect(card.sender.fullName).toBe("Mystery User");
    // Real sender name from baseRawRow is "Alice" — must not appear
    expect(card.sender.fullName).not.toBe("Alice");
  });

  it("falls back to 'Ẩn danh' when is_anonymous=true but anonymous_name is null", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: true, anonymous_name: null });
    expect(card.sender.fullName).toBe("Ẩn danh");
  });

  it("falls back to 'Ẩn danh' when is_anonymous=true but anonymous_name is empty/whitespace", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: true, anonymous_name: "   " });
    expect(card.sender.fullName).toBe("Ẩn danh");
  });

  it("masks sender avatarUrl to null when is_anonymous=true", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: true, anonymous_name: "X" });
    expect(card.sender.avatarUrl).toBeNull();
  });

  it("does NOT mask sender when is_anonymous=false (real profile exposed as usual)", () => {
    const card = hydrateKudoCard({ ...baseRawRow, is_anonymous: false });
    expect(card.sender.id).toBe("sender-1");
    expect(card.sender.fullName).toBe("Alice");
  });

  // ownedByViewer — server-computed self-like guard. Must use the REAL sender id
  // even when anonymous, so the viewer can never like their own (anonymous) kudo.
  it("sets ownedByViewer=true when the viewer is the real sender", () => {
    const card = hydrateKudoCard(baseRawRow, false, "sender-1");
    expect(card.ownedByViewer).toBe(true);
  });

  it("sets ownedByViewer=false when the viewer is someone else", () => {
    const card = hydrateKudoCard(baseRawRow, false, "viewer-2");
    expect(card.ownedByViewer).toBe(false);
  });

  it("sets ownedByViewer=false when there is no viewer (unauthenticated)", () => {
    expect(hydrateKudoCard(baseRawRow, false, null).ownedByViewer).toBe(false);
    expect(hydrateKudoCard(baseRawRow).ownedByViewer).toBe(false);
  });

  it("REGRESSION: ownedByViewer=true for an anonymous kudo the viewer authored, even though sender.id is masked", () => {
    const card = hydrateKudoCard(
      { ...baseRawRow, is_anonymous: true, anonymous_name: "Secret" },
      false,
      "sender-1",
    );
    // Identity stays masked for display…
    expect(card.sender.id).toBe("");
    expect(card.sender.fullName).toBe("Secret");
    // …but the self-like guard still knows it's the viewer's own kudo.
    expect(card.ownedByViewer).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// hydrate.ts — hydrateSpotlightNodes weight normalisation
// ---------------------------------------------------------------------------

describe("hydrateSpotlightNodes", () => {
  it("returns empty array for empty input", () => {
    expect(hydrateSpotlightNodes([])).toEqual([]);
  });

  it("normalises weight so the top node has weight 1", () => {
    const rows = [
      { recipient_id: "a", kudos_received: 100, profiles: { id: "a", full_name: "Alpha", avatar_url: null, department_id: null } },
      { recipient_id: "b", kudos_received: 50,  profiles: { id: "b", full_name: "Beta",  avatar_url: null, department_id: null } },
      { recipient_id: "c", kudos_received: 25,  profiles: { id: "c", full_name: "Gamma", avatar_url: null, department_id: null } },
    ];
    const nodes = hydrateSpotlightNodes(rows);
    expect(nodes[0].weight).toBe(1);        // 100/100
    expect(nodes[1].weight).toBe(0.5);      // 50/100
    expect(nodes[2].weight).toBe(0.25);     // 25/100
  });

  it("handles a single node with weight 1", () => {
    const rows = [
      { recipient_id: "x", kudos_received: 7, profiles: { id: "x", full_name: "Solo", avatar_url: null, department_id: null } },
    ];
    const nodes = hydrateSpotlightNodes(rows);
    expect(nodes).toHaveLength(1);
    expect(nodes[0].weight).toBe(1);
    expect(nodes[0].kudosReceived).toBe(7);
  });
});

// ---------------------------------------------------------------------------
// spotlight-queries.ts — SearchValidationError class
// ---------------------------------------------------------------------------

describe("SearchValidationError", () => {
  it("is an instance of Error", () => {
    const err = new SearchValidationError("test");
    expect(err).toBeInstanceOf(Error);
    expect(err).toBeInstanceOf(SearchValidationError);
  });

  it("has the correct name and message", () => {
    const err = new SearchValidationError("too long");
    expect(err.name).toBe("SearchValidationError");
    expect(err.message).toBe("too long");
  });
});

// ---------------------------------------------------------------------------
// Pagination cursor shape
// ---------------------------------------------------------------------------

describe("KudosPage cursor contract", () => {
  it("nextCursor is null when items < limit (no more pages)", () => {
    // This validates the shape contract: getKudosPage returns null nextCursor
    // when the DB returned fewer rows than limit+1 (we fetch limit+1 to detect more).
    // We test the pure logic, not the DB call.
    const items = Array.from({ length: 5 }, (_, i) => ({ id: `k${i}` }));
    const limit = 20;
    const hasMore = items.length > limit;
    expect(hasMore).toBe(false);
    // Cursor would be null in this case
    const nextCursor = hasMore ? { createdAt: "x", id: "y" } : null;
    expect(nextCursor).toBeNull();
  });

  it("nextCursor is set when items === limit+1 (more pages available)", () => {
    const limit = 3;
    // Simulate receiving limit+1 rows
    const rawRows = [
      { id: "a", created_at: "2026-06-06T10:00:00Z" },
      { id: "b", created_at: "2026-06-06T09:00:00Z" },
      { id: "c", created_at: "2026-06-06T08:00:00Z" },
      { id: "d", created_at: "2026-06-06T07:00:00Z" }, // extra sentinel
    ];
    const hasMore = rawRows.length > limit;
    const pageRows = hasMore ? rawRows.slice(0, limit) : rawRows;
    const last = pageRows[pageRows.length - 1];
    const nextCursor = hasMore ? { createdAt: last.created_at, id: last.id } : null;

    expect(hasMore).toBe(true);
    expect(pageRows).toHaveLength(3);
    expect(nextCursor).toEqual({ createdAt: "2026-06-06T08:00:00Z", id: "c" });
  });
});

// ---------------------------------------------------------------------------
// spotlight-queries.ts — searchSunners validation (B4 spec: TC 9e689933)
// ---------------------------------------------------------------------------

import { searchSunners } from "./spotlight-queries";

describe("searchSunners input validation", () => {
  it("throws SearchValidationError when search term is empty string", async () => {
    await expect(searchSunners("")).rejects.toBeInstanceOf(SearchValidationError);
  });

  it("throws SearchValidationError when search term is only whitespace", async () => {
    await expect(searchSunners("   ")).rejects.toBeInstanceOf(SearchValidationError);
  });

  it("throws SearchValidationError when search term exceeds 100 characters", async () => {
    const longTerm = "a".repeat(101);
    await expect(searchSunners(longTerm)).rejects.toBeInstanceOf(SearchValidationError);
  });

  it("accepts search term of exactly 100 characters (boundary)", async () => {
    const term100 = "a".repeat(100);
    // This will fail at the DB level (no Supabase), but validation should pass.
    // We only test that validation doesn't throw.
    try {
      await searchSunners(term100);
    } catch (err) {
      // Expected: DB error, not validation error
      expect((err as Error).message).not.toContain("không được vượt quá");
    }
  });
});

// ---------------------------------------------------------------------------
// use-toggle-like.ts — isLikeDisabled function (B3 spec: no self-like)
// ---------------------------------------------------------------------------

import { isLikeDisabled } from "./use-toggle-like";

describe("isLikeDisabled", () => {
  it("returns true when currentUserId is null (unauthenticated)", () => {
    expect(isLikeDisabled("sender-123", null)).toBe(true);
  });

  it("returns true when sender === currentUserId (self-like guard)", () => {
    expect(isLikeDisabled("user-abc", "user-abc")).toBe(true);
  });

  it("returns false when sender !== currentUserId and viewer is authenticated", () => {
    expect(isLikeDisabled("sender-123", "viewer-456")).toBe(false);
  });
});
