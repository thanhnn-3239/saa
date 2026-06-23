/**
 * Unit tests for the send-kudo form validation predicate.
 * Extracted from send-kudo-dialog-container as a pure function.
 * Tests: required fields, length limits, hashtag bounds.
 */

import { describe, it, expect } from "vitest";

/** Replicate the validation logic from the container for unit testing. */
interface HashtagBrief {
  id: number;
  name: string;
}

interface ProfileBrief {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface SendKudoErrors {
  recipient?: string;
  title?: string;
  body?: string;
  hashtags?: string;
}

const MAX_TITLE = 100;
const MAX_BODY_CHARS = 2000;
const MIN_HASHTAGS = 1;
const MAX_HASHTAGS = 5;

/** Extract plain text length from HTML string for validation. */
function htmlTextLength(html: string): number {
  if (typeof window === "undefined") return html.replace(/<[^>]*>/g, "").length;
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent ?? "").length;
}

/** Single validation predicate — returns field-level errors map. */
function validateForm(
  recipient: ProfileBrief | null,
  title: string,
  body: string,
  hashtags: HashtagBrief[],
): SendKudoErrors {
  const errs: SendKudoErrors = {};

  if (!recipient) {
    errs.recipient = "Recipient required";
  }
  if (!title.trim()) {
    errs.title = "Title required";
  } else if (title.trim().length > MAX_TITLE) {
    errs.title = "Title too long";
  }

  const bodyTextLen = htmlTextLength(body);
  if (!body || bodyTextLen === 0) {
    errs.body = "Body required";
  } else if (bodyTextLen > MAX_BODY_CHARS) {
    errs.body = "Body too long";
  }

  if (hashtags.length < MIN_HASHTAGS) {
    errs.hashtags = "At least 1 hashtag required";
  } else if (hashtags.length > MAX_HASHTAGS) {
    errs.hashtags = "Max 5 hashtags";
  }

  return errs;
}

function isValidForm(errors: SendKudoErrors): boolean {
  return Object.keys(errors).length === 0;
}

const testRecipient: ProfileBrief = {
  id: "user-1",
  name: "Alice",
  avatarUrl: null,
};

const testHashtag: HashtagBrief = {
  id: 1,
  name: "#teamwork",
};

