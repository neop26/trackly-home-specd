-- Phase 1 Migration Test Queries
-- Run these manually in Supabase SQL editor to verify migrations

-- 1. Verify role enum exists
SELECT unnest(enum_range(NULL::role_enum));

-- 2. Check household_members table has role column
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'household_members' AND column_name = 'role';

-- 3. Verify is_household_admin function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_name = 'is_household_admin';

-- 4. Test is_household_admin function (replace with real UUIDs)
-- SELECT is_household_admin('00000000-0000-0000-0000-000000000000'::uuid, '00000000-0000-0000-0000-000000000000'::uuid);

-- 5. Check RLS policies on household_invites
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'invites';

-- 6. Check RLS policies on household_members
SELECT tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'household_members';

-- 7. Verify last_admin_removal trigger exists
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name = 'prevent_last_admin_removal';
