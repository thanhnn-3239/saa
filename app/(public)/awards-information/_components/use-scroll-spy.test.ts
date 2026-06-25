import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useScrollSpy } from "./use-scroll-spy";

/**
 * useScrollSpy unit tests.
 * Validates scroll-spy behavior including the null-guard for unknown slugs (TC ID-13).
 */
describe("useScrollSpy", () => {
  beforeEach(() => {
    // Reset document before each test
    document.body.innerHTML = "";

    // Mock IntersectionObserver with a constructor-compatible class-based mock.
    global.IntersectionObserver = vi.fn(function (
      this: unknown,
      _cb: IntersectionObserverCallback,
    ) {
      return { observe: vi.fn(), unobserve: vi.fn(), disconnect: vi.fn() };
    }) as unknown as typeof IntersectionObserver;
  });

  it("returns initial activeSlug as null", () => {
    const { result } = renderHook(() => useScrollSpy(["section-1", "section-2"]));

    expect(result.current.activeSlug).toBeNull();
  });

  it("scrollTo with valid slug does not throw", () => {
    // Create a mock element
    const element = document.createElement("div");
    element.id = "valid-section";
    document.body.appendChild(element);

    const mockScrollIntoView = vi.fn();
    element.scrollIntoView = mockScrollIntoView;

    const { result } = renderHook(() => useScrollSpy(["valid-section"]));

    expect(() => {
      act(() => {
        result.current.scrollTo("valid-section");
      });
    }).not.toThrow();

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("scrollTo with unknown slug is a silent no-op (TC ID-13)", () => {
    const { result } = renderHook(() => useScrollSpy(["section-1"]));

    // This should not throw, even though the element doesn't exist
    expect(() => {
      act(() => {
        result.current.scrollTo("unknown-slug");
      });
    }).not.toThrow();
  });

  it("scrollTo with empty slug is a silent no-op", () => {
    const { result } = renderHook(() => useScrollSpy(["section-1"]));

    expect(() => {
      act(() => {
        result.current.scrollTo("");
      });
    }).not.toThrow();
  });

  it("returns scrollTo function", () => {
    const { result } = renderHook(() => useScrollSpy(["section-1"]));

    expect(typeof result.current.scrollTo).toBe("function");
  });

  it("handles empty slug list gracefully", () => {
    const { result } = renderHook(() => useScrollSpy([]));

    expect(result.current.activeSlug).toBeNull();
    expect(typeof result.current.scrollTo).toBe("function");
  });

  it("scrollTo calls scrollIntoView with correct parameters", () => {
    const element = document.createElement("div");
    element.id = "target-section";
    document.body.appendChild(element);

    const mockScrollIntoView = vi.fn();
    element.scrollIntoView = mockScrollIntoView;

    const { result } = renderHook(() => useScrollSpy(["target-section"]));

    act(() => {
      result.current.scrollTo("target-section");
    });

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });
});
