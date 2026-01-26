# Implementation Plan: Task Lifecycle Enhancement

**Branch**: `006-task-editing` | **Date**: 2026-01-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-task-editing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

**Primary Requirement**: Enable full task lifecycle management allowing household members to edit task details (title, assignee, due date, notes), delete tasks (soft-delete with restore), sort/filter tasks by various criteria, and use bulk operations for efficiency.

**Technical Approach**: 
- **Database Layer**: Extend `tasks` table with `notes`, `deleted_at`, `archived_at` columns; add indexes for filtering performance
- **Frontend Layer**: Build edit modal, delete confirmation, filter/sort controls, bulk selection mode using Chakra UI components
- **State Management**: Client-side filtering/sorting with local storage for user preferences; optimistic UI updates with rollback on error
- **Real-time**: Leverage existing Supabase Realtime subscriptions for live task updates across household members
- **No Edge Functions Required**: All operations handled via direct Supabase client with RLS enforcement

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Chakra UI 2.x, @supabase/supabase-js, date-fns (date manipulation)  
**Storage**: PostgreSQL (via Supabase) with RLS  
**Testing**: Manual testing (future: Vitest, Playwright)  
**Target Platform**: Web (Azure Static Web Apps)  
**Project Type**: web (frontend in apps/web, backend in supabase)  
**Performance Goals**: Task edit save < 800ms, task list filter/sort < 1s, bulk operations (50 tasks) < 2s  
**Constraints**: Household data isolation, member-level access (all members can edit/delete any household task)  
**Scale/Scope**: 100+ tasks per household with performant filtering/sorting

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ | RLS policies already enforce household isolation on tasks table. Extended columns (notes, deleted_at, archived_at) inherit existing RLS. No new security surface. |
| II. Vertical Slices | ✅ | User stories independently deliverable: US1 (edit), US2 (delete/restore), US3 (My Tasks filter), US4 (sort), US5 (status filter), US6 (assignee filter), US7 (notes), US8 (bulk), US9 (archive). P1 stories form minimal viable increment. |
| III. Minimal Changes | ✅ | Extending existing tasks table (3 new columns) rather than new tables. Reusing existing Chakra UI components. No over-engineering - client-side filtering/sorting sufficient for MVP scale (100 tasks). |
| IV. Document As You Go | ✅ | Migration README will be updated with schema changes. JSDoc comments added to new service functions. PRD Phase 6 status updated on completion. |
| V. Test Before Deploy | ✅ | Manual smoke test plan documented below. RLS verification queries for new columns. Build validation (npm run build + lint) before merge. |

**Re-check Post-Design**: Constitution check passed - no violations.

## Project Structure

### Documentation (this feature)

```text
specs/006-task-editing/
├── plan.md              # This file
├── spec.md              # Feature specification
├── data-model.md        # Database schema changes
├── quickstart.md        # Setup/testing guide
└── checklists/
    └── requirements.md  # Specification quality checklist (completed)
```

### Source Code (Trackly Home structure)

```text
apps/web/src/
├── components/
│   ├── EditTaskModal.tsx         # NEW: Task edit form modal
│   ├── DeleteTaskDialog.tsx      # NEW: Delete confirmation dialog
│   ├── TaskFilters.tsx           # NEW: Filter/sort controls
│   ├── BulkActionsBar.tsx        # NEW: Bulk operation controls
│   ├── TaskList.tsx              # MODIFIED: Add edit/delete buttons, selection mode
│   └── TaskItem.tsx              # MODIFIED: Add notes indicator, selection checkbox
├── screens/
│   └── TasksScreen.tsx           # MODIFIED: Integrate filters, bulk actions
├── services/
│   └── tasks.ts                  # MODIFIED: Add updateTask, softDeleteTask, restoreTask functions
├── hooks/
│   └── useTaskFilters.ts         # NEW: Custom hook for filter/sort state management
├── types/
│   └── task.ts                   # MODIFIED: Extend Task interface with notes, deleted_at, archived_at
└── lib/
    └── supabaseClient.ts         # Existing (no changes)

supabase/
├── migrations/
│   └── 20260126000000_010_task_lifecycle.sql  # NEW: Extend tasks table
└── config.toml                   # Existing (no changes)
```

**Structure Decision**: Web application with frontend (apps/web) and backend (supabase)

## Database Design

**Migration Number**: `20260126000000_010_task_lifecycle.sql`

