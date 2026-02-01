---
name: database-migration
description: Create and manage PostgreSQL database migrations with RLS policies for Supabase. Use when adding tables, columns, indexes, or modifying database schema. Ensures security compliance and proper migration patterns.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Supabase CLI, Docker for local testing
allowed-tools: Bash(supabase:*) Read Edit
---

# Database Migration Skill

Create secure, well-structured database migrations for Supabase PostgreSQL with Row Level Security.

## When to Use

- Adding new database tables
- Adding columns to existing tables
- Creating or modifying RLS policies
- Adding indexes or constraints
- Creating helper functions

## Migration Naming Convention

Format: `YYYYMMDDHHMMSS_00X_description.sql`

- `YYYYMMDDHHMMSS` - Timestamp when created
- `00X` - Sequential 3-digit number (001, 002, 003...)
- `description` - Snake_case description

Examples:
```
20260125021436_009_tasks_table.sql
20260126143000_010_add_due_date_to_tasks.sql
```

## Creating a Migration

```bash
# Create new migration file
supabase migration new description_of_change

# Edit the generated file in supabase/migrations/
```

## Migration Template

```sql
-- Migration: [Description]
-- Author: [Name]
-- Date: [YYYY-MM-DD]

-- ============================================
-- 1. CREATE TABLE
-- ============================================
CREATE TABLE public.my_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    household_id UUID NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 500),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 2. ENABLE RLS (REQUIRED)
-- ============================================
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- SELECT: Household members only
CREATE POLICY "Members can view household data"
    ON public.my_table FOR SELECT
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- INSERT: Household members only
CREATE POLICY "Members can insert household data"
    ON public.my_table FOR INSERT
    WITH CHECK (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- UPDATE: Household members only
CREATE POLICY "Members can update household data"
    ON public.my_table FOR UPDATE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- DELETE: Household members only
CREATE POLICY "Members can delete household data"
    ON public.my_table FOR DELETE
    USING (
        household_id IN (
            SELECT household_id FROM public.household_members
            WHERE user_id = auth.uid()
        )
    );

-- ============================================
-- 4. INDEXES
-- ============================================
CREATE INDEX idx_my_table_household_id ON public.my_table(household_id);
CREATE INDEX idx_my_table_created_by ON public.my_table(created_by);

-- ============================================
-- 5. TRIGGERS (if needed)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER my_table_updated_at
    BEFORE UPDATE ON public.my_table
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## RLS Policy Patterns

### Admin-Only Operations

```sql
CREATE POLICY "Admins can manage"
    ON public.my_table FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.household_members
            WHERE user_id = auth.uid()
            AND household_id = my_table.household_id
            AND role IN ('owner', 'admin')
        )
    );
```

### Owner-Only Operations

```sql
CREATE POLICY "Only owners can modify"
    ON public.my_table FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.households
            WHERE id = my_table.household_id
            AND owner_user_id = auth.uid()
        )
    );
```

### Using Helper Functions (Avoid Recursion)

```sql
-- Helper function (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION is_household_member(p_household_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.household_members
        WHERE user_id = auth.uid()
        AND household_id = p_household_id
    );
$$;

-- Use in policy
CREATE POLICY "Members access"
    ON public.my_table FOR SELECT
    USING (is_household_member(household_id));
```

## Testing Migrations

### Local Testing

```bash
# Reset database (applies all migrations)
supabase db reset

# Start local Supabase
supabase start
```

### RLS Verification Queries

```sql
-- Test: User can only see own household data
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM public.my_table;
-- Should return only rows from user's household

-- Test: Cross-household access blocked
SELECT * FROM public.my_table WHERE household_id = 'other-household-id';
-- Should return 0 rows
```

## Checklist Before Commit

- [ ] RLS enabled on new table (`ALTER TABLE ... ENABLE ROW LEVEL SECURITY`)
- [ ] SELECT policy enforces household membership
- [ ] INSERT policy validates target household
- [ ] UPDATE/DELETE policies appropriate for feature
- [ ] Indexes on foreign keys and frequently queried columns
- [ ] Constraints validate data (CHECK, NOT NULL, REFERENCES)
- [ ] Migration tested locally with `supabase db reset`
- [ ] Cross-household access tested and blocked
- [ ] Helper functions use SECURITY DEFINER if accessing RLS tables

## Existing Tables Reference

| Table | Purpose | RLS |
|-------|---------|-----|
| profiles | User profiles | Self-access |
| households | Household entities | Members |
| household_members | Membership join | Members |
| invites | Invitation tokens | Members/Admins |
| tasks | Task management | Members |

## Common Mistakes to Avoid

1. **Forgetting RLS** - Always enable and add policies
2. **Recursive policies** - Use SECURITY DEFINER helpers
3. **Missing indexes** - Add for foreign keys
4. **No constraints** - Validate data at DB level
5. **Hardcoded UUIDs** - Use `auth.uid()` and relationships
