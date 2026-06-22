/**
 * Hook tests for useCreateKudo mutation.
 * Covers: image upload integration, RPC call format, invalidation, error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useCreateKudo } from "@/lib/kudos/use-create-kudo";

// Mock uploadKudoImages to avoid real storage calls
vi.mock("@/lib/kudos/upload-kudo-images", () => ({
  uploadKudoImages: vi.fn(),
  validateKudoImages: vi.fn(),
  ImageValidationError: Error,
  MAX_KUDO_IMAGES: 5,
  MAX_IMAGE_BYTES: 5 * 1024 * 1024,
}));

function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = "QueryWrapper";
  return Wrapper;
}

describe("useCreateKudo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("image upload", () => {
    it("uploads images before posting to /api/kudos", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce(["path/to/img1.jpg"]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      const imageFile = new File(["fake"], "test.jpg", { type: "image/jpeg" });

      result.current.mutate({
        recipientId: "user-2",
        title: "Great work",
        bodyHtml: "<p>Well done</p>",
        hashtagIds: [1],
        imageFiles: [imageFile],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(mockUploadKudoImages).toHaveBeenCalledWith([imageFile]);
      });
    });

    it("passes uploaded image paths to API call", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      const imagePaths = ["path/to/img1.jpg", "path/to/img2.png"];
      mockUploadKudoImages.mockResolvedValueOnce(imagePaths);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      const file1 = new File(["fake"], "img1.jpg", { type: "image/jpeg" });
      const file2 = new File(["fake"], "img2.png", { type: "image/png" });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [file1, file2],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.imagePaths).toEqual(imagePaths);
    });

    it("handles empty image array", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.imagePaths).toEqual([]);
    });
  });

  describe("API call format", () => {
    it("posts to /api/kudos with correct headers", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1, 2],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      expect(mockFetch.mock.calls[0][0]).toBe("/api/kudos");
      const options = mockFetch.mock.calls[0][1];
      expect(options.method).toBe("POST");
      expect(options.headers["Content-Type"]).toBe("application/json");
    });

    it("sends all required fields in request body", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Great work",
        bodyHtml: "<p>Well done</p>",
        hashtagIds: [1, 2],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "John",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.recipientId).toBe("user-2");
      expect(body.title).toBe("Great work");
      expect(body.bodyHtml).toBe("<p>Well done</p>");
      expect(body.hashtagIds).toEqual([1, 2]);
      expect(body.imagePaths).toEqual([]);
    });
  });

  describe("anonymous name handling", () => {
    it("sends anonymousName as null when isAnonymous is false", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "SomeAlias",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.anonymousName).toBeNull();
    });

    it("sends anonymousName when isAnonymous is true", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: true,
        anonymousName: "Mystery Friend",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.anonymousName).toBe("Mystery Friend");
    });

    it("trims and converts empty anonymousName to null when isAnonymous is true", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: true,
        anonymousName: "   ",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.anonymousName).toBeNull();
    });

    it("trims anonymousName when isAnonymous is true", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: true,
        anonymousName: "  Secret Friend  ",
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalled();
      });

      const body = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(body.anonymousName).toBe("Secret Friend");
    });
  });

  describe("success handling", () => {
    it("returns kudo id on success", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-123" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: "kudo-123" });
    });

    it("invalidates feed query cache on success", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: "kudo-1" }),
      });
      global.fetch = mockFetch;

      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      // Spy on invalidateQueries
      const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      );

      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["kudos", "feed"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["kudos", "highlight"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["kudos", "spotlight"] });
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ["kudos", "sidebar"] });
    });
  });

  describe("error handling", () => {
    it("surfaces error from failed API response", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockResolvedValueOnce([]);

      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 422,
        json: async () => ({ error: "Title is required" }),
      });
      global.fetch = mockFetch;

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      result.current.mutate({
        recipientId: "user-2",
        title: "",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });

    it("surfaces error from image upload failure", async () => {
      const { uploadKudoImages } = await import("@/lib/kudos/upload-kudo-images");
      const mockUploadKudoImages = uploadKudoImages as any;
      mockUploadKudoImages.mockRejectedValueOnce(new Error("Upload failed"));

      global.fetch = vi.fn();

      const wrapper = createQueryWrapper();
      const { result } = renderHook(() => useCreateKudo(), { wrapper });

      const imageFile = new File(["fake"], "test.jpg", { type: "image/jpeg" });

      result.current.mutate({
        recipientId: "user-2",
        title: "Title",
        bodyHtml: "<p>Body</p>",
        hashtagIds: [1],
        imageFiles: [imageFile],
        isAnonymous: false,
        anonymousName: "",
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeDefined();
    });
  });
});
