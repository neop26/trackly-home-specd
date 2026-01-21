# Feature Specification: RLS Security Audit & Strengthening

**Feature Branch**: `001-audit-and-strengthen`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: "Audit and strengthen Row Level Security policies for households, household_members, and invites tables to ensure no cross-household data access"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Prevent Cross-Household Data Leaks (Priority: P1)

**As a** household member,  
**I want** my household data to be completely isolated from other households,  
**So that** no other users can access my private family information.

**Why this priority**: This is the foundational security requirement for the entire application. A single data leak would undermine user trust and violate privacy guarantees. This is MVP-critical and must be validated before adding any new features.

**Independent Test**: Create two households (HH-A, HH-B) with different users. Attempt to query HH-B's data while authenticated as HH-A member. All queries must return zero results or errors. This can be tested independently through direct SQL queries against the database with different user JWTs.

**Acceptance Scenarios**:

1. **Given** User A is a member of Household 1, **When** User A attempts to SELECT from households table for Household 2, **Then** query returns no results
2. **Given** User B is a member of Household 2, **When** User B attempts to SELECT from household_members for Household 1, **Then** query returns no results
3. **Given** User A is authenticated, **When** User A attempts to SELECT from invites for a household they don't belong to, **Then** query returns no results
4. **Given** User A is a member of Household 1, **When** User A attempts to SELECT profiles for users in Household 2 only, **Then** query returns no results

---

### User Story 2 - Prevent Unauthorized Membership Changes (Priority: P1)

**As a** system administrator,  
**I want** to ensure only authorized Edge Functions can modify household memberships,  
**So that** users cannot arbitrarily add themselves to households or manipulate roles.

**Why this priority**: Membership tampering could allow users to gain unauthorized access to households or escalate their privileges. This must be prevented at the database level.

**Independent Test**: Attempt direct INSERT/UPDATE/DELETE operations on household_members table as an authenticated user (bypassing Edge Functions). All write operations must fail with permission errors.

**Acceptance Scenarios**:

1. **Given** User A has no household, **When** User A attempts to INSERT themselves into Household 1 via direct SQL, **Then** query fails with RLS violation
2. **Given** User B is a member of Household 2, **When** User B attempts to UPDATE their role to 'admin' via direct SQL, **Then** query fails with RLS violation
3. **Given** User A is a member of Household 1, **When** User A attempts to DELETE their membership via direct SQL, **Then** query fails with RLS violation (only Edge Functions should handle this)

---

### User Story 3 - Validate Admin-Only Operations (Priority: P1)

**As an** admin or owner,  
**I want** only admins to create invites and manage roles,  
**So that** regular members cannot invite new users or modify permissions.

**Why this priority**: Role-based access control is implemented (Phase 1 complete), but RLS policies must enforce these constraints at the database level to prevent bypassing the UI layer.

**Independent Test**: Authenticate as a regular member (role='member') and attempt to INSERT into invites table or UPDATE roles in household_members table. Operations must fail with RLS violations.

**Acceptance Scenarios**:

1. **Given** User A is a member (not admin) of Household 1, **When** User A attempts to INSERT an invite for Household 1, **Then** query fails with RLS violation
2. **Given** User B is an admin of Household 2, **When** User B attempts to INSERT an invite for Household 2, **Then** query succeeds (defensive layer; Edge Functions normally handle this)
3. **Given** User A is a member of Household 1, **When** User A attempts to UPDATE another member's role, **Then** query fails with RLS violation

---

### User Story 4 - Prevent Helper Function Recursion (Priority: P2)

**As a** developer,  
**I want** helper functions like `is_household_member()` and `is_household_admin()` to be free from infinite recursion,  
**So that** RLS policies execute efficiently without stack depth errors.

**Why this priority**: While Phase 1 implementation already uses SECURITY DEFINER to prevent recursion (migration 003), this story validates the fix and ensures future modifications don't reintroduce the issue.

**Independent Test**: Execute complex nested queries involving multiple RLS policy checks (e.g., joining households → household_members → profiles). Monitor for stack depth errors or performance degradation. Can be tested independently with SQL EXPLAIN ANALYZE.

**Acceptance Scenarios**:

