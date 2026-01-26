# Data Model: Task Lifecycle Enhancement

**Feature**: 006-task-editing  
**Created**: 2026-01-26  
**Database**: PostgreSQL (Supabase)

## Overview

This feature extends the existing `tasks` table with additional columns to support task editing, soft deletion, archiving, and notes. No new tables are created—all changes are additive to the existing schema.

## Schema Changes

### Extended Table: `tasks`

**New Columns**:

| Column | Type | Nullable | Default | Constraints | Purpose |
|--------|------|----------|---------|-------------|---------|
| `notes` | TEXT | YES | NULL | `CHECK (char_length(notes) <= 5000)` | Optional multi-line task notes/description |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | — | Soft-delete timestamp (null = active, not null = deleted) |
| `archived_at` | TIMESTAMPTZ | YES | NULL | — | Archive timestamp (null = active/deleted, not null = archived) |

**Complete Table Schema (after migration)**:

```sql
create table if not exists public.tasks (
  -- Existing columns (from migration 009)
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 500),
  status text not null default 'incomplete' check (status in ('incomplete', 'complete')),
  assigned_to uuid references public.profiles(user_id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  
  -- New columns (migration 010)
  notes text check (char_length(notes) <= 5000),
  deleted_at timestamptz,
  archived_at timestamptz
);
```

### Indexes

**New Indexes**:

```sql
-- Partial index for soft-deleted tasks (only indexes deleted tasks)
create index if not exists tasks_deleted_at_idx 
  on public.tasks(deleted_at) 
  where deleted_at is not null;

-- Partial index for archived tasks (only indexes archived tasks)
create index if not exists tasks_archived_at_idx 
  on public.tasks(archived_at) 
  where archived_at is not null;

-- Composite index for common filter combinations (household + assignee + status)
-- Excludes deleted and archived tasks for main view performance
create index if not exists tasks_household_assigned_status_idx 
  on public.tasks(household_id, assigned_to, status) 
  where deleted_at is null and archived_at is null;
```

**Existing Indexes** (no changes):
- `tasks_household_id_idx` on `household_id` (from migration 009)
- `tasks_assigned_to_idx` on `assigned_to` (from migration 009)

**Index Rationale**:
- **Partial indexes**: Only index non-null values for `deleted_at` and `archived_at` to save space and improve performance (most tasks are active)
- **Composite index**: Supports common query pattern: "Get active tasks for household X, assigned to user Y, with status Z"
- **WHERE clause**: Excludes deleted/archived tasks from main index to keep it lean for default view queries

## Data States

### Task Lifecycle States

A task can be in one of four states based on `deleted_at` and `archived_at`:

| State | `deleted_at` | `archived_at` | Visible In | Actions Available |
|-------|--------------|---------------|------------|-------------------|
| **Active** | NULL | NULL | Default task list | Edit, Complete, Delete, Archive (if completed) |
| **Deleted** | NOT NULL | NULL | "Deleted Tasks" view | Restore, Permanently Delete (admin, 30+ days) |
| **Archived** | NULL | NOT NULL | "Archived Tasks" view | Restore to Completed |
| **Deleted + Archived** | NOT NULL | NOT NULL | "Deleted Tasks" view | Restore (clears both timestamps) |

**State Transitions**:

```
         ┌─────────────┐
         │   Active    │
         │ (default)   │
         └──────┬──────┘
                │
       ┌────────┼────────┐
       │                 │
    Delete           Archive
       │             (if complete)
       ▼                 │
┌─────────────┐         ▼
│   Deleted   │   ┌──────────────┐
│ (soft)      │   │   Archived   │
└──────┬──────┘   └──────┬───────┘
       │                 │
    Restore          Restore
       │                 │
       └────────┬────────┘
                ▼
         ┌─────────────┐
         │   Active    │
         │ (restored)  │
         └─────────────┘
```

### Notes Field

**Format**: Multi-line plain text (no rich text formatting in MVP)

**Auto-Linkification**: URLs in notes are automatically converted to clickable links in the UI (using `react-linkify` or similar library)

**Examples**:
```
"Pick up Sarah from school at 3pm
Call dentist to reschedule: (555) 123-4567"

"Buy groceries:
- Milk
- Eggs
- Bread
https://www.example.com/grocery-list"
```

## RLS Policies

**No new RLS policies required** - existing `tasks` table policies automatically apply to new columns.

**Existing Policies** (apply to all columns including `notes`, `deleted_at`, `archived_at`):

