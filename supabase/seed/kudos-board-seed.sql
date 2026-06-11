-- =============================================================================
-- Sun* Kudos Live Board — deterministic sample data
-- =============================================================================
-- PURPOSE: Populates the board with realistic demo data for dev/demo environments.
--
-- IMPORTANT — auth.users requirement:
--   profiles.id references auth.users(id). This script inserts rows directly
--   into auth.users using Supabase''s internal schema. This works against a local
--   Supabase instance (supabase start) which exposes auth.users for seeding.
--   Against a hosted project, use the Supabase dashboard or Admin API to create
--   users first, then run only the INSERT statements below that reference profiles.
--
-- RUN COMMAND (local):
--   supabase db reset          # wipes + re-applies all migrations, then runs seeds/
--   -- OR seed only (migrations already applied):
--   psql "$(supabase status --output json | jq -r '.DB_URL')" \
--        -f supabase/seed/kudos-board-seed.sql
--
-- IDEMPOTENT: uses ON CONFLICT DO NOTHING throughout; safe to re-run.
-- =============================================================================

-- ===================== Clean slate for idempotency =====================
-- Delete in FK-dependency order so foreign-key constraints don''t block.
delete from public.kudo_likes;
delete from public.kudo_hashtags;
delete from public.kudo_images;
delete from public.kudos;
delete from public.user_badges;
delete from public.secret_boxes;
delete from public.notifications;
delete from public.profiles;
delete from public.departments;
delete from public.hashtags;
delete from public.badges;

-- Remove seed auth users (identified by @seed.kudos email domain).
delete from auth.users where email like '%@seed.kudos';

-- ===================== Departments (6) =====================
insert into public.departments (name) values
  ('CEVC10'),
  ('Marketing'),
  ('Engineering'),
  ('Design'),
  ('HR & Culture'),
  ('Product')
on conflict (name) do nothing;

-- ===================== Auth users + Profiles (12) =====================
-- Insert auth.users first so the FK from profiles is satisfied.
-- confirmed_at is set so these users are treated as verified.
insert into auth.users (
  id, email, encrypted_password, email_confirmed_at,
  raw_user_meta_data, created_at, updated_at, role, aud
)
values
  ('a1000000-0000-0000-0000-000000000001', 'minh.tran@seed.kudos',   '', now(),
   '{"full_name":"Minh Trần","avatar_url":"https://i.pravatar.cc/150?u=a1"}',   now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000002', 'linh.nguyen@seed.kudos', '', now(),
   '{"full_name":"Linh Nguyễn","avatar_url":"https://i.pravatar.cc/150?u=a2"}', now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000003', 'hung.le@seed.kudos',     '', now(),
   '{"full_name":"Hùng Lê","avatar_url":"https://i.pravatar.cc/150?u=a3"}',     now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000004', 'huong.pham@seed.kudos',  '', now(),
   '{"full_name":"Hương Phạm","avatar_url":"https://i.pravatar.cc/150?u=a4"}',  now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000005', 'duc.vo@seed.kudos',      '', now(),
   '{"full_name":"Đức Võ","avatar_url":"https://i.pravatar.cc/150?u=a5"}',      now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000006', 'mai.do@seed.kudos',      '', now(),
   '{"full_name":"Mai Đỗ","avatar_url":"https://i.pravatar.cc/150?u=a6"}',      now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000007', 'nam.bui@seed.kudos',     '', now(),
   '{"full_name":"Nam Bùi","avatar_url":"https://i.pravatar.cc/150?u=a7"}',     now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000008', 'trang.hoang@seed.kudos', '', now(),
   '{"full_name":"Trang Hoàng","avatar_url":"https://i.pravatar.cc/150?u=a8"}', now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000009', 'khoa.dang@seed.kudos',   '', now(),
   '{"full_name":"Khoa Đặng","avatar_url":"https://i.pravatar.cc/150?u=a9"}',   now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000010', 'yen.trinh@seed.kudos',   '', now(),
   '{"full_name":"Yến Trịnh","avatar_url":"https://i.pravatar.cc/150?u=a10"}',  now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000011', 'long.cao@seed.kudos',    '', now(),
   '{"full_name":"Long Cao","avatar_url":"https://i.pravatar.cc/150?u=a11"}',   now(), now(), 'authenticated', 'authenticated'),
  ('a1000000-0000-0000-0000-000000000012', 'thu.ly@seed.kudos',      '', now(),
   '{"full_name":"Thu Lý","avatar_url":"https://i.pravatar.cc/150?u=a12"}',     now(), now(), 'authenticated', 'authenticated')
