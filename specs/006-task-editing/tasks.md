# Tasks: Task Lifecycle Enhancement

**Input**: Design documents from `/specs/006-task-editing/`  
**Prerequisites**: plan.md, spec.md, data-model.md, quickstart.md

**Tests**: No test tasks included (not requested in specification)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- File paths follow Trackly Home structure: `apps/web/src/` and `supabase/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Database schema extension and type definitions

- [ ] T001 Create migration file `supabase/migrations/20260126000000_010_task_lifecycle.sql`
- [ ] T002 Add `notes`, `deleted_at`, `archived_at` columns to tasks table per data-model.md
- [ ] T003 [P] Add partial indexes for `deleted_at`, `archived_at`, and composite index for filtering
- [ ] T004 [P] Add column comments for documentation in migration
- [ ] T005 Apply migration locally via `npx supabase db reset` and verify schema changes
- [ ] T006 Update TypeScript task type in `apps/web/src/types/task.ts` with new columns
- [ ] T007 [P] Create TaskUpdate and TaskFilters type definitions in `apps/web/src/types/task.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T008 Extend tasks service with `updateTask()` function in `apps/web/src/services/tasks.ts`
- [ ] T009 [P] Add `softDeleteTask()` function in `apps/web/src/services/tasks.ts`
- [ ] T010 [P] Add `restoreTask()` function in `apps/web/src/services/tasks.ts`
- [ ] T011 [P] Add `archiveTask()` function in `apps/web/src/services/tasks.ts`
- [ ] T012 Add `bulkUpdateTasks()` function in `apps/web/src/services/tasks.ts`
- [ ] T013 Create useTaskFilters custom hook in `apps/web/src/hooks/useTaskFilters.ts` for filter/sort state
- [ ] T014 [P] Create useTaskBulkActions custom hook in `apps/web/src/hooks/useTaskBulkActions.ts` for selection state
- [ ] T015 Install date-fns if not present: `npm install date-fns` in apps/web

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Edit Existing Task (Priority: P1) 🎯 MVP

**Goal**: Allow household members to edit task title, assignee, due date, and notes

**Independent Test**: Create task, click edit, change all fields, save, verify updates persist and display correctly

### Implementation for User Story 1

- [ ] T016 [P] [US1] Create EditTaskModal component in `apps/web/src/components/EditTaskModal.tsx`
- [ ] T017 [US1] Add form fields (title, assignee, due date, notes) using Chakra UI FormControl, Input, Textarea, Select
- [ ] T018 [US1] Implement pre-population of form with current task values on modal open
- [ ] T019 [US1] Add form validation (title required, notes max 5000 chars, due date format)
- [ ] T020 [US1] Wire up save handler calling `updateTask()` service function
- [ ] T021 [US1] Implement optimistic UI update with rollback on error
- [ ] T022 [US1] Add cancel button that discards changes and closes modal
- [ ] T023 [US1] Modify TaskItem component in `apps/web/src/components/TaskItem.tsx` to add Edit icon button
- [ ] T024 [US1] Add onClick handler to Edit button that opens EditTaskModal with task data
- [ ] T025 [US1] Add error toast notification for network/validation errors using Chakra useToast
- [ ] T026 [US1] Add success toast notification on successful edit

**Checkpoint**: User Story 1 complete - users can edit any task field and changes persist

---

## Phase 4: User Story 2 - Delete Unwanted Tasks (Priority: P1)

**Goal**: Allow users to soft-delete tasks with restore capability, admins can permanently delete old tasks

**Independent Test**: Delete task, verify it disappears from list, navigate to Deleted Tasks view, restore it

### Implementation for User Story 2

