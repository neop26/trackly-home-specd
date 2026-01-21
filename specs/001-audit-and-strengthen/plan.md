# Implementation Plan: RLS Security Audit & Strengthening

**Branch**: `001-audit-and-strengthen` | **Date**: 2026-01-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-audit-and-strengthen/spec.md`

## Summary

Conduct comprehensive audit of Row Level Security (RLS) policies across all core tables (profiles, households, household_members, invites) to validate zero cross-household data leaks and ensure admin-only operations are enforced at the database level. This is a **security validation effort with no schema changes**—only testing, documentation, and potential policy refinements.

**Technical Approach**: Execute SQL test queries against existing RLS policies using different user contexts, document findings, and create test suite for ongoing validation.

## Technical Context

**Language/Version**: SQL (PostgreSQL 15.x via Supabase)  
**Primary Dependencies**: None (database-level testing)  
**Storage**: PostgreSQL with RLS (existing migrations 002-008)  
**Testing**: Direct SQL queries with SET LOCAL role/jwt context  
**Target Platform**: Supabase PostgreSQL database  
**Project Type**: Database security audit  
**Performance Goals**: Helper functions < 500ms, no recursion errors  
**Constraints**: Zero cross-household data access, admin-only writes  
**Scale/Scope**: 4 core tables (profiles, households, household_members, invites)

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ | Entire audit focuses on security validation |
| II. Vertical Slices | ✅ | Each user story independently testable (cross-household, write protection, admin enforcement, performance) |
| III. Minimal Changes | ✅ | NO schema changes, NO new tables—audit only validates existing policies |
| IV. Document As You Go | ✅ | Will document all findings in supabase/migrations/README.md with test queries |
| V. Test Before Deploy | ✅ | Test suite will be created and executed locally before merging |

## Project Structure

### Documentation (this feature)

```text
specs/001-audit-and-strengthen/
├── plan.md              # This file
├── spec.md              # Feature specification
└── tasks.md             # Task list (created by /speckit.tasks)
```

### Source Code (Trackly Home structure)

```text
supabase/
├── migrations/          # Existing SQL migrations (002-008)
│   ├── 20260107010607_002_households_invites.sql
│   ├── 20260111000100_003_rls_stack_depth_fix.sql
│   ├── 20260113000100_005_admin_role_and_helpers.sql
│   ├── 20260113000200_006_admin_only_invite_policies.sql
│   ├── 20260120090000_007_profiles_household_select.sql
│   └── README.md        # Will document RLS policies + test queries
└── test_rls_audit.sql   # New: Comprehensive RLS test suite (artifact)
```

**Structure Decision**: No new application code—only SQL test queries and documentation updates.

## Database Design *(if feature involves data changes)*

**No schema changes for this audit.** Validating existing tables:

### Tables Under Audit

| Table | RLS Status | Migration | Policies to Validate |
|-------|------------|-----------|---------------------|
| profiles | ✅ Enabled | 001, 007 | Self + household member visibility |
| households | ✅ Enabled | 002, 003 | Member-only SELECT, admin UPDATE/DELETE |
| household_members | ✅ Enabled | 002, 003 | Member SELECT, NO client writes |
| invites | ✅ Enabled | 002, 003, 006 | Member SELECT, admin INSERT only |

### RLS Policies to Validate

| Table | Operation | Expected Policy | Test |
|-------|-----------|----------------|------|
| profiles | SELECT | Self OR household member | Cross-household profile blocked |
| households | SELECT | is_household_member(id) | Cross-household SELECT → 0 rows |
| households | INSERT | owner_user_id = auth.uid() | Defensive layer (Edge Functions primary) |
| households | UPDATE/DELETE | is_household_admin(id) | Non-admin UPDATE blocked |
| household_members | SELECT | is_household_member(household_id) | Cross-household members → 0 rows |
| household_members | INSERT/UPDATE/DELETE | **NO POLICIES** | Client writes blocked |
| invites | SELECT | is_household_member(household_id) | Cross-household invites → 0 rows |
| invites | INSERT | is_household_admin(household_id) | Non-admin INSERT blocked |
| invites | UPDATE/DELETE | **NO POLICIES** | Client writes blocked |

### Helper Functions to Validate

| Function | Purpose | Security Concern |
|----------|---------|-----------------|
| is_household_member(uuid) | Check membership | Must use SECURITY DEFINER to avoid recursion |
| is_household_admin(uuid) | Check admin role | Must use SECURITY DEFINER to avoid recursion |
| count_household_admins(uuid) | Count admins | Used by last admin trigger |
| protect_last_admin() | Trigger function | Prevent removing last admin |

## Edge Functions *(if new server-side logic)*

No Edge Function changes required. Audit validates that existing functions (`create-household`, `create-invite`, `accept-invite`, `manage-roles`) use service role correctly and bypass RLS as intended.

## Frontend Components *(if UI changes)*

No frontend changes required. This is a database-level security audit.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations—this audit adheres to all constitution principles.

## Security Considerations

- [x] New tables have RLS enabled — **N/A: No new tables**
- [x] Edge functions validate JWT (verify_jwt = true) — **Validate existing functions**
- [x] Admin-only features check role — **Validate RLS policies enforce this**
- [x] No service role key exposure — **Validate Edge Functions use service role correctly**
- [x] Tokens hashed before storage — **Validate invites.token_hash usage**
- [x] CORS configured correctly — **Out of scope for this audit**
- [x] No PII in logs — **Will review in separate Phase 2 task**

### Specific Audit Checks

1. **Cross-Household Isolation**: Verify User A in HH-1 cannot SELECT data from HH-2
2. **Write Protection**: Verify authenticated users cannot INSERT/UPDATE/DELETE household_members directly
3. **Admin Enforcement**: Verify non-admin users cannot INSERT invites
4. **Helper Function Security**: Verify functions use SECURITY DEFINER and don't recurse
5. **Last Admin Protection**: Verify trigger prevents removing last admin
6. **Profile Visibility**: Verify users can only see profiles within their household

## Testing Plan

### Manual Testing (SQL Queries)

Create comprehensive test suite in `supabase/test_rls_audit.sql` with the following scenarios:

#### Test 1: Cross-Household Data Isolation

```sql
-- Setup: Create two test households with different users
-- Execute as User A (HH-1):
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';

