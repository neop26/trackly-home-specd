# Tasks: RLS Security Audit & Strengthening

**Input**: Design documents from `/specs/001-audit-and-strengthen/`
**Feature**: Comprehensive Row Level Security audit for zero cross-household data leaks
**Tests**: No automated tests - SQL validation queries only

**Organization**: Tasks are grouped by user story to enable independent validation of each security concern.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different concerns, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- All tasks include exact file paths

---

## Phase 1: Setup (Test Infrastructure)

**Purpose**: Prepare SQL test suite and documentation structure

- [X] T001 Create test suite file `supabase/test_rls_audit.sql` with header and test runner instructions
- [X] T002 Document RLS audit process in `supabase/migrations/README.md` (add new section "RLS Policy Reference")
- [X] T003 [P] Create test helper function `create_test_household(user_uuid, household_name)` for setup/teardown in test_rls_audit.sql

---

## Phase 2: Foundational (Test Data Setup)

**Purpose**: Create test data for audit queries (2 households with different users)

**⚠️ CRITICAL**: Test data must be created before ANY validation queries can run

- [X] T004 Create test user A and household HH-1 (owner) in test_rls_audit.sql
- [X] T005 Create test user B and household HH-2 (owner) in test_rls_audit.sql
- [X] T006 [P] Add test user C as member of HH-1 in test_rls_audit.sql
- [X] T007 [P] Create test invite for HH-1 by user A in test_rls_audit.sql

**Checkpoint**: Test data ready - validation queries can now execute

---

## Phase 3: User Story 1 - Prevent Cross-Household Data Leaks (Priority: P1) 🎯 MVP

**Goal**: Validate zero cross-household data access across all tables

**Independent Test**: Run all US1 queries as user A (HH-1) attempting to access HH-2 data - expect 0 rows for all queries

### Validation Queries for User Story 1

- [X] T008 [P] [US1] Test cross-household SELECT on `households` table in test_rls_audit.sql (user A → HH-2 data)
- [X] T009 [P] [US1] Test cross-household SELECT on `household_members` table in test_rls_audit.sql (user A → HH-2 members)
- [X] T010 [P] [US1] Test cross-household SELECT on `invites` table in test_rls_audit.sql (user A → HH-2 invites)
- [X] T011 [P] [US1] Test cross-household SELECT on `profiles` table in test_rls_audit.sql (user A → user B profile)

### Documentation for User Story 1

- [X] T012 [US1] Document households RLS policies in `supabase/migrations/README.md` (SELECT policy with is_household_member check)
- [X] T013 [US1] Document household_members RLS policies in `supabase/migrations/README.md` (SELECT policy with is_household_member check)
- [X] T014 [US1] Document invites RLS policies in `supabase/migrations/README.md` (SELECT policy with is_household_member check)
- [X] T015 [US1] Document profiles RLS policies in `supabase/migrations/README.md` (self + household member visibility from migration 007)

**Checkpoint**: Cross-household isolation validated - zero leaks confirmed for all tables

---

## Phase 4: User Story 2 - Prevent Unauthorized Membership Changes (Priority: P1) 🎯 MVP

**Goal**: Validate authenticated users cannot directly modify household_members table

**Independent Test**: Run all US2 queries as authenticated user attempting INSERT/UPDATE/DELETE on household_members - expect RLS violations

### Validation Queries for User Story 2

- [X] T016 [P] [US2] Test direct INSERT on `household_members` blocked in test_rls_audit.sql (user attempts to add self to household)
- [X] T017 [P] [US2] Test direct UPDATE on `household_members` blocked in test_rls_audit.sql (user attempts to change own role)
- [X] T018 [P] [US2] Test direct DELETE on `household_members` blocked in test_rls_audit.sql (user attempts to remove self)

### Policy Verification for User Story 2

- [X] T019 [US2] Verify no INSERT policy exists on household_members for authenticated role (check migration 003)
- [X] T020 [US2] Verify no UPDATE policy exists on household_members for authenticated role (check migration 003)
- [X] T021 [US2] Verify no DELETE policy exists on household_members for authenticated role (check migration 003)

### Documentation for User Story 2

- [X] T022 [US2] Document write protection rationale in `supabase/migrations/README.md` (Edge Functions use service role only)