- [ ] T027 [P] [US2] Create DeleteTaskDialog component in `apps/web/src/components/DeleteTaskDialog.tsx`
- [ ] T028 [US2] Implement confirmation dialog using Chakra AlertDialog component
- [ ] T029 [US2] Wire up confirm button to call `softDeleteTask()` service function
- [ ] T030 [US2] Modify TaskItem component to add Delete icon button (red color, warning style)
- [ ] T031 [US2] Add onClick handler to Delete button that opens DeleteTaskDialog
- [ ] T032 [P] [US2] Create DeletedTasksView component in `apps/web/src/components/DeletedTasksView.tsx`
- [ ] T033 [US2] Query tasks where `deleted_at IS NOT NULL` in DeletedTasksView
- [ ] T034 [US2] Add Restore button for each deleted task calling `restoreTask()` service
- [ ] T035 [US2] Add Permanently Delete button (admin-only) for tasks deleted > 30 days
- [ ] T036 [US2] Implement role check (admin only) for permanent delete button visibility
- [ ] T037 [US2] Add navigation link to DeletedTasksView in app sidebar or settings menu
- [ ] T038 [US2] Modify main TaskList query to exclude deleted tasks: `WHERE deleted_at IS NULL`

**Checkpoint**: User Story 2 complete - users can soft-delete and restore tasks, admins can permanently delete old ones

---

## Phase 5: User Story 3 - View My Assigned Tasks (Priority: P1)

**Goal**: Provide "My Tasks" quick filter showing only tasks assigned to current user

**Independent Test**: Assign 3 tasks to self, 2 to partner, click "My Tasks", verify only 3 appear

### Implementation for User Story 3

- [ ] T039 [P] [US3] Create TaskFilters component in `apps/web/src/components/TaskFilters.tsx`
- [ ] T040 [US3] Add "My Tasks" quick filter button/toggle in TaskFilters component
- [ ] T041 [US3] Integrate useTaskFilters hook to manage "My Tasks" filter state
- [ ] T042 [US3] Update TaskList component to accept filter props and apply `assigned_to = currentUserId` filter
- [ ] T043 [US3] Add empty state for "My Tasks" with no results: "You're all caught up! 🎉"
- [ ] T044 [US3] Add clear filter button to return to all household tasks
- [ ] T045 [US3] Persist "My Tasks" filter state in localStorage via useTaskFilters hook
- [ ] T046 [US3] Modify TasksScreen in `apps/web/src/screens/TasksScreen.tsx` to integrate TaskFilters component

**Checkpoint**: User Story 3 complete - users have personalized "My Tasks" view with persistence

---

## Phase 6: User Story 4 - Sort Tasks by Due Date (Priority: P1)

**Goal**: Default sort by due date (earliest first), with alternative sort options

**Independent Test**: Create 5 tasks with different due dates, verify auto-sort, change due date, verify re-sort

### Implementation for User Story 4

- [ ] T047 [US4] Add sort dropdown to TaskFilters component (Due Date, Created Date, Title, Assignee)
- [ ] T048 [US4] Update useTaskFilters hook to manage sort state (default: 'due_date')
- [ ] T049 [US4] Implement client-side sort logic in TaskList component:
  - Sort by due_date ASC (nulls last),
  - Sub-sort by created_at ASC for same due date
- [ ] T050 [US4] Add sort option: Created Date (oldest first)
- [ ] T051 [P] [US4] Add sort option: Title (alphabetical A-Z)
- [ ] T052 [P] [US4] Add sort option: Assignee (group by assignee name)
- [ ] T053 [US4] Persist selected sort method in localStorage via useTaskFilters hook
- [ ] T054 [US4] Auto re-sort when task due_date is updated (listen for Realtime updates)

**Checkpoint**: User Story 4 complete - tasks sorted intelligently with user control

---

## Phase 7: User Story 5 - Filter Tasks by Status (Priority: P1)

**Goal**: Toggle between active, completed, and all tasks

**Independent Test**: Create and complete 2 tasks, create 3 incomplete, toggle "Show Completed", verify display changes

### Implementation for User Story 5

- [ ] T055 [US5] Add status filter controls to TaskFilters component (Active Only, Completed Only, All Tasks)
- [ ] T056 [US5] Update useTaskFilters hook to manage status filter state (default: 'active')
- [ ] T057 [US5] Apply status filter in TaskList component:
  - Active: WHERE status = 'incomplete'
  - Completed: WHERE status = 'complete'  
  - All: no status filter
