-- Dev-only seed: internal test users for the auto-login backdoor / E2E (issue #7).
-- Opt-in via env(SUPABASE_EXTRA_SEEDS) in supabase/config.toml — NOT loaded by default.
-- Creates admin-test, member-test, and member01..08 as REAL auth users (no password;
-- they log in via magiclink through GET /auto-login). Idempotent: safe to re-run.
--
-- The auth.users insert is GoTrue-version-sensitive (risk #3 in the plan): it needs the
-- required columns plus a matching auth.identities row so generateLink() can resolve the
-- user. The on_auth_user_created trigger auto-creates each public.profiles row.

do $$
declare
  rec   record;
  v_uid uuid;
begin
  for rec in
    select * from (values
      ('admin-test@sun-asterisk.com',  'Admin Test',   null),
      ('member-test@sun-asterisk.com', 'Member Test',  null),
      ('member01@sun-asterisk.com',    'Member One',   'Engineering'),
      ('member02@sun-asterisk.com',    'Member Two',   'Design'),
      ('member03@sun-asterisk.com',    'Member Three', 'Product'),
      ('member04@sun-asterisk.com',    'Member Four',  'Operations'),
      ('member05@sun-asterisk.com',    'Member Five',  'HR'),
      ('member06@sun-asterisk.com',    'Member Six',   'Engineering'),
      ('member07@sun-asterisk.com',    'Member Seven', 'Design'),
      ('member08@sun-asterisk.com',    'Member Eight', 'Product')
    ) as t(email, full_name, dept)
  loop
    -- Create the auth user only if it doesn't already exist (idempotent re-run).
    select id into v_uid from auth.users where email = rec.email;
    if v_uid is null then
      v_uid := gen_random_uuid();

      insert into auth.users (
        id, instance_id, aud, role, email, email_confirmed_at,
        encrypted_password, raw_app_meta_data, raw_user_meta_data,
        created_at, updated_at,
        -- These token columns are nullable with no default. GoTrue's Go scanner
        -- reads them as plain strings (not nullable), so a NULL here makes
        -- listUsers/generateLink fail with "Database error finding user". Seed ''.
        confirmation_token, recovery_token, email_change,
        email_change_token_new, email_change_token_current,
        reauthentication_token, phone_change, phone_change_token
      ) values (
        v_uid,
        '00000000-0000-0000-0000-000000000000',
        'authenticated',
        'authenticated',
        rec.email,
        now(),
        null,  -- magiclink needs no password
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', rec.full_name),  -- handle_new_user reads full_name
        now(),
        now(),
        '', '', '', '', '', '', '', ''
      );

      -- Matching identity row so GoTrue lookups / generateLink resolve the user.
      insert into auth.identities (
        id, user_id, provider, provider_id, identity_data,
        last_sign_in_at, created_at, updated_at
      ) values (
        gen_random_uuid(),
        v_uid,
        'email',
        v_uid::text,
        jsonb_build_object('sub', v_uid::text, 'email', rec.email),
        now(),
        now(),
        now()
      );
    end if;

    -- Department assignment (does NOT trip the role guard). Profile was created by the
    -- on_auth_user_created trigger; this is idempotent on re-run.
    if rec.dept is not null then
      update public.profiles p
         set department_id = d.id
        from public.departments d
       where p.email = rec.email and d.name = rec.dept;
    end if;
  end loop;
end $$;

-- Promote admin-test. trg_guard_profile_role raises 'only admins can change role' when
-- is_admin() is false — during db reset there is no auth session, so auth.uid() is null
-- and is_admin() is false. Disable the guard around the role change.
alter table public.profiles disable trigger trg_guard_profile_role;
update public.profiles set role = 'admin' where email = 'admin-test@sun-asterisk.com';
alter table public.profiles enable trigger trg_guard_profile_role;