**Checkpoint**: Write protection validated - all client writes blocked

---

## Phase 5: User Story 3 - Validate Admin-Only Operations (Priority: P1) 🎯 MVP

**Goal**: Validate only admins can create invites via RLS policy (defensive layer)

**Independent Test**: Run US3 queries as non-admin member attempting to INSERT invites - expect RLS violation

### Validation Queries for User Story 3

- [X] T023 [US3] Test non-admin INSERT on `invites` blocked in test_rls_audit.sql (member user C attempts to create invite for HH-1)
- [X] T024 [US3] Test admin INSERT on `invites` succeeds in test_rls_audit.sql (owner user A creates invite for HH-1)

### Policy Verification for User Story 3

- [X] T025 [US3] Verify invites INSERT policy checks `is_household_admin(household_id)` (check migration 006)
- [X] T026 [US3] Verify invites INSERT policy validates `invited_by_user_id = auth.uid()` (check migration 006)

### Documentation for User Story 3

- [X] T027 [US3] Document admin-only invite creation policy in `supabase/migrations/README.md` with test queries

**Checkpoint**: Admin enforcement validated - non-admins blocked from creating invites

---

## Phase 6: User Story 4 - Prevent Helper Function Recursion (Priority: P2)

**Goal**: Validate helper functions execute efficiently without stack depth errors

**Independent Test**: Run complex nested queries using EXPLAIN ANALYZE - expect < 500ms execution and no recursion warnings

### Validation Queries for User Story 4

- [X] T028 [P] [US4] Test `is_household_member()` function with EXPLAIN ANALYZE in test_rls_audit.sql (complex query with joins)
- [X] T029 [P] [US4] Test `is_household_admin()` function with EXPLAIN ANALYZE in test_rls_audit.sql (complex query with joins)
- [X] T030 [P] [US4] Test nested RLS policy evaluation performance in test_rls_audit.sql (households → household_members → profiles join)

### Function Verification for User Story 4

- [X] T031 [US4] Verify `is_household_member()` uses SECURITY DEFINER in migration 003
- [X] T032 [US4] Verify `is_household_admin()` uses SECURITY DEFINER in migration 003/005
- [X] T033 [US4] Verify `count_household_admins()` is marked STABLE (check migration 005)
- [X] T034 [US4] Verify GRANT/REVOKE permissions restrict functions to authenticated role only (check migrations 003/005)

### Documentation for User Story 4

- [X] T035 [US4] Document helper function security model in `supabase/migrations/README.md` (SECURITY DEFINER rationale)
- [X] T036 [US4] Document performance expectations in `supabase/migrations/README.md` (< 500ms for complex queries)

**Checkpoint**: Helper functions validated - no recursion, efficient execution

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and documentation

- [X] T037 [P] Test last admin protection trigger in test_rls_audit.sql (attempt to remove/demote last admin → expect error)
- [X] T038 [P] Verify token_hash usage in invites table (check no plaintext tokens in migration 002)
- [X] T039 [P] Create RLS policy summary table in `supabase/migrations/README.md` (all tables with policies listed)
- [X] T040 Add "How to Re-Run RLS Audit" section to `supabase/migrations/README.md`
- [X] T041 Update `docs/PROJECT_TRACKER.md` to mark Phase 2 RLS audit tasks complete
- [X] T042 Create audit summary in `specs/001-audit-and-strengthen/AUDIT_FINDINGS.md` (optional artifact)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T003) - test data creation requires test suite file
- **User Stories (Phase 3-6)**: All depend on Foundational (Phase 2) test data
  - User stories can then proceed in parallel (different security concerns)
  - Or sequentially in priority order (P1 → P2)
- **Polish (Phase 7)**: Depends on all user stories being validated

### User Story Dependencies

- **User Story 1 (P1)**: Can start after test data setup - No dependencies on other stories
- **User Story 2 (P1)**: Can start after test data setup - Independent of US1
- **User Story 3 (P1)**: Can start after test data setup - Independent of US1/US2
- **User Story 4 (P2)**: Can start after test data setup - Independent of all others (performance focus)

### Within Each User Story

