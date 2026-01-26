# Feature Specification: Planner MVP (Task Management)

**Feature Branch**: `005-planner-mvp`  
**Created**: 2026-01-25  
**Status**: Draft  
**Input**: User description: "Implement a basic task management system for household members that allows them to create, view, and complete shared tasks. Tasks must be isolated by household with proper RLS policies ensuring members can only access tasks belonging to their household. Include core fields (title, status, household_id) and optional fields for assignment and due dates. Integrate the task interface into the main app shell."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Household Tasks (Priority: P0)

All household members can view a shared list of tasks belonging to their household. The task list serves as the central location for tracking what needs to be done, showing task titles and completion status at a glance.

**Why this priority**: Core MVP functionality - users cannot manage tasks without first being able to view them. This is the foundation that all other task features build upon.

**Independent Test**: Can be fully tested by creating a household, adding tasks to the database, and verifying members see only their household's tasks in a clear list view.

**Acceptance Scenarios**:

1. **Given** Alice is a member of household "Home", **When** she navigates to the tasks view, **Then** she sees all tasks belonging to household "Home" displayed in a list
2. **Given** Bob is a member of household "Apartment", **When** he views the task list, **Then** he sees ONLY tasks from "Apartment" and NO tasks from other households
3. **Given** a household has zero tasks, **When** a member views the task list, **Then** they see an empty state message indicating no tasks exist yet
4. **Given** a household has 10 tasks (5 complete, 5 incomplete), **When** a member views the list, **Then** all 10 tasks are displayed with clear visual distinction between complete and incomplete

---

### User Story 2 - Create New Tasks (Priority: P0)

Any household member can quickly add a new task to their household's shared list by providing a task title. The new task appears immediately in the task list for all household members.

**Why this priority**: Essential for MVP - without task creation, the task list remains empty and provides no value. Must be available to all members (not admin-only) to enable collaborative task management.

**Independent Test**: Can be tested by logging in as any household member, adding a task with a title, and verifying it appears in the task list for all members of that household.

**Acceptance Scenarios**:

1. **Given** Chris is a member of a household, **When** he creates a task with title "Buy groceries", **Then** the task appears in the household task list immediately with status "incomplete"
2. **Given** Diana creates a task in household "Home", **When** another member Emma views the task list, **Then** Emma sees Diana's newly created task
3. **Given** a user attempts to create a task with an empty title, **When** they submit the form, **Then** they see a validation error and the task is not created
4. **Given** a user creates a task, **When** the task is successfully saved, **Then** the creation form clears and is ready for adding another task

---

### User Story 3 - Complete Tasks (Priority: P0)

Household members can mark tasks as complete to indicate they are done. Completed tasks remain visible in the list with clear visual indication of completion status, allowing members to see both what needs to be done and what has been accomplished.

**Why this priority**: Core task lifecycle management - marking tasks complete is equally important as creating them. Without completion functionality, task lists grow indefinitely without clear progress tracking.

**Independent Test**: Can be tested by creating a task, marking it complete, and verifying the status change is reflected immediately in the UI for all household members.

**Acceptance Scenarios**:

1. **Given** Frank sees a task "Clean kitchen" with status incomplete, **When** he marks it as complete, **Then** the task status updates to complete and shows visual indication (e.g., strikethrough, checkmark)
2. **Given** Grace marks a task complete in household "Home", **When** another member Hugo views the task list, **Then** Hugo sees the task with completed status
3. **Given** a task is marked complete, **When** a member wants to revert it, **Then** they can mark it as incomplete again (toggle behavior)
4. **Given** a household has 5 complete and 3 incomplete tasks, **When** a member views the list, **Then** they can visually distinguish completed tasks from incomplete tasks at a glance

---

### User Story 4 - Task Assignment (Priority: P1)

Household members can optionally assign tasks to specific members of their household. Assigned tasks display who is responsible for completion, helping coordinate work distribution among household members.

**Why this priority**: Important for multi-person households to coordinate responsibilities, but not blocking for MVP launch. Users can manage tasks without assignment by using task titles to indicate ownership (e.g., "Alice: Buy groceries").

**Independent Test**: Can be tested by creating a task, assigning it to a specific household member, and verifying the assignment is displayed in the task list.

**Acceptance Scenarios**:

1. **Given** Ian creates a task "Take out trash", **When** he assigns it to household member Jane, **Then** the task displays Jane as the assignee
2. **Given** a task is unassigned, **When** a member views it, **Then** it shows no assignee or "Unassigned" indicator
3. **Given** a task assigned to member A, **When** another member changes the assignment to member B, **Then** the task now shows member B as assignee
4. **Given** a household has 3 members, **When** assigning a task, **Then** the member can select from all household members or leave unassigned