describe("send-kudo validation predicate", () => {
  describe("recipient validation", () => {
    it("requires a recipient", () => {
      const errs = validateForm(null, "Title", "Body", [testHashtag]);
      expect(errs.recipient).toBeDefined();
    });

    it("accepts a valid recipient", () => {
      const errs = validateForm(testRecipient, "Title", "Body", [testHashtag]);
      expect(errs.recipient).toBeUndefined();
    });

    it("returns error when recipient is null", () => {
      const errs = validateForm(null, "Valid title", "Valid body", [testHashtag]);
      expect(Object.keys(errs)).toContain("recipient");
    });
  });

  describe("title validation", () => {
    it("requires a title", () => {
      const errs = validateForm(testRecipient, "", "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });

    it("accepts a valid title", () => {
      const errs = validateForm(testRecipient, "Great Work", "Body", [testHashtag]);
      expect(errs.title).toBeUndefined();
    });

    it("trims whitespace when validating title requirement", () => {
      const errs = validateForm(testRecipient, "   ", "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });

    it("allows title at MAX_TITLE length (100 chars)", () => {
      const title = "x".repeat(100);
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeUndefined();
    });

    it("rejects title exceeding MAX_TITLE length", () => {
      const title = "x".repeat(101);
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });

    it("rejects title at 150 chars", () => {
      const title = "x".repeat(150);
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });

    it("trims whitespace when checking title length", () => {
      // "x" * 100 + "   " should still be 100 chars of content
      const title = "x".repeat(100) + "   ";
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeUndefined();
    });

    it("considers trimmed length for title validation", () => {
      const title = "   " + "x".repeat(101) + "   ";
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });
  });

  describe("body validation", () => {
    it("requires body content", () => {
      const errs = validateForm(testRecipient, "Title", "", [testHashtag]);
      expect(errs.body).toBeDefined();
    });

    it("accepts valid body", () => {
      const errs = validateForm(testRecipient, "Title", "<p>Great work</p>", [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("rejects empty HTML", () => {
      const errs = validateForm(testRecipient, "Title", "<p></p>", [testHashtag]);
      expect(errs.body).toBeDefined();
    });

    it("strips HTML tags when measuring body length", () => {
      const body = "<p>Hello world</p>";
      // "Hello world" = 11 chars, under 2000 limit
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("allows body at MAX_BODY_CHARS length (2000 chars)", () => {
      const body = "<p>" + "x".repeat(2000) + "</p>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("rejects body exceeding MAX_BODY_CHARS length", () => {
      const body = "<p>" + "x".repeat(2001) + "</p>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeDefined();
    });

    it("rejects body at 3000 chars", () => {
      const body = "<p>" + "x".repeat(3000) + "</p>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeDefined();
    });

    it("counts plain text length in HTML, ignoring tags", () => {
      // Body with lots of HTML but only 10 chars of text
      const body = "<p><strong><em>hello</em></strong></p>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("handles complex nested HTML tags when measuring length", () => {
      const text = "A".repeat(2000);
      const body = `<p><strong><em>${text}</em></strong></p>`;
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("rejects HTML with text just over the limit", () => {
      const text = "x".repeat(2001);
      const body = `<p>${text}</p>`;
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeDefined();
    });
  });

  describe("hashtag validation", () => {
    it("requires at least 1 hashtag", () => {
      const errs = validateForm(testRecipient, "Title", "Body", []);
      expect(errs.hashtags).toBeDefined();
    });

    it("accepts exactly 1 hashtag (minimum)", () => {
      const errs = validateForm(testRecipient, "Title", "Body", [testHashtag]);
      expect(errs.hashtags).toBeUndefined();
    });

    it("accepts 5 hashtags (maximum)", () => {
      const hashtags = Array.from({ length: 5 }, (_, i) => ({
        id: i + 1,
        name: `#tag${i}`,
      }));
      const errs = validateForm(testRecipient, "Title", "Body", hashtags);
      expect(errs.hashtags).toBeUndefined();
    });

    it("accepts 3 hashtags (middle range)", () => {
      const hashtags = Array.from({ length: 3 }, (_, i) => ({
        id: i + 1,
        name: `#tag${i}`,
      }));
      const errs = validateForm(testRecipient, "Title", "Body", hashtags);
      expect(errs.hashtags).toBeUndefined();
    });

    it("rejects 6 hashtags", () => {
      const hashtags = Array.from({ length: 6 }, (_, i) => ({
        id: i + 1,
        name: `#tag${i}`,
      }));
      const errs = validateForm(testRecipient, "Title", "Body", hashtags);
      expect(errs.hashtags).toBeDefined();
    });

    it("rejects 10 hashtags", () => {
      const hashtags = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        name: `#tag${i}`,
      }));
      const errs = validateForm(testRecipient, "Title", "Body", hashtags);
      expect(errs.hashtags).toBeDefined();
    });
  });

  describe("form-wide validation (multiple fields)", () => {
    it("returns empty object for fully valid form", () => {
      const errs = validateForm(testRecipient, "Valid Title", "Valid body", [
        testHashtag,
      ]);
      expect(isValidForm(errs)).toBe(true);
      expect(Object.keys(errs).length).toBe(0);
    });

    it("accumulates multiple validation errors", () => {
      const errs = validateForm(null, "", "", []);
      expect(errs.recipient).toBeDefined();
      expect(errs.title).toBeDefined();
      expect(errs.body).toBeDefined();
      expect(errs.hashtags).toBeDefined();
    });

    it("returns only recipient error when only recipient is missing", () => {
      const errs = validateForm(null, "Title", "Body", [testHashtag]);
      expect(Object.keys(errs)).toEqual(["recipient"]);
    });

    it("returns only title error when only title is invalid", () => {
      const errs = validateForm(testRecipient, "", "Body", [testHashtag]);
      expect(Object.keys(errs)).toEqual(["title"]);
    });

    it("returns only body error when only body is invalid", () => {
      const errs = validateForm(testRecipient, "Title", "", [testHashtag]);
      expect(Object.keys(errs)).toEqual(["body"]);
    });

    it("returns only hashtag error when only hashtags are invalid", () => {
      const errs = validateForm(testRecipient, "Title", "Body", []);
      expect(Object.keys(errs)).toEqual(["hashtags"]);
    });

    it("disables submit when form has any error", () => {
      const fullErrors = validateForm(null, "", "", []);
      expect(isValidForm(fullErrors)).toBe(false);

      const oneError = validateForm(testRecipient, "Title", "Body", []);
      expect(isValidForm(oneError)).toBe(false);
    });

    it("enables submit only when all fields are valid", () => {
      const errs = validateForm(testRecipient, "Title", "Body", [testHashtag]);
      expect(isValidForm(errs)).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("handles title with only spaces", () => {
      const errs = validateForm(testRecipient, "     ", "Body", [testHashtag]);
      expect(errs.title).toBeDefined();
    });

    it("handles body with only HTML tags and no text", () => {
      const errs = validateForm(testRecipient, "Title", "<p></p><br><br>", [
        testHashtag,
      ]);
      expect(errs.body).toBeDefined();
    });

    it("counts mixed text and complex formatting", () => {
      const body = "<p>Hello</p><ol><li>World</li></ol>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("handles title exactly at boundary (100 chars)", () => {
      const title = "T".repeat(100);
      const errs = validateForm(testRecipient, title, "Body", [testHashtag]);
      expect(errs.title).toBeUndefined();
    });

    it("handles body exactly at boundary (2000 chars)", () => {
      const body = "<p>" + "B".repeat(2000) + "</p>";
      const errs = validateForm(testRecipient, "Title", body, [testHashtag]);
      expect(errs.body).toBeUndefined();
    });

    it("handles hashtag exactly at min boundary (1)", () => {
      const errs = validateForm(testRecipient, "Title", "Body", [testHashtag]);
      expect(errs.hashtags).toBeUndefined();
    });

    it("handles hashtag exactly at max boundary (5)", () => {
      const hashtags = Array.from({ length: 5 }, (_, i) => ({
        id: i,
        name: `#tag${i}`,
      }));
      const errs = validateForm(testRecipient, "Title", "Body", hashtags);
      expect(errs.hashtags).toBeUndefined();
    });

    it("accepts body with newline in HTML (counts as content)", () => {
      const errs = validateForm(testRecipient, "Title", "<p>\n</p>", [testHashtag]);
      // Newline character counts as text content in the HTML string
      // stripTags("<p>\n</p>") → "\n" which has length 1
      expect(errs.body).toBeUndefined();
    });
  });

  describe("constants", () => {
    it("has correct MAX_TITLE value", () => {
      expect(MAX_TITLE).toBe(100);
    });

    it("has correct MAX_BODY_CHARS value", () => {
      expect(MAX_BODY_CHARS).toBe(2000);
    });

    it("has correct MIN_HASHTAGS value", () => {
      expect(MIN_HASHTAGS).toBe(1);
    });

    it("has correct MAX_HASHTAGS value", () => {
      expect(MAX_HASHTAGS).toBe(5);
    });
  });
});
