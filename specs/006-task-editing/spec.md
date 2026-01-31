# Feature Specification: Task Lifecycle Enhancement

**Feature Branch**: `006-task-editing`  
**Created**: 2026-01-26  
**Status**: Draft  
**Input**: User description: "Enable full task lifecycle management including editing, deleting, sorting, and filtering tasks"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Edit Existing Task (Priority: P1)

A household member realizes a task needs changes after creation—the due date shifted, it should be assigned to someone else, or the title needs correction. They should be able to update any task detail without deleting and recreating it.

**Why this priority**: Currently, users cannot modify tasks after creation, forcing them to delete and recreate tasks when details change. This is the most critical missing capability blocking daily use.

**Independent Test**: Create a task, click edit, change the title, assignee, and due date, save changes, and verify all fields update correctly in the task list.

**Acceptance Scenarios**:

1. **Given** I am viewing my household's task list, **When** I click the edit button on a task, **Then** I see a form pre-populated with current task details
2. **Given** I am editing a task, **When** I change the title and click save, **Then** the task list shows the updated title immediately
3. **Given** I am editing a task, **When** I change the assignee from myself to my partner, **Then** the task appears in my partner's "My Tasks" view
4. **Given** I am editing a task, **When** I change the due date to tomorrow, **Then** the task sorts correctly by the new date
5. **Given** I am editing a task, **When** I click cancel, **Then** no changes are saved and the original task data remains
6. **Given** I am editing a task assigned to me, **When** I reassign it to someone else, **Then** I receive confirmation of the reassignment
7. **Given** I am a household member, **When** I try to edit a task in my household, **Then** I have permission to modify any household task (not restricted to my own tasks)

---

### User Story 2 - Delete Unwanted Tasks (Priority: P1)

Users need to remove tasks that are no longer relevant—a duplicate entry, a cancelled plan, or an obsolete recurring task. Deletion should be safe and reversible to prevent accidental data loss.

**Why this priority**: Without deletion, the task list becomes cluttered with irrelevant items, reducing trust in the system and making it harder to focus on actual work.

**Independent Test**: Create a task, delete it, verify it disappears from the default task list, navigate to archived/deleted view, and restore it if needed.

**Acceptance Scenarios**:

1. **Given** I am viewing a task, **When** I click the delete button, **Then** I see a confirmation dialog asking "Are you sure you want to delete this task?"
2. **Given** I confirm deletion, **When** the task is deleted, **Then** it is soft-deleted (marked as deleted in database, not permanently removed)
3. **Given** I have deleted a task, **When** I view the default task list, **Then** the deleted task does not appear
4. **Given** I have deleted a task, **When** I navigate to "Deleted Tasks" view, **Then** I can see all deleted tasks with a "Restore" option
5. **Given** I am viewing a deleted task, **When** I click restore, **Then** the task returns to the active task list with all original details intact
6. **Given** I am an admin, **When** I view deleted tasks, **Then** I see a "Permanently Delete" option for items older than 30 days

---

### User Story 3 - View My Assigned Tasks (Priority: P1)

When a household member opens the app, they want to immediately see tasks assigned to them without manually filtering through everyone's tasks. This "My Tasks" view becomes their personal command center.

**Why this priority**: Users report being overwhelmed by seeing all household tasks. A personalized view increases task completion rates by reducing cognitive load.

**Independent Test**: Assign 3 tasks to yourself, 2 to your partner, click "My Tasks" filter, and verify only your 3 tasks appear.

**Acceptance Scenarios**:

1. **Given** I am logged in, **When** I navigate to the tasks screen, **Then** I see a "My Tasks" quick filter prominently displayed
2. **Given** I click "My Tasks", **When** the filter is applied, **Then** I see only tasks assigned to me
3. **Given** I have no assigned tasks, **When** I view "My Tasks", **Then** I see an encouraging empty state: "You're all caught up! 🎉"
4. **Given** I am viewing "My Tasks", **When** a partner assigns a new task to me, **Then** it appears in my list immediately via real-time updates
5. **Given** I am viewing "My Tasks", **When** I complete a task, **Then** it updates to completed status (remains visible if "show completed" is enabled)
6. **Given** "My Tasks" is active, **When** I clear the filter, **Then** I return to viewing all household tasks

---

### User Story 4 - Sort Tasks by Due Date (Priority: P1)

Users need to see which tasks are most urgent. Tasks should default to due-date order (earliest first) so members can prioritize work effectively.

