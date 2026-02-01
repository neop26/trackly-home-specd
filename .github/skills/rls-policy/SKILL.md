---
name: rls-policy
description: Create and manage PostgreSQL Row Level Security policies for Supabase. Use when adding data access rules, fixing security issues, or implementing household data isolation. Ensures zero cross-household data leaks.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Supabase CLI, PostgreSQL knowledge
allowed-tools: Bash(supabase:*) Read Edit
---

# RLS Policy Skill

Create and manage Row Level Security policies ensuring zero cross-household data leaks.

## When to Use

- Adding RLS to new tables
- Modifying existing policies
- Debugging access issues
- Implementing role-based access
- Security audits

## Core Principle

**Zero cross-household data leaks.** Users must only see data from their own household(s).

## RLS Basics

### Enable RLS (Required)

```sql
-- ALWAYS enable RLS on new tables
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;
```

### Policy Structure

```sql
CREATE POLICY "policy_name"
    ON public.table_name
    FOR {SELECT | INSERT | UPDATE | DELETE | ALL}
    [TO role_name]
    [USING (condition)]           -- For SELECT, UPDATE, DELETE
    [WITH CHECK (condition)];     -- For INSERT, UPDATE
```

## Common Policy Patterns

### Pattern 1: Household Members Only

Most common pattern - users can access data in their household.

```sql
-- SELECT: Members can view household data
CREATE POLICY "Members can view"
    ON public.tasks FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: Members can add to their household
CREATE POLICY "Members can insert"
    ON public.tasks FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Members can update in their household
CREATE POLICY "Members can update"
    ON public.tasks FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- DELETE: Members can delete from their household
CREATE POLICY "Members can delete"
    ON public.tasks FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );
```

### Pattern 2: Admin-Only Operations

For operations requiring admin privileges.

```sql
CREATE POLICY "Admins can manage"
    ON public.invites FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE user_id = auth.uid()
            AND household_id = invites.household_id
            AND role IN ('owner', 'admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE user_id = auth.uid()
            AND household_id = invites.household_id
            AND role IN ('owner', 'admin')
        )
    );
```

### Pattern 3: Owner-Only Operations

For sensitive operations only the owner should do.

```sql
CREATE POLICY "Owner can update household"
    ON public.households FOR UPDATE
    USING (owner_user_id = auth.uid());
```

### Pattern 4: Self-Access Only

For personal data like profiles.

```sql
CREATE POLICY "Users manage own profile"
    ON public.profiles FOR ALL
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());
```

### Pattern 5: Read-Only for Members

Members can view but not modify.

```sql
-- SELECT allowed
CREATE POLICY "Members can view"
    ON public.categories FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- Only admins can modify
CREATE POLICY "Admins can modify"
    ON public.categories FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE user_id = auth.uid()
            AND household_id = categories.household_id
            AND role IN ('owner', 'admin')
        )
    );
```

## Using Helper Functions

### Why Helper Functions?

- Avoid code duplication
- Prevent stack overflow from recursive policies
- Centralize access logic

### Creating a Helper Function

```sql
-- Helper: Check household membership
CREATE OR REPLACE FUNCTION is_household_member(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER  -- Bypasses RLS to avoid recursion
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM household_members
        WHERE user_id = auth.uid()
        AND household_id = p_household_id
    );
$$;

-- Helper: Check admin role
CREATE OR REPLACE FUNCTION is_household_admin(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM household_members
        WHERE user_id = auth.uid()
        AND household_id = p_household_id
        AND role IN ('owner', 'admin')
    );
$$;
```

### Using Helper in Policy

```sql
CREATE POLICY "Members can view"
    ON public.tasks FOR SELECT
    USING (is_household_member(household_id));

CREATE POLICY "Admins can manage"
    ON public.categories FOR ALL
    USING (is_household_admin(household_id))
    WITH CHECK (is_household_admin(household_id));
```

## Existing Table Policies

### profiles Table