---

### User Story 5 - Due Dates (Priority: P1)

Members can optionally set due dates on tasks to track deadlines and time-sensitive work. Tasks display their due dates in the list view, helping members prioritize work based on urgency.

**Why this priority**: Helpful for time-sensitive tasks but not essential for basic task tracking. Users can work around this by including dates in task titles (e.g., "Buy milk by Friday"). Can be added after MVP launch if time permits.

**Independent Test**: Can be tested by creating a task with a due date, verifying it displays in the task list, and confirming tasks without due dates still function normally.

**Acceptance Scenarios**:

1. **Given** Kelly creates a task "Pay rent", **When** she sets due date to "2026-02-01", **Then** the task displays the due date in the list view
2. **Given** a task has no due date, **When** a member views it, **Then** it shows no due date indicator or "No due date" text
3. **Given** a task is past its due date, **When** a member views the list, **Then** the task has visual indication it is overdue (e.g., red text, warning icon)
4. **Given** a task with a due date, **When** a member wants to remove it, **Then** they can clear the due date field to make it unspecified

---

### Edge Cases

- **Cross-household isolation**: What happens when a user tries to access tasks from a different household? (Must be blocked by RLS policies - user should only see their own household's tasks)
- **No household membership**: What happens if a user without a household tries to access the tasks view? (Should be redirected to setup/join flow via existing route guard logic)
- **Concurrent updates**: What happens when two members mark the same task complete simultaneously? (Last write wins - both see the completed state, no data corruption)
- **Empty task list**: What happens when a household has zero tasks? (Display empty state message: "No tasks yet. Create your first task to get started!")
- **Assignment to former member**: What happens if a task is assigned to a member who later leaves the household? (Task remains assigned - shows member name or ID even if no longer in household. Out of scope for MVP: handling member removal)
- **Network errors**: What happens if task creation/update fails due to network issues? (Display error message to user, do not update UI optimistically until confirmed by server)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST store tasks with required fields: household_id (UUID reference), title (text), status (enum: incomplete/complete), created_at (timestamp)
- **FR-002**: System MUST allow any authenticated household member to create tasks for their household
- **FR-003**: System MUST allow any authenticated household member to view all tasks belonging to their household
- **FR-004**: System MUST allow any authenticated household member to update task status (mark complete/incomplete)
- **FR-005**: System MUST display tasks in a list view showing title and completion status at minimum
- **FR-006**: System MUST integrate task list view into the main app interface (replacing placeholder content in AppShell)
- **FR-007**: System MUST validate task title is non-empty before allowing creation
- **FR-008**: System SHOULD support optional assigned_to field (UUID reference to household_members.user_id)
- **FR-009**: System SHOULD support optional due_date field (date)
- **FR-010**: System SHOULD visually distinguish completed tasks from incomplete tasks in the list view (e.g., strikethrough text, checkmark icon, reduced opacity)

### Security Requirements

- **SR-001**: System MUST enforce household isolation via RLS policies ensuring zero cross-household data access under any circumstances
- **SR-002**: System MUST validate user is authenticated before allowing any task operations (create/read/update)
- **SR-003**: System MUST verify user is a member of a household before allowing task creation/updates
- **SR-004**: Task queries MUST use RLS policies to filter by household_id automatically based on authenticated user's household membership

### Key Entities

- **tasks** (NEW): Represents a to-do item for a household
  - **Primary Key**: id (UUID, auto-generated)
  - **Required Fields**:
    - household_id (UUID, foreign key to households.id) - isolates tasks by household
    - title (text, max 500 characters) - what needs to be done
    - status (enum: 'incomplete' | 'complete') - completion state
    - created_at (timestamp with timezone, auto-generated) - when task was created
  - **Optional Fields** (P1):
    - assigned_to (UUID, foreign key to household_members.user_id) - who is responsible
    - due_date (date) - when task should be completed by
  - **Relationships**:
    - Belongs to ONE household (via household_id)
    - Optionally assigned to ONE household member (via assigned_to)
  - **RLS**: Members can read/write tasks for their household only

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Household members can view their task list in under 2 seconds from clicking the tasks navigation link (initial page load)
- **SC-002**: Zero cross-household data exposure verified through RLS testing - members cannot access tasks from other households under any circumstances
- **SC-003**: Users can create a new task and see it appear in the list within 1 second of submission (round-trip time)
- **SC-004**: Task completion status updates are reflected in the UI for all household members within 2 seconds (including other open browser tabs)
- **SC-005**: 95% of users successfully create their first task on first attempt without validation errors or form submission failures
- **SC-006**: Task list remains functional with up to 100 tasks per household (acceptable performance, no UI degradation)
