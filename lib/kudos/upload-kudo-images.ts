"use client";

/**
 * Client-side image upload for the send-kudo dialog.
 *
 * Validates type/size/count BEFORE any network call (mirrors the server-side
 * guards in create_kudo), then uploads each file to the private `kudo-images`
 * bucket at `{uid}/{uuid}.{ext}` and returns the storage paths to pass to the
 * create-kudo RPC.
 *
 * Orphan policy: if the subsequent RPC fails, uploaded files are NOT rolled
 * back — the bucket is private and orphans are harmless; a cleanup job can
 * prune paths with no kudo_images row if it ever matters.
 */

import { createClient } from "@/lib/supabase/client";

export const MAX_KUDO_IMAGES = 5;
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Typed validation error so the UI can show a field-level message. */
export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

/** Throws ImageValidationError if any file violates type/size/count limits. */
export function validateKudoImages(files: File[]): void {
  if (files.length > MAX_KUDO_IMAGES) {
    throw new ImageValidationError(`Tối đa ${MAX_KUDO_IMAGES} ảnh`);
  }
  for (const file of files) {
    if (!ALLOWED_MIME_TO_EXT[file.type]) {
      throw new ImageValidationError(
        "Định dạng file không hợp lệ (chỉ chấp nhận JPG, PNG, WEBP)",
      );
    }
    if (file.size > MAX_IMAGE_BYTES) {
      throw new ImageValidationError("Ảnh vượt quá dung lượng tối đa 5MB");
    }
  }
}

/**
 * Upload validated images and return their storage paths (in input order).
 * Caller must be authenticated — storage RLS rejects anon writes.
 */
export async function uploadKudoImages(files: File[]): Promise<string[]> {
  if (files.length === 0) return [];
  validateKudoImages(files);

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("authentication required");
  }

  const paths: string[] = [];
  for (const file of files) {
    const ext = ALLOWED_MIME_TO_EXT[file.type];
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("kudo-images")
      .upload(path, file, { contentType: file.type });
    if (error) {
      throw new Error(`upload failed: ${error.message}`);
    }
    paths.push(path);
  }
  return paths;
}
