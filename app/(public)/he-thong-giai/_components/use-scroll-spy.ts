"use client";
/**
 * useScrollSpy — IntersectionObserver-based scroll spy + smooth-scroll helper.
 *
 * Contract for section anchors (phase-01 / integration):
 *   Each section wrapper must carry `id={slug}` and `scroll-mt-[96px]` (Tailwind)
 *   so the heading is not hidden under the 80px fixed header after smooth-scroll.
 *
 * rootMargin "-96px 0px -60% 0px":
 *   - Top: 96px offset accounts for the fixed header (80px) + a small buffer.
 *   - Bottom: -60% means a section is only "active" when its top edge is in the
 *     upper 40% of the viewport, preventing premature activation of the next section.
 *
 * Active section rule: top-most intersecting section wins (exclusive active).
 *
 * TC ID-13: unknown / missing slug passed to scrollTo() → silent no-op, no error.
 */

import { useCallback, useEffect, useRef, useState } from "react";

const ROOT_MARGIN = "-96px 0px -60% 0px";

export interface ScrollSpyResult {
  /** The slug of the currently active (most in-view) section, or null if none. */
  activeSlug: string | null;
  /** Smooth-scroll to the section identified by slug. Unknown slugs are ignored. */
  scrollTo: (slug: string) => void;
}

/**
 * @param slugs - Ordered list of section IDs matching `id` attributes in the DOM.
 *                Order determines priority when multiple sections intersect.
 */
export function useScrollSpy(slugs: string[]): ScrollSpyResult {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);

  // Track which slugs are currently intersecting the root margin window.
  // Using a ref (not state) so the IntersectionObserver callback can read and
  // mutate it synchronously without triggering extra renders.
  const intersectingRef = useRef<Set<string>>(new Set());

  // Recompute the active slug from the current intersecting set, always
  // preferring the first slug in the ordered list (top-most visible section).
  const recomputeActive = useCallback(
    (intersecting: Set<string>) => {
      const topMost = slugs.find((s) => intersecting.has(s)) ?? null;
      setActiveSlug(topMost);
    },
    [slugs],
  );

  useEffect(() => {
    // Reset tracking when the slug list changes. activeSlug self-corrects:
    // IntersectionObserver fires an initial callback for every observed element,
    // which recomputes the active slug against the new list.
    intersectingRef.current = new Set();

    // SSR / environments without IntersectionObserver (e.g. jsdom without polyfill).
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return;
    }

    const elements = slugs
      .map((slug) => document.getElementById(slug))
      .filter((el): el is HTMLElement => el !== null);

    if (elements.length === 0) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const slug = (entry.target as HTMLElement).id;
          if (entry.isIntersecting) {
            intersectingRef.current.add(slug);
          } else {
            intersectingRef.current.delete(slug);
          }
        }
        recomputeActive(intersectingRef.current);
      },
      { rootMargin: ROOT_MARGIN },
    );

    for (const el of elements) {
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
    };
  }, [slugs, recomputeActive]);

  const scrollTo = useCallback((slug: string) => {
    // TC ID-13: null-guard — unknown slug is a silent no-op.
    const el = document.getElementById(slug);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return { activeSlug, scrollTo };
}
