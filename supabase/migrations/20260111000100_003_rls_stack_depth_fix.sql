-- =====================================================================
-- 003: RLS hardening + remove recursion ("stack depth exceeded")
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- Helper: is user a member of the household?
-- SECURITY DEFINER so it bypasses RLS and avoids recursion.
-- ---------------------------------------------------------------------
drop policy if exists households_select_members on public.households;
drop policy if exists household_members_select_own_households on public.household_members;
drop policy if exists invites_select_members on public.invites;
drop function if exists public.is_household_member(uuid);
create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
  );
$$;

revoke all on function public.is_household_member(uuid) from public;
grant execute on function public.is_household_member(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Helper: is user an "admin" of the household?
-- For now: owner_user_id OR member role in ('owner','admin')
-- (You can later formalize admin roles via CHECK constraint / enum.)
-- ---------------------------------------------------------------------
create or replace function public.is_household_admin(p_household_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1
      from public.households h
      where h.id = p_household_id
        and h.owner_user_id = auth.uid()
    )
    or exists (
      select 1
      from public.household_members hm
      where hm.household_id = p_household_id
        and hm.user_id = auth.uid()
        and hm.role in ('owner','admin')
    );
$$;

revoke all on function public.is_household_admin(uuid) from public;
grant execute on function public.is_household_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Ensure RLS is enabled
-- ---------------------------------------------------------------------
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.invites enable row level security;

-- ---------------------------------------------------------------------
-- HOUSEHOLDS policies
-- ---------------------------------------------------------------------
drop policy if exists households_select_members on public.households;
drop policy if exists households_insert_owner on public.households;
drop policy if exists households_update_owner on public.households;
drop policy if exists households_delete_owner on public.households;

create policy households_select_members
on public.households
for select
to authenticated
using (public.is_household_member(id));

-- If you ever insert households directly from the client, this is safe.
-- (In your app you’re using an Edge Function with service role anyway.)
create policy households_insert_owner
on public.households
for insert
to authenticated
with check (owner_user_id = auth.uid());

-- Optional: allow updating household name by admins/owner
create policy households_update_owner
on public.households
for update
to authenticated
using (public.is_household_admin(id))
with check (public.is_household_admin(id));

-- Optional: allow delete by owner/admin (you may want owner-only later)
create policy households_delete_owner
on public.households
for delete
to authenticated
using (public.is_household_admin(id));

-- ---------------------------------------------------------------------
-- HOUSEHOLD_MEMBERS policies
-- IMPORTANT: don’t allow arbitrary client-side joins.
-- You should add members via Edge Functions (service role) only.
-- ---------------------------------------------------------------------
drop policy if exists household_members_select_own_households on public.household_members;
drop policy if exists household_members_insert_owner_self on public.household_members;
drop policy if exists household_members_insert_self_any_household on public.household_members;
drop policy if exists household_members_update_any on public.household_members;
drop policy if exists household_members_delete_any on public.household_members;

-- Members can see membership rows for households they belong to
create policy household_members_select_members
on public.household_members
for select
to authenticated
using (public.is_household_member(household_id));

-- NOTE:
-- No INSERT/UPDATE/DELETE policies on household_members for authenticated users.
-- That means: clients cannot arbitrarily add themselves to households.
-- Your Edge Functions (using service role) still can.

-- ---------------------------------------------------------------------
-- INVITES policies
-- Similar: invites should be created/accepted via Edge Functions.
-- ---------------------------------------------------------------------
drop policy if exists invites_select_members on public.invites;
drop policy if exists invites_insert_members on public.invites;
drop policy if exists invites_insert_admin on public.invites;
drop policy if exists invites_update_any on public.invites;

create policy invites_select_members
on public.invites
for select
to authenticated
using (public.is_household_member(household_id));

-- If you ever insert invites from the client directly, enforce admin + inviter id.
create policy invites_insert_admin
on public.invites
for insert
to authenticated
with check (
  public.is_household_admin(household_id)
  and invited_by_user_id = auth.uid()
);

-- NOTE:
-- No UPDATE policy on invites for authenticated users.
-- Acceptance should happen via Edge Function (service role) to prevent tampering.

commit;