- Validation queries before documentation (confirm findings first)
- Policy verification before documentation (understand current state)
- Documentation captures validated findings

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel (T003 independent)
- All Foundational test data tasks marked [P] can run in parallel (T006, T007 independent)
- **All validation queries within each user story marked [P] can run in parallel**:
  - US1: T008, T009, T010, T011 (different tables)
  - US2: T016, T017, T018 (different operations)
  - US4: T028, T029, T030 (different functions)
- **Once test data is ready, ALL user stories (US1, US2, US3, US4) can be validated in parallel**
- Polish tasks marked [P] can run in parallel (T037, T038, T039 independent)

---

## Parallel Execution Example: User Story 1

```bash
# After test data is ready (Phase 2 complete), launch all US1 queries together:

# Terminal 1:
psql> -- T008: Test cross-household households SELECT
psql> SET LOCAL role TO 'authenticated';
psql> SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';
psql> SELECT * FROM public.households WHERE id = '<hh-2-uuid>';

# Terminal 2:
psql> -- T009: Test cross-household household_members SELECT
psql> SET LOCAL role TO 'authenticated';
psql> SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';
psql> SELECT * FROM public.household_members WHERE household_id = '<hh-2-uuid>';

# Terminal 3:
psql> -- T010: Test cross-household invites SELECT
psql> SET LOCAL role TO 'authenticated';
psql> SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';
psql> SELECT * FROM public.invites WHERE household_id = '<hh-2-uuid>';

# Terminal 4:
psql> -- T011: Test cross-household profiles SELECT
psql> SET LOCAL role TO 'authenticated';
psql> SET LOCAL request.jwt.claims.sub TO '<user-a-uuid>';
psql> SELECT * FROM public.profiles WHERE user_id = '<user-b-uuid>';

# All queries should return 0 rows - cross-household isolation confirmed
```

---

## Implementation Strategy

### Sequential Validation (Single Developer)

1. Complete Phase 1: Setup (test suite file + docs structure)
2. Complete Phase 2: Foundational (test data creation)
3. Validate User Story 1: Cross-household isolation → **CRITICAL**
4. Validate User Story 2: Write protection → **CRITICAL**
5. Validate User Story 3: Admin enforcement → **CRITICAL**
6. Validate User Story 4: Performance (can defer if time-constrained)
7. Complete Polish phase
8. **STOP and VALIDATE**: Review all findings before merging

### Parallel Validation (Multiple Developers or Terminals)

1. Developer A: Complete Setup + Foundational (everyone waits)
2. Once test data ready:
   - Developer A: User Story 1 (cross-household)
   - Developer B: User Story 2 (write protection)
   - Developer C: User Story 3 (admin enforcement)
   - Developer D: User Story 4 (performance)
3. All developers contribute to documentation
4. Merge findings together

### MVP Approach (Fastest Path to Security Validation)

**Focus on P1 stories only:**

1. Setup + Foundational → Test data ready
2. User Story 1: Cross-household isolation → **MUST PASS**
3. User Story 2: Write protection → **MUST PASS**
4. User Story 3: Admin enforcement → **MUST PASS**
5. Document findings → Merge
6. Defer User Story 4 (performance) to future optimization

---

## Success Metrics

- **Zero cross-household data leaks**: All US1 queries return 0 rows ✅
- **All write operations blocked**: All US2 queries fail with RLS violations ✅
- **Admin enforcement working**: All US3 non-admin attempts blocked ✅
- **No recursion errors**: All US4 queries complete without stack depth errors ✅
- **Documentation complete**: README.md has comprehensive RLS reference ✅
- **Test suite reusable**: test_rls_audit.sql can be re-run after future migrations ✅

---

## Notes

- **NO schema changes**: This is an audit only - existing migrations remain unchanged
- **NO application code changes**: Validation is database-level only
- Test queries use `SET LOCAL` to simulate different user contexts
- Document ALL findings even if policies are correct (validates security model)
- Commit test_rls_audit.sql and README.md updates together
- This audit can be re-run after any future migration that touches RLS policies

**Total Tasks**: 42 tasks across 7 phases
**Parallelizable**: 14 tasks marked [P] can run independently
**Critical Path**: Setup → Foundational → US1+US2+US3 (P1 stories) → Documentation
**Estimated Effort**: 6-8 hours (1 developer, sequential) or 3-4 hours (parallel validation)