**Why this priority**: Without sorting, users cannot identify urgent tasks quickly, leading to missed deadlines and reduced trust in the system.

**Independent Test**: Create 5 tasks with different due dates, observe they automatically sort with nearest deadline first, change a due date via edit, and verify re-sorting.

**Acceptance Scenarios**:

1. **Given** I am viewing the task list, **When** tasks load, **Then** they are sorted by due date with earliest due date appearing first
2. **Given** tasks are sorted by due date, **When** a task has no due date, **Then** it appears at the bottom of the list
3. **Given** I am viewing sorted tasks, **When** I edit a task's due date, **Then** the list re-sorts automatically to maintain due-date order
4. **Given** multiple tasks have the same due date, **When** viewing the list, **Then** they are sub-sorted by creation time (oldest first)
5. **Given** I am viewing the task list, **When** I click a "Sort by" dropdown, **Then** I can choose alternative sorting: "Due Date" (default), "Created Date", "Title (A-Z)", or "Assignee"
6. **Given** I change the sort method, **When** I leave and return to the task list, **Then** my sort preference is remembered

---

### User Story 5 - Filter Tasks by Status (Priority: P1)

Users want to toggle between viewing incomplete tasks (active work), completed tasks (recent accomplishments), or all tasks (full context). This helps them focus or review progress.

**Why this priority**: Seeing completed tasks mixed with active work creates visual clutter. Filtering by status is essential for daily task management.

**Independent Test**: Create and complete 2 tasks, create 3 incomplete tasks, toggle "Show Completed" filter, and verify display changes correctly.

**Acceptance Scenarios**:

1. **Given** I am viewing the task list, **When** the page loads, **Then** the default view shows only incomplete tasks
2. **Given** I am viewing incomplete tasks, **When** I toggle "Show Completed", **Then** completed tasks appear in the list (likely in a visually distinct style with strikethrough)
3. **Given** I am viewing all tasks (completed + incomplete), **When** I toggle "Hide Completed", **Then** only incomplete tasks remain visible
4. **Given** I have filtered to show only completed tasks, **When** I mark a task as incomplete, **Then** it disappears from the completed-only view
5. **Given** I am viewing the task list, **When** I select "Completed Only" from a status filter, **Then** I see only completed tasks (useful for reviewing accomplishments)

---

### User Story 6 - Filter Tasks by Assignee (Priority: P2)

In multi-member households, users want to see tasks assigned to a specific person (e.g., "Show me all of Sarah's tasks" or "Show me unassigned tasks"). This supports accountability and workload visibility.

**Why this priority**: Important for household coordination and fairness tracking, but less critical than personal "My Tasks" view. Can be deferred if time-constrained.

**Independent Test**: Assign tasks to 3 different household members and "unassigned", filter by one member's name, verify only their tasks appear.

**Acceptance Scenarios**:

1. **Given** I am viewing the task list, **When** I click "Filter by Assignee", **Then** I see a dropdown with all household members plus "Unassigned"
2. **Given** I select my partner from the assignee filter, **When** the filter is applied, **Then** only tasks assigned to my partner are visible
3. **Given** I filter by "Unassigned", **When** viewing the list, **Then** I see only tasks with no assignee set
4. **Given** I have applied an assignee filter, **When** I reassign a visible task to someone else, **Then** it disappears from the filtered view
5. **Given** assignee filter is active, **When** I combine it with "My Tasks", **Then** both filters apply (intersection: my tasks only)

---

### User Story 7 - Add Task Notes/Description (Priority: P2)

Some tasks need additional context beyond the title—instructions, links, shopping list details, or reminders. Users should be able to add optional notes when creating or editing tasks.

**Why this priority**: Enhances task completeness but is not blocking daily use. Many tasks work fine with just a title.

**Independent Test**: Create a task with multi-line notes, save, edit to update notes, and verify notes display correctly when viewing task details.

**Acceptance Scenarios**:

1. **Given** I am creating a new task, **When** I expand the "Add Notes" field, **Then** I can enter multi-line text with basic formatting preserved
2. **Given** I am editing a task, **When** I add or update the notes field, **Then** the notes are saved with the task
3. **Given** a task has notes, **When** viewing the task list, **Then** I see a note icon indicator on tasks with notes
4. **Given** I click on a task with notes, **When** viewing task details, **Then** the notes are displayed in a scrollable area
5. **Given** I am adding notes, **When** I paste a URL, **Then** it is automatically converted to a clickable link (basic markdown support)

