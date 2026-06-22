-- Make the kudo-images bucket publicly readable.
--
-- Kudo images are public board content (every authenticated user already sees
-- all kudos and their images), so serving them via getPublicUrl — the same way
-- avatars work — is the simplest, consistent approach. Without this the board
-- could only show a placeholder because the bucket was private.
update storage.buckets set public = true where id = 'kudo-images';

-- Public read policy (mirrors "avatars public read"). The authenticated-only
-- read policy from the initial migration stays; SELECT policies are OR'd.
create policy "kudo-images public read" on storage.objects for select
  using (bucket_id = 'kudo-images');
