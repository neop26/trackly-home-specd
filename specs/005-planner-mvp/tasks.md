# Tasks: Planner MVP (Task Management)

**Input**: Design documents from `/specs/005-planner-mvp/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: No automated tests requested - using manual testing approach per constitution

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Frontend**: `apps/web/src/`
- **Database**: `supabase/migrations/`
- **Documentation**: `supabase/migrations/README.md`, `docs/PROJECT_TRACKER.md`

---

## Phase 0: Chakra UI Migration (Prerequisite)

**Purpose**: Full migration from Tailwind CSS to Chakra UI across entire application

**⚠️ CRITICAL**: This phase must complete before implementing any task management features (US1-US5)

### Dependency Installation & Configuration

- [X] T001 Install Chakra UI dependencies in apps/web/package.json (@chakra-ui/react@^2.8.2, @emotion/react@^11.11.3, @emotion/styled@^11.11.0, framer-motion@^10.18.0)
- [X] T002 Remove Tailwind CSS dependencies from apps/web/package.json (@tailwindcss/vite, tailwindcss)
- [X] T003 Create Chakra UI theme configuration in apps/web/src/theme.ts (brand colors, fonts)
- [X] T004 Update apps/web/src/App.tsx to wrap with ChakraProvider and apply theme
- [X] T005 Delete apps/web/src/index.css (Tailwind directives file)
- [X] T006 Remove Tailwind CSS import from apps/web/src/main.tsx

### Component Migration

- [X] T007 [P] Migrate AppHeader component to Chakra UI in apps/web/src/components/AppHeader.tsx (replace Tailwind with Flex, Heading, Button)
- [X] T008 [P] Migrate ProtectedRoute component to Chakra UI in apps/web/src/ProtectedRoute.tsx (minimal styling changes)
- [X] T009 [P] Migrate LoginPage to Chakra UI in apps/web/src/screens/LoginPage.tsx (replace Tailwind with Box, Input, Button, Heading)
- [X] T010 [P] Migrate SetupPage to Chakra UI in apps/web/src/screens/SetupPage.tsx (replace Tailwind with Box, Input, Button, FormControl)
- [X] T011 [P] Migrate JoinPage to Chakra UI in apps/web/src/screens/JoinPage.tsx (replace Tailwind with Box, Input, Button, Text)
- [X] T012 Migrate InvitePartnerCard to Chakra UI in apps/web/src/components/InvitePartnerCard.tsx (replace Tailwind with Card, Input, Button, FormControl)
- [X] T013 Migrate ManageRolesCard to Chakra UI in apps/web/src/components/ManageRolesCard.tsx (replace Tailwind with Card, Select, Button)
- [X] T014 Migrate AppShell to Chakra UI in apps/web/src/screens/AppShell.tsx (replace Tailwind with Box, Container, VStack)

### Migration Validation

- [X] T015 Run build validation: npm run build succeeds without errors
- [X] T016 Run lint validation: npm run lint passes without warnings
- [X] T017 Visual regression test: All existing pages render correctly (Login, Setup, Join, AppShell)
- [X] T018 Verify no Tailwind classes remain in codebase (grep search for bg-, text-, p-, m-, flex, grid classes)

**Checkpoint**: Phase 0 complete - all components migrated to Chakra UI, builds passing, visual validation complete

---

## Phase 1: Database Foundation (Foundational - Blocks All User Stories)

**Purpose**: Create tasks table with RLS policies for household isolation

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [X] T019 Create migration file: npx supabase migration new tasks_table (creates supabase/migrations/[timestamp]_009_tasks_table.sql)
- [X] T020 Define tasks table schema in migration file (id, household_id, title, status, assigned_to, due_date, created_at, updated_at with constraints)
- [X] T021 Add indexes in migration file (tasks_household_id_idx, tasks_assigned_to_idx)
- [X] T022 Add updated_at trigger in migration file (set_tasks_updated_at using moddatetime extension)
- [X] T023 Enable RLS on tasks table in migration file

### RLS Policies

- [X] T024 [P] Create tasks_select_members policy in migration file (members can read their household's tasks)
- [X] T025 [P] Create tasks_insert_members policy in migration file (members can create tasks for their household)
- [X] T026 [P] Create tasks_update_members policy in migration file (members can update their household's tasks)
- [X] T027 [P] Create tasks_delete_members policy in migration file (members can delete their household's tasks)

### Migration Application & Validation

- [X] T028 Apply migration locally: npx supabase db reset
- [X] T029 Verify tasks table created correctly: query information_schema.tables
- [X] T030 Test RLS policy: Cross-household SELECT blocked (user A cannot see household B tasks)
- [X] T031 Test RLS policy: Same-household SELECT allowed (user A can see household A tasks)
- [X] T032 Test RLS policy: Cross-household INSERT blocked (user A cannot create task for household B)
- [X] T033 Test RLS policy: Same-household INSERT allowed (user A can create task for household A)
- [X] T034 Test RLS policy: Cross-household UPDATE blocked (user A cannot update household B tasks)
- [X] T035 Test RLS policy: Cross-household DELETE blocked (user A cannot delete household B tasks)

### Documentation

- [X] T036 Update supabase/migrations/README.md with tasks table documentation (schema, RLS policies, migration number)

**Checkpoint**: Foundation ready - database schema complete, RLS verified, user story implementation can now begin in parallel

---

## Phase 2: User Story 1 - View Household Tasks (Priority: P0) 🎯 MVP

**Goal**: Display household tasks in a list view with completion status visual distinction

**Independent Test**: Create household, add tasks to database manually, verify members see only their household's tasks in TaskList component

### Task Service Layer

- [X] T037 Create Task TypeScript interface in apps/web/src/services/tasks.ts (id, household_id, title, status, assigned_to, due_date, created_at, updated_at)
- [X] T038 Implement getTasks service function in apps/web/src/services/tasks.ts (Supabase query with household_id filter, ordered by created_at DESC)

### UI Components

- [X] T039 [P] [US1] Create TaskItem component in apps/web/src/components/TaskItem.tsx (display single task with checkbox, title, visual completion indicator)
- [X] T040 [P] [US1] Create TaskList component in apps/web/src/components/TaskList.tsx (map tasks array to TaskItem components, handle empty state)
- [X] T041 [US1] Create TasksScreen container in apps/web/src/screens/TasksScreen.tsx (fetch tasks on mount, pass to TaskList, manage loading state)

### Integration

- [X] T042 [US1] Integrate TasksScreen into AppShell in apps/web/src/screens/AppShell.tsx (replace placeholder content with TasksScreen, pass household_id prop)

### Manual Testing

- [X] T043 [US1] Test: Empty state displays "No tasks yet" message when household has zero tasks
- [X] T044 [US1] Test: Task list displays all tasks for authenticated user's household
- [X] T045 [US1] Test: Cross-household isolation verified (user in household A sees zero tasks from household B)
- [X] T046 [US1] Test: Completed tasks visually distinct from incomplete tasks (strikethrough or different styling)
- [X] T047 [US1] Test: Task list renders within 2 seconds with 100 tasks (performance validation SC-001)

**Checkpoint**: User Story 1 complete - Task viewing functional, household isolation verified, ready for independent deployment

---

## Phase 3: User Story 2 - Create New Tasks (Priority: P0) 🎯 MVP

**Goal**: Allow household members to quickly add new tasks with title validation

**Independent Test**: Log in as household member, create task with title, verify it appears in TaskList for all members

### Task Service Layer

- [X] T048 Implement createTask service function in apps/web/src/services/tasks.ts (insert task with household_id, title, default status 'incomplete')

### UI Components

- [X] T049 [US2] Create AddTask component in apps/web/src/components/AddTask.tsx (input field for title, submit button, form validation)
- [X] T050 [US2] Add form validation in AddTask component (title required, 1-500 chars, display error toast for empty title)
- [X] T051 [US2] Implement form submission handler in AddTask component (call createTask service, clear form on success, show success toast)

### Integration

- [X] T052 [US2] Integrate AddTask into TasksScreen in apps/web/src/screens/TasksScreen.tsx (place above TaskList, pass onAddTask callback)
- [X] T053 [US2] Update TasksScreen to refresh task list after creation (optimistic UI update or re-fetch)

### Manual Testing

- [X] T054 [US2] Test: Task creation with valid title succeeds and appears in list immediately
- [X] T055 [US2] Test: Task creation with empty title shows validation error and does not create task
- [ ] T056 [US2] Test: Task creation with 500-char title succeeds
- [ ] T057 [US2] Test: Task creation with 501-char title blocked by database constraint
- [X] T058 [US2] Test: Form clears after successful task creation
- [X] T059 [US2] Test: Created task visible to other household members (test in second browser tab)
- [X] T060 [US2] Test: Task creation round-trip completes in under 1 second (performance validation SC-003)

**Checkpoint**: User Story 2 complete - Task creation functional, validation working, ready for independent deployment

---

## Phase 4: User Story 3 - Complete Tasks (Priority: P0) 🎯 MVP

**Goal**: Enable members to mark tasks complete/incomplete with toggle behavior

**Independent Test**: Create task, mark complete, verify status change persists and reflects for all members

### Task Service Layer

- [ ] T061 Implement toggleTaskStatus service function in apps/web/src/services/tasks.ts (update status field, toggle between 'incomplete' and 'complete')

### UI Components

- [ ] T062 [US3] Add checkbox toggle handler to TaskItem component in apps/web/src/components/TaskItem.tsx (call toggleTaskStatus, pass task id and current status)
- [ ] T063 [US3] Update TaskItem visual styling in apps/web/src/components/TaskItem.tsx (strikethrough for complete, gray text for complete)
- [ ] T064 [US3] Add optimistic UI update to TaskList component in apps/web/src/components/TaskList.tsx (update local state immediately, revert on error)

### Integration

- [ ] T065 [US3] Wire toggleTaskStatus callback through TasksScreen to TaskItem in apps/web/src/screens/TasksScreen.tsx

### Manual Testing

- [ ] T066 [US3] Test: Marking task complete updates status and shows visual indication (strikethrough, checkmark)
- [ ] T067 [US3] Test: Marking task incomplete reverts visual styling (remove strikethrough)
- [ ] T068 [US3] Test: Toggle behavior works repeatedly (complete → incomplete → complete)
- [ ] T069 [US3] Test: Status change persists after page reload
- [ ] T070 [US3] Test: Status change visible to other household members within 2 seconds (test in second browser tab, performance validation SC-004)
- [ ] T071 [US3] Test: Concurrent status updates handled gracefully (two members toggle same task simultaneously)

**Checkpoint**: User Story 3 complete - Task completion functional, MVP core features (view/create/complete) ready for deployment

---

## Phase 5: User Story 4 - Task Assignment (Priority: P1)

**Goal**: Allow optional assignment of tasks to specific household members

**Independent Test**: Create task, assign to household member, verify assignment displays in task list

### Service Layer Enhancement

- [ ] T072 [US4] Update createTask function signature in apps/web/src/services/tasks.ts to accept optional assignedTo parameter
- [ ] T073 [US4] Create getHouseholdMembers service function in apps/web/src/services/members.ts (fetch all members for dropdown, reuse existing service if available)
- [ ] T074 [US4] Update Task interface in apps/web/src/services/tasks.ts to include assigned_to_name for display (join with profiles table or fetch separately)

### UI Components

- [ ] T075 [P] [US4] Add assignment dropdown to AddTask component in apps/web/src/components/AddTask.tsx (Select component with household members, "Unassigned" option)
- [ ] T076 [P] [US4] Update TaskItem component to display assignee name in apps/web/src/components/TaskItem.tsx (show assignee or "Unassigned")
- [ ] T077 [US4] Wire assignment selection through TasksScreen to createTask call in apps/web/src/screens/TasksScreen.tsx

### Manual Testing

- [ ] T078 [US4] Test: Task can be created with assigned member selected from dropdown
- [ ] T079 [US4] Test: Task can be created unassigned (no member selected)
- [ ] T080 [US4] Test: Assigned task displays assignee name in task list
- [ ] T081 [US4] Test: Unassigned task shows "Unassigned" or blank assignment field
- [ ] T082 [US4] Test: Assignment dropdown only shows members from same household (household isolation)

**Checkpoint**: User Story 4 complete - Task assignment functional, optional feature ready

---

## Phase 6: User Story 5 - Due Dates (Priority: P1)

**Goal**: Allow optional due dates on tasks with visual overdue indicator

**Independent Test**: Create task with due date, verify it displays in list, confirm overdue tasks highlighted

### Service Layer Enhancement

- [ ] T083 [US5] Update createTask function signature in apps/web/src/services/tasks.ts to accept optional dueDate parameter

### UI Components

- [ ] T084 [P] [US5] Add due date picker to AddTask component in apps/web/src/components/AddTask.tsx (Input type="date" or Chakra DatePicker)
- [ ] T085 [P] [US5] Update TaskItem component to display due date in apps/web/src/components/TaskItem.tsx (formatted date string)
- [ ] T086 [P] [US5] Add overdue visual indicator to TaskItem component in apps/web/src/components/TaskItem.tsx (red text or warning icon if due_date < today and status incomplete)
- [ ] T087 [US5] Wire due date selection through TasksScreen to createTask call in apps/web/src/screens/TasksScreen.tsx

### Manual Testing

- [ ] T088 [US5] Test: Task can be created with due date selected
- [ ] T089 [US5] Test: Task can be created without due date (optional field)
- [ ] T090 [US5] Test: Task with due date displays formatted date in list
- [ ] T091 [US5] Test: Task without due date shows "No due date" or blank due date field
- [ ] T092 [US5] Test: Overdue task (due_date < today, status incomplete) shows visual warning (red text/icon)
- [ ] T093 [US5] Test: Completed task with past due date does not show overdue warning

**Checkpoint**: User Story 5 complete - Due dates functional, all P0 and P1 features implemented

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements affecting multiple user stories and deployment preparation

### Error Handling & UX Polish

- [ ] T094 [P] Add loading spinner to TasksScreen during initial fetch in apps/web/src/screens/TasksScreen.tsx (Chakra Spinner component)
- [ ] T095 [P] Add error toast notifications for failed operations in apps/web/src/screens/TasksScreen.tsx (task creation failure, fetch failure, toggle failure)
- [ ] T096 [P] Implement network error handling in all service functions in apps/web/src/services/tasks.ts (catch errors, throw user-friendly messages)

### Documentation Updates

- [ ] T097 Update docs/PROJECT_TRACKER.md with Phase 5 completion status (mark 100%, add completion date, note task count)
- [ ] T098 Create implementation summary in specs/005-planner-mvp/ documenting what was built and deviations from plan

### Final Validation

- [ ] T099 Run full build validation: npm run build succeeds
- [ ] T100 Run lint validation: npm run lint passes
- [ ] T101 Visual regression test: All pages render correctly after all changes
- [ ] T102 Run complete manual test suite from quickstart.md (all 6 success criteria validated)
- [ ] T103 Performance validation: Task list with 100 tasks loads in under 2 seconds (SC-006)
- [ ] T104 Security validation: RLS verification queries pass (6/6 tests, SC-002)
- [ ] T105 Multi-user test: Concurrent task creation and status updates work correctly across browser tabs
- [ ] T106 [US2] Test: Validate task creation UX - 5 users create first task, track success rate and failure points (target 95%+ no errors, SC-005)

**Checkpoint**: All features complete, validation passed, ready for deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Chakra UI Migration)**: No dependencies - MUST complete before any other phase
- **Phase 1 (Database Foundation)**: Depends on Phase 0 - BLOCKS all user stories
- **Phase 2 (US1 - View Tasks)**: Depends on Phase 1 completion - Can run in parallel with US2, US3 if tasks are in different files
- **Phase 3 (US2 - Create Tasks)**: Depends on Phase 1 completion - Integrates with US1 (TasksScreen)
- **Phase 4 (US3 - Complete Tasks)**: Depends on Phase 2 (TaskItem component) - Enhances existing TaskItem
- **Phase 5 (US4 - Assignment)**: Depends on Phase 3 - Optional enhancement
- **Phase 6 (US5 - Due Dates)**: Depends on Phase 3 - Optional enhancement
- **Phase 7 (Polish)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (View Tasks)**: Foundation only - Independently testable
- **US2 (Create Tasks)**: Foundation + US1 (TasksScreen integration) - Independently testable
- **US3 (Complete Tasks)**: Foundation + US1 (TaskItem enhancement) - Independently testable
- **US4 (Assignment)**: Foundation + US2 (AddTask enhancement) - Optional, independently testable
- **US5 (Due Dates)**: Foundation + US2 (AddTask enhancement) - Optional, independently testable

### Within Each Phase

**Phase 0 (Migration)**:
- T001-T006 (dependencies, config) must complete first
- T007-T014 (component migration) can run in parallel
- T015-T018 (validation) must complete last

**Phase 1 (Database)**:
- T019-T023 (schema) must complete first
- T024-T027 (RLS policies) can run in parallel
- T028-T035 (testing) must complete after schema and policies
- T036 (documentation) can run in parallel with testing

**Phase 2 (US1)**:
- T037-T038 (service) must complete first
- T039-T040 (components) can run in parallel after service
- T041 (container) depends on T039-T040
- T042 (integration) depends on T041
- T043-T047 (testing) must complete last

**Phase 3 (US2)**:
- T048 (service) must complete first
- T049-T051 (AddTask component) can run sequentially (same file)
- T052-T053 (integration) depends on T049-T051
- T054-T060 (testing) must complete last

**Phase 4 (US3)**:
- T061 (service) must complete first
- T062-T064 (component updates) can run sequentially (modify existing components)
- T065 (integration) depends on T062-T064
- T066-T071 (testing) must complete last

### Parallel Opportunities

**Maximum Parallelization Strategy**:

1. **Phase 0**: All component migrations (T007-T014) can run in parallel by different developers
2. **Phase 1**: RLS policies (T024-T027) can be written in parallel, RLS tests (T030-T035) can run in parallel
3. **Phase 2**: TaskItem and TaskList (T039-T040) can be developed in parallel
4. **After Phase 1**: US1, US2, US3 can be developed in parallel by different developers (different files/components)
5. **After US2 complete**: US4 and US5 can be developed in parallel (both enhance AddTask but different features)
6. **Phase 7**: Error handling (T094-T096) can be added in parallel across services

---

## Parallel Example: User Story 1 (View Tasks)

```bash
# Launch service layer development:
Task: "Create Task TypeScript interface in apps/web/src/services/tasks.ts"
Task: "Implement getTasks service function in apps/web/src/services/tasks.ts"