### New Tables

*No new tables required - extending existing `tasks` table.*

### New Columns (existing tables)

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| tasks | notes | TEXT | Optional multi-line notes (max 5000 chars) |
| tasks | deleted_at | TIMESTAMP WITH TIME ZONE | Soft-delete timestamp (null = active, not null = deleted) |
| tasks | archived_at | TIMESTAMP WITH TIME ZONE | Archive timestamp (null = active/deleted, not null = archived) |

**Schema Extension (Migration SQL)**:
```sql
-- Add new columns to tasks table
alter table public.tasks
  add column if not exists notes text check (char_length(notes) <= 5000),
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Add indexes for filtering performance
create index if not exists tasks_deleted_at_idx on public.tasks(deleted_at) where deleted_at is not null;
create index if not exists tasks_archived_at_idx on public.tasks(archived_at) where archived_at is not null;
create index if not exists tasks_household_assigned_status_idx on public.tasks(household_id, assigned_to, status) where deleted_at is null and archived_at is null;

-- Add comment documentation
comment on column public.tasks.notes is 'Optional task notes/description (max 5000 characters)';
comment on column public.tasks.deleted_at is 'Soft-delete timestamp - null means active, not null means deleted (can be restored)';
comment on column public.tasks.archived_at is 'Archive timestamp - null means active/deleted, not null means archived (hidden from default views)';
```

**Column Rationale**:
- `notes`: Supports FR-015 through FR-017 (task notes with multi-line text)
- `deleted_at`: Supports FR-004 through FR-006 (soft-delete with restore capability)
- `archived_at`: Supports FR-021 through FR-024 (archive completed tasks)

**Index Strategy**:
- Partial index on `deleted_at` (only deleted tasks) for efficient "Deleted Tasks" view
- Partial index on `archived_at` (only archived tasks) for efficient "Archived Tasks" view  
- Composite index on `household_id + assigned_to + status` for filter combinations (excludes deleted/archived for main view performance)

### RLS Policies Required

**No new RLS policies required** - existing `tasks` table policies already cover all operations (SELECT, INSERT, UPDATE, DELETE) for household members.

**RLS Inheritance**: New columns (`notes`, `deleted_at`, `archived_at`) automatically inherit existing RLS policies:
- `tasks_select_members`: Members can read tasks (including new columns) where household_id matches
- `tasks_update_members`: Members can update tasks (including new columns) in their household
- `tasks_delete_members`: Members can delete tasks (soft-delete sets `deleted_at`) in their household

**Verification**: Existing RLS tests will validate that:
- Users cannot read/edit tasks from other households (even if only filtering by deleted_at/archived_at)
- Users can edit notes, set deleted_at, set archived_at for their household's tasks
- Cross-household access remains blocked with new columns

## Edge Functions

**No Edge Functions required for this feature.**

**Rationale**: All task lifecycle operations (edit, delete, restore, archive, bulk actions) are simple CRUD operations that can be handled directly from the frontend using Supabase client with RLS enforcement. No complex business logic requiring server-side execution.

**Data Access Pattern**: Direct Supabase client queries from frontend service layer (`apps/web/src/services/tasks.ts`).

**Operations Handled Client-Side**:
- **Edit**: `UPDATE tasks SET title = ?, assigned_to = ?, due_date = ?, notes = ?, updated_at = NOW() WHERE id = ?`
- **Soft Delete**: `UPDATE tasks SET deleted_at = NOW() WHERE id = ?`
- **Restore**: `UPDATE tasks SET deleted_at = NULL WHERE id = ?`
- **Archive**: `UPDATE tasks SET archived_at = NOW() WHERE id = ?`
- **Bulk Operations**: Multiple UPDATE statements in a transaction (Supabase client supports transactions)

## Frontend Components

### New Components

