-- Application identities are deliberately separate from domain People.
-- auth.users remains the source of authentication identity; this migration only
-- adds application-owned profile and authorization data keyed by its UUID.

create table public.identity_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identity_profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 120)
);

comment on table public.identity_profiles is 'Application profile for an auth.users identity. It is not a domain Person.';
create table public.identity_roles (
  key text primary key,
  description text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint identity_roles_key_format check (key ~ '^[a-z][a-z0-9_]{1,62}$')
);
create table public.identity_role_assignments (
  user_id uuid not null references auth.users (id) on delete cascade,
  role_key text not null references public.identity_roles (key) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users (id) on delete set null,
  primary key (user_id, role_key)
);
create index identity_role_assignments_role_key_user_id_idx on public.identity_role_assignments (role_key, user_id);

create or replace function public.set_identity_updated_at() returns trigger language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
create trigger identity_profiles_set_updated_at before update on public.identity_profiles for each row execute function public.set_identity_updated_at();
create trigger identity_roles_set_updated_at before update on public.identity_roles for each row execute function public.set_identity_updated_at();

insert into public.identity_roles (key, description) values
  ('member', 'Default authenticated application user.'),
  ('app_admin', 'Can manage application identity role assignments through approved RPCs.')
on conflict (key) do update set description = excluded.description;

create or replace function public.create_identity_profile_for_auth_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare candidate_name text;
begin
  candidate_name := nullif(left(trim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 120), '');
  insert into public.identity_profiles (id, display_name) values (new.id, candidate_name) on conflict (id) do nothing;
  insert into public.identity_role_assignments (user_id, role_key) values (new.id, 'member') on conflict (user_id, role_key) do nothing;
  return new;
end;
$$;
create trigger auth_user_created_identity_profile after insert on auth.users for each row execute function public.create_identity_profile_for_auth_user();

insert into public.identity_profiles (id, display_name)
select id, nullif(left(trim(coalesce(raw_user_meta_data ->> 'full_name', raw_user_meta_data ->> 'name', '')), 120), '') from auth.users
on conflict (id) do nothing;
insert into public.identity_role_assignments (user_id, role_key)
select id, 'member' from public.identity_profiles on conflict (user_id, role_key) do nothing;

create or replace function public.is_identity_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.identity_role_assignments where user_id = auth.uid() and role_key = 'app_admin');
$$;

create or replace function public.assign_identity_role(target_user_id uuid, target_role_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_identity_admin() then raise exception 'Identity administrator role required' using errcode = '42501'; end if;
  insert into public.identity_role_assignments (user_id, role_key, assigned_by) values (target_user_id, target_role_key, auth.uid()) on conflict (user_id, role_key) do nothing;
end;
$$;

create or replace function public.revoke_identity_role(target_user_id uuid, target_role_key text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_identity_admin() then raise exception 'Identity administrator role required' using errcode = '42501'; end if;
  if target_user_id = auth.uid() and target_role_key = 'app_admin' then
    raise exception 'An administrator cannot revoke their own app_admin role' using errcode = '22023';
  end if;
  if target_role_key = 'app_admin' and (select count(*) from public.identity_role_assignments where role_key = 'app_admin') <= 1 then
    raise exception 'At least one app_admin must remain assigned' using errcode = '22023';
  end if;
  delete from public.identity_role_assignments where user_id = target_user_id and role_key = target_role_key;
end;
$$;

-- These functions are the only administrator read path. They expose email only
-- to existing app_admins and never make auth.users queryable from the browser.
create or replace function public.list_identity_accounts(search text default null)
returns table (id uuid, email text, display_name text, created_at timestamptz, roles text[])
language sql stable security definer set search_path = '' as $$
  select u.id, u.email, p.display_name, u.created_at,
    coalesce(array_agg(a.role_key order by a.role_key) filter (where a.role_key is not null), '{}')
  from auth.users u
  join public.identity_profiles p on p.id = u.id
  left join public.identity_role_assignments a on a.user_id = u.id
  where public.is_identity_admin()
    and (search is null or trim(search) = '' or u.email ilike '%' || trim(search) || '%' or p.display_name ilike '%' || trim(search) || '%')
  group by u.id, u.email, p.display_name, u.created_at
  order by u.created_at desc;
$$;

create or replace function public.get_identity_account(target_user_id uuid)
returns table (id uuid, email text, display_name text, created_at timestamptz, roles text[])
language sql stable security definer set search_path = '' as $$
  select * from public.list_identity_accounts() where id = target_user_id;
$$;

create or replace function public.list_identity_roles()
returns table (key text, description text)
language sql stable security definer set search_path = '' as $$
  select key, description from public.identity_roles
  where public.is_identity_admin()
  order by key;
$$;

alter table public.identity_profiles enable row level security;
alter table public.identity_roles enable row level security;
alter table public.identity_role_assignments enable row level security;
create policy "identity_profiles_select_own" on public.identity_profiles for select to authenticated using ((select auth.uid()) = id);
create policy "identity_profiles_update_own" on public.identity_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "identity_roles_select_assigned" on public.identity_roles for select to authenticated using (exists (select 1 from public.identity_role_assignments a where a.user_id = (select auth.uid()) and a.role_key = identity_roles.key));
create policy "identity_role_assignments_select_own" on public.identity_role_assignments for select to authenticated using ((select auth.uid()) = user_id);
revoke all on public.identity_profiles, public.identity_roles, public.identity_role_assignments from anon;
revoke insert, delete on public.identity_profiles from authenticated;
revoke insert, update, delete on public.identity_roles, public.identity_role_assignments from authenticated;
grant select, update (display_name) on public.identity_profiles to authenticated;
grant select on public.identity_roles, public.identity_role_assignments to authenticated;
grant execute on function public.is_identity_admin(), public.assign_identity_role(uuid, text), public.revoke_identity_role(uuid, text), public.list_identity_accounts(text), public.get_identity_account(uuid), public.list_identity_roles() to authenticated;
revoke all on function public.set_identity_updated_at(), public.create_identity_profile_for_auth_user(), public.is_identity_admin(), public.assign_identity_role(uuid, text), public.revoke_identity_role(uuid, text), public.list_identity_accounts(text), public.get_identity_account(uuid), public.list_identity_roles() from public;