on conflict (id) do nothing;

-- Profiles reference departments by name — use a subquery to stay deterministic.
insert into public.profiles (id, full_name, email, avatar_url, department_id, role)
values
  ('a1000000-0000-0000-0000-000000000001', 'Minh Trần',   'minh.tran@seed.kudos',   'https://i.pravatar.cc/150?u=a1',  (select id from public.departments where name='CEVC10'),    'member'),
  ('a1000000-0000-0000-0000-000000000002', 'Linh Nguyễn', 'linh.nguyen@seed.kudos', 'https://i.pravatar.cc/150?u=a2',  (select id from public.departments where name='Marketing'), 'member'),
  ('a1000000-0000-0000-0000-000000000003', 'Hùng Lê',     'hung.le@seed.kudos',     'https://i.pravatar.cc/150?u=a3',  (select id from public.departments where name='Engineering'),'member'),
  ('a1000000-0000-0000-0000-000000000004', 'Hương Phạm',  'huong.pham@seed.kudos',  'https://i.pravatar.cc/150?u=a4',  (select id from public.departments where name='Design'),     'member'),
  ('a1000000-0000-0000-0000-000000000005', 'Đức Võ',      'duc.vo@seed.kudos',      'https://i.pravatar.cc/150?u=a5',  (select id from public.departments where name='Engineering'),'member'),
  ('a1000000-0000-0000-0000-000000000006', 'Mai Đỗ',      'mai.do@seed.kudos',      'https://i.pravatar.cc/150?u=a6',  (select id from public.departments where name='HR & Culture'),'admin'),
  ('a1000000-0000-0000-0000-000000000007', 'Nam Bùi',     'nam.bui@seed.kudos',     'https://i.pravatar.cc/150?u=a7',  (select id from public.departments where name='Product'),    'member'),
  ('a1000000-0000-0000-0000-000000000008', 'Trang Hoàng', 'trang.hoang@seed.kudos', 'https://i.pravatar.cc/150?u=a8',  (select id from public.departments where name='Marketing'), 'member'),
  ('a1000000-0000-0000-0000-000000000009', 'Khoa Đặng',   'khoa.dang@seed.kudos',   'https://i.pravatar.cc/150?u=a9',  (select id from public.departments where name='CEVC10'),    'member'),
  ('a1000000-0000-0000-0000-000000000010', 'Yến Trịnh',   'yen.trinh@seed.kudos',   'https://i.pravatar.cc/150?u=a10', (select id from public.departments where name='Design'),     'member'),
  ('a1000000-0000-0000-0000-000000000011', 'Long Cao',    'long.cao@seed.kudos',    'https://i.pravatar.cc/150?u=a11', (select id from public.departments where name='Product'),    'member'),
  ('a1000000-0000-0000-0000-000000000012', 'Thu Lý',      'thu.ly@seed.kudos',      'https://i.pravatar.cc/150?u=a12', (select id from public.departments where name='HR & Culture'),'member')
-- NOTE: handle_new_user trigger auto-creates a profile (null department_id) the
-- moment we insert auth.users above, so this must UPDATE — "do nothing" would
-- silently drop department_id / avatar / role from the seed.
-- Do NOT update `role` here: the guard_profile_role trigger blocks role changes
-- outside an admin session. role stays at the trigger default ('member').
on conflict (id) do update set
  full_name     = excluded.full_name,
  avatar_url    = excluded.avatar_url,
  department_id = excluded.department_id;

-- ===================== Hashtags (12) =====================
insert into public.hashtags (name) values
  ('#Dedicated'),
  ('#Inspiring'),
  ('#IDOL GIỚI TRẺ'),
  ('#TeamPlayer'),
  ('#Innovative'),
  ('#BeyondExpectations'),
  ('#Helpful'),
  ('#LeadByExample'),
  ('#RootFurther'),
  ('#SunStar'),
  ('#DeepWork'),
  ('#PositiveVibes')
on conflict (name) do nothing;

