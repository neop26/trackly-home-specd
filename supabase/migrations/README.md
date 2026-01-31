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
8. `20260120091000_008_transfer_household_ownership.sql` - **Phase 1**: Transfer ownership function
9. `20260125021436_009_tasks_table.sql` - **Phase 5 (Planner MVP)**: Tasks table with RLS policies9. `20260126000000_010_task_lifecycle.sql` - **Phase 6 (Task Lifecycle Enhancement)**: Extended tasks table with notes, deleted_at, archived_at
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

### 010_task_lifecycle.sql (Phase 6 - Task Lifecycle Enhancement)

Extends tasks table for full lifecycle management:

**New Columns**:
- `notes` (TEXT, nullable): Optional multi-line task notes (max 5000 chars)
- `deleted_at` (TIMESTAMP WITH TIME ZONE, nullable): Soft-delete timestamp
- `archived_at` (TIMESTAMP WITH TIME ZONE, nullable): Archive timestamp

**Indexes**:
- `tasks_deleted_at_idx`: Efficient filtering of deleted tasks
- `tasks_archived_at_idx`: Efficient filtering of archived tasks
- `tasks_household_assigned_status_idx`: Composite index for filter combinations

**RLS Policies**: Inherits existing member-level access policies from Phase 5. New columns automatically protected by household isolation.

**Security Model**: All household members have equal access to edit, delete, and archive tasks. No admin restrictions on task operations.

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

### RLS Policy Tests

Run the RLS audit test suite to verify all policies and security guarantees:

```bash
# Option 1: Via psql (local Supabase)
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/supabase/test_rls_audit.sql

# Option 2: Via Supabase CLI
supabase db execute < scripts/supabase/test_rls_audit.sql

# Option 3: Copy sections into SQL Editor (Supabase Dashboard)
```

### Phase 1 Core Tests

Run Phase 1 validation tests (roles, policies, triggers):

```bash
# Execute Phase 1 test queries
npx supabase db execute -f scripts/supabase/test_phase1.sql
```

### Performance Tests

For performance validation (e.g., T047 - 100 tasks < 2 second render):

```bash
# Execute performance test script
npx supabase db execute -f scripts/supabase/test_performance_100_tasks.sql
```

**Note**: All test scripts are located in `scripts/supabase/` directory. The `migrations/` folder contains ONLY timestamped migration files.

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

---

## RLS Policy Reference

**Purpose**: This section documents all Row Level Security (RLS) policies across core tables to ensure zero cross-household data leaks and proper authorization enforcement.

**Last Audited**: 2026-01-21 (Feature 001-audit-and-strengthen)

### Security Model Overview

**Defense in Depth**: Security is enforced at three layers:
1. **Database (RLS)**: Policies prevent unauthorized data access
2. **Edge Functions**: Validate JWT and use service role for writes
3. **UI**: Role-based component visibility

**Least Privilege**: Users only access data from households they are members of.

**Helper Functions**: Use `SECURITY DEFINER` to avoid RLS recursion while maintaining security.

### Helper Functions

#### `is_household_member(p_household_id uuid)`

**Purpose**: Check if authenticated user is a member of the given household

**Source**: Migration 003 (RLS hardening)

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.is_household_member(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
  );
$$;
```

**Security**: `SECURITY DEFINER` bypasses RLS to avoid infinite recursion. Function is granted only to `authenticated` role.

**Test Query**:
```sql
-- Should return true for user's own household
SELECT public.is_household_member('<your-household-id>'::uuid);
```

---

#### `is_household_admin(p_household_id uuid)`

**Purpose**: Check if authenticated user has admin or owner role in the given household

**Source**: Migration 003, enhanced in Migration 005

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.is_household_admin(p_household_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.household_members hm
    WHERE hm.household_id = p_household_id
      AND hm.user_id = auth.uid()
      AND hm.role IN ('owner', 'admin')
  );
$$;
```

**Security**: `SECURITY DEFINER` bypasses RLS. Granted only to `authenticated` role.

**Test Query**:
```sql
-- Should return true only if user is admin/owner
SELECT public.is_household_admin('<household-id>'::uuid);
```

---

#### `count_household_admins(p_household_id uuid)`

**Purpose**: Count number of owners + admins in a household

**Source**: Migration 005 (last admin protection)

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.count_household_admins(p_household_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*)
  FROM public.household_members
  WHERE household_id = p_household_id
    AND role IN ('owner', 'admin');