| Component | Location | Purpose | Chakra Components Used |
|-----------|----------|---------|------------------------|
| EditTaskModal | apps/web/src/components/EditTaskModal.tsx | Modal dialog for editing task (title, assignee, due date, notes) | Modal, ModalOverlay, ModalContent, ModalHeader, ModalBody, ModalFooter, FormControl, FormLabel, Input, Textarea, Select, Button |
| DeleteTaskDialog | apps/web/src/components/DeleteTaskDialog.tsx | Confirmation dialog for task deletion | AlertDialog, AlertDialogOverlay, AlertDialogContent, AlertDialogHeader, AlertDialogBody, AlertDialogFooter, Button |
| TaskFilters | apps/web/src/components/TaskFilters.tsx | Filter and sort controls (status, assignee, sort method) | Box, Flex, Select, Button, Menu, MenuButton, MenuList, MenuItem, Tag |
| BulkActionsBar | apps/web/src/components/BulkActionsBar.tsx | Bulk operation controls (complete, delete, assign) visible when tasks selected | Flex, Text, Button, Menu, MenuButton, MenuList, MenuItem, IconButton |
| DeletedTasksView | apps/web/src/components/DeletedTasksView.tsx | Special view for soft-deleted tasks with restore capability | Box, VStack, Text, Button, Badge |
| ArchivedTasksView | apps/web/src/components/ArchivedTasksView.tsx | Special view for archived tasks with restore capability (P3) | Box, VStack, Text, Button, Badge |

### Modified Components

| Component | Location | Changes | Chakra Components Added |
|-----------|----------|---------|-------------------------|
| TaskList | apps/web/src/components/TaskList.tsx | Add edit/delete buttons to each task, selection mode toggle, filter state integration | IconButton, Checkbox, Tooltip |
| TaskItem | apps/web/src/components/TaskItem.tsx | Add notes indicator icon, selection checkbox, edit/delete action buttons | Icon (MdOutlineNotes), Checkbox, IconButton (MdEdit, MdDelete) |
| TasksScreen | apps/web/src/screens/TasksScreen.tsx | Integrate TaskFilters component, BulkActionsBar, manage filter state | Box, VStack |

### New Custom Hooks

| Hook | Location | Purpose |
|------|----------|----------|
| useTaskFilters | apps/web/src/hooks/useTaskFilters.ts | Manage filter/sort state, URL sync, localStorage persistence |
| useTaskBulkActions | apps/web/src/hooks/useTaskBulkActions.ts | Manage bulk selection state, bulk action handlers |

### Service Layer Extensions

| Service | Location | New Functions |
|---------|----------|---------------|
| tasks.ts | apps/web/src/services/tasks.ts | `updateTask()`, `softDeleteTask()`, `restoreTask()`, `archiveTask()`, `bulkUpdateTasks()` |

**Component Architecture**:
```
TasksScreen
├── TaskFilters (status, assignee, sort controls)
├── BulkActionsBar (visible when selection active)
├── AddTask (existing, task creation form)
└── TaskList
    └── TaskItem[] (with edit/delete buttons, selection checkbox)

Modals (rendered at app level):
├── EditTaskModal (opened from TaskItem edit button)
└── DeleteTaskDialog (opened from TaskItem delete button)
```

## Complexity Tracking

**No Constitution violations** - Section left empty per template guidance ("Fill ONLY if Constitution Check has violations that must be justified").

All complexity is justified by user requirements:
- **Database extensions**: Minimal (3 columns) to existing table
- **Component count**: Reasonable given feature scope (9 user stories)
- **Client-side filtering**: Appropriate for MVP scale (100 tasks)
- **No premature optimization**: Deferring server-side filtering/pagination until scale requires it

## Security Considerations

- [x] New tables have RLS enabled (N/A - extending existing tasks table which already has RLS)
- [x] Edge functions validate JWT (N/A - no Edge Functions in this feature)
- [x] Admin-only features check role (N/A - task editing is member-level, not admin-gated)
- [x] No service role key exposure (frontend uses anon key + RLS policies only)
- [x] Tokens hashed before storage (N/A - no tokens in this feature)
- [x] CORS configured correctly (N/A - no new Edge Functions)
- [x] No PII in logs (task notes are user-controlled content; logging only task IDs)

**Additional Security Notes**:
- **Household Isolation**: Existing RLS policies on tasks table automatically apply to new columns (notes, deleted_at, archived_at)
- **SQL Injection**: Protected by Supabase client parameterized queries (no raw SQL from frontend)
- **XSS Prevention**: React's built-in XSS protection for rendering task notes (no `dangerouslySetInnerHTML`)
- **URL Auto-Linkification**: Use `react-linkify` or similar library with safe link rendering (opens in new tab with `rel="noopener noreferrer"`)
- **Authorization**: All operations require authenticated user (existing RLS policies enforce this)
- **Data Validation**: Database constraints enforce notes length (5000 chars max)
- **Soft Delete Integrity**: `deleted_at` timestamp prevents accidental data loss (can always be restored)
- **Bulk Action Security**: Each task in bulk operation validated against RLS individually