---

### User Story 8 - Bulk Complete Tasks (Priority: P2)

Users completing multiple related tasks (e.g., weekly chores) want to mark several done at once instead of clicking each individually. This saves time and reduces friction.

**Why this priority**: Nice efficiency gain but not essential. Can be deferred to later if scope needs trimming.

**Independent Test**: Select 5 incomplete tasks via checkboxes, click "Mark as Complete", and verify all 5 transition to completed status simultaneously.

**Acceptance Scenarios**:

1. **Given** I am viewing the task list, **When** I enable "Select Mode", **Then** checkboxes appear next to each task
2. **Given** I am in select mode, **When** I check 3 tasks and click "Complete Selected", **Then** all 3 tasks are marked as complete in one action
3. **Given** I have selected tasks, **When** I click "Delete Selected", **Then** all selected tasks are soft-deleted with one confirmation dialog
4. **Given** I am in select mode, **When** I click "Select All", **Then** all visible tasks (respecting current filters) are selected
5. **Given** I have selected tasks, **When** I exit select mode without acting, **Then** selections are cleared and checkboxes disappear

---

### User Story 9 - Archive Completed Tasks (Priority: P3)

Over time, completed tasks accumulate and clutter views. Users should be able to archive old completed tasks (move them out of default views) while keeping records for history/audit purposes.

**Why this priority**: Quality-of-life feature for long-term users but not needed for initial launch. Most users are fine with simple completed/incomplete toggle.

**Independent Test**: Complete 10 tasks, archive tasks older than 30 days, verify they disappear from "Show Completed" view but remain accessible in "Archived Tasks" section.

**Acceptance Scenarios**:

1. **Given** I am viewing completed tasks, **When** I select "Archive All Completed", **Then** all completed tasks are moved to archived status
2. **Given** I have archived tasks, **When** I view the default task list (even with "Show Completed" enabled), **Then** archived tasks do not appear
3. **Given** I navigate to "Settings" or "More", **When** I click "Archived Tasks", **Then** I see a dedicated view of all archived items
4. **Given** I am viewing archived tasks, **When** I click "Restore to Active", **Then** the task returns to the completed task list
5. **Given** I am an admin, **When** viewing archive settings, **Then** I can configure auto-archive rules (e.g., "Archive tasks completed over 90 days ago")

---

### Edge Cases

- **What happens when editing a task that was just deleted by another household member?**  
  The edit should fail gracefully with a message: "This task has been deleted. Refresh to see current tasks."

- **What happens when two users edit the same task simultaneously?**  
  Last-write-wins with optimistic UI updates. If a conflict occurs, the second user sees: "This task was recently updated. Please review changes and try again."

- **What happens when filtering/sorting with zero results?**  
  Display encouraging empty state: "No tasks match your filters. Try adjusting filters or create a new task."

- **What happens when a user deletes the last task assigned to another member?**  
  The assignee's "My Tasks" view shows the empty state. No special notification required.

- **What happens when trying to bulk-complete tasks including already-completed ones?**  
  Already-completed tasks are skipped silently. Success message reflects actual changed count: "3 tasks marked complete."

- **What happens when restoring a deleted task whose assignee has since left the household?**  
  The task is restored as "Unassigned" with a note: "Original assignee no longer in household."

- **What happens when sorting by due date and all tasks have no due date?**  
  Fall back to sorting by created date (oldest first) to maintain consistent ordering.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow household members to edit any task within their household, modifying title, assignee, due date, and notes fields
