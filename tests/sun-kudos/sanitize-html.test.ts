/**
 * Unit tests for HTML sanitization in kudo bodies.
 * Verifies XSS protection: allowlist enforcement + dangerous URI blocking.
 * No DOM/jsdom needed — pure function tests.
 */

import { describe, it, expect } from "vitest";
import { sanitizeKudoHtml } from "@/lib/kudos/sanitize-html";

describe("sanitizeKudoHtml", () => {
  describe("allowed tags", () => {
    it("preserves <p> paragraphs", () => {
      const html = "<p>Hello world</p>";
      expect(sanitizeKudoHtml(html)).toContain("Hello world");
    });

    it("preserves <strong> bold text", () => {
      const html = "<p><strong>Bold text</strong></p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<strong>");
      expect(result).toContain("Bold text");
    });

    it("preserves <em> italic text", () => {
      const html = "<p><em>Italic text</em></p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<em>");
      expect(result).toContain("Italic text");
    });

    it("preserves <s> strikethrough", () => {
      const html = "<p><s>Crossed out</s></p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<s>");
    });

    it("preserves <ol> ordered lists", () => {
      const html = "<ol><li>First</li><li>Second</li></ol>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<ol>");
      expect(result).toContain("<li>");
    });

    it("preserves <blockquote>", () => {
      const html = "<blockquote>A quote</blockquote>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<blockquote>");
    });

    it("preserves <br> line breaks", () => {
      const html = "Line 1<br>Line 2";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<br");
    });

    it("preserves <a> links with safe attributes", () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<a");
      expect(result).toContain("https://example.com");
    });

    it("preserves <span> with allowed attributes", () => {
      const html = '<span data-mention="user-1">@user</span>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("span");
      expect(result).toContain("@user");
    });
  });

  describe("XSS protection — script tags", () => {
    it("strips <script> tags entirely", () => {
      const html = "<p>Hello</p><script>alert('xss')</script>";
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("script");
      expect(result).not.toContain("alert");
      expect(result).toContain("Hello");
    });

    it("strips <img> tags (not in allowlist)", () => {
      const html = '<p>Text<img src="x" onerror="alert(1)"></p>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("img");
    });

    it("strips event handlers from allowed tags", () => {
      const html = '<p onclick="alert(1)">Click me</p>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("onclick");
      expect(result).toContain("Click me");
    });

    it("strips onerror attribute", () => {
      const html = '<span onerror="malicious()">Bad</span>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("onerror");
    });
  });

  describe("dangerous URIs", () => {
    it("blocks javascript: protocol", () => {
      const html = '<a href="javascript:alert(1)">Click</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("javascript:");
      expect(result).toContain("Click");
    });

    it("blocks data: protocol", () => {
      const html = '<a href="data:text/html,<script>alert(1)</script>">Click</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("data:");
    });

    it("allows http:// links", () => {
      const html = '<a href="http://example.com">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("http://example.com");
    });

    it("allows https:// links", () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("https://example.com");
    });
  });

  describe("allowed attributes", () => {
    it("preserves href attribute on links", () => {
      const html = '<a href="https://example.com">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("href");
    });

    it("preserves link with href (target stripping is DOMPurify default)", () => {
      const html = '<a href="https://example.com" target="_blank">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("https://example.com");
      expect(result).toContain("Link");
    });

    it("preserves link href (rel attribute stripping is DOMPurify default)", () => {
      const html = '<a href="https://example.com" rel="noopener noreferrer">Link</a>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("https://example.com");
      expect(result).toContain("Link");
    });

    it("preserves class attribute on span", () => {
      const html = '<span class="mention">@user</span>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("class");
    });

    it("preserves data-mention attribute on span", () => {
      const html = '<span data-mention="user-123">@alice</span>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("data-mention");
    });

    it("preserves data-id attribute on span", () => {
      const html = '<span data-id="item-456">Reference</span>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("data-id");
    });

    it("strips disallowed attributes like style", () => {
      const html = '<p style="color: red">Red text</p>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("style");
      expect(result).toContain("Red text");
    });
  });

  describe("disallowed tags", () => {
    it("strips <div> (not in allowlist)", () => {
      const html = "<div>Content</div>";
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("<div");
      expect(result).toContain("Content");
    });

    it("strips <table> tags", () => {
      const html = "<table><tr><td>Data</td></tr></table>";
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("table");
      expect(result).toContain("Data");
    });

    it("strips <iframe> tags", () => {
      const html = '<iframe src="https://example.com"></iframe>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("iframe");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      expect(sanitizeKudoHtml("")).toBe("");
    });

    it("handles plain text without tags", () => {
      const text = "Just plain text";
      expect(sanitizeKudoHtml(text)).toBe(text);
    });

    it("handles nested allowed tags", () => {
      const html = "<p><strong><em>Bold italic</em></strong></p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<strong>");
      expect(result).toContain("<em>");
      expect(result).toContain("Bold italic");
    });

    it("handles mixed allowed and disallowed tags", () => {
      const html = "<p>Normal <div>wrapped in div</div> text</p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("Normal");
      expect(result).toContain("wrapped in div");
      expect(result).not.toContain("<div");
    });

    it("handles malformed HTML gracefully", () => {
      const html = "<p>Unclosed paragraph";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("Unclosed paragraph");
    });

    it("preserves text with special characters", () => {
      const html = "<p>&lt; greater &gt; symbols &amp;</p>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("&lt;");
      expect(result).toContain("&gt;");
      expect(result).toContain("&amp;");
    });
  });

  describe("complex real-world cases", () => {
    it("sanitizes Tiptap-generated HTML with mentions", () => {
      const html =
        '<p>Great work <span data-mention="user-123" data-id="u123">@Alice</span>, you really helped with <strong>the project</strong>!</p>';
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("Great work");
      expect(result).toContain("@Alice");
      expect(result).toContain("<strong>");
      expect(result).toContain("the project");
    });

    it("sanitizes HTML with lists and blockquotes", () => {
      const html =
        "<blockquote><p>Remember:</p><ol><li>Be kind</li><li>Work hard</li></ol></blockquote>";
      const result = sanitizeKudoHtml(html);
      expect(result).toContain("<blockquote>");
      expect(result).toContain("<ol>");
      expect(result).toContain("<li>");
      expect(result).toContain("Be kind");
    });

    it("rejects HTML attempting multiple XSS vectors", () => {
      const html =
        '<p onclick="alert(1)"><img src="x" onerror="alert(2)"><script>alert(3)</script><a href="javascript:alert(4)">Click</a></p>';
      const result = sanitizeKudoHtml(html);
      expect(result).not.toContain("onclick");
      expect(result).not.toContain("onerror");
      expect(result).not.toContain("script");
      expect(result).not.toContain("javascript:");
      expect(result).not.toContain("img");
    });
  });
});