**Cross-Household Attack Vectors Mitigated**:
1. **Editing other household's tasks**: RLS UPDATE policy blocks (household_id must match membership)
2. **Viewing deleted tasks from other households**: RLS SELECT policy blocks (household_id must match)
3. **Restoring deleted tasks to different household**: RLS UPDATE check ensures household_id unchanged
4. **Bulk actions across households**: Each task validated individually by RLS

## Testing Plan

### Database Migration Testing

**Migration Application**:
```bash
# Apply migration locally
npx supabase migration new task_lifecycle
# Copy SQL from Database Design section above
npx supabase db reset
```

**RLS Verification Queries**:
```sql
-- Test 1: Reading tasks with new columns (same household)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
SELECT id, title, notes, deleted_at, archived_at FROM tasks WHERE household_id = 'household-a-uuid';
-- Expected: Returns tasks with new columns visible

-- Test 2: Cross-household access blocked (even with new columns)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO ' user-a-uuid';  -- User in household A
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';
-- Expected: 0 rows (RLS blocks cross-household regardless of columns)

-- Test 3: UPDATE notes (allowed for own household)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
UPDATE tasks SET notes = 'Test notes' WHERE id = 'task-in-household-a-uuid';
-- Expected: 1 row updated

-- Test 4: UPDATE notes (blocked for other household)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
UPDATE tasks SET notes = 'Test notes' WHERE id = 'task-in-household-b-uuid';
-- Expected: 0 rows updated (RLS blocks)

-- Test 5: Soft delete (set deleted_at)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
UPDATE tasks SET deleted_at = NOW() WHERE id = 'task-in-household-a-uuid';
-- Expected: 1 row updated, deleted_at now set

-- Test 6: Restore (clear deleted_at)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
UPDATE tasks SET deleted_at = NULL WHERE id = 'task-in-household-a-uuid';
-- Expected: 1 row updated, deleted_at now null

-- Test 7: Archive (set archived_at)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';
UPDATE tasks SET archived_at = NOW() WHERE id = 'task-in-household-a-uuid';
-- Expected: 1 row updated, archived_at now set
```

### Manual Testing Checklist

#### US1 - Edit Existing Task (P1)

- [ ] **Happy Path**:
  - [ ] Click edit button on task → EditTaskModal opens
  - [ ] Modal pre-populated with current task values (title, assignee, due date, notes)
  - [ ] Change title → Save → Task list shows updated title immediately
  - [ ] Change assignee → Save → Task shows new assignee
  - [ ] Change due date → Save → Task sorts correctly by new date
  - [ ] Change notes → Save → Notes icon appears on task
  - [ ] Click Cancel → Modal closes without saving changes
  
- [ ] **Error Scenarios**:
  - [ ] Empty title → Save disabled or shows validation error
  - [ ] Network error during save → Error toast shown, changes rollback
  - [ ] Concurrent edit (another user updates same task) → Warning message shown

- [ ] **Performance**:
  - [ ] Edit save round-trip completes in < 800ms
  - [ ] Optimistic UI update (immediate local change before server confirmation)

#### US2 - Delete Unwanted Tasks (P1)

- [ ] **Soft Delete**:
  - [ ] Click delete button → DeleteTaskDialog opens with confirmation prompt
  - [ ] Confirm deletion → Task disappears from default list
  - [ ] Check database → `deleted_at` timestamp set (not permanent DELETE)
  - [ ] Navigate to "Deleted Tasks" view → See deleted task with restore button
  
- [ ] **Restore**:
  - [ ] In "Deleted Tasks" view, click Restore → Task returns to active list
  - [ ] Check database → `deleted_at` now null
  - [ ] All original task details preserved (title, assignee, due date, notes)

- [ ] **Admin: Permanent Delete (P1)**:
  - [ ] As admin, view task deleted > 30 days ago
  - [ ] "Permanently Delete" button visible
  - [ ] Click → Confirmation dialog → Permanent DELETE from database
  - [ ] As member, "Permanently Delete" button not visible

- [ ] **Edge Cases**:
  - [ ] Delete task assigned to partner → Partner's "My Tasks" view updates
  - [ ] Attempt to edit task that was just deleted → Error message shown

