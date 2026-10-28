-- =====================================================================
-- Team CRM — database setup
-- Run ONCE in Supabase: SQL Editor -> New query -> paste all -> Run.
-- It is safe to run again (it will not delete data).
-- =====================================================================

-- 1) PEOPLE ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text not null,
  full_name  text,
  role       text not null default 'member' check (role in ('admin', 'member')),
  created_at timestamptz not null default now()
);

-- Every new login automatically gets a profile. The very first user becomes admin.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles) then 'member' else 'admin' end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users that already exist (e.g. you created yourself before running this script).
-- The oldest one becomes admin if there are no profiles yet.
insert into public.profiles (id, email, full_name, role)
select u.id,
       u.email,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       case when row_number() over (order by u.created_at) = 1
                 and not exists (select 1 from public.profiles)
            then 'admin' else 'member' end
from auth.users u
where u.email is not null
on conflict (id) do nothing;

-- Helper checks used by the security rules below
create or replace function public.is_member()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid());
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

revoke all on function public.is_member() from public, anon;
revoke all on function public.is_admin()  from public, anon;
grant execute on function public.is_member() to authenticated;
grant execute on function public.is_admin()  to authenticated;

-- 2) CLIENTS -----------------------------------------------------------
-- To add a column later: see README ("How to add a new column").
create table if not exists public.clients (
  id                 uuid primary key default gen_random_uuid(),
  company_name       text not null default '',
  contact_person     text,
  phone              text,
  email              text,
  city               text,
  status             text not null default 'Lead',
  owner_id           uuid references public.profiles(id) on delete set null,
  last_contact_date  date,
  next_followup_date date,
  deal_value         numeric(14,2),
  notes              text,
  created_by         uuid references public.profiles(id) on delete set null,
  updated_by         uuid references public.profiles(id) on delete set null,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists clients_created_at_idx on public.clients (created_at desc);
create index if not exists clients_status_idx     on public.clients (status);
create index if not exists clients_owner_idx      on public.clients (owner_id);
create index if not exists clients_followup_idx   on public.clients (next_followup_date);

-- Fills "created by / updated by / updated at" automatically, and stops anyone faking them.
create or replace function public.clients_audit()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.created_at := now();
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  new.updated_by := auth.uid();
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists clients_audit_trg on public.clients;
create trigger clients_audit_trg
  before insert or update on public.clients
  for each row execute function public.clients_audit();

-- 3) SECURITY (Row Level Security) -------------------------------------
alter table public.profiles enable row level security;
alter table public.clients  enable row level security;

drop policy if exists "members read profiles"  on public.profiles;
drop policy if exists "admins update profiles" on public.profiles;
drop policy if exists "members full access"    on public.clients;

-- Team members can see the team list (needed for the Owner dropdown).
create policy "members read profiles" on public.profiles
  for select to authenticated using (public.is_member());

-- Only admins can change roles / names. Adding and removing users is done by the
-- Admin page (server side), never directly from the browser.
create policy "admins update profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Only people who have a profile (= team members) can read or write clients.
create policy "members full access" on public.clients
  for all to authenticated using (public.is_member()) with check (public.is_member());

-- Anonymous (not logged in) visitors get nothing.
revoke all on public.clients  from anon;
revoke all on public.profiles from anon;

-- 4) LIVE UPDATES ------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'clients'
  ) then
    alter publication supabase_realtime add table public.clients;
  end if;
end $$;

-- Done. To make someone else an admin later:
--   update public.profiles set role = 'admin' where email = 'person@yourcompany.com';
