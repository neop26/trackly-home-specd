-- 004_lockdown_membership_and_owner.sql
--
-- Goals:
-- 1) Prevent any client-side inserts into households / household_members (Edge Functions only)
-- 2) Enforce exactly ONE owner per household (DB constraint, not just app logic)
-- 3) Constrain household_members.role to known values (extensible)

begin;

-- -------------------------------------------------------------------
-- 1) REMOVE CLIENT-SIDE INSERT PATHS (Edge Functions must own these)
-- -------------------------------------------------------------------
-- This policy allows any authed user to insert themselves into ANY household_id
-- (as long as user_id = auth.uid()). That is a security hole.
drop policy if exists "household_members_insert_owner_self" on public.household_members;

-- This policy allows authed users to insert into households directly.
-- We create households via Edge Functions using service role, so we don't need it.
drop policy if exists "households_insert_owner" on public.households;

-- NOTE:
-- RLS is still enabled on these tables; without an INSERT policy,
-- client-side inserts will be denied automatically.
-- Edge Functions using the service role key bypass RLS and will still work.

-- -------------------------------------------------------------------
-- 2) ROLE CONSTRAINT (prevents weird role values)
-- -------------------------------------------------------------------
alter table public.household_members
  drop constraint if exists household_members_role_check;

alter table public.household_members
  add constraint household_members_role_check
  check (role in ('owner', 'admin', 'member'));

-- -------------------------------------------------------------------
-- 3) ENFORCE SINGLE OWNER PER HOUSEHOLD (hard guarantee)
-- -------------------------------------------------------------------
-- Guard: if any household already has multiple owners, fail migration.
do $$
begin
  if exists (
    select 1
    from public.household_members
    where role = 'owner'
    group by household_id
    having count(*) > 1
  ) then
    raise exception
      'Migration blocked: multiple owners detected in household_members. Fix data first (one owner per household).';
  end if;
end $$;

-- Unique partial index = only one row where role='owner' per household_id.
create unique index if not exists household_members_one_owner_per_household
  on public.household_members (household_id)
  where role = 'owner';

commit;
