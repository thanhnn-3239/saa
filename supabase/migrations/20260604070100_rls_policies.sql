-- SAA Kudos — RLS policies. Requires is_admin() + tables from 20260604070000_schema.sql.
-- Principle: reads via RLS; correctness-critical writes only through SECURITY DEFINER functions.

-- ===================== profiles =====================
create policy "profiles readable by authenticated"
  on public.profiles for select to authenticated using (true);
create policy "profiles update own or admin"
  on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

-- ===================== reference catalogs (read all, write admin) =====================
-- departments, hashtags, badges, awards, campaigns
create policy "departments readable" on public.departments for select to authenticated using (true);
create policy "departments admin write" on public.departments for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "hashtags readable" on public.hashtags for select to authenticated using (true);
create policy "hashtags admin write" on public.hashtags for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "badges readable" on public.badges for select to authenticated using (true);
create policy "badges admin write" on public.badges for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "awards readable" on public.awards for select to authenticated using (true);
create policy "awards admin write" on public.awards for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy "campaigns readable" on public.campaigns for select to authenticated using (true);
create policy "campaigns admin write" on public.campaigns for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- ===================== kudos =====================
-- Visible if published, or you are sender/recipient, or admin. Inserts go through create_kudo().
create policy "kudos readable"
  on public.kudos for select to authenticated
  using (status = 'published' or sender_id = auth.uid() or recipient_id = auth.uid() or public.is_admin());
create policy "kudos admin moderate"
  on public.kudos for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- child tables: visible iff parent kudo is visible; writes only via create_kudo() (definer)
create policy "kudo_hashtags readable" on public.kudo_hashtags for select to authenticated
  using (exists (select 1 from public.kudos k where k.id = kudo_id
    and (k.status='published' or k.sender_id=auth.uid() or k.recipient_id=auth.uid() or public.is_admin())));
create policy "kudo_images readable" on public.kudo_images for select to authenticated
  using (exists (select 1 from public.kudos k where k.id = kudo_id
    and (k.status='published' or k.sender_id=auth.uid() or k.recipient_id=auth.uid() or public.is_admin())));
create policy "kudo_links readable" on public.kudo_links for select to authenticated
  using (exists (select 1 from public.kudos k where k.id = kudo_id
    and (k.status='published' or k.sender_id=auth.uid() or k.recipient_id=auth.uid() or public.is_admin())));

-- ===================== badges earned / secret boxes =====================
-- user_badges public-readable (shown on profiles); inserted only via open_secret_box().
create policy "user_badges readable" on public.user_badges for select to authenticated using (true);

-- secret_boxes: owner reads own; mutated only via grant_secret_box()/open_secret_box() (definer).
create policy "secret_boxes read own" on public.secret_boxes for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- ===================== notifications =====================
create policy "notifications read own" on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy "notifications update own" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
