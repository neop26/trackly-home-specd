-- 007_profiles_household_select.sql
-- Allow household members to read display_name for other members in the same household.

begin;

-- Keep existing self-select policy; add household-member visibility.
drop policy if exists profiles_select_household_members on public.profiles;
create policy profiles_select_household_members
on public.profiles
for select
to authenticated
using (
  auth.uid() = user_id
  or exists (
    select 1
    from public.household_members hm
    where hm.user_id = profiles.user_id
      and public.is_household_member(hm.household_id)
  )
);

commit;
