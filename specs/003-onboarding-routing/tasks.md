# Tasks: Onboarding State Machine & Routing

**Feature**: Feature 003 - Onboarding State Machine & Routing  
**Branch**: `003-onboarding-routing`  
**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [quickstart.md](./quickstart.md)

**Organization**: Tasks organized by user story for independent implementation and testing

**Tests**: Not requested in specification - using manual testing only

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Exact file paths included in descriptions

---

## Phase 1: Setup (Project Infrastructure)

**Purpose**: Basic project setup and dependency verification

- [X] T001 Verify React Router v6 installed in apps/web/package.json
- [X] T002 Create apps/web/src/hooks/ directory for new hook
- [X] T003 [P] Review existing routing code: apps/web/src/ProtectedRoute.tsx
- [X] T004 [P] Review existing routing code: apps/web/src/screens/AppShell.tsx
- [X] T005 [P] Review existing routing code: apps/web/src/router/AppRouter.tsx

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: No foundational work needed - using existing infrastructure

**⚠️ SKIP**: All required infrastructure exists:
- ✅ profiles.onboarding_status column (migration 001)
- ✅ Edge Functions (create-household, accept-invite)
- ✅ RLS policies on profiles table
- ✅ Supabase client configured

**Checkpoint**: Foundation ready - proceed directly to User Story 1

---

## Phase 3: User Story 1 - Onboarding State Machine (Priority: P0) 🎯 MVP

**Goal**: Update Edge Functions to set onboarding_status when users create/join households, enabling automatic routing based on user state

**Independent Test**: Create test user, verify onboarding_status updates to 'in_household' after household creation or invite acceptance. Check database directly with SQL query.

### Implementation for User Story 1

- [X] T006 [US1] Add onboarding_status update to supabase/functions/create-household/index.ts (after household creation, before response)
- [X] T007 [US1] Add onboarding_status update to supabase/functions/accept-invite/index.ts (after member insertion, before response)
- [X] T008 [US1] Test create-household locally: verify onboarding_status = 'in_household' after creation
- [X] T009 [US1] Test accept-invite locally: verify onboarding_status = 'in_household' after join
- [X] T010 [US1] Test edge case: invalid user_id should not crash Edge Function
- [X] T011 [US1] Verify Edge Function logs show no errors (check Supabase local logs)

**Checkpoint**: User Story 1 complete - onboarding_status updates work correctly

---

## Phase 4: User Story 2 - Centralized Route Guard (Priority: P0)

**Goal**: Create single source of truth for all routing decisions by consolidating logic from AppShell and ProtectedRoute into one hook

**Independent Test**: Review code - all routing logic should be in useRouteGuard hook. Test all navigation paths manually to ensure no infinite loops.

### Implementation for User Story 2

- [X] T012 [US2] Create apps/web/src/hooks/useRouteGuard.ts with routing state machine logic
- [X] T013 [US2] Add auth state check to useRouteGuard (authenticated vs not)
- [X] T014 [US2] Add onboarding_status fetch to useRouteGuard (query profiles table)
- [X] T015 [US2] Add household membership check to useRouteGuard (query household_members table)
- [X] T016 [US2] Implement redirect decision logic in useRouteGuard (return target route or null)
- [X] T017 [US2] Add loading state tracking to useRouteGuard (isLoading: boolean)
- [X] T018 [US2] Add JSDoc documentation to useRouteGuard explaining all routing rules
- [X] T019 [US2] Update apps/web/src/router/AppRouter.tsx to use useRouteGuard hook
- [X] T020 [US2] Remove household redirect logic from apps/web/src/screens/AppShell.tsx (keep banner flags)
- [X] T021 [US2] Simplify apps/web/src/ProtectedRoute.tsx to only check auth (remove onboarding logic)
- [X] T022 [US2] Test unauthenticated access to /app redirects to /login?next=/app
- [X] T023 [US2] Test authenticated user with no household visiting /app redirects to /setup
- [X] T024 [US2] Test authenticated user with household visiting /setup redirects to /app
- [X] T025 [US2] Test ?next= parameter preserved through login flow
- [X] T026 [US2] Test /join?token=xyz allows user to stay on join page (not redirected away)
- [X] T027 [US2] Test no infinite redirect loops in any navigation scenario
- [X] T028 [US2] Verify all routing logic consolidated into ≤2 files (useRouteGuard + AppRouter)

**Checkpoint**: User Story 2 complete - routing logic centralized, all flows working

---

## Phase 5: User Story 3 - Sign-Out from Any Page (Priority: P0)

**Goal**: Add sign-out button to all pages so users can always log out, improving security and user experience

**Independent Test**: Navigate to /login, /setup, /join, /app while authenticated. Verify sign-out button appears and works on all 4 pages.