# Launch UI components in parallel (different files):
Task: "[P] [US1] Create TaskItem component in apps/web/src/components/TaskItem.tsx"
Task: "[P] [US1] Create TaskList component in apps/web/src/components/TaskList.tsx"

# Launch testing tasks in parallel (different test scenarios):
Task: "[US1] Test: Empty state displays"
Task: "[US1] Test: Task list displays all tasks"
Task: "[US1] Test: Cross-household isolation"
```

---

## Implementation Strategy

### MVP First (User Stories 1-3 Only - P0 Features)

1. Complete Phase 0: Chakra UI Migration (prerequisite)
2. Complete Phase 1: Database Foundation (CRITICAL - blocks all stories)
3. Complete Phase 2: User Story 1 (View Tasks)
4. **STOP and VALIDATE**: Test US1 independently - can users view tasks?
5. Complete Phase 3: User Story 2 (Create Tasks)
6. **STOP and VALIDATE**: Test US1+US2 together - can users create and view tasks?
7. Complete Phase 4: User Story 3 (Complete Tasks)
8. **STOP and VALIDATE**: Test US1+US2+US3 together - full task lifecycle works?
9. Complete Phase 7: Polish (error handling, documentation)
10. **DEPLOY MVP** - Task management core features live!

### Incremental Delivery (Add P1 Features)

1. MVP deployed and stable
2. Add Phase 5: User Story 4 (Assignment) → Test independently → Deploy
3. Add Phase 6: User Story 5 (Due Dates) → Test independently → Deploy
4. Each enhancement adds value without breaking previous features

### Parallel Team Strategy (If Multiple Developers)

With 3 developers:

1. **All devs**: Phase 0 (Chakra Migration) together - helps coordination
2. **All devs**: Phase 1 (Database) together - foundation is critical
3. Once Phase 1 done:
   - **Developer A**: Phase 2 (US1 - View Tasks)
   - **Developer B**: Phase 3 (US2 - Create Tasks, depends on US1 TasksScreen)
   - **Developer C**: Can start Phase 5 or 6 prep work
4. After US1+US2 complete:
   - **Developer A**: Phase 4 (US3 - Complete Tasks)
   - **Developer B**: Phase 5 (US4 - Assignment)
   - **Developer C**: Phase 6 (US5 - Due Dates)
5. **All devs**: Phase 7 (Polish) together for final validation

---

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **[Story] labels** map tasks to specific user stories for traceability
- Each user story should be independently completable and testable
- **No TDD**: Tests are manual validation, not automated test files
- Commit after each task or logical group
- Stop at checkpoints to validate story independently
- **Chakra UI migration is prerequisite** - must complete Phase 0 before implementing task features
- All P0 stories (US1-US3) required for MVP, P1 stories (US4-US5) are optional enhancements

---

## Total Task Count: 106 tasks

- **Phase 0 (Chakra Migration)**: 18 tasks (T001-T018)
- **Phase 1 (Database Foundation)**: 18 tasks (T019-T036)
- **Phase 2 (US1 - View Tasks)**: 11 tasks (T037-T047)
- **Phase 3 (US2 - Create Tasks)**: 13 tasks (T048-T060)
- **Phase 4 (US3 - Complete Tasks)**: 11 tasks (T061-T071)
- **Phase 5 (US4 - Assignment)**: 11 tasks (T072-T082)
- **Phase 6 (US5 - Due Dates)**: 11 tasks (T083-T093)
- **Phase 7 (Polish)**: 13 tasks (T094-T106)

**MVP Scope** (P0 only): Phases 0-4 + Phase 7 = 73 tasks
**Full Feature Set** (P0 + P1): All phases = 106 tasks