- **`tasks_select_members`**: Members can read tasks where `household_id` matches their household membership
- **`tasks_insert_members`**: Members can create tasks for their household only
- **`tasks_update_members`**: Members can update tasks (including new columns) in their household only
- **`tasks_delete_members`**: Members can delete tasks in their household only

**Security Guarantee**: A user in Household A cannot:
- Read `notes` from tasks in Household B
- Set `deleted_at` on tasks in Household B (cannot soft-delete other household's tasks)
- Restore tasks from Household B (cannot clear `deleted_at` on other household's tasks)
- Archive tasks in Household B (cannot set `archived_at` on other household's tasks)

## Query Patterns

### Get Active Tasks (Default View)

```sql
SELECT id, household_id, title, status, assigned_to, due_date, notes, created_at, updated_at
FROM tasks
WHERE household_id = :householdId
  AND deleted_at IS NULL
  AND archived_at IS NULL
ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at ASC;
```

**Performance**: Uses `tasks_household_assigned_status_idx` composite index (filtered by household_id, excludes deleted/archived)

### Get My Tasks (Filtered by Assignee)

```sql
SELECT id, household_id, title, status, assigned_to, due_date, notes, created_at, updated_at
FROM tasks
WHERE household_id = :householdId
  AND assigned_to = :currentUserId
  AND deleted_at IS NULL
  AND archived_at IS NULL
ORDER BY CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC, created_at ASC;
```

**Performance**: Uses `tasks_household_assigned_status_idx` composite index (household + assignee)

### Get Deleted Tasks

```sql
SELECT id, household_id, title, status, assigned_to, due_date, deleted_at
FROM tasks
WHERE household_id = :householdId
  AND deleted_at IS NOT NULL
ORDER BY deleted_at DESC;
```

**Performance**: Uses `tasks_deleted_at_idx` partial index

### Get Archived Tasks

```sql
SELECT id, household_id, title, status, assigned_to, due_date, archived_at
FROM tasks
WHERE household_id = :householdId
  AND archived_at IS NOT NULL
ORDER BY archived_at DESC;
```

**Performance**: Uses `tasks_archived_at_idx` partial index

### Update Task (Edit)

```sql
UPDATE tasks
SET title = :title,
    assigned_to = :assignedTo,
    due_date = :dueDate,
    notes = :notes,
    updated_at = NOW()
WHERE id = :taskId
  AND household_id = :householdId;  -- RLS enforces this, but explicit for clarity
```

**Side Effect**: `updated_at` trigger automatically fires on UPDATE (from migration 009)

### Soft Delete Task

```sql
UPDATE tasks
SET deleted_at = NOW(),
    updated_at = NOW()
WHERE id = :taskId;
```

**Note**: Soft delete preserves all task data for potential restore or audit purposes.

### Restore Deleted Task

```sql
UPDATE tasks
SET deleted_at = NULL,
    updated_at = NOW()
WHERE id = :taskId
  AND deleted_at IS NOT NULL;
```

**Effect**: Task returns to active state (visible in default list view).

### Archive Completed Task

```sql
UPDATE tasks
SET archived_at = NOW(),
    updated_at = NOW()
WHERE id = :taskId
  AND status = 'complete';  -- Application should enforce archiving only completed tasks
```

**Effect**: Task hidden from default view (even with "Show Completed" filter enabled).

### Restore Archived Task

```sql
UPDATE tasks
SET archived_at = NULL,
    updated_at = NOW()
WHERE id = :taskId
  AND archived_at IS NOT NULL;
```

**Effect**: Task returns to completed state (visible in default list with "Show Completed" enabled).

### Permanently Delete Task (Admin Only, 30+ Days)

```sql
DELETE FROM tasks
WHERE id = :taskId
  AND deleted_at IS NOT NULL
  AND deleted_at < NOW() - INTERVAL '30 days';
```

**Application Logic**: Frontend must verify admin role before allowing this action (RLS allows all members to DELETE, but UI restricts to admins).

## Migration File

**File**: `supabase/migrations/20260126000000_010_task_lifecycle.sql`

**Content**:
```sql
-- Migration: Task Lifecycle Enhancement
-- Feature: 006-task-editing
-- Adds support for task editing, soft deletion, archiving, and notes

-- Add new columns to tasks table
alter table public.tasks
  add column if not exists notes text check (char_length(notes) <= 5000),
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Add indexes for filtering performance
create index if not exists tasks_deleted_at_idx 
  on public.tasks(deleted_at) 
  where deleted_at is not null;

create index if not exists tasks_archived_at_idx 
  on public.tasks(archived_at) 
  where archived_at is not null;

create index if not exists tasks_household_assigned_status_idx 
  on public.tasks(household_id, assigned_to, status) 
  where deleted_at is null and archived_at is null;

-- Add column comments for documentation
comment on column public.tasks.notes is 'Optional task notes/description (max 5000 characters). Plain text with auto-linkified URLs in UI.';
comment on column public.tasks.deleted_at is 'Soft-delete timestamp. NULL = active, NOT NULL = deleted (can be restored). Tasks deleted for 30+ days can be permanently removed by admins.';
comment on column public.tasks.archived_at is 'Archive timestamp. NULL = active/deleted, NOT NULL = archived (hidden from default views). Archived tasks can be restored to completed status.';
```

## TypeScript Types

**Updated Task Interface**:

```typescript
// apps/web/src/types/task.ts

export interface Task {
  id: string;
  household_id: string;
  title: string;
  status: 'incomplete' | 'complete';
  assigned_to: string | null;  // UUID of assigned user
  due_date: string | null;      // ISO date string (YYYY-MM-DD)
  notes: string | null;          // NEW: Multi-line text
  deleted_at: string | null;     // NEW: ISO timestamp
  archived_at: string | null;    // NEW: ISO timestamp
  created_at: string;            // ISO timestamp
  updated_at: string;            // ISO timestamp
}

export type TaskUpdate = Partial<Pick<Task, 'title' | 'assigned_to' | 'due_date' | 'notes'>>;

export interface TaskFilters {
  status: 'active' | 'completed' | 'all';
  assignee: string | 'all' | 'unassigned' | 'me';
  sortBy: 'due_date' | 'created_at' | 'title' | 'assignee';
}
```

## Validation Rules

| Field | Client-Side Validation | Database Constraint | Error Message |
|-------|------------------------|---------------------|---------------|
| `title` | Required, 1-500 chars | `CHECK (char_length(title) > 0 and char_length(title) <= 500)` | "Title is required and must be 500 characters or less" |
| `notes` | Optional, max 5000 chars | `CHECK (char_length(notes) <= 5000)` | "Notes must be 5000 characters or less" |
| `assigned_to` | Must be valid household member UUID or null | `REFERENCES profiles(user_id) ON DELETE SET NULL` | "Invalid assignee selected" |
| `due_date` | Must be valid date or null | None (handled by PostgreSQL DATE type) | "Invalid date format" |
| `status` | Must be 'incomplete' or 'complete' | `CHECK (status IN ('incomplete', 'complete'))` | "Invalid status" |

## Data Integrity

### Foreign Key Behavior

- **`household_id`**: `ON DELETE CASCADE` - If household deleted, all tasks deleted (inherited from migration 009)
- **`assigned_to`**: `ON DELETE SET NULL` - If user deleted, tasks become unassigned (inherited from migration 009)

### Timestamp Triggers

- **`updated_at`**: Automatically updated on any column modification (inherited trigger from migration 009)

### Constraints

- **Title**: Cannot be empty string, max 500 characters
- **Notes**: Max 5000 characters (prevents abuse while allowing detailed notes)
- **Status**: Must be 'incomplete' or 'complete' (enum-like constraint)
- **Delete/Archive**: No database constraint preventing both being set (allowed state for audit purposes)

## Rollback Plan

If migration needs to be rolled back:

```sql
-- Remove indexes
drop index if exists public.tasks_deleted_at_idx;
drop index if exists public.tasks_archived_at_idx;
drop index if exists public.tasks_household_assigned_status_idx;

-- Remove columns (WARNING: Data loss)
alter table public.tasks
  drop column if exists notes,
  drop column if exists deleted_at,
  drop column if exists archived_at;
```

**Impact**: All task notes, soft-delete history, and archive history will be lost. Only use if migration causes critical issues.

**Safer Alternative**: If migration is problematic but data must be preserved, create a new migration that copies data to a backup table before rolling back.

## Future Considerations

**V2 Enhancements** (not in current scope):
- **Rich text notes**: Support basic markdown formatting (bold, italic, lists)
- **Tag system**: Replace or supplement categories with flexible tags
- **Attachments**: Allow file uploads (receipts, photos) linked to tasks
- **Comments**: Multi-user threaded comments on tasks
- **History**: Audit log of all task changes (who changed what when)

**Migration Path**: All future enhancements should extend the `tasks` table or create related tables (e.g., `task_attachments`, `task_comments`) rather than modifying these columns.
