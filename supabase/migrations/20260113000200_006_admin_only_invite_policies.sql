-- 006_admin_only_invite_policies.sql
--
-- Goals:
-- 1) Update RLS policies so only admins can create invites (via Edge Functions)
-- 2) Keep select policies for invites open to household members (they can see pending invites)
-- 3) Note: Edge Functions use service role and bypass RLS, but we document intent here

begin;

-- -------------------------------------------------------------------
-- INVITES: Only admins should create invites
-- -------------------------------------------------------------------
-- In practice, Edge Functions (using service role) bypass RLS.
-- However, we add a policy constraint here as a defensive layer.
-- This ensures if someone tries to insert via client (which should fail anyway),
-- they must be an admin.

drop policy if exists "invites_insert_admins_only" on public.invites;
create policy "invites_insert_admins_only"
on public.invites for insert
with check (public.is_household_admin(household_id));

-- Keep the existing select policy for household members
-- (members can view invites to see who was invited)
-- This was already defined in 002_households_invites.sql as "invites_select_members"

commit;
