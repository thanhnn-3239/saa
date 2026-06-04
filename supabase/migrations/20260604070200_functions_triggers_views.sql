-- SAA Kudos — business functions, trigger, view, realtime, storage.
-- Requires schema + RLS from previous migrations. See docs/database-design.md.

-- ===================== create_kudo (atomic multi-table write) =====================
create or replace function public.create_kudo(
  p_recipient_id uuid,
  p_body         text,
  p_is_anonymous boolean default false,
  p_hashtag_ids  bigint[] default '{}',
  p_image_paths  text[]  default '{}',
  p_links        jsonb   default '[]'
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_kudo_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if array_length(p_hashtag_ids,1) is null or array_length(p_hashtag_ids,1) > 5 then
    raise exception 'kudo requires 1..5 hashtags';
  end if;
  if coalesce(array_length(p_image_paths,1),0) > 5 then
    raise exception 'max 5 images';
  end if;

  insert into public.kudos (sender_id, recipient_id, body, is_anonymous)
  values (auth.uid(), p_recipient_id, p_body, p_is_anonymous)
  returning id into v_kudo_id;

  insert into public.kudo_hashtags (kudo_id, hashtag_id)
  select v_kudo_id, unnest(p_hashtag_ids);

  if array_length(p_image_paths,1) is not null then
    insert into public.kudo_images (kudo_id, storage_path)
    select v_kudo_id, unnest(p_image_paths);
  end if;

  insert into public.kudo_links (kudo_id, url, title)
  select v_kudo_id, e->>'url', e->>'title'
  from jsonb_array_elements(p_links) e;

  return v_kudo_id;
end $$;

-- ===================== grant_secret_box (admin / system grant) =====================
create or replace function public.grant_secret_box(p_user_id uuid, p_count integer default 1)
returns integer
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then
    raise exception 'only admins can grant secret boxes';
  end if;
  if p_count < 1 then
    raise exception 'count must be >= 1';
  end if;
  insert into public.secret_boxes (user_id)
  select p_user_id from generate_series(1, p_count);
  return p_count;
end $$;

-- ===================== open_secret_box (server-authoritative random + atomic) =====================
create or replace function public.open_secret_box(p_box_id uuid)
returns public.badges
language plpgsql security definer set search_path = public as $$
declare v_badge public.badges;
begin
  perform 1 from public.secret_boxes
   where id = p_box_id and user_id = auth.uid() and status = 'unopened'
   for update;
  if not found then
    raise exception 'box not found, not yours, or already opened';
  end if;

  -- weighted random pick: exponential method (-ln(rand)/weight)
  select * into v_badge from public.badges
   order by -ln(random()) / weight
   limit 1;

  update public.secret_boxes
     set status = 'opened', badge_id = v_badge.id, opened_at = now()
   where id = p_box_id;

  insert into public.user_badges (user_id, badge_id, source)
  values (auth.uid(), v_badge.id, 'secret_box');

  return v_badge;
end $$;

-- ===================== notify_on_kudo trigger =====================
create or replace function public.notify_on_kudo() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, kudo_id)
  values (new.recipient_id, 'kudo_received', new.id);
  return new;
end $$;

create trigger trg_notify_on_kudo
  after insert on public.kudos
  for each row execute function public.notify_on_kudo();

-- ===================== user_statistics view (leaderboard / profile tiles) =====================
create or replace view public.user_statistics
with (security_invoker = true) as
select
  p.id as user_id,
  (select count(*) from public.kudos k where k.recipient_id = p.id and k.status='published') as kudos_received,
  (select count(*) from public.kudos k where k.sender_id   = p.id and k.status='published') as kudos_sent,
  (select count(*) from public.user_badges ub where ub.user_id = p.id) as badges_count
from public.profiles p;

-- ===================== Realtime =====================
alter publication supabase_realtime add table public.kudos;
alter publication supabase_realtime add table public.notifications;

-- ===================== Storage buckets + policies =====================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true), ('kudo-images', 'kudo-images', false)
on conflict (id) do nothing;

-- avatars: public read; owner writes within their own folder (path prefix = uid)
create policy "avatars public read" on storage.objects for select
  using (bucket_id = 'avatars');
create policy "avatars owner write" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "avatars owner update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- kudo-images: authenticated read + write
create policy "kudo-images read" on storage.objects for select to authenticated
  using (bucket_id = 'kudo-images');
create policy "kudo-images write" on storage.objects for insert to authenticated
  with check (bucket_id = 'kudo-images');
