-- Dev-only E2E kudos seed — data contract for e2e/sun-kudos.authed.spec.ts.
--
-- Load together with seed.sql (which creates the member users) in one reset:
--   SUPABASE_EXTRA_SEEDS="./seeds/dev/*.sql" pnpm db:reset
-- sql_paths globs are sorted, so seed.sql always runs before this file, and the
-- common seed (hashtags/departments referenced below) runs before both.
--
-- Deterministic: fixed kudo UUIDs; sender/recipient resolved by seeded email;
-- bodies carry [e2e-kN] markers the specs use as unambiguous card locators.
-- Idempotent: ON CONFLICT DO NOTHING throughout; safe to re-run.
-- No kudo_likes rows — the like spec toggles and cleans up after itself.
--
-- WARNING: supabase/seed/kudos-board-seed.sql wipes ALL profiles (including
-- member-test) plus every kudo. Do not apply it on a database used for this
-- E2E suite.

-- Recipients per department (from seed.sql): member02 Design, member04 Operations,
-- member06 Engineering, member08 Product, member01 Engineering.
insert into public.kudos (id, sender_id, recipient_id, body, is_anonymous, status, created_at)
select t.id::uuid, s.id, r.id, t.body, t.is_anonymous, 'published', now() - (t.minutes_ago || ' minutes')::interval
from (values
  ('e2e00000-0000-0000-0000-000000000001', 'member01@sun-asterisk.com', 'member02@sun-asterisk.com',
   'Member Two delivered a flawless design handoff. [e2e-k1]', false, 1),
  ('e2e00000-0000-0000-0000-000000000002', 'member03@sun-asterisk.com', 'member04@sun-asterisk.com',
   'Member Four kept the release train on schedule. [e2e-k2]', false, 2),
  ('e2e00000-0000-0000-0000-000000000003', 'member05@sun-asterisk.com', 'member06@sun-asterisk.com',
   'Member Six prototyped the new idea overnight. [e2e-k3]', false, 3),
  ('e2e00000-0000-0000-0000-000000000004', 'member07@sun-asterisk.com', 'member08@sun-asterisk.com',
   'Member Eight untangled the roadmap beautifully. [e2e-k4]', false, 4),
  ('e2e00000-0000-0000-0000-000000000005', 'member02@sun-asterisk.com', 'member01@sun-asterisk.com',
   'Quietly fixed the flaky pipeline before standup. [e2e-k5]', true, 5),
  ('e2e00000-0000-0000-0000-000000000006', 'member-test@sun-asterisk.com', 'member01@sun-asterisk.com',
   'Thanks for pairing on the tricky migration. [e2e-k6]', false, 6)
) as t(id, sender_email, recipient_email, body, is_anonymous, minutes_ago)
join public.profiles s on s.email = t.sender_email
join public.profiles r on r.email = t.recipient_email
on conflict (id) do nothing;

-- Hashtags from the common seed. positivity is intentionally unused so the
-- empty-state filter spec has a guaranteed zero-result tag.
insert into public.kudo_hashtags (kudo_id, hashtag_id)
select k.id, h.id
from (values
  ('e2e00000-0000-0000-0000-000000000001', 'teamwork'),
  ('e2e00000-0000-0000-0000-000000000002', 'teamwork'),
  ('e2e00000-0000-0000-0000-000000000003', 'innovation'),
  ('e2e00000-0000-0000-0000-000000000005', 'ownership')
) as t(kudo_id, hashtag_name)
join public.kudos k on k.id = t.kudo_id::uuid
join public.hashtags h on h.name = t.hashtag_name
on conflict do nothing;
