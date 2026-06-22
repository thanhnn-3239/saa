-- Viết Kudo send-dialog: add kudos.title + kudos.anonymous_name, extend create_kudo.
-- Columns stay nullable for backwards compat with existing rows; "required" for title
-- is enforced in the RPC + app layer, not as DDL.
-- Rollback (forward-only): follow-up migration dropping the two columns and
-- re-creating create_kudo with the prior 6-param signature.

alter table public.kudos add column if not exists title text;
alter table public.kudos add column if not exists anonymous_name text;

-- Changing the parameter list creates an overload rather than replacing the
-- function, so drop the old 6-param signature explicitly.
drop function if exists public.create_kudo(uuid, text, boolean, bigint[], text[], jsonb);

create or replace function public.create_kudo(
  p_recipient_id   uuid,
  p_title          text,
  p_body           text,
  p_is_anonymous   boolean default false,
  p_hashtag_ids    bigint[] default '{}',
  p_image_paths    text[]  default '{}',
  p_links          jsonb   default '[]',
  p_anonymous_name text    default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_kudo_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if coalesce(btrim(p_title), '') = '' then
    raise exception 'kudo requires a title';
  end if;
  if char_length(p_title) > 100 then
    raise exception 'title too long (max 100)';
  end if;
  if coalesce(btrim(p_body), '') = '' then
    raise exception 'kudo requires a body';
  end if;
  -- Body arrives as sanitized HTML; the client enforces 2000 visible characters,
  -- this raw-length guard only bounds markup-inflated payloads.
  if char_length(p_body) > 10000 then
    raise exception 'body too long';
  end if;
  if array_length(p_hashtag_ids,1) is null or array_length(p_hashtag_ids,1) > 5 then
    raise exception 'kudo requires 1..5 hashtags';
  end if;
  if coalesce(array_length(p_image_paths,1),0) > 5 then
    raise exception 'max 5 images';
  end if;

  insert into public.kudos (sender_id, recipient_id, title, body, is_anonymous, anonymous_name)
  values (auth.uid(), p_recipient_id, p_title, p_body, p_is_anonymous,
          case when p_is_anonymous then nullif(btrim(p_anonymous_name), '') end)
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

-- Default EXECUTE is granted to public roles on creation, but the old-signature
-- grant does not carry over; make the new signature's grant explicit.
grant execute on function public.create_kudo(uuid, text, text, boolean, bigint[], text[], jsonb, text) to authenticated;