### Implementation for User Story 3

- [ ] T029 [P] [US3] Add sign-out button to apps/web/src/components/AppHeader.tsx (visible when authenticated)
- [ ] T030 [P] [US3] Add sign-out button to apps/web/src/screens/LoginPage.tsx (show if already logged in)
- [ ] T031 [P] [US3] Add sign-out button to apps/web/src/screens/SetupPage.tsx
- [ ] T032 [P] [US3] Add sign-out button to apps/web/src/screens/JoinPage.tsx
- [ ] T033 [US3] Implement handleSignOut function using supabase.auth.signOut()
- [ ] T034 [US3] Add redirect to /login after successful sign-out
- [ ] T035 [US3] Test sign-out from /login page clears session and stays on /login
- [ ] T036 [US3] Test sign-out from /setup page clears session and redirects to /login
- [ ] T037 [US3] Test sign-out from /join page clears session and redirects to /login
- [ ] T038 [US3] Test sign-out from /app page clears session and redirects to /login
- [ ] T039 [US3] Test multi-tab behavior: sign out in one tab, other tab detects and redirects
- [ ] T040 [US3] Test after sign-out, cannot access /app (redirected back to /login)

**Checkpoint**: User Story 3 complete - sign-out works on all pages

---

## Phase 6: User Story 4 - Loading States (Priority: P2)

**Goal**: Add skeleton loaders and loading indicators to prevent blank screens and content flashing during navigation

**Independent Test**: Throttle network in DevTools to "Slow 3G". Navigate through app and verify loading states appear instead of blank screens.

### Implementation for User Story 4

- [ ] T041 [P] [US4] Add loading spinner component in apps/web/src/components/LoadingSpinner.tsx
- [ ] T042 [P] [US4] Create skeleton layout component in apps/web/src/components/SkeletonLayout.tsx
- [ ] T043 [US4] Update useRouteGuard to expose isLoading state
- [ ] T044 [US4] Show loading spinner in AppRouter while useRouteGuard.isLoading is true
- [ ] T045 [US4] Show skeleton layout in AppShell while household data is loading
- [ ] T046 [US4] Add loading state to accept invite button in JoinPage
- [ ] T047 [US4] Test loading indicator appears when routing guard checks auth/household (network throttled)
- [ ] T048 [US4] Test skeleton layout appears on /app before household data loads
- [ ] T049 [US4] Test no content flash during navigation (measure with DevTools Performance)
- [ ] T050 [US4] Verify loading states < 200ms perceived delay (console.time measurements)

**Checkpoint**: User Story 4 complete - all loading states polished

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final touches and validation

- [ ] T051 [P] Run `npm run build` in apps/web - verify no errors
- [ ] T052 [P] Run `npm run lint` in apps/web - verify no warnings
- [ ] T053 Test all 16 manual test scenarios from quickstart.md
- [ ] T054 Verify no console errors in browser DevTools during full user flows
- [ ] T055 Test edge case: corrupted onboarding_status defaults to 'new' and shows /setup
- [ ] T056 Test edge case: expired invite token shows error and redirects to /app
- [ ] T057 Test edge case: network failure during redirect shows error message
- [ ] T058 [P] Update docs/PROJECT_TRACKER.md: mark Phase 3 tasks 3.1, 3.2, 3.5, 3.7, 3.8 complete
- [ ] T059 [P] Add implementation notes to specs/003-onboarding-routing/plan.md (completion date, any deviations)
- [ ] T060 Final smoke test: new user flow (sign in → setup → dashboard)
- [ ] T061 Final smoke test: invite flow (sign in → join → dashboard)
- [ ] T062 Final smoke test: sign out from each page (/login, /setup, /join, /app)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: SKIPPED - all infrastructure exists
- **User Story 1 (Phase 3)**: Can start immediately after Setup
- **User Story 2 (Phase 4)**: Can start after User Story 1 complete (needs onboarding_status updates working)
- **User Story 3 (Phase 5)**: Independent - can start after Setup (parallel with US1/US2)
- **User Story 4 (Phase 6)**: Depends on User Story 2 (needs useRouteGuard hook)
- **Polish (Phase 7)**: Depends on all P0 user stories (US1, US2, US3). US4 is P2 (optional).

### User Story Dependencies

- **User Story 1 (P0)**: Independent - only modifies Edge Functions
- **User Story 2 (P0)**: Depends on User Story 1 (routing logic needs onboarding_status to be set)
- **User Story 3 (P0)**: Independent - only adds sign-out buttons
- **User Story 4 (P2)**: Depends on User Story 2 (needs useRouteGuard.isLoading state)

### Within Each User Story

**User Story 1** (Sequential):
1. T006-T007: Add updates to Edge Functions
2. T008-T011: Test and verify updates work