| Operation | Policy |
|-----------|--------|
| SELECT | Own row only |
| INSERT | Own row only |
| UPDATE | Own row only |
| DELETE | Not allowed |

### households Table

| Operation | Policy |
|-----------|--------|
| SELECT | Members only |
| INSERT | Via edge function |
| UPDATE | Owner only |
| DELETE | Not allowed |

### household_members Table

| Operation | Policy |
|-----------|--------|
| SELECT | Members of household |
| INSERT | Via edge function |
| UPDATE | Admins only |
| DELETE | Not allowed |

### invites Table

| Operation | Policy |
|-----------|--------|
| SELECT | Members of household |
| INSERT | Admins only |
| UPDATE | Not allowed |
| DELETE | Not allowed |

### tasks Table

| Operation | Policy |
|-----------|--------|
| SELECT | Members only |
| INSERT | Members only |
| UPDATE | Members only |
| DELETE | Members only |

## Testing Policies

### Basic Test Setup

```sql
-- Simulate authenticated user
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
```

### Test SELECT Policy

```sql
-- Should return only user's household data
SELECT * FROM tasks;

-- Should return 0 rows (other household)
SELECT * FROM tasks WHERE household_id = 'other-household-uuid';
```

### Test INSERT Policy

```sql
-- Should succeed (own household)
INSERT INTO tasks (household_id, title, created_by)
VALUES ('own-household-uuid', 'Test', auth.uid());

-- Should fail (other household)
INSERT INTO tasks (household_id, title, created_by)
VALUES ('other-household-uuid', 'Test', auth.uid());
```

### Cross-Household Test

```sql
-- As User A, try to access Household B
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';

-- All should return 0 rows
SELECT * FROM households WHERE id = 'household-b-uuid';
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';
SELECT * FROM invites WHERE household_id = 'household-b-uuid';
```

## Common Mistakes

### 1. Forgetting to Enable RLS

```sql
-- WRONG: Table has no RLS
CREATE TABLE my_table (...);

-- CORRECT: Enable RLS
CREATE TABLE my_table (...);
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;
```

### 2. Missing WITH CHECK

```sql
-- WRONG: Only USING (allows UPDATE without validation)
CREATE POLICY "update"
    ON my_table FOR UPDATE
    USING (household_id = ...);

-- CORRECT: Include WITH CHECK for data changes
CREATE POLICY "update"
    ON my_table FOR UPDATE
    USING (household_id = ...)
    WITH CHECK (household_id = ...);
```

### 3. Recursive Policies

```sql
-- WRONG: Policy queries same table → stack overflow
CREATE POLICY "bad_policy"
    ON household_members FOR SELECT
    USING (
        user_id IN (
            SELECT user_id FROM household_members -- Recursion!
            WHERE household_id = ...
        )
    );

-- CORRECT: Use SECURITY DEFINER helper
CREATE POLICY "good_policy"
    ON household_members FOR SELECT
    USING (is_household_member(household_id));
```

### 4. Using auth.uid() Wrong

```sql
-- WRONG: Direct comparison without join
CREATE POLICY "wrong"
    ON tasks FOR SELECT
    USING (auth.uid() = household_id);  -- household_id is not user_id!

-- CORRECT: Check membership
CREATE POLICY "correct"
    ON tasks FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM household_members
            WHERE user_id = auth.uid()
        )
    );
```

## Debugging Policies

### View All Policies

```sql
SELECT tablename, policyname, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public';
```

### Check If RLS Enabled

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Test as Specific User

```sql
-- Set user context
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid';

-- Run queries and check results
SELECT * FROM my_table;
```

## Policy Checklist

```markdown
- [ ] RLS enabled on table
- [ ] SELECT policy defined
- [ ] INSERT policy defined (if needed)
- [ ] UPDATE policy defined (if needed)
- [ ] DELETE policy defined (if needed)
- [ ] USING clause for reads
- [ ] WITH CHECK clause for writes
- [ ] Cross-household access tested
- [ ] No recursive queries
- [ ] Helper functions use SECURITY DEFINER
```
