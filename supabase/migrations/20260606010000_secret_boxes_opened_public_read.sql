-- Public read of OPENED secret boxes.
-- The "10 SUNNER NHẬN QUÀ MỚI NHẤT" leaderboard (D.3) shows everyone's most
-- recently opened gifts. The base "read own" policy on secret_boxes (in
-- 20260604070100_rls_policies.sql) restricts SELECT to the owner, which made the
-- leaderboard always empty. RLS policies are OR'd, so this supplements it:
-- everyone sees OPENED boxes; UNOPENED boxes stay private (own-only).
create policy "secret_boxes opened public"
  on public.secret_boxes for select to authenticated
  using (status = 'opened');
