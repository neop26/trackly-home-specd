-- 008_transfer_household_ownership.sql
--
-- Goal:
-- Allow transferring household ownership atomically.
--
-- Why:
-- `household_members` enforces a single owner per household via a unique partial index.
-- Promoting a second member to 'owner' without demoting the current owner will fail.

begin;

create or replace function public.transfer_household_ownership(
  p_household_id uuid,
  p_new_owner_user_id uuid
)
returns void
language plpgsql
as $$
declare
  member_exists boolean;
begin
  -- Ensure the target user is already a member of the household.
  select exists(
    select 1
    from public.household_members hm
    where hm.household_id = p_household_id
      and hm.user_id = p_new_owner_user_id
  ) into member_exists;

  if not member_exists then
    raise exception 'Target user is not a household member';
  end if;

  -- Demote the existing owner (if any) to admin.
  update public.household_members
    set role = 'admin'
  where household_id = p_household_id
    and role = 'owner'
    and user_id <> p_new_owner_user_id;

  -- Update the household owner pointer.
  update public.households
    set owner_user_id = p_new_owner_user_id
  where id = p_household_id;

  if not found then
    raise exception 'Household not found';
  end if;

  -- Promote the target member to owner.
  update public.household_members
    set role = 'owner'
  where household_id = p_household_id
    and user_id = p_new_owner_user_id;
end;
$$;

-- Only allow service_role to call this function.
revoke execute on function public.transfer_household_ownership(uuid, uuid) from public;
revoke execute on function public.transfer_household_ownership(uuid, uuid) from anon;
revoke execute on function public.transfer_household_ownership(uuid, uuid) from authenticated;
grant execute on function public.transfer_household_ownership(uuid, uuid) to service_role;

commit;