$$;
```

**Usage**: Used by `protect_last_admin()` trigger to prevent removing the last admin.

---

### Table: `profiles`

**RLS Status**: ✅ Enabled

**Policies**:

| Policy Name | Operation | Rule | Source |
|-------------|-----------|------|--------|
| `profiles_select_household_members` | SELECT | Self OR household member | Migration 007 |
| `profiles_insert_self` | INSERT | `auth.uid() = user_id` | Migration 001 |
| `profiles_update_self` | UPDATE | `auth.uid() = user_id` | Migration 001 |

**Security Guarantees**:
- Users can always see their own profile
- Users can see profiles of other members in their household
- Users CANNOT see profiles of users in other households
- Users can only INSERT/UPDATE their own profile

**Test Query - Cross-Household Blocked**:
```sql
-- Should return 0 rows for users in different households
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';
SELECT * FROM public.profiles WHERE user_id = '<user-b-in-different-household>';
```

---

### Table: `households`

**RLS Status**: ✅ Enabled

**Policies**:

| Policy Name | Operation | Rule | Source |
|-------------|-----------|------|--------|
| `households_select_members` | SELECT | `is_household_member(id)` | Migration 003 |
| `households_insert_owner` | INSERT | `owner_user_id = auth.uid()` | Migration 003 |
| `households_update_owner` | UPDATE | `is_household_admin(id)` | Migration 003 |
| `households_delete_owner` | DELETE | `is_household_admin(id)` | Migration 003 |

**Security Guarantees**:
- Users can only SELECT households they are members of
- Users CANNOT see households they don't belong to
- INSERT enforces owner assignment (defensive; Edge Functions normally handle this)
- UPDATE/DELETE restricted to admins (Edge Functions recommended)

**Note**: In practice, Edge Functions using service role handle household creation. RLS policies are defensive layers.

**Test Query - Cross-Household Blocked**:
```sql
-- Should return 0 rows
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-in-hh1>';
SELECT * FROM public.households WHERE id = '<hh2-id>';
```

---

### Table: `household_members`

**RLS Status**: ✅ Enabled

**Policies**:

| Policy Name | Operation | Rule | Source |
|-------------|-----------|------|--------|
| `household_members_select_members` | SELECT | `is_household_member(household_id)` | Migration 003 |

**⚠️ CRITICAL**: **NO INSERT/UPDATE/DELETE policies** for `authenticated` role

**Security Guarantees**:
- Users can only SELECT members from their own household
- Users CANNOT directly INSERT/UPDATE/DELETE memberships
- All membership changes MUST go through Edge Functions using service role
- This prevents users from adding themselves to households or escalating roles

**Why No Write Policies**: Membership is a security-critical operation. Edge Functions (`create-household`, `accept-invite`, `manage-roles`) use service role to bypass RLS and perform validated writes. This prevents tampering.

**Test Query - Cross-Household Blocked**:
```sql
-- Should return 0 rows
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-in-hh1>';
SELECT * FROM public.household_members WHERE household_id = '<hh2-id>';
```

**Test Query - Write Blocked**:
```sql
-- Should fail with RLS violation
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-uuid>';
INSERT INTO public.household_members (user_id, household_id, role)
VALUES ('<user-uuid>', '<household-id>', 'admin');
-- Expected: ERROR - new row violates row-level security policy
```

---

### Table: `invites`

**RLS Status**: ✅ Enabled

**Policies**:

| Policy Name | Operation | Rule | Source |
|-------------|-----------|------|--------|
| `invites_select_members` | SELECT | `is_household_member(household_id)` | Migration 003 |
| `invites_insert_admin` | INSERT | `is_household_admin(household_id)` AND `invited_by_user_id = auth.uid()` | Migration 003, 006 |

**⚠️ CRITICAL**: **NO UPDATE/DELETE policies** for `authenticated` role

**Security Guarantees**:
- Users can only SELECT invites for their own household
- Only admins can INSERT invites (validated by `is_household_admin`)
- Users CANNOT UPDATE/DELETE invites directly
- Invite acceptance goes through `accept-invite` Edge Function

**Note**: INSERT policy is a defensive layer. In practice, `create-invite` Edge Function (service role) handles invite creation with additional validation (token hashing, expiry).

**Test Query - Non-Admin Blocked**:
```sql
-- Should fail for non-admin users
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<member-user-uuid>'; -- not admin
INSERT INTO public.invites (household_id, token_hash, invited_email, expires_at, invited_by_user_id)
VALUES ('<household-id>', 'test-hash', 'test@example.com', now() + interval '7 days', '<member-user-uuid>');
-- Expected: ERROR - new row violates row-level security policy
```

---

### Triggers

#### `protect_last_admin_trigger`

**Purpose**: Prevent removing or demoting the last admin in a household

**Source**: Migration 005

**Implementation**:
```sql
CREATE OR REPLACE FUNCTION public.protect_last_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  old_is_admin boolean;
  admin_count bigint;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    old_is_admin := (OLD.role IN ('owner', 'admin'));
    IF old_is_admin AND NEW.role = 'member' THEN
      admin_count := public.count_household_admins(OLD.household_id);
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot demote the last admin in household';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    old_is_admin := (OLD.role IN ('owner', 'admin'));
    IF old_is_admin THEN
      admin_count := public.count_household_admins(OLD.household_id);
      IF admin_count <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last admin from household';
      END IF;
    END IF;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER protect_last_admin_trigger
  BEFORE UPDATE OR DELETE ON public.household_members
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_last_admin();
```

**Test Query**:
```sql
-- Attempt to demote last admin (should fail)
UPDATE public.household_members
SET role = 'member'
WHERE user_id = '<last-admin-user>' AND household_id = '<household-id>';
-- Expected: ERROR - Cannot demote the last admin in household
```

---

### Table: `tasks`

**RLS Status**: ✅ Enabled

**Policies**:

| Policy Name | Operation | Rule | Source |
|-------------|-----------|------|--------|
| `tasks_select_members` | SELECT | `is_household_member(household_id)` | Migration 009 |
| `tasks_insert_members` | INSERT | `is_household_member(household_id)` | Migration 009 |
| `tasks_update_members` | UPDATE | `is_household_member(household_id)` | Migration 009 |
| `tasks_delete_members` | DELETE | `is_household_member(household_id)` | Migration 009 |

**Security Guarantees**:
- Users can only access tasks from their own household
- Users CANNOT see or modify tasks from other households
- All members have equal access (no admin restrictions on tasks)
- Household isolation enforced via `EXISTS` clause on `household_members`

**Performance**: Uses `tasks_household_id_idx` index for efficient household filtering

**Test Query - Cross-Household Blocked**:
```sql
-- Should return 0 rows
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-in-hh1>';
SELECT * FROM public.tasks WHERE household_id = '<hh2-id>';
```

**Test Query - Write Blocked**:
```sql
-- Should fail with RLS violation
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-in-hh1>';
INSERT INTO public.tasks (household_id, title, status)
VALUES ('<hh2-id>', 'Cross-household task', 'incomplete');
-- Expected: ERROR - new row violates row-level security policy
```

---

### How to Re-Run RLS Audit

Run the comprehensive test suite to validate all RLS policies:

```bash
# Option 1: Via psql (local Supabase)
psql postgresql://postgres:postgres@localhost:54322/postgres -f scripts/supabase/test_rls_audit.sql