1. **Given** RLS policies are enabled on all tables, **When** a user queries households with nested joins to household_members and profiles, **Then** query completes without stack depth errors
2. **Given** `is_household_member()` function is called in RLS policy, **When** policy is evaluated, **Then** function executes with SECURITY DEFINER context (no recursion)
3. **Given** multiple RLS policies reference helper functions, **When** complex query is executed, **Then** query completes in under 500ms

---

### Edge Cases

- **Cross-household profile visibility**: User A in HH-1 attempts to read User B's profile (User B only in HH-2) → Must fail
- **Multi-household user**: If a user joins multiple households (future), can they access data from all households? → Out of scope for MVP (only single household per user)
- **Orphaned invites**: What if an invite exists for a deleted household? → Cascade delete handles this (ON DELETE CASCADE)
- **Last admin protection**: What if admin count drops to zero via direct SQL? → Trigger prevents this (migration 005)
- **Token hash brute force**: Can an attacker enumerate token_hash values? → Index exists but tokens are SHA-256 hashes (infeasible to reverse)
- **Expired token cleanup**: Do expired invites accumulate? → Out of scope for this audit (future cleanup job)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All tables MUST have RLS enabled (households, household_members, invites, profiles)
- **FR-002**: Users MUST only SELECT data from households they are members of
- **FR-003**: Users MUST only SELECT household_members rows for households they belong to
- **FR-004**: Users MUST only SELECT invites for households they are members of
- **FR-005**: Users MUST NOT directly INSERT/UPDATE/DELETE household_members (Edge Functions only)
- **FR-006**: Admin users MUST be validated before INSERT operations on invites table
- **FR-007**: Helper functions (`is_household_member`, `is_household_admin`) MUST execute without recursion
- **FR-008**: Profiles MUST be visible to authenticated users within the same household (migration 007)
- **FR-009**: Last admin protection trigger MUST prevent removing/demoting the last admin

### Security Requirements

- **SR-001**: Zero cross-household data access MUST be enforced at database level
- **SR-002**: RLS policies MUST use SECURITY DEFINER functions to avoid recursion
- **SR-003**: GRANT/REVOKE permissions MUST restrict helper function access to authenticated role only
- **SR-004**: INSERT/UPDATE/DELETE policies on household_members MUST NOT exist for authenticated users (service role only)
- **SR-005**: Invite creation via RLS MUST validate `is_household_admin(household_id)` returns true
- **SR-006**: Token hashing MUST prevent plaintext token exposure in database
- **SR-007**: Edge Functions MUST continue using service role for write operations (RLS bypass)

### Key Entities

**Existing Entities (No Schema Changes)**:

- **profiles** (user_id, display_name, timezone, last_login_at)
  - RLS: Users can SELECT own profile + profiles of users in same household
  - RLS: Users can INSERT/UPDATE own profile only

- **households** (id, name, owner_user_id, created_at)
  - RLS: Members can SELECT households they belong to
  - RLS: INSERT allowed if owner_user_id = auth.uid() (defensive; Edge Function normally handles)
  - RLS: UPDATE/DELETE allowed for admins (policy exists but Edge Functions recommended)

- **household_members** (id, user_id, household_id, role, joined_at)
  - RLS: Members can SELECT membership rows for their households
  - RLS: NO INSERT/UPDATE/DELETE policies for authenticated users (service role only)

- **invites** (id, household_id, token_hash, invited_email, expires_at, accepted_at, invited_by_user_id)
  - RLS: Members can SELECT invites for their household
  - RLS: INSERT allowed for admins only (defensive layer)
  - RLS: NO UPDATE/DELETE policies (service role only)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **Zero cross-household data leaks** - 100% of test queries attempting cross-household access return zero results
- **SC-002**: **RLS coverage** - All 4 core tables (profiles, households, household_members, invites) have RLS enabled and enforced
- **SC-003**: **Helper function performance** - All queries using RLS helper functions complete in under 500ms
- **SC-004**: **No recursion errors** - Zero "stack depth exceeded" errors during complex nested queries
- **SC-005**: **Admin enforcement** - 100% of non-admin invite creation attempts fail with RLS violations
- **SC-006**: **Write protection** - 100% of direct client INSERT/UPDATE/DELETE attempts on household_members fail
- **SC-007**: **Audit documentation** - All RLS policies documented with rationale and test queries in migration README
