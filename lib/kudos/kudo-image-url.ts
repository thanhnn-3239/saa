/**
 * kudo-image-url.ts
 *
 * Resolve a kudo image storage path (e.g. "{uid}/{uuid}.png") to a displayable
 * public URL. The `kudo-images` bucket is public (see migration
 * 20260622000000_kudo_images_public.sql), so the public object endpoint serves
 * files directly — no signed URL needed. Works on both server and client.
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

export function kudoImageUrl(storagePath: string): string {
  if (!storagePath) return "";
  // Already an absolute URL (defensive) — pass through.
  if (/^https?:\/\//i.test(storagePath)) return storagePath;
  const clean = storagePath.replace(/^\/+/, "");
  return `${SUPABASE_URL}/storage/v1/object/public/kudo-images/${clean}`;
}