- [ ] T058 [US5] Add "Show Completed" toggle button as alternative to dropdown
- [ ] T059 [US5] Style completed tasks with strikethrough text and checkmark icon
- [ ] T060 [US5] Update task display when status changes (mark complete/incomplete)

**Checkpoint**: User Story 5 complete - users can focus on active work or review accomplishments

---

## Phase 8: User Story 6 - Filter Tasks by Assignee (Priority: P2)

**Goal**: Filter tasks by specific household member or unassigned

**Independent Test**: Assign tasks to 3 members and unassigned, filter by one member, verify only their tasks appear

### Implementation for User Story 6

- [ ] T061 [US6] Add assignee filter dropdown to TaskFilters component
- [ ] T062 [US6] Populate dropdown with all household members from household_members table
- [ ] T063 [US6] Add "Unassigned" option to assignee dropdown
- [ ] T064 [US6] Update useTaskFilters hook to manage assignee filter state
- [ ] T065 [US6] Apply assignee filter in TaskList component:
  - Specific member: WHERE assigned_to = userId
  - Unassigned: WHERE assigned_to IS NULL
  - All: no assignee filter
- [ ] T066 [US6] Update filtered view when task is reassigned (remove from view or add)
- [ ] T067 [US6] Support combining assignee filter with "My Tasks" (intersection logic)

**Checkpoint**: User Story 6 complete - household coordination with assignee visibility

---

## Phase 9: User Story 7 - Add Task Notes/Description (Priority: P2)

**Goal**: Support optional multi-line notes with URL auto-linkification

**Independent Test**: Create task with notes, save, edit notes, verify display with clickable links

### Implementation for User Story 7