**User Story 2** (Sequential with one parallel set):
1. T012-T018: Create and implement useRouteGuard hook
2. T019-T021: Update components to use hook (can be done in parallel if careful)
3. T022-T028: Test all routing scenarios

**User Story 3** (Highly Parallel):
1. T029-T032: Add sign-out buttons to components (all parallel - different files)
2. T033-T034: Implement sign-out logic
3. T035-T040: Test sign-out on all pages

**User Story 4** (Some parallel):
1. T041-T042: Create loading components (parallel - different files)
2. T043-T046: Add loading states to existing components
3. T047-T050: Test loading behavior

### Parallel Opportunities

**Phase 1 (Setup)**: T003, T004, T005 can run in parallel (reading different files)

**User Story 3**: T029, T030, T031, T032 can ALL run in parallel (different files, independent changes)

**User Story 4**: T041, T042 can run in parallel (different component files)

**Phase 7 (Polish)**: T051, T052, T058, T059 can run in parallel (different operations)

---

## Parallel Example: User Story 3

```bash
# All sign-out button additions can happen simultaneously:
Task T029: "Add sign-out button to apps/web/src/components/AppHeader.tsx"
Task T030: "Add sign-out button to apps/web/src/screens/LoginPage.tsx"
Task T031: "Add sign-out button to apps/web/src/screens/SetupPage.tsx"
Task T032: "Add sign-out button to apps/web/src/screens/JoinPage.tsx"

# These 4 tasks touch different files with no conflicts
# After all 4 complete, implement handleSignOut logic (T033)
# Then test on all 4 pages (T035-T040)
```

---

## Implementation Strategy

### MVP First (P0 User Stories Only)

1. Complete Phase 1: Setup (T001-T005)
2. Complete Phase 3: User Story 1 - Onboarding State Machine (T006-T011) ✅
3. Complete Phase 4: User Story 2 - Centralized Route Guard (T012-T028) ✅
4. Complete Phase 5: User Story 3 - Sign-Out (T029-T040) ✅
5. Complete Phase 7: Polish (T051-T062, skip US4 tests) ✅
6. **STOP and VALIDATE**: Test all P0 features, verify Success Criteria
7. **MVP COMPLETE** - Ready to merge and deploy

**User Story 4 (P2)** is optional polish - can defer to post-MVP

### Incremental Delivery

1. **Checkpoint 1**: After User Story 1 → Edge Functions set status correctly
2. **Checkpoint 2**: After User Story 2 → Routing centralized, no infinite loops
3. **Checkpoint 3**: After User Story 3 → Sign-out works everywhere
4. **Checkpoint 4**: After Polish → All 16 test scenarios pass, no errors
5. Each checkpoint is independently testable and validates progress

### Recommended Order

**Day 1**: Setup + User Story 1 (Edge Function updates)
- T001-T011 (11 tasks)
- Deliverable: onboarding_status updates work

**Day 2**: User Story 2 (Centralized routing)
- T012-T028 (17 tasks)
- Deliverable: All routing logic in one place, flows working

**Day 3**: User Story 3 (Sign-out)
- T029-T040 (12 tasks)
- Deliverable: Sign-out works on all pages

**Day 4**: Polish + Validation
- T051-T062 (12 tasks, skip T041-T050 if deferring US4)
- Deliverable: Production-ready, all tests passing

**Total**: 52 tasks for P0 features (MVP), 62 tasks if including P2 (loading states)

---

## Notes

- **Tests not requested**: Spec does not request automated tests, using manual testing only (16 scenarios in quickstart.md)
- **[P] markers**: Tasks that modify different files with no conflicts can run in parallel
- **[Story] labels**: Map tasks to user stories for traceability and independent delivery
- **MVP scope**: User Stories 1-3 (P0) are MVP-critical. User Story 4 (P2) is optional polish.
- **Commit strategy**: Commit after each user story phase completion (after checkpoints)
- **Success Criteria**: Verify all 6 criteria from spec.md after Phase 7 completion
- **Edge cases**: Covered in T055-T057 (invalid status, expired tokens, network failures)
- **PROJECT_TRACKER update**: T058 marks Phase 3 tasks complete in tracker

---

## Success Criteria Validation (After Phase 7)

From spec.md, verify:

- [ ] **SC-001**: 100% routing accuracy (all 16 test scenarios pass) → T053
- [ ] **SC-002**: Zero redirect loops (no infinite redirects) → T027
- [ ] **SC-003**: Sign-out works on 4/4 pages → T035-T040
- [ ] **SC-004**: Loading states < 200ms (if US4 implemented) → T050
- [ ] **SC-005**: Routing logic in ≤2 files → T028
- [ ] **SC-006**: No stuck users (all edge cases handled) → T055-T057

All success criteria must pass before merging to main.
