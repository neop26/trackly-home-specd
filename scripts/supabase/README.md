# Supabase Utility Scripts

This directory contains Supabase-related utility scripts for testing, data generation, and manual operations. **These are NOT migration files** - actual database migrations belong in `supabase/migrations/`.

## Script Categories

### Test Scripts

**Purpose**: Validate database security, performance, and functionality

- `test_rls_audit.sql` - Comprehensive RLS policy validation suite
  - Tests cross-household data isolation
  - Validates write protection on household_members
  - Verifies admin enforcement on invites
  - Checks helper function performance

- `test_phase1.sql` - Phase 1 validation tests (roles, policies, triggers)
  - Validates role-based access control
  - Tests last admin protection trigger
  - Verifies invite policies

- `test_performance_100_tasks.sql` - Performance testing script for T047
  - Creates 100 tasks with varied realistic titles
  - Mix of complete/incomplete tasks (20%/80%)
  - Includes cleanup script for post-testing
  - Usage: Replace household UUID and run in Supabase SQL Editor

### Data Generation Scripts

**Purpose**: Create test data, seed fixtures, or dummy data for development/testing

- Performance test scripts (see `test_performance_100_tasks.sql`)
- Future seed data scripts

### One-Off Utilities

**Purpose**: Manual queries, cleanup operations, investigation tools

- Ad-hoc data fixes
- Manual data transformations
- Debugging queries

## Usage

### Running Test Scripts

**Local Development** (via Supabase CLI):

```bash
# RLS audit tests
npx supabase db execute -f scripts/supabase/test_rls_audit.sql

# Phase 1 validation
npx supabase db execute -f scripts/supabase/test_phase1.sql

# Performance tests (requires household UUID replacement)
# 1. Edit test_performance_100_tasks.sql and replace 'YOUR-HOUSEHOLD-ID-HERE'
# 2. Run:
npx supabase db execute -f scripts/supabase/test_performance_100_tasks.sql
```

**Local Development** (via psql):

```bash
# Connect to local Supabase
psql postgresql://postgres:postgres@localhost:54322/postgres

# Run script
\i scripts/supabase/test_rls_audit.sql
```

**Production/Staging** (via Supabase Dashboard):

1. Navigate to SQL Editor in Supabase Dashboard
2. Copy script contents from `scripts/supabase/`
3. Paste into SQL Editor
4. Execute query

### Creating New Scripts

When creating new Supabase utility scripts:

1. **Determine script type**:
   - Migration? → `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
   - Test/utility? → `scripts/supabase/test_*.sql` or `scripts/supabase/util_*.sql`
   - Data generation? → `scripts/supabase/seed_*.sql`

2. **Follow naming conventions**:
   - Test scripts: `test_<feature>.sql`
   - Seed scripts: `seed_<dataset>.sql`
   - Utility scripts: `util_<purpose>.sql`

3. **Include documentation**:
   - Header comment explaining purpose
   - Usage instructions (parameters, prerequisites)
   - Cleanup instructions (if creates test data)

4. **Update this README**: Add entry under appropriate category

## Script Organization Rules (per Constitution v1.2.0)

**Migration scripts ONLY**: `supabase/migrations/` - Timestamped migration files only (e.g., `20260125021436_tasks_table.sql`)

**Everything else**: `scripts/supabase/`:
- Test scripts (RLS tests, performance tests, data validation)
- Data generation (seed data, dummy data, test fixtures)
- One-off utilities (manual queries, cleanup scripts, investigation tools)

**Rationale**: Separating migrations from utility scripts ensures migration directories remain clean and only contain schema changes. This prevents confusion during deployment and makes it clear which files are automatically applied by migration tools versus which require manual execution.

## Current Test Scripts

### test_rls_audit.sql

**Purpose**: Comprehensive RLS policy validation across all tables

**What it tests**:
- Cross-household data isolation (households, household_members, invites, profiles, tasks)
- Write protection on household_members (no direct client writes)
- Admin enforcement on invites (only admins can create)
- Helper function performance (no recursion errors)
- Task table RLS policies (member-level access)

**Usage**:
```bash
npx supabase db execute -f scripts/supabase/test_rls_audit.sql
```

**Notes**: Safe for dev environments. Creates and cleans up test data. Review before running in production.

### test_phase1.sql

**Purpose**: Validate Phase 1 RBAC implementation (roles, policies, triggers)

**What it tests**:
- Role enum and role column on household_members
- is_household_admin helper function
- protect_last_admin trigger
- Admin-only invite policies

**Usage**:
```bash
npx supabase db execute -f scripts/supabase/test_phase1.sql
```

### test_performance_100_tasks.sql

**Purpose**: Performance validation for T047 (100 tasks < 2 second render time)

**What it does**:
- Creates 100 tasks with varied realistic titles
- Distributes tasks 20% complete / 80% incomplete
- Provides cleanup script for post-testing

**Usage**:
1. Get household UUID: `SELECT id, name FROM public.households;`
2. Edit script and replace `'YOUR-HOUSEHOLD-ID-HERE'` with actual UUID
3. Run: `npx supabase db execute -f scripts/supabase/test_performance_100_tasks.sql`
4. Validate render time on /app page < 2 seconds
5. Run cleanup script if needed (uncomment DELETE portion)

**Notes**: Requires manual household UUID replacement before execution.

## Best Practices

1. **Always test locally first**: Run scripts on local Supabase before production
2. **Include cleanup scripts**: If creating test data, provide a way to clean it up
3. **Document parameters**: Use comments to explain required replacements (UUIDs, etc.)
4. **Use transactions**: Wrap destructive operations in transactions for safety
5. **Parameterize when possible**: Use variables/DO blocks instead of hardcoded values
6. **Version control everything**: All scripts should be committed to git
7. **Update documentation**: Keep this README current when adding new scripts

## Security Considerations

- **Never commit credentials**: No connection strings, passwords, or API keys
- **Review before production**: Double-check destructive operations
- **Use read-only for investigations**: Prefer SELECT queries for debugging
- **Limit scope**: Target specific households/users when testing RLS
- **Audit logging**: Consider adding logging for high-risk operations

## References

- Main project constitution: `.specify/memory/constitution.md` (v1.2.0)
- Migration documentation: `supabase/migrations/README.md`
- RLS policy reference: `supabase/migrations/README.md#rls-policy-reference`