# Option 2: Via Supabase CLI
supabase db execute < scripts/supabase/test_rls_audit.sql

# Option 3: Copy sections into SQL Editor (Supabase Dashboard)
```

The test suite validates:
- ✅ Cross-household data isolation (households, household_members, invites, profiles)
- ✅ Write protection on household_members (no direct client writes)
- ✅ Admin enforcement on invites (only admins can create)
- ✅ Helper function performance (no recursion errors)

**⚠️ Important**: Test suite creates and cleans up test data. Safe for dev environments. Review before running in production.

---

### Known Limitations

1. **Multi-Household Support**: Current RLS assumes single household per user (MVP scope). Future support for multiple households will require policy updates.

2. **Invite Cleanup**: Expired invites accumulate in database. Future migration should add cleanup job or trigger.

3. **Performance**: Helper functions (`is_household_member`, `is_household_admin`) are called on every row. For large datasets (>10k households), consider materialized views or caching.

4. **Audit Logging**: RLS policies do not log unauthorized access attempts. Consider adding audit triggers for security monitoring.

---

### Security Best Practices

1. **Always Use Helper Functions**: Never query `household_members` directly in RLS policies to avoid recursion
2. **Service Role for Writes**: Critical operations (membership, invites) should use Edge Functions with service role
3. **Regular Audits**: Re-run test scripts from `scripts/supabase/` after any migration that touches RLS policies
4. **Test Cross-Household Access**: Always validate that users cannot access data from other households
5. **Document Changes**: Update this README when adding/modifying RLS policies

---

**For detailed test queries and validation scenarios, see**: `scripts/supabase/test_rls_audit.sql`

-- Test comment to trigger Supabase deployment workflow
