/**
 * Unit tests for image validation in the send-kudo dialog.
 * Covers: MIME type validation, file size limits, count limits.
 * No storage/network calls — validateKudoImages is a pure sync function.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  validateKudoImages,
  ImageValidationError,
  MAX_KUDO_IMAGES,
  MAX_IMAGE_BYTES,
} from "@/lib/kudos/upload-kudo-images";

/** Mock File constructor for vitest jsdom environment. */
function createFile(name: string, size: number, type: string): File {
  const blob = new Blob([new ArrayBuffer(size)], { type });
  return new File([blob], name, { type });
}

describe("validateKudoImages", () => {
  describe("count limits", () => {
    it("accepts empty array", () => {
      expect(() => validateKudoImages([])).not.toThrow();
    });

    it("accepts exactly MAX_KUDO_IMAGES files", () => {
      const files = Array.from({ length: MAX_KUDO_IMAGES }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts 1 file (boundary)", () => {
      const files = [createFile("img.jpg", 1024, "image/jpeg")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("rejects more than MAX_KUDO_IMAGES files", () => {
      const files = Array.from({ length: MAX_KUDO_IMAGES + 1 }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/Tối đa/);
    });

    it("rejects 6 files when MAX is 5", () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects 10 files", () => {
      const files = Array.from({ length: 10 }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });
  });

  describe("MIME type validation", () => {
    it("accepts image/jpeg", () => {
      const files = [createFile("photo.jpg", 1024, "image/jpeg")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts image/png", () => {
      const files = [createFile("photo.png", 1024, "image/png")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts image/webp", () => {
      const files = [createFile("photo.webp", 1024, "image/webp")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("rejects text/plain", () => {
      const files = [createFile("text.txt", 1024, "text/plain")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/Định dạng/);
    });

    it("rejects image/gif (not in allowlist)", () => {
      const files = [createFile("anim.gif", 1024, "image/gif")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects image/svg+xml", () => {
      const files = [createFile("graphic.svg", 1024, "image/svg+xml")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects video/mp4", () => {
      const files = [createFile("video.mp4", 1024 * 1024, "video/mp4")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects empty MIME type", () => {
      const files = [createFile("noext", 1024, "")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects mixed valid and invalid MIME types (stops at first invalid)", () => {
      const files = [
        createFile("img1.jpg", 1024, "image/jpeg"),
        createFile("img2.gif", 1024, "image/gif"),
      ];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });
  });

  describe("file size limits", () => {
    it("accepts exactly MAX_IMAGE_BYTES", () => {
      const files = [createFile("large.jpg", MAX_IMAGE_BYTES, "image/jpeg")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts 1 byte (boundary)", () => {
      const files = [createFile("tiny.jpg", 1, "image/jpeg")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts file under MAX_IMAGE_BYTES", () => {
      const files = [createFile("normal.jpg", MAX_IMAGE_BYTES - 1000, "image/jpeg")];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("rejects file exceeding MAX_IMAGE_BYTES", () => {
      const files = [createFile("huge.jpg", MAX_IMAGE_BYTES + 1, "image/jpeg")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/5MB/);
    });

    it("rejects file at 6MB when limit is 5MB", () => {
      const sixMB = 6 * 1024 * 1024;
      const files = [createFile("oversized.jpg", sixMB, "image/jpeg")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects file at 10MB", () => {
      const tenMB = 10 * 1024 * 1024;
      const files = [createFile("huge.jpg", tenMB, "image/jpeg")];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });

    it("rejects if any file in batch exceeds size (stops at first violation)", () => {
      const files = [
        createFile("ok.jpg", 1024, "image/jpeg"),
        createFile("huge.jpg", MAX_IMAGE_BYTES + 1, "image/jpeg"),
      ];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
    });
  });

  describe("combined validation", () => {
    it("accepts batch of multiple valid files", () => {
      const files = [
        createFile("photo1.jpg", 2 * 1024 * 1024, "image/jpeg"),
        createFile("photo2.png", 3 * 1024 * 1024, "image/png"),
        createFile("photo3.webp", 1024 * 1024, "image/webp"),
      ];
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("accepts batch at maximum: 5 files, each at 5MB", () => {
      const files = Array.from({ length: 5 }, (_, i) =>
        createFile(`max${i}.jpg`, MAX_IMAGE_BYTES, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).not.toThrow();
    });

    it("rejects count violation before checking size", () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/Tối đa/);
    });

    it("rejects MIME type violation on second file in a batch", () => {
      const files = [
        createFile("ok.jpg", 1024, "image/jpeg"),
        createFile("bad.txt", 1024, "text/plain"),
      ];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/Định dạng/);
    });

    it("rejects size violation on third file in a batch", () => {
      const files = [
        createFile("ok1.jpg", 1024, "image/jpeg"),
        createFile("ok2.jpg", 1024, "image/jpeg"),
        createFile("big.jpg", MAX_IMAGE_BYTES + 1, "image/jpeg"),
      ];
      expect(() => validateKudoImages(files)).toThrow(ImageValidationError);
      expect(() => validateKudoImages(files)).toThrow(/5MB/);
    });
  });

  describe("error message content", () => {
    it("includes max image count in error message", () => {
      const files = Array.from({ length: 6 }, (_, i) =>
        createFile(`img${i}.jpg`, 1024, "image/jpeg"),
      );
      try {
        validateKudoImages(files);
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof ImageValidationError) {
          expect(err.message).toContain("5");
        }
      }
    });

    it("error message mentions JPG, PNG, WEBP for MIME rejection", () => {
      const files = [createFile("bad.gif", 1024, "image/gif")];
      try {
        validateKudoImages(files);
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof ImageValidationError) {
          expect(err.message.toUpperCase()).toMatch(/JPG|JPEG/);
          expect(err.message.toUpperCase()).toMatch(/PNG/);
          expect(err.message.toUpperCase()).toMatch(/WEBP/);
        }
      }
    });

    it("error message mentions 5MB for size rejection", () => {
      const files = [createFile("huge.jpg", MAX_IMAGE_BYTES + 1, "image/jpeg")];
      try {
        validateKudoImages(files);
        expect.fail("Should have thrown");
      } catch (err) {
        if (err instanceof ImageValidationError) {
          expect(err.message).toContain("5MB");
        }
      }
    });
  });

  describe("ImageValidationError", () => {
    it("is an instance of Error", () => {
      const err = new ImageValidationError("Test");
      expect(err).toBeInstanceOf(Error);
    });

    it("has name property set to ImageValidationError", () => {
      const err = new ImageValidationError("Test");
      expect(err.name).toBe("ImageValidationError");
    });

    it("stores the error message", () => {
      const msg = "Custom error message";
      const err = new ImageValidationError(msg);
      expect(err.message).toBe(msg);
    });
  });

  describe("exported constants", () => {
    it("exports MAX_KUDO_IMAGES = 5", () => {
      expect(MAX_KUDO_IMAGES).toBe(5);
    });

    it("exports MAX_IMAGE_BYTES = 5MB", () => {
      expect(MAX_IMAGE_BYTES).toBe(5 * 1024 * 1024);
    });
  });
});
