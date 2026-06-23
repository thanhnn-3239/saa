-- Auto-provision a public.profiles row for every auth user.
--
-- ROOT CAUSE FIX (like / send-kudo FK violations):
-- public.profiles.id references auth.users(id), and both kudos.sender_id and
-- kudo_likes.user_id reference public.profiles(id). There was NO mechanism to
-- create a profile when a user signs in — the auth callback doesn't, and no
-- trigger existed. Seeded test users have profiles (via seed.sql), but a real
-- Google OAuth sign-in only created an auth.users row. So the first time such a
-- user liked a kudo, the insert into kudo_likes(user_id = auth.uid()) failed:
--   insert or update on table "kudo_likes" violates foreign key constraint
--   "kudo_likes_user_id_fkey"
-- which surfaced in the UI as the heart count incrementing (optimistic) then
-- snapping back when the request 500'd. The same gap blocks sending kudos.
--
-- profiles has no INSERT RLS policy, so the app cannot self-insert with the
-- user's client — a SECURITY DEFINER trigger is the correct provisioning path.

-- 1) Provisioning function — runs as definer so it bypasses profiles RLS.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    -- full_name is NOT NULL: prefer Google metadata, fall back to the email
    -- local-part, then a generic label so the insert can never fail on null.
    coalesce(
      nullif(trim(new.raw_user_meta_data->>'full_name'), ''),
      nullif(trim(new.raw_user_meta_data->>'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Sunner'
    ),
    coalesce(new.email, ''),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- 2) Fire after every new auth user is created.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Backfill: create profiles for existing auth users that have none yet
--    (accounts that signed in before this trigger existed, incl. current testers).
insert into public.profiles (id, full_name, email, avatar_url)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data->>'full_name'), ''),
    nullif(trim(u.raw_user_meta_data->>'name'), ''),
    nullif(split_part(coalesce(u.email, ''), '@', 1), ''),
    'Sunner'
  ),
  coalesce(u.email, ''),
  coalesce(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null;
