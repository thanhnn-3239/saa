-- ============================================================================
-- notification_feed view
-- Denormalizes notifications with the originating kudo's sender name and title
-- for display in the bell dropdown and the /notifications page.
--
-- security_invoker = true: the caller's RLS applies, so the existing
-- "notifications read own" policy restricts each user to their own rows.
--
-- Anonymity: when the source kudo is anonymous, actor_name is masked to the
-- sender-chosen alias (anonymous_name) or the generic "Ẩn danh" label. The real
-- sender's name (sender.full_name) is never selected for anonymous kudos.
-- ============================================================================
create or replace view public.notification_feed
with (security_invoker = true) as
select
  n.id,
  n.user_id,
  n.type,
  n.kudo_id,
  n.is_read,
  n.created_at,
  case
    when k.is_anonymous then coalesce(k.anonymous_name, 'Ẩn danh')
    else sender.full_name
  end as actor_name,
  k.title as kudo_title
from public.notifications n
left join public.kudos k on k.id = n.kudo_id
left join public.profiles sender on sender.id = k.sender_id;