- **FR-002**: System MUST pre-populate the edit form with current task values and clearly indicate which fields are editable
- **FR-003**: System MUST validate edited task data (title required, due date format, assignee is valid household member) before saving
- **FR-004**: System MUST soft-delete tasks (set `deleted_at` timestamp) rather than permanently removing records from the database
- **FR-005**: System MUST hide soft-deleted tasks from default task list views while retaining data for potential restore or audit
- **FR-006**: System MUST provide a "Deleted Tasks" view accessible to all household members showing soft-deleted tasks with restore capability
- **FR-007**: System MUST allow admins to permanently delete tasks that have been soft-deleted for over 30 days
- **FR-008**: System MUST provide a "My Tasks" quick filter that shows only tasks assigned to the current user
- **FR-009**: System MUST sort tasks by due date (earliest first) by default, with null due dates appearing last
- **FR-010**: System MUST support alternative sort methods: Created Date, Title (alphabetical), Assignee name
- **FR-011**: System MUST persist user's chosen sort preference across sessions using browser local storage or user settings
- **FR-012**: System MUST provide status filters: "Active Only" (default), "Completed Only", "All Tasks"
- **FR-013**: System MUST provide assignee filter showing all household members plus "Unassigned" option
- **FR-014**: System MUST allow combining multiple filters (e.g., "My Tasks" + "Active Only" + specific sort)
- **FR-015**: System MUST add an optional `notes` text field to tasks table, supporting multi-line text up to 5000 characters
- **FR-016**: System MUST preserve line breaks and basic formatting in task notes (display as entered)
- **FR-017**: System MUST auto-linkify URLs in task notes (convert to clickable links)
- **FR-018**: System MUST provide bulk selection mode enabling users to select multiple tasks via checkboxes
- **FR-019**: System MUST support bulk actions: "Complete Selected", "Delete Selected", "Assign Selected to [Member]"
- **FR-020**: System MUST show selection count and available bulk actions when tasks are selected
- **FR-021**: System MUST add `archived_at` timestamp field to tasks table for archival functionality
- **FR-022**: System MUST hide archived tasks from default views (even when "Show Completed" is enabled)
- **FR-023**: System MUST provide dedicated "Archived Tasks" view showing all archived items with restore capability
- **FR-024**: System MUST support manual archive action on completed tasks and optional auto-archive rules (admin-configurable)
- **FR-025**: System MUST update task `updated_at` timestamp whenever any field is modified for audit trail
- **FR-026**: System MUST show real-time updates when other household members edit, delete, or reassign tasks (Supabase Realtime)
- **FR-027**: System MUST handle optimistic UI updates (immediate local update with server confirmation/rollback on error)

### Security Requirements

- **SR-001**: All task edit operations MUST enforce household isolation via RLS policies (users can only edit tasks in their household)
- **SR-002**: Task deletion MUST verify the authenticated user is a member of the household owning the task
- **SR-003**: Permanent deletion MUST be restricted to admin role only and require household ownership verification
- **SR-004**: Bulk action endpoints MUST validate household membership for every task in the selection
- **SR-005**: System MUST prevent cross-household task modification attempts and log such attempts as potential security incidents
- **SR-006**: Restored tasks MUST maintain their original household_id to prevent cross-household data leakage

### Key Entities

**Existing Entity Extensions**:

- **tasks** (extended):
  - Add `notes` (TEXT, nullable, max 5000 chars)
  - Add `deleted_at` (TIMESTAMP WITH TIME ZONE, nullable)
  - Add `archived_at` (TIMESTAMP WITH TIME ZONE, nullable)
  - Ensure `updated_at` trigger fires on any field change
  - Add index on `deleted_at` for efficient filtering
  - Add index on `archived_at` for efficient filtering
  - Add index on `(household_id, assigned_to, status)` for filter performance

**New Entity** (if implementing user preferences):

- **user_task_preferences**:
  - `user_id` (FK to profiles, PK)
  - `default_sort` (ENUM: due_date, created_date, title, assignee)
  - `show_completed` (BOOLEAN, default false)
  - `tasks_per_page` (INTEGER, default 50)
  - Represents: User-specific UI preferences for task list views
  - Relationship: One per user (not per household—global user preference)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can edit and save task changes in under 10 seconds from click to confirmation (95th percentile)
- **SC-002**: Zero cross-household task modifications observed in post-deployment audit logs
- **SC-003**: Task deletion confirmation dialog prevents 100% of accidental permanent deletions (all deletions are soft-deletes requiring restore or admin action)
- **SC-004**: "My Tasks" filter increases daily task completion rate by at least 15% (measured via analytics comparing before/after)
- **SC-005**: Task list with 100 items renders and responds to filter changes in under 1 second (p95)
- **SC-006**: 90% of users who edit tasks successfully save changes on first attempt without validation errors
- **SC-007**: Bulk complete action processes up to 50 tasks in under 2 seconds
- **SC-008**: Real-time updates (another user's edit) appear in local UI within 500ms of database commit
- **SC-009**: Deleted task restore success rate is 100% (no data loss during soft-delete/restore cycle)
- **SC-010**: Users report reduced frustration with task management in post-feature user feedback (qualitative metric via survey)
