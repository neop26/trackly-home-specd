-- 002_households_invites.sql

create extension if not exists pgcrypto;

-- households
create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.households enable row level security;

-- household members
create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'member'
  created_at timestamptz not null default now(),
  unique(household_id, user_id)
);

alter table public.household_members enable row level security;

-- invites (store only token hash; never raw token)
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  email text not null,
  token_hash text not null,
  expires_at timestamptz not null,
  invited_by_user_id uuid not null references auth.users(id) on delete cascade,
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists invites_token_hash_idx on public.invites(token_hash);
alter table public.invites enable row level security;

-- Helper: is user member of household
create or replace function public.is_household_member(hid uuid)
returns boolean as $$
  select exists(
    select 1 from public.household_members hm
    where hm.household_id = hid and hm.user_id = auth.uid()
  );
$$ language sql stable;

-- HOUSEHOLDS POLICIES
drop policy if exists "households_select_members" on public.households;
create policy "households_select_members"
on public.households for select
using (public.is_household_member(id));

drop policy if exists "households_insert_owner" on public.households;
create policy "households_insert_owner"
on public.households for insert
with check (auth.uid() = owner_user_id);

-- HOUSEHOLD_MEMBERS POLICIES
drop policy if exists "household_members_select_own_households" on public.household_members;
create policy "household_members_select_own_households"
on public.household_members for select
using (public.is_household_member(household_id));

drop policy if exists "household_members_insert_owner_self" on public.household_members;
create policy "household_members_insert_owner_self"
on public.household_members for insert
with check (auth.uid() = user_id);

-- INVITES POLICIES (members can view invites in their household - MVP)
drop policy if exists "invites_select_members" on public.invites;
create policy "invites_select_members"
on public.invites for select
using (public.is_household_member(household_id));