-- ===================== Badges (for secret boxes / leaderboard) =====================
insert into public.badges (name, image_url, description, weight) values
  ('Rising Star',   null, 'Awarded to emerging talents', 10),
  ('Team Anchor',   null, 'The one everyone relies on',  5),
  ('Innovator',     null, 'Pushes boundaries',           3),
  ('Culture Keeper',null, 'Guards the Sun* spirit',      8),
  ('Top Sender',    null, 'Sends the most kudos',        6)
on conflict (name) do nothing;

-- ===================== Kudos (40 rows) =====================
-- Fixed UUIDs keep the seed deterministic and allow kudo_hashtags to reference them.
-- sender <> recipient enforced by kudos table CHECK constraint.
-- created_at spread over past 30 days for realistic feed ordering.
insert into public.kudos (id, sender_id, recipient_id, body, is_anonymous, status, created_at)
values
  -- Linh receives many kudos → clear TOP-1 in spotlight
  ('b0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','Linh handled the client escalation brilliantly. Pure calm under fire!',false,'published',now()-interval'1 day'),
  ('b0000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','Linh''s onboarding docs saved my first week. Thank you so much!',false,'published',now()-interval'2 days'),
  ('b0000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000002','Great presentation at the all-hands, Linh!',false,'published',now()-interval'3 days'),
  ('b0000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000002','Linh always makes time to help even when swamped.',false,'published',now()-interval'4 days'),
  ('b0000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000002','Inspiring leader — thank you for mentoring the new joiners.',false,'published',now()-interval'5 days'),
  ('b0000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000002','Linh reviewed my PR at midnight before the release. Hero!',false,'published',now()-interval'6 days'),
  ('b0000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000002','Linh''s Figma work is next level — every handoff is spotless.',false,'published',now()-interval'7 days'),

  -- Minh receives several kudos → TOP-2
  ('b0000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001','Minh''s debugging session yesterday saved our release!',false,'published',now()-interval'1 day'),
  ('b0000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001','Minh went above and beyond with the performance optimisation.',false,'published',now()-interval'8 days'),
  ('b0000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','Always willing to pair. Thanks Minh!',false,'published',now()-interval'9 days'),
  ('b0000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001','Minh''s architecture proposal was exactly what we needed.',false,'published',now()-interval'10 days'),
  ('b0000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001','Thank you for volunteering to cover the on-call shift, Minh.',false,'published',now()-interval'11 days'),

  -- Hùng → TOP-3
  ('b0000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','Hùng''s CI pipeline work cut build time by 40%. Incredible!',false,'published',now()-interval'2 days'),
  ('b0000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','Hùng stayed late every day this sprint — true dedication.',false,'published',now()-interval'12 days'),
  ('b0000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000003','Hùng wrote the clearest RFCs I''ve ever read.',false,'published',now()-interval'13 days'),
  ('b0000000-0000-0000-0000-000000000016','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000003','The team relies on Hùng and he never lets us down.',false,'published',now()-interval'14 days'),

  -- Hương → TOP-4
  ('b0000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004','Hương''s design system has made every dev''s life so much easier.',false,'published',now()-interval'3 days'),
  ('b0000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','Beautiful accessibility work — every component is WCAG 2.1.',false,'published',now()-interval'15 days'),
  ('b0000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','Hương''s prototypes always surprise us in the best way.',false,'published',now()-interval'16 days'),

  -- Đức → TOP-5
  ('b0000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000005','Đức shipped the new auth module ahead of schedule — legend!',false,'published',now()-interval'4 days'),
  ('b0000000-0000-0000-0000-000000000021','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000005','Đức''s code reviews are always thorough and encouraging.',false,'published',now()-interval'17 days'),
  ('b0000000-0000-0000-0000-000000000022','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000005','Đức mentored two interns this quarter. What a role model!',false,'published',now()-interval'18 days'),

  -- Additional kudos (various senders/recipients for feed variety)
  ('b0000000-0000-0000-0000-000000000023','a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000006','Mai organised the team outing — everyone had a great time!',false,'published',now()-interval'5 days'),
  ('b0000000-0000-0000-0000-000000000024','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000007','Nam''s product thinking helped us prioritise the right things.',false,'published',now()-interval'6 days'),
  ('b0000000-0000-0000-0000-000000000025','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000008','Trang''s marketing copy is always crisp and on-brand.',false,'published',now()-interval'7 days'),
  ('b0000000-0000-0000-0000-000000000026','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000009','Khoa''s performance profiling uncovered a hidden memory leak.',false,'published',now()-interval'19 days'),
  ('b0000000-0000-0000-0000-000000000027','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000010','Yến''s UX research shaped our Q3 roadmap. Invaluable.',false,'published',now()-interval'20 days'),
  ('b0000000-0000-0000-0000-000000000028','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000011','Long''s backend work handles 10x the load effortlessly.',false,'published',now()-interval'21 days'),
  ('b0000000-0000-0000-0000-000000000029','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000012','Thu handled the compliance audit single-handedly. Respect.',false,'published',now()-interval'22 days'),
  ('b0000000-0000-0000-0000-000000000030','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000009','Khoa''s SQL optimisation reduced report query time by 80%.',false,'published',now()-interval'23 days'),
  ('b0000000-0000-0000-0000-000000000031','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000010','Yến always turns research into clear, actionable insights.',false,'published',now()-interval'24 days'),
  ('b0000000-0000-0000-0000-000000000032','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000011','Long''s API design is textbook clean. Great to work with.',false,'published',now()-interval'25 days'),
  ('b0000000-0000-0000-0000-000000000033','a1000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000012','Thu supported everyone during the reorg. Genuine culture keeper.',false,'published',now()-interval'26 days'),
  ('b0000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000001','Minh''s talk at the brown-bag session was the best all year.',false,'published',now()-interval'27 days'),
  -- Anonymous kudo for variety
  ('b0000000-0000-0000-0000-000000000035','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000002','Your energy in standups lifts the whole team. Keep it up!', true,'published',now()-interval'28 days'),
  ('b0000000-0000-0000-0000-000000000036','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000004','Incredible eye for detail in every design review.',            true,'published',now()-interval'29 days'),
  ('b0000000-0000-0000-0000-000000000037','a1000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000003','Hùng''s RFC template is now standard across all teams.',       false,'published',now()-interval'30 days'),
  ('b0000000-0000-0000-0000-000000000038','a1000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000006','Mai created the warmest team culture I have ever worked in.', false,'published',now()-interval'29 days'),
  ('b0000000-0000-0000-0000-000000000039','a1000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000007','Nam''s roadmap planning saved us from scope creep.',           false,'published',now()-interval'28 days'),
  ('b0000000-0000-0000-0000-000000000040','a1000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000008','Trang''s campaign doubled our organic reach. Amazing.',         false,'published',now()-interval'27 days')
