-- SAA Kudos — core schema (tables, indexes, identity triggers).
-- RLS is enabled here; policies live in 20260604070100_rls_policies.sql.
-- See docs/database-design.md.

-- ===================== Identity & Org =====================
create table public.departments (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  email         text not null,
  avatar_url    text,
  role          text not null default 'member' check (role in ('member','admin')),
  department_id bigint references public.departments(id),
  created_at    timestamptz not null default now()
);

-- Helper (defined after profiles exists, referenced by RLS policies).
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- ===================== Taxonomy & Campaign =====================
create table public.hashtags (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  created_at  timestamptz not null default now()
);

create table public.campaigns (
  id            bigint generated always as identity primary key,
  name          text not null,
  rules_content text,
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  check (ends_at > starts_at)
);

-- ===================== Kudos =====================
create table public.kudos (
  id            uuid primary key default gen_random_uuid(),
  sender_id     uuid not null references public.profiles(id),
  recipient_id  uuid not null references public.profiles(id),
  body          text not null,
  is_anonymous  boolean not null default false,
  status        text not null default 'published' check (status in ('published','hidden','spam')),
  campaign_id   bigint references public.campaigns(id),
  created_at    timestamptz not null default now(),
  check (sender_id <> recipient_id)
);

create table public.kudo_hashtags (
  kudo_id     uuid not null references public.kudos(id) on delete cascade,
  hashtag_id  bigint not null references public.hashtags(id),
  primary key (kudo_id, hashtag_id)
);

create table public.kudo_images (
  id           bigint generated always as identity primary key,
  kudo_id      uuid not null references public.kudos(id) on delete cascade,
  storage_path text not null
);

create table public.kudo_links (
  id       bigint generated always as identity primary key,
  kudo_id  uuid not null references public.kudos(id) on delete cascade,
  url      text not null,
  title    text
);

-- ===================== Badges & Secret Box =====================
create table public.badges (
  id          bigint generated always as identity primary key,
  name        text not null unique,
  image_url   text,
  description text,
  weight      integer not null check (weight > 0)
);

create table public.user_badges (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  badge_id    bigint not null references public.badges(id),
  source      text not null default 'secret_box',
  created_at  timestamptz not null default now()
);

create table public.secret_boxes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  status      text not null default 'unopened' check (status in ('unopened','opened')),
  badge_id    bigint references public.badges(id),
  opened_at   timestamptz,
  created_at  timestamptz not null default now()
);

-- ===================== Awards & Notifications =====================
create table public.awards (
  id          bigint generated always as identity primary key,
  category    text not null,
  name        text not null,
  description text,
  image_url   text,
  sort_order  integer not null default 0
);

create table public.notifications (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        text not null,
  kudo_id     uuid references public.kudos(id) on delete cascade,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Cross reference added after badges exists: showcased "title" badge on profile.
alter table public.profiles
  add column active_badge_id bigint references public.badges(id);

-- ===================== Indexes =====================
create index idx_kudos_recipient on public.kudos (recipient_id, created_at desc);
create index idx_kudos_sender    on public.kudos (sender_id, created_at desc);
create index idx_kudos_status    on public.kudos (status, created_at desc);
create index idx_secret_boxes_user on public.secret_boxes (user_id, status);
create index idx_notifications_user on public.notifications (user_id, is_read, created_at desc);
create index idx_kudo_hashtags_hashtag on public.kudo_hashtags (hashtag_id);

-- ===================== Enable RLS (policies in next migration) =====================
alter table public.departments    enable row level security;
alter table public.profiles       enable row level security;
alter table public.hashtags       enable row level security;
alter table public.campaigns      enable row level security;
alter table public.kudos          enable row level security;
alter table public.kudo_hashtags  enable row level security;
alter table public.kudo_images    enable row level security;
alter table public.kudo_links     enable row level security;
alter table public.badges         enable row level security;
alter table public.user_badges    enable row level security;
alter table public.secret_boxes   enable row level security;
alter table public.awards         enable row level security;
alter table public.notifications  enable row level security;

-- ===================== Identity triggers =====================
-- Auto-create a profile row when a new auth user signs up (Google OAuth).
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email),
    new.email,
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Prevent privilege escalation: only admins may change a profile's role.
create or replace function public.guard_profile_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception 'only admins can change role';
  end if;
  return new;
end $$;

create trigger trg_guard_profile_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();