#### US3 - View My Assigned Tasks (P1)

- [ ] **Filter Behavior**:
  - [ ] "My Tasks" quick filter prominently displayed
  - [ ] Click "My Tasks" → Only tasks assigned to current user shown
  - [ ] No assigned tasks → Empty state: "You're all caught up! 🎉"
  - [ ] Create task assigned to partner → Does not appear in "My Tasks"
  - [ ] Partner assigns task to me → Appears in "My Tasks" immediately (Realtime)
  
- [ ] **Filter Persistence**:
  - [ ] Apply "My Tasks" filter → Refresh page → Filter still active (localStorage)
  - [ ] Clear filter → Return to all household tasks

#### US4 - Sort Tasks by Due Date (P1)

- [ ] **Sort Behavior**:
  - [ ] Default sort: Due date ascending (earliest first)
  - [ ] Tasks with no due date appear at bottom
  - [ ] Tasks with same due date sub-sorted by created_at
  - [ ] Edit task due date → List re-sorts automatically
  
- [ ] **Sort Options**:
  - [ ] Click "Sort by" dropdown → Options visible: Due Date, Created Date, Title (A-Z), Assignee
  - [ ] Select "Created Date" → List re-sorts (oldest first)
  - [ ] Select "Title (A-Z)" → List re-sorts alphabetically
  - [ ] Select "Assignee" → List groups by assignee name
  
- [ ] **Sort Persistence**:
  - [ ] Change sort method → Refresh page → Sort preference remembered (localStorage)

#### US5 - Filter Tasks by Status (P1)

- [ ] **Status Filters**:
  - [ ] Default view: "Active Only" (incomplete tasks only)
  - [ ] Toggle "Show Completed" → Completed tasks appear (with strikethrough style)
  - [ ] Select "Completed Only" → Only completed tasks shown
  - [ ] Select "All Tasks" → Both incomplete and completed shown
  
- [ ] **Filter Interaction**:
  - [ ] Mark task complete with "Active Only" filter → Task disappears
  - [ ] Mark task complete with "Show Completed" enabled → Task updates to strikethrough
  - [ ] Mark task incomplete with "Completed Only" filter → Task disappears from view

#### US6 - Filter Tasks by Assignee (P2)

- [ ] **Assignee Filter**:
  - [ ] Click "Filter by Assignee" → Dropdown shows all household members + "Unassigned"
  - [ ] Select partner name → Only partner's tasks shown
  - [ ] Select "Unassigned" → Only unassigned tasks shown
  - [ ] Reassign visible task to different member → Task disappears from filtered view
  
- [ ] **Filter Combination**:
  - [ ] Apply "My Tasks" + "Active Only" → Both filters work together (intersection)
  - [ ] Apply "Assignee: Alice" + "Completed Only" → Both filters work together

#### US7 - Add Task Notes/Description (P2)

- [ ] **Notes UI**:
  - [ ] Create task → "Add Notes" field visible (collapsed by default)
  - [ ] Expand "Add Notes" → Multi-line textarea rendered
  - [ ] Enter notes with line breaks → Line breaks preserved on save
  - [ ] Paste URL → URL auto-linkified in task detail view (clickable link)
  - [ ] Notes > 5000 chars → Validation error shown
  
- [ ] **Notes Display**:
  - [ ] Task with notes → Note icon indicator visible in list
  - [ ] Click task with notes → Notes displayed in detail view
  - [ ] Edit notes → Save → Updated notes displayed
  - [ ] Clear notes → Save → Note icon disappears

#### US8 - Bulk Complete Tasks (P2)

- [ ] **Bulk Selection**:
  - [ ] Click "Select Mode" → Checkboxes appear next to each task
  - [ ] Check 3 tasks → Selection count shown: "3 tasks selected"
  - [ ] Click "Select All" → All visible tasks (respecting filters) selected
  - [ ] Exit select mode → Checkboxes disappear, selections cleared
  
- [ ] **Bulk Actions**:
  - [ ] Select 5 incomplete tasks → Click "Complete Selected" → All 5 marked complete
  - [ ] Select 3 tasks → Click "Delete Selected" → Confirmation dialog → All 3 soft-deleted
  - [ ] Select tasks including already-completed → Bulk complete → Already-completed skipped
  - [ ] Success message reflects actual count: "3 tasks marked complete" (not 5 if 2 already complete)
  