on conflict (id) do nothing;

-- ===================== Kudo hashtags =====================
insert into public.kudo_hashtags (kudo_id, hashtag_id)
select k.id, h.id from (values
  ('b0000000-0000-0000-0000-000000000001','#Inspiring'),
  ('b0000000-0000-0000-0000-000000000001','#LeadByExample'),
  ('b0000000-0000-0000-0000-000000000002','#Helpful'),
  ('b0000000-0000-0000-0000-000000000003','#Inspiring'),
  ('b0000000-0000-0000-0000-000000000004','#Helpful'),
  ('b0000000-0000-0000-0000-000000000005','#IDOL GIỚI TRẺ'),
  ('b0000000-0000-0000-0000-000000000006','#Dedicated'),
  ('b0000000-0000-0000-0000-000000000007','#BeyondExpectations'),
  ('b0000000-0000-0000-0000-000000000008','#Dedicated'),
  ('b0000000-0000-0000-0000-000000000009','#BeyondExpectations'),
  ('b0000000-0000-0000-0000-000000000010','#Helpful'),
  ('b0000000-0000-0000-0000-000000000011','#Innovative'),
  ('b0000000-0000-0000-0000-000000000012','#TeamPlayer'),
  ('b0000000-0000-0000-0000-000000000013','#DeepWork'),
  ('b0000000-0000-0000-0000-000000000014','#Dedicated'),
  ('b0000000-0000-0000-0000-000000000015','#Innovative'),
  ('b0000000-0000-0000-0000-000000000016','#LeadByExample'),
  ('b0000000-0000-0000-0000-000000000017','#RootFurther'),
  ('b0000000-0000-0000-0000-000000000018','#BeyondExpectations'),
  ('b0000000-0000-0000-0000-000000000019','#Innovative'),
  ('b0000000-0000-0000-0000-000000000020','#DeepWork'),
  ('b0000000-0000-0000-0000-000000000021','#LeadByExample'),
  ('b0000000-0000-0000-0000-000000000022','#IDOL GIỚI TRẺ'),
  ('b0000000-0000-0000-0000-000000000023','#PositiveVibes'),
  ('b0000000-0000-0000-0000-000000000024','#Innovative'),
  ('b0000000-0000-0000-0000-000000000025','#SunStar'),
  ('b0000000-0000-0000-0000-000000000026','#DeepWork'),
  ('b0000000-0000-0000-0000-000000000027','#RootFurther'),
  ('b0000000-0000-0000-0000-000000000028','#BeyondExpectations'),
  ('b0000000-0000-0000-0000-000000000029','#TeamPlayer')
) as t(kudo_id, hashtag_name)
join public.kudos k on k.id = t.kudo_id::uuid
join public.hashtags h on h.name = t.hashtag_name
on conflict do nothing;

