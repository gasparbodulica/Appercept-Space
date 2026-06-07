-- ============================================================================
-- Appercept Space — Step 1 schema: real accounts (auth) + profiles
-- Run this in Supabase → SQL Editor → New query → paste → Run.
-- It is safe to run more than once.
-- ============================================================================

-- 1) Profiles table — extra info for each auth user (role, approval, etc.)
create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  name           text not null default '',
  email          text not null default '',
  role           text not null default 'viewer'  check (role in ('admin','member','viewer','client')),
  approved       boolean not null default false,
  client_company text,
  initials       text not null default '',
  color          text not null default '#6b7280',
  avatar_url     text,
  created_at     timestamptz not null default now()
);

-- 2) When a new user signs up, auto-create their profile row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, initials, color)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    new.email,
    upper(left(coalesce(new.raw_user_meta_data->>'name', new.email), 2)),
    '#1c75bc'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Row-Level Security — each user reads/updates only their own profile.
--    (Admin "read everyone" for the approval UI is handled later with a
--     security-definer function to avoid policy recursion.)
alter table public.profiles enable row level security;

drop policy if exists "read own or admin" on public.profiles;
drop policy if exists "update own or admin" on public.profiles;
drop policy if exists "read own profile" on public.profiles;
drop policy if exists "update own profile" on public.profiles;

create policy "read own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "update own profile" on public.profiles
  for update using (auth.uid() = id);

-- 4) OPTIONAL — make YOUR account the admin automatically.
--    After you sign up once with gaspar@appercept.net, run just this line:
-- update public.profiles set role = 'admin', approved = true where email = 'gaspar@appercept.net';
