-- 005_admin_role_and_helpers.sql
--
-- Goals:
-- 1) Extend role constraint to include 'admin' (owner/admin/member)
-- 2) Add is_household_admin helper to check if user is owner OR admin
-- 3) Add trigger to prevent removing the last admin from a household
-- 4) Add helper to count admins in a household

begin;

-- -------------------------------------------------------------------
-- 1) EXTEND ROLE CONSTRAINT TO INCLUDE 'admin'
-- -------------------------------------------------------------------
alter table public.household_members
  drop constraint if exists household_members_role_check;

alter table public.household_members
  add constraint household_members_role_check
  check (role in ('owner', 'admin', 'member'));

-- -------------------------------------------------------------------
-- 2) HELPER: is_household_admin (owner or admin)
-- -------------------------------------------------------------------
-- Returns true if the calling user is owner or admin in the given household
create or replace function public.is_household_admin(p_household_id uuid)
returns boolean as $$
  select exists(
    select 1 from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = auth.uid()
      and hm.role in ('owner', 'admin')
  );
$$ language sql stable security definer;

-- -------------------------------------------------------------------
-- 3) HELPER: count_household_admins
-- -------------------------------------------------------------------
-- Returns the number of owner + admin members in a household
create or replace function public.count_household_admins(p_household_id uuid)
returns bigint as $$
  select count(*)
  from public.household_members
  where household_id = p_household_id
    and role in ('owner', 'admin');
$$ language sql stable;

-- -------------------------------------------------------------------
-- 4) TRIGGER: prevent removing the last admin
-- -------------------------------------------------------------------
-- This function checks before UPDATE or DELETE:
-- - If the member being modified is an admin/owner
-- - And they are the LAST admin in the household
-- - Then block the operation
create or replace function public.protect_last_admin()
returns trigger as $$
declare
  old_is_admin boolean;
  admin_count bigint;
begin
  -- For UPDATE: check if we're demoting an admin to member
  if TG_OP = 'UPDATE' then
    old_is_admin := (OLD.role in ('owner', 'admin'));
    if old_is_admin and NEW.role = 'member' then
      admin_count := public.count_household_admins(OLD.household_id);
      if admin_count <= 1 then
        raise exception 'Cannot demote the last admin in household';
      end if;
    end if;
    return NEW;
  end if;

  -- For DELETE: check if we're removing an admin
  if TG_OP = 'DELETE' then
    old_is_admin := (OLD.role in ('owner', 'admin'));
    if old_is_admin then
      admin_count := public.count_household_admins(OLD.household_id);
      if admin_count <= 1 then
        raise exception 'Cannot remove the last admin from household';
      end if;
    end if;
    return OLD;
  end if;

  return NULL;
end;
$$ language plpgsql;

drop trigger if exists protect_last_admin_trigger on public.household_members;
create trigger protect_last_admin_trigger
  before update or delete on public.household_members
  for each row
  execute function public.protect_last_admin();

commit;