-- ===================== Kudo images (a few sample rows) =====================
insert into public.kudo_images (kudo_id, storage_path)
values
  ('b0000000-0000-0000-0000-000000000001', 'kudo-images/seed/kudo1-img1.jpg'),
  ('b0000000-0000-0000-0000-000000000008', 'kudo-images/seed/kudo8-img1.jpg'),
  ('b0000000-0000-0000-0000-000000000013', 'kudo-images/seed/kudo13-img1.jpg')
on conflict do nothing;

-- ===================== Kudo likes — distributed for clear TOP-5 =====================
-- Linh (recipient 02) gets the most likes across her kudos  → rank 1
-- Minh  (recipient 01) → rank 2
-- Hùng  (recipient 03) → rank 3
-- Hương (recipient 04) → rank 4
-- Đức   (recipient 05) → rank 5
-- Note: a user cannot like a kudo they sent (RLS enforced; mirrored here).

insert into public.kudo_likes (kudo_id, user_id, hearts) values
  -- kudos TO Linh (b01–b07) — liked by many
  ('b0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000004',1),
  ('b0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000005',1),
  ('b0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000006',1),
  ('b0000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004',1),
  ('b0000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000005',1),
  ('b0000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005',1),
  ('b0000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004',1),
  ('b0000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000005',1),
  ('b0000000-0000-0000-0000-000000000035','a1000000-0000-0000-0000-000000000001',1),

  -- kudos TO Minh (b08–b12)
  ('b0000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000008','a1000000-0000-0000-0000-000000000005',1),
  ('b0000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000009','a1000000-0000-0000-0000-000000000006',1),
  ('b0000000-0000-0000-0000-000000000010','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000011','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000012','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000003',1),
  ('b0000000-0000-0000-0000-000000000034','a1000000-0000-0000-0000-000000000005',1),

  -- kudos TO Hùng (b13–b16, b37)
  ('b0000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000013','a1000000-0000-0000-0000-000000000004',1),
  ('b0000000-0000-0000-0000-000000000014','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000015','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000037','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000037','a1000000-0000-0000-0000-000000000002',1),

  -- kudos TO Hương (b17–b19, b36)
  ('b0000000-0000-0000-0000-000000000017','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000018','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000019','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000036','a1000000-0000-0000-0000-000000000001',1),

  -- kudos TO Đức (b20–b22)
  ('b0000000-0000-0000-0000-000000000020','a1000000-0000-0000-0000-000000000002',1),
  ('b0000000-0000-0000-0000-000000000021','a1000000-0000-0000-0000-000000000001',1),
  ('b0000000-0000-0000-0000-000000000022','a1000000-0000-0000-0000-000000000003',1)
on conflict (kudo_id, user_id) do nothing;

-- ===================== Secret boxes =====================
insert into public.secret_boxes (id, user_id, status, badge_id, opened_at) values
  -- opened boxes (with badge assigned)
  ('c0000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000001','opened',
   (select id from public.badges where name='Rising Star'), now()-interval'10 days'),
  ('c0000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000002','opened',
   (select id from public.badges where name='Team Anchor'), now()-interval'5 days'),
  ('c0000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000003','opened',
   (select id from public.badges where name='Innovator'),   now()-interval'3 days'),
  -- unopened boxes
  ('c0000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000001','unopened',null,null),
  ('c0000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000002','unopened',null,null),
  ('c0000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000004','unopened',null,null),
  ('c0000000-0000-0000-0000-000000000007','a1000000-0000-0000-0000-000000000005','unopened',null,null)
