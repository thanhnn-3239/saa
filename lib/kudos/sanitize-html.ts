/**
 * HTML sanitization for kudo bodies authored in the send-dialog Tiptap editor.
 *
 * Sanitize-on-RENDER policy: the stored HTML is treated as untrusted no matter
 * what the client sent. Every render path (board cards, previews) must pass the
 * body through sanitizeKudoHtml before dangerouslySetInnerHTML.
 *
 * isomorphic-dompurify works in both RSC/SSR (jsdom) and the browser.
 */

import DOMPurify from "isomorphic-dompurify";

/**
 * Allowlist mirrors exactly what the Tiptap config can emit
 * (StarterKit subset + Link + Mention): paragraphs, bold, italic,
 * strikethrough, ordered lists, links, blockquotes, hard breaks and
 * mention spans. Everything else is stripped.
 */
const ALLOWED_TAGS = [
  "p",
  "strong",
  "em",
  "s",
  "ol",
  "li",
  "a",
  "blockquote",
  "br",
  "span",
];

const ALLOWED_ATTR = ["href", "target", "rel", "class", "data-mention", "data-id"];

export function sanitizeKudoHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // Only allow http(s) links — blocks javascript: and data: URIs.
    ALLOWED_URI_REGEXP: /^https?:\/\//i,
  });
}
