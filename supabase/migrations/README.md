# Supabase Migrations

## Migration Order

Migrations are applied in timestamp order:

1. `20260106203424_001_profiles.sql` - User profiles table
2. `20260107010607_002_households_invites.sql` - Households, members, and invites
3. `20260111000100_003_rls_stack_depth_fix.sql` - RLS optimization
4. `20260112000100_004_lockdown_membership_and_owner.sql` - Membership constraints
5. `20260113000100_005_admin_role_and_helpers.sql` - **Phase 1**: Role enum, helper functions
6. `20260113000200_006_admin_only_invite_policies.sql` - **Phase 1**: Admin-only RLS policies
7. `20260120090000_007_profiles_household_select.sql` - **Phase 1**: Household member profile visibility

## Phase 1 Migrations (Roles & Invites)

### 005_admin_role_and_helpers.sql

Creates role-based access control foundation:

- `role_enum` type (owner, admin, member)
- `role` column on `household_members` (defaults to member)
- `is_household_admin(user_id, household_id)` helper function
- Trigger to prevent removing last admin from household

### 006_admin_only_invite_policies.sql

Enforces admin-only operations:

- Invites: Only admins can create (`INSERT` on `invites`)
- Roles: Only admins can modify roles (`UPDATE` on `household_members`)

### 007_profiles_household_select.sql

Expands profile visibility:

- Allows authenticated household members to read `display_name` for other members in the same household
- Keeps self-select access intact

## Applying Migrations

### Local Development

```bash
# Start Supabase locally
npx supabase start

# Apply all migrations
npx supabase db reset

# Or apply new migrations only
npx supabase migration up
```

### Production

```bash
# Link to your project
npx supabase link --project-ref <your-project-ref>

# Push migrations
npx supabase db push
```

## Testing Migrations

Run the test queries in `test_phase1.sql` to verify Phase 1 core checks (roles, policies, triggers):

```bash
# Execute test queries
npx supabase db execute -f supabase/migrations/test_phase1.sql
```

To validate the new household profile visibility from 007, run an additional check in the SQL editor:

```sql
-- Replace with a member in the same household
select display_name
from public.profiles
where user_id = '<other-member-uuid>'::uuid;
```

## Rolling Back

If you need to rollback Phase 1 migrations:

```sql
-- Drop trigger
DROP TRIGGER IF EXISTS prevent_last_admin_removal ON household_members;
DROP FUNCTION IF EXISTS prevent_last_admin_removal();

-- Drop helper function
DROP FUNCTION IF EXISTS is_household_admin(uuid, uuid);

-- Remove role column
ALTER TABLE household_members DROP COLUMN IF EXISTS role;

-- Drop enum
DROP TYPE IF EXISTS role_enum;

-- Restore previous RLS policies (manually, from 004 migration)
```

## Edge Functions

After applying migrations, deploy updated edge functions:

```bash
# Deploy all functions
npx supabase functions deploy

# Or deploy individually
npx supabase functions deploy create-invite
npx supabase functions deploy manage-roles
npx supabase functions deploy accept-invite
```

## Verifying Deployment

1. Check migrations are applied:

   ```bash
   npx supabase migration list
   ```

2. Verify edge functions are deployed:

   ```bash
   npx supabase functions list
   ```

3. Test role-based access in the UI by:
   - Creating a household (you become owner)
   - Inviting a partner (they become member)
   - Promoting member to admin via ManageRolesCard
   - Verifying members cannot invite or manage roles