- [ ] **Performance**:
  - [ ] Bulk complete 50 tasks → Completes in < 2 seconds
  - [ ] Bulk delete 20 tasks → Completes in < 1 second

#### US9 - Archive Completed Tasks (P3)

- [ ] **Archive Action**:
  - [ ] View completed tasks → "Archive All Completed" button visible
  - [ ] Click "Archive All Completed" → All completed tasks archived
  - [ ] Check database → `archived_at` timestamp set on archived tasks
  - [ ] View task list with "Show Completed" enabled → Archived tasks not shown
  
- [ ] **Archived Tasks View**:
  - [ ] Navigate to "Archived Tasks" (in Settings/More) → See all archived tasks
  - [ ] Click "Restore to Active" → Task returns to completed status
  - [ ] Check database → `archived_at` now null
  
- [ ] **Auto-Archive (P3, Admin)**:
  - [ ] As admin, view archive settings
  - [ ] Configure "Auto-archive tasks completed over 90 days ago"
  - [ ] Trigger auto-archive (cron job or manual) → Old completed tasks archived

### Edge Case Testing

- [ ] **Concurrent Updates**:
  - [ ] User A and User B both open edit modal for same task
  - [ ] User A saves first → User B saves second → Warning shown to User B
  - [ ] User B's changes applied (last-write-wins with notification)

- [ ] **Deleted Task Edge Cases**:
  - [ ] User A deletes task → User B tries to edit same task → Error: "Task deleted. Refresh to see current tasks."
  - [ ] Restore task whose assignee left household → Task restored as "Unassigned"

- [ ] **Filter Empty States**:
  - [ ] Apply filter with zero results → Empty state: "No tasks match your filters. Try adjusting filters or create a new task."
  - [ ] "My Tasks" with no assigned tasks → Empty state: "You're all caught up! 🎉"

- [ ] **Sort Edge Cases**:
  - [ ] Sort by due date with all tasks having no due date → Falls back to created_at sort
  - [ ] Sort by assignee with mostly unassigned tasks → Unassigned group appears first or last (consistent)

### Performance Testing

- [ ] **Task List Rendering**:
  - [ ] Task list with 100 items renders in < 1.5 seconds
  - [ ] Apply filter (status/assignee) → Results update in < 1 second
  - [ ] Change sort method → List re-renders in < 500ms

- [ ] **Task Operations**:
  - [ ] Edit task save round-trip: < 800ms (p95)
  - [ ] Soft delete operation: < 500ms (p95)
  - [ ] Bulk complete 50 tasks: < 2 seconds

### Real-time Updates Testing

- [ ] **Multi-User Sync**:
  - [ ] User A and User B both viewing task list (same household)
  - [ ] User A edits task → User B sees update within 500ms (Supabase Realtime)
  - [ ] User A deletes task → User B sees task disappear immediately
  - [ ] User A reassigns task to User B → Task appears in User B's "My Tasks" immediately

### Final Validation

**Pre-Merge Checklist**:
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes without warnings
- [ ] All manual test scenarios pass (94 checkboxes above)
- [ ] RLS verification queries pass (7/7 tests)
- [ ] No console errors in browser
- [ ] Migration README updated (supabase/migrations/README.md)
- [ ] JSDoc comments added to new service functions
- [ ] PROJECT_TRACKER.md updated with Phase 6 completion
- [ ] PRD Phase 6 requirements marked complete

**Success Criteria Validation** (from spec.md):
- [ ] **SC-001**: Users can edit and save task changes in < 10 seconds (p95) ✓
- [ ] **SC-002**: Zero cross-household task modifications (RLS tests pass) ✓
- [ ] **SC-003**: Task deletion confirmation prevents 100% accidental permanent deletions ✓
- [ ] **SC-004**: "My Tasks" filter increases task completion rate (measured post-deployment) ✓
- [ ] **SC-005**: Task list (100 items) renders and filters in < 1 second (p95) ✓
- [ ] **SC-006**: 90% of users edit tasks successfully on first attempt ✓
- [ ] **SC-007**: Bulk complete (50 tasks) processes in < 2 seconds ✓
- [ ] **SC-008**: Real-time updates appear within 500ms ✓
- [ ] **SC-009**: Deleted task restore success rate 100% (no data loss) ✓
- [ ] **SC-010**: User feedback reports reduced frustration (qualitative survey) ✓