on conflict (id) do nothing;

-- ===================== User badges =====================
insert into public.user_badges (user_id, badge_id, source) values
  ('a1000000-0000-0000-0000-000000000001',(select id from public.badges where name='Rising Star'),  'secret_box'),
  ('a1000000-0000-0000-0000-000000000002',(select id from public.badges where name='Team Anchor'),  'secret_box'),
  ('a1000000-0000-0000-0000-000000000003',(select id from public.badges where name='Innovator'),    'secret_box'),
  ('a1000000-0000-0000-0000-000000000006',(select id from public.badges where name='Culture Keeper'),'secret_box')
on conflict do nothing;

-- =============================================================================
-- DEMO AUGMENT — extra data so hero-title pills / stars, a denser Spotlight
-- cloud, and a 5-image gallery are demonstrable. Idempotent: the clean-slate
-- delete at the top wipes everything first; generated rows use gen_random_uuid().
-- =============================================================================

-- 8 extra Sunners (auth.users → handle_new_user trigger makes the profile →
-- the upsert below sets department). Adds cloud density (~20 recipients).
insert into auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at, role, aud)
values
  ('a3000000-0000-0000-0000-000000000001','tu.anh@seed.kudos',     '',now(),'{"full_name":"Tú Anh","avatar_url":"https://i.pravatar.cc/150?u=b1"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000002','bao.khanh@seed.kudos',  '',now(),'{"full_name":"Bảo Khánh","avatar_url":"https://i.pravatar.cc/150?u=b2"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000003','dieu.linh@seed.kudos',  '',now(),'{"full_name":"Diệu Linh","avatar_url":"https://i.pravatar.cc/150?u=b3"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000004','gia.huy@seed.kudos',    '',now(),'{"full_name":"Gia Huy","avatar_url":"https://i.pravatar.cc/150?u=b4"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000005','ha.my@seed.kudos',      '',now(),'{"full_name":"Hà My","avatar_url":"https://i.pravatar.cc/150?u=b5"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000006','khoi.nguyen@seed.kudos','',now(),'{"full_name":"Khôi Nguyên","avatar_url":"https://i.pravatar.cc/150?u=b6"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000007','phuong.vy@seed.kudos',  '',now(),'{"full_name":"Phương Vy","avatar_url":"https://i.pravatar.cc/150?u=b7"}',now(),now(),'authenticated','authenticated'),
  ('a3000000-0000-0000-0000-000000000008','tan.phat@seed.kudos',   '',now(),'{"full_name":"Tấn Phát","avatar_url":"https://i.pravatar.cc/150?u=b8"}',now(),now(),'authenticated','authenticated')
on conflict (id) do nothing;

insert into public.profiles (id, full_name, email, avatar_url, department_id)
values
  ('a3000000-0000-0000-0000-000000000001','Tú Anh',     'tu.anh@seed.kudos',     'https://i.pravatar.cc/150?u=b1',(select id from public.departments where name='Engineering')),
  ('a3000000-0000-0000-0000-000000000002','Bảo Khánh',  'bao.khanh@seed.kudos',  'https://i.pravatar.cc/150?u=b2',(select id from public.departments where name='Design')),
  ('a3000000-0000-0000-0000-000000000003','Diệu Linh',  'dieu.linh@seed.kudos',  'https://i.pravatar.cc/150?u=b3',(select id from public.departments where name='Marketing')),
  ('a3000000-0000-0000-0000-000000000004','Gia Huy',    'gia.huy@seed.kudos',    'https://i.pravatar.cc/150?u=b4',(select id from public.departments where name='Product')),
  ('a3000000-0000-0000-0000-000000000005','Hà My',      'ha.my@seed.kudos',      'https://i.pravatar.cc/150?u=b5',(select id from public.departments where name='HR & Culture')),
  ('a3000000-0000-0000-0000-000000000006','Khôi Nguyên','khoi.nguyen@seed.kudos','https://i.pravatar.cc/150?u=b6',(select id from public.departments where name='CEVC10')),
  ('a3000000-0000-0000-0000-000000000007','Phương Vy',  'phuong.vy@seed.kudos',  'https://i.pravatar.cc/150?u=b7',(select id from public.departments where name='Engineering')),
  ('a3000000-0000-0000-0000-000000000008','Tấn Phát',   'tan.phat@seed.kudos',   'https://i.pravatar.cc/150?u=b8',(select id from public.departments where name='Marketing'))