- [ ] T068 [P] [US7] Add notes textarea field to AddTask component in `apps/web/src/components/AddTask.tsx`
- [ ] T069 [P] [US7] Add notes textarea field to EditTaskModal component (already exists from US1, verify it's functional)
- [ ] T070 [US7] Add notes validation: max 5000 characters with character counter
- [ ] T071 [US7] Preserve line breaks in notes (render as `white-space: pre-wrap`)
- [ ] T072 [US7] Install react-linkify or similar: `npm install react-linkify` in apps/web
- [ ] T073 [US7] Implement URL auto-linkification in task detail view using react-linkify
- [ ] T074 [US7] Add note icon indicator to TaskItem when task has notes
- [ ] T075 [US7] Expand TaskItem or create task detail view to display notes on click
- [ ] T076 [US7] Ensure links open in new tab with `rel="noopener noreferrer"` for security

**Checkpoint**: User Story 7 complete - tasks can include rich contextual information

---

## Phase 10: User Story 8 - Bulk Complete Tasks (Priority: P2)

**Goal**: Select multiple tasks and perform bulk actions (complete, delete, assign)

**Independent Test**: Select 5 tasks, click "Complete Selected", verify all marked complete

### Implementation for User Story 8

- [ ] T077 [P] [US8] Create BulkActionsBar component in `apps/web/src/components/BulkActionsBar.tsx`
- [ ] T078 [US8] Add "Select Mode" toggle button to TasksScreen
- [ ] T079 [US8] Update TaskItem to show checkbox when in selection mode
- [ ] T080 [US8] Integrate useTaskBulkActions hook to manage selection state
- [ ] T081 [US8] Add "Select All" button (selects all visible tasks respecting filters)
- [ ] T082 [US8] Add "Clear Selection" button
- [ ] T083 [US8] Display selection count in BulkActionsBar: "X tasks selected"
- [ ] T084 [US8] Implement "Complete Selected" action calling `bulkUpdateTasks({ status: 'complete' })`
- [ ] T085 [US8] Implement "Delete Selected" action with confirmation dialog
- [ ] T086 [US8] Implement "Assign Selected to [Member]" dropdown action
- [ ] T087 [US8] Skip already-completed tasks in bulk complete (show accurate count)
- [ ] T088 [US8] Exit selection mode after bulk action completes
- [ ] T089 [US8] Optimize bulk operations to complete within 2 seconds for 50 tasks

**Checkpoint**: User Story 8 complete - efficiency gains for managing multiple related tasks

---

## Phase 11: User Story 9 - Archive Completed Tasks (Priority: P3)

**Goal**: Move old completed tasks to archive to declutter views

**Independent Test**: Complete 10 tasks, archive old ones, verify hidden from "Show Completed" but visible in "Archived Tasks"

### Implementation for User Story 9

- [ ] T090 [P] [US9] Create ArchivedTasksView component in `apps/web/src/components/ArchivedTasksView.tsx`
- [ ] T091 [US9] Query tasks where `archived_at IS NOT NULL` in ArchivedTasksView
- [ ] T092 [US9] Add "Restore to Active" button calling `archiveTask()` with archived_at = NULL
- [ ] T093 [US9] Add "Archive All Completed" button to TasksScreen (visible when completed tasks exist)
- [ ] T094 [US9] Implement archive confirmation dialog for bulk archive action
- [ ] T095 [US9] Update TaskList query to exclude archived tasks: `WHERE archived_at IS NULL`
- [ ] T096 [US9] Add navigation link to ArchivedTasksView in settings menu
- [ ] T097 [US9] (Optional) Add admin setting for auto-archive rule: "Archive completed tasks older than X days"
- [ ] T098 [US9] (Optional) Implement scheduled job or manual trigger for auto-archive based on rule

**Checkpoint**: User Story 9 complete - long-term task list hygiene maintained

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T099 [P] Update migration README in `supabase/migrations/README.md` with new schema details
- [ ] T100 [P] Add JSDoc comments to all new service functions in `apps/web/src/services/tasks.ts`
- [ ] T101 [P] Verify all Chakra UI components follow consistent styling (spacing, colors, fonts)
- [ ] T102 Add loading states (skeletons) to TaskList during fetch/filter operations
- [ ] T103 Add error boundaries for EditTaskModal and DeleteTaskDialog
- [ ] T104 Verify Realtime subscriptions update all views (deleted tasks, archived tasks, filtered views)
- [ ] T105 Test performance with 100 tasks: list render < 1.5s, filter/sort < 1s
- [ ] T106 Test cross-household security: verify RLS blocks editing/deleting other household's tasks
- [ ] T107 Run full manual test suite from quickstart.md (94 test scenarios)
- [ ] T108 Verify mobile responsiveness of all new components (TaskFilters, modals, bulk actions bar)
- [ ] T109 Update PRD Phase 6 requirements status in `docs/TRACKLY_HOME_PRD.md` to "Complete"
- [ ] T110 Run `npm run build` and `npm run lint` - verify no errors or warnings
- [ ] T111 Create pull request with all changes for review

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-11)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if multiple developers)
  - Or sequentially in priority order: US1 → US2 → US3 → US4 → US5 (P1) → US6 → US7 → US8 (P2) → US9 (P3)
- **Polish (Phase 12)**: Depends on all desired user stories being complete

### User Story Dependencies

- **US1 (Edit Task)**: Can start after Foundational - No dependencies on other stories
- **US2 (Delete Task)**: Can start after Foundational - No dependencies on other stories
- **US3 (My Tasks Filter)**: Can start after Foundational - No dependencies (standalone filter)
- **US4 (Sort)**: Can start after Foundational - No dependencies (standalone sort)
- **US5 (Status Filter)**: Can start after Foundational - No dependencies (standalone filter)
- **US6 (Assignee Filter)**: Can start after Foundational - Integrates with US3 but independently testable
- **US7 (Notes)**: Can start after Foundational - Integrates with US1 (EditTaskModal) but independently testable
- **US8 (Bulk Actions)**: Can start after Foundational - Uses same service functions but independently testable
- **US9 (Archive)**: Can start after Foundational - Similar pattern to US2 (delete), independently testable

### Within Each User Story

- Foundation services (T008-T014) before any UI work
- Components can be built in parallel where they don't share files
- TaskFilters and related views integrate into TasksScreen last
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**: T003 [P] can run parallel with T001-T002; T004 [P], T007 [P] parallel with other tasks

**Phase 2 (Foundation)**: T009, T010, T011 [P] can all run in parallel after T008; T014 [P] parallel with T013