-- Attempt to SELECT HH-2 data:
SELECT * FROM public.households WHERE id = '<hh-2-uuid>';
-- EXPECT: 0 rows

SELECT * FROM public.household_members WHERE household_id = '<hh-2-uuid>';
-- EXPECT: 0 rows

SELECT * FROM public.invites WHERE household_id = '<hh-2-uuid>';
-- EXPECT: 0 rows
```

#### Test 2: Write Protection on household_members

```sql
-- Execute as authenticated user (non-service role):
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-uuid>';

-- Attempt to INSERT membership:
INSERT INTO public.household_members (user_id, household_id, role)
VALUES ('<user-uuid>', '<household-uuid>', 'admin');
-- EXPECT: RLS violation error

-- Attempt to UPDATE own role:
UPDATE public.household_members SET role = 'admin'
WHERE user_id = '<user-uuid>';
-- EXPECT: RLS violation error (no UPDATE policy)
```

#### Test 3: Admin-Only Invite Creation

```sql
-- Execute as non-admin member:
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<member-user-uuid>';

-- Attempt to INSERT invite:
INSERT INTO public.invites (household_id, token_hash, invited_email, expires_at, invited_by_user_id)
VALUES ('<household-uuid>', 'hash123', 'test@example.com', now() + interval '7 days', '<member-user-uuid>');
-- EXPECT: RLS violation (is_household_admin check fails)
```

#### Test 4: Helper Function Performance

```sql
-- Test complex query with multiple RLS checks:
EXPLAIN ANALYZE
SELECT h.*, hm.role, p.display_name
FROM public.households h
JOIN public.household_members hm ON h.id = hm.household_id
JOIN public.profiles p ON hm.user_id = p.user_id
WHERE public.is_household_member(h.id);
-- EXPECT: Query completes in < 500ms, no recursion warnings
```

#### Test 5: Profile Visibility

```sql
-- Execute as User A (HH-1):
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';

-- Attempt to SELECT User B's profile (User B only in HH-2):
SELECT * FROM public.profiles WHERE user_id = '<user-b-uuid>';
-- EXPECT: 0 rows (unless User B is also in HH-1)
```

### RLS Verification Checklist

- [ ] Cross-household households SELECT blocked
- [ ] Cross-household household_members SELECT blocked
- [ ] Cross-household invites SELECT blocked
- [ ] Cross-household profiles SELECT blocked
- [ ] Direct INSERT on household_members blocked
- [ ] Direct UPDATE on household_members blocked
- [ ] Direct DELETE on household_members blocked
- [ ] Non-admin INSERT on invites blocked
- [ ] Helper functions use SECURITY DEFINER
- [ ] No "stack depth exceeded" errors
- [ ] Query performance < 500ms
- [ ] Last admin trigger prevents removal

### Documentation Deliverable

Update `supabase/migrations/README.md` with:

1. **RLS Policy Summary Table**: All policies with purpose and test queries
2. **Test Query Reference**: Copy of test_rls_audit.sql queries
3. **Known Limitations**: Any edge cases or assumptions
4. **Ongoing Testing**: How to re-run audit after future migrations

## Artifacts

1. **supabase/test_rls_audit.sql**: Comprehensive SQL test suite
2. **supabase/migrations/README.md**: Updated with RLS documentation
3. **Audit Report** (optional): Summary of findings for PROJECT_TRACKER.md

## Success Metrics

- Zero cross-household data leaks in all test scenarios
- All write operations blocked for authenticated users (non-service role)
- All admin-only operations enforced at RLS level
- All helper functions execute without recursion errors
- Documentation complete with test queries for future validation