on conflict (id) do update set
  full_name = excluded.full_name, avatar_url = excluded.avatar_url, department_id = excluded.department_id;

-- Bulk kudos to push tiers. sender_id is picked from a set that EXCLUDES the
-- recipient (kudos check: sender_id <> recipient_id). created_at sits OLDER than
-- the curated kudos so the feed top still shows the hand-written ones.
-- Linh (02) → +45  ⇒ ~52 received ⇒ 3★ "Legend Hero"
insert into public.kudos (sender_id, recipient_id, body, status, created_at)
select (array['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005','a1000000-0000-0000-0000-000000000006','a1000000-0000-0000-0000-000000000007']::uuid[])[1+(g%6)],
       'a1000000-0000-0000-0000-000000000002'::uuid,
       'Cảm ơn Linh vì sự tận tâm và lan tỏa năng lượng tích cực! (#'||g||')','published', now()-((30+g)||' days')::interval
from generate_series(1,45) g;

-- Minh (01) → +16 ⇒ ~22 received ⇒ 2★ "Super Hero"
insert into public.kudos (sender_id, recipient_id, body, status, created_at)
select (array['a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005']::uuid[])[1+(g%4)],
       'a1000000-0000-0000-0000-000000000001'::uuid,
       'Cảm ơn Minh đã hỗ trợ kỹ thuật hết mình! (#'||g||')','published', now()-((30+g)||' days')::interval
from generate_series(1,16) g;

-- Hùng (03) → +7 ⇒ ~12 ⇒ 1★ "Rising Hero" ; Hương (04) → +8 ⇒ ~12 ⇒ 1★
insert into public.kudos (sender_id, recipient_id, body, status, created_at)
select (array['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000004','a1000000-0000-0000-0000-000000000005']::uuid[])[1+(g%4)],
       'a1000000-0000-0000-0000-000000000003'::uuid,
       'Cảm ơn Hùng vì những đóng góp thầm lặng! (#'||g||')','published', now()-((30+g)||' days')::interval
from generate_series(1,7) g;
insert into public.kudos (sender_id, recipient_id, body, status, created_at)
select (array['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003','a1000000-0000-0000-0000-000000000005']::uuid[])[1+(g%4)],
       'a1000000-0000-0000-0000-000000000004'::uuid,
       'Cảm ơn Hương vì design system tuyệt vời! (#'||g||')','published', now()-((30+g)||' days')::interval
from generate_series(1,8) g;

-- Each new Sunner receives 2 kudos so they appear in the Spotlight cloud.
insert into public.kudos (sender_id, recipient_id, body, status, created_at)
select (array['a1000000-0000-0000-0000-000000000001','a1000000-0000-0000-0000-000000000002','a1000000-0000-0000-0000-000000000003']::uuid[])[1+(g%3)],
       np.id,
       'Chào mừng '||np.full_name||' gia nhập phong trào Kudos! (#'||g||')','published', now()-((10+g)||' days')::interval
from public.profiles np cross join generate_series(1,2) g
where np.email like '%@seed.kudos' and np.id::text like 'a3000000-%';

-- 5-image gallery on two feed kudos (b01 + b08 already have 1 image each → top up to 5).
insert into public.kudo_images (kudo_id, storage_path) values
  ('b0000000-0000-0000-0000-000000000001','kudo-images/seed/kudo1-img2.jpg'),
  ('b0000000-0000-0000-0000-000000000001','kudo-images/seed/kudo1-img3.jpg'),
  ('b0000000-0000-0000-0000-000000000001','kudo-images/seed/kudo1-img4.jpg'),
  ('b0000000-0000-0000-0000-000000000001','kudo-images/seed/kudo1-img5.jpg'),
  ('b0000000-0000-0000-0000-000000000008','kudo-images/seed/kudo8-img2.jpg'),
  ('b0000000-0000-0000-0000-000000000008','kudo-images/seed/kudo8-img3.jpg'),
  ('b0000000-0000-0000-0000-000000000008','kudo-images/seed/kudo8-img4.jpg'),
  ('b0000000-0000-0000-0000-000000000008','kudo-images/seed/kudo8-img5.jpg')
on conflict do nothing;