**Within User Stories**:
- US1: T016 [P] (EditTaskModal) can start in parallel with US2/US3/US4/US5 components
- US7: T068 [P] and T069 [P] can run in parallel
- US8: T077 [P] can run in parallel with other US8 tasks
- US9: T090 [P] can run in parallel with other US9 tasks

**Phase 12 (Polish)**: T099, T100, T101 [P] can all run in parallel

**Parallel Team Strategy**: Once Foundational is complete:
- Developer A: US1 + US2 (Edit + Delete - related UI patterns)
- Developer B: US3 + US4 + US5 (All filtering/sorting)
- Developer C: US6 + US7 (Additional filters + notes)
- Developer D: US8 + US9 (Bulk actions + archive)

---

## Parallel Example: User Story 1

```bash
# After Foundation is ready, these can start together:
T016 [P] [US1] Create EditTaskModal component  # Different file
T023 [US1] Modify TaskItem component           # Different file

# After T016 completes, these can run in parallel:
T017 [US1] Add form fields to EditTaskModal
T018 [US1] Implement pre-population
T019 [US1] Add validation
# (All editing same EditTaskModal.tsx file, so sequential)
```

---

## Implementation Strategy

### MVP First (P1 Stories: US1-US5)

1. Complete Phase 1: Setup (database migration + types)
2. Complete Phase 2: Foundational (services + hooks) - **CRITICAL**
3. Complete Phase 3-7: All P1 user stories (edit, delete, my tasks, sort, status filter)
4. **STOP and VALIDATE**: Test all P1 stories independently
5. Run full manual test suite for P1 features
6. Deploy to staging for beta testing

**MVP Delivers**: Complete task lifecycle management (edit, delete, personalized views, sorting, filtering)

### Incremental Delivery (Add P2 Features)

1. Complete Phase 8: US6 (Assignee filter) → Test independently
2. Complete Phase 9: US7 (Notes) → Test independently  
3. Complete Phase 10: US8 (Bulk actions) → Test independently
4. Deploy P2 features to staging

**P2 Delivers**: Enhanced coordination and efficiency (assignee tracking, detailed notes, bulk operations)

### Optional Enhancement (P3)

1. Complete Phase 11: US9 (Archive) → Test independently
2. Deploy to staging

**P3 Delivers**: Long-term task list hygiene

### Final Steps

1. Complete Phase 12: Polish
2. Final integrated testing (all stories together)
3. Deploy to production

---

## Notes

- **[P] tasks**: Different files, no dependencies - can run in parallel
- **[Story] label**: Maps task to specific user story for traceability
- **Each user story**: Independently completable and testable
- **No tests included**: Tests not requested in specification (manual testing via quickstart.md)
- **Commit strategy**: Commit after each task or logical group
- **Checkpoints**: Stop at each phase/story checkpoint to validate independently
- **Database migration**: Must be applied first (Phase 1) - everything else depends on schema
- **Foundation critical**: Phase 2 blocks all UI work - prioritize completing services/hooks first

---

## Task Count Summary

- **Setup**: 7 tasks (T001-T007)
- **Foundational**: 8 tasks (T008-T015)
- **US1 (Edit)**: 11 tasks (T016-T026)
- **US2 (Delete)**: 12 tasks (T027-T038)
- **US3 (My Tasks)**: 8 tasks (T039-T046)
- **US4 (Sort)**: 8 tasks (T047-T054)
- **US5 (Status Filter)**: 6 tasks (T055-T060)
- **US6 (Assignee Filter)**: 7 tasks (T061-T067)
- **US7 (Notes)**: 9 tasks (T068-T076)
- **US8 (Bulk)**: 13 tasks (T077-T089)
- **US9 (Archive)**: 9 tasks (T090-T098)
- **Polish**: 13 tasks (T099-T111)

**Total**: 111 tasks

**P1 (MVP)**: 15 setup/foundation + 45 implementation (US1-US5) = 60 tasks  
**P2**: 29 tasks (US6-US8)  
**P3**: 9 tasks (US9)  
**Polish**: 13 tasks
