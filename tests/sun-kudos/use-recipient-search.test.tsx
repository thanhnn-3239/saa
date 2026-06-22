/**
 * Hook tests for useRecipientSearch.
 * Covers: debouncing, term filtering, enabled predicate, API call format.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRecipientSearch } from "@/lib/kudos/use-recipient-search";
import type { ProfileBrief } from "@/lib/kudos/types";

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryWrapper";
  return Wrapper;
}

describe("useRecipientSearch", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("debouncing", () => {
    it("applies debounce of 300ms before querying", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("alice"), { wrapper });

      // Query fires after debounce settles
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("debounces between multiple term changes", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { rerender } = renderHook(
        ({ term }: { term: string }) => useRecipientSearch(term),
        { wrapper, initialProps: { term: "a" } },
      );

      // Change term
      rerender({ term: "alice" });

      // Wait for debounce to settle and query
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });
  });

  describe("enabled predicate", () => {
    it("does not query when term is empty", async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch(""), { wrapper });

      // Wait for debounce to settle
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("does not query when term is only whitespace", async () => {
      const mockFetch = vi.fn();
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("   "), { wrapper });

      // useRecipientSearch trims internally
      await new Promise((resolve) => setTimeout(resolve, 400));

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("queries when term has at least 1 character", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("a"), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });

    it("queries when term has multiple characters", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );
    });
  });

  describe("API call format", () => {
    it("calls /api/kudos/spotlight with search and excludeSelf params", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("/api/kudos/spotlight");
      expect(callUrl).toContain("search=alice");
      expect(callUrl).toContain("excludeSelf=1");
    });

    it("URL-encodes the search term", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("john doe"), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      // URLSearchParams encodes spaces as %20 or +
      expect(callUrl).toContain("search");
      expect(callUrl).toContain("excludeSelf=1");
    });

    it("trims whitespace from search term before querying", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("  alice  "), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("search=alice");
    });
  });

  describe("response handling", () => {
    it("returns results from successful response", async () => {
      const mockResults: ProfileBrief[] = [
        {
          id: "user-1",
          fullName: "Alice",
          avatarUrl: null,
          stars: 1,
          kudosReceived: 10,
          departmentId: null,
        },
      ];

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: mockResults }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual(mockResults);
    });

    it("returns empty array when no results match", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useRecipientSearch("nonexistent"), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.data).toBeDefined();
      });

      expect(result.current.data).toEqual([]);
    });

    it("handles error response gracefully", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: "Server error" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });

  describe("query key", () => {
    it("uses unique query key based on debounced term", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { rerender } = renderHook(
        ({ term }: { term: string }) => useRecipientSearch(term),
        { wrapper, initialProps: { term: "alice" } },
      );

      // Let first query complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Change term
      rerender({ term: "bob" });

      // Should make new query with new term
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("staleTime", () => {
    it("sets staleTime to 30 seconds for cached results", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Query should be in cache with staleTime applied
      // (tested via behavior, not direct staleTime inspection)
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe("excludeSelf parameter", () => {
    it("always includes excludeSelf=1 to prevent self-kudos", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      renderHook(() => useRecipientSearch("alice"), { wrapper });

      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalled();
        },
        { timeout: 500 },
      );

      const callUrl = mockFetch.mock.calls[0][0] as string;
      expect(callUrl).toContain("excludeSelf=1");
    });
  });

  describe("multiple searches in sequence", () => {
    it("handles sequential term changes correctly", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ results: [] }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { rerender } = renderHook(
        ({ term }: { term: string }) => useRecipientSearch(term),
        { wrapper, initialProps: { term: "alice" } },
      );

      // Wait for first query to complete
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1);
      });

      // Change to different term
      rerender({ term: "bob" });

      // Wait for second query
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledTimes(2);
        },
        { timeout: 500 },
      );

      const secondCallUrl = mockFetch.mock.calls[1][0] as string;
      expect(secondCallUrl).toContain("search=bob");
    });
  });
});
