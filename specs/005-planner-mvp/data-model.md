# Data Model: Tasks Table

**Feature**: Planner MVP (Task Management)  
**Created**: 2026-01-25  
**Migration**: `20260125000000_009_tasks_table.sql`

---

## Entity-Relationship

```
households (existing)
  ↓ 1:N
tasks (new)
  ↓ N:1 (optional)
profiles (existing) [assigned_to]
```

**Relationships**:
- One household has many tasks (`household_id` FK required)
- One task optionally assigned to one profile (`assigned_to` FK nullable)
- Tasks cascade delete when household is deleted
- Tasks set `assigned_to` to NULL when assigned user is deleted

---

## Schema Definition

### Table: `tasks`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | uuid | PRIMARY KEY, auto-generated | Unique task identifier |
| `household_id` | uuid | NOT NULL, FK → households(id) ON DELETE CASCADE | Household this task belongs to (isolation key) |
| `title` | text | NOT NULL, length 1-500 chars | Task description/what needs to be done |
| `status` | text | NOT NULL, CHECK (status IN ('incomplete', 'complete')), DEFAULT 'incomplete' | Task completion status |
| `assigned_to` | uuid | NULLABLE, FK → profiles(user_id) ON DELETE SET NULL | Household member assigned to this task (optional) |
| `due_date` | date | NULLABLE | Date when task should be completed (optional) |
| `created_at` | timestamptz | NOT NULL, DEFAULT now() | When task was created (audit trail) |
| `updated_at` | timestamptz | NOT NULL, DEFAULT now() | When task was last modified (audit trail, auto-updated) |

**Indexes**:
- `tasks_household_id_idx` on `household_id` (primary query pattern)
- `tasks_assigned_to_idx` on `assigned_to` (secondary query pattern: "my tasks")

**Triggers**:
- `set_tasks_updated_at` - Auto-update `updated_at` on row modification (uses `moddatetime` extension)

---

## Constraints & Validation

### Database-Level Constraints

```sql
-- Title: Non-empty, max 500 characters
check (char_length(title) > 0 and char_length(title) <= 500)

-- Status: Must be 'incomplete' or 'complete'
check (status in ('incomplete', 'complete'))

-- Foreign Keys
household_id references public.households(id) on delete cascade
assigned_to references public.profiles(user_id) on delete set null
```

**Why These Constraints**:
- **Title length**: Prevent abuse (no empty or excessively long titles)
- **Status enum**: Enforce valid states at database level (no invalid statuses possible)
- **Cascade delete**: If household deleted, all tasks deleted (clean data)
- **Set null on delete**: If assigned user removed, task remains but becomes unassigned

### Application-Level Validation

**Frontend validation (before submission)**:
- Title: Required, 1-500 characters
- Status: Required ('incomplete' | 'complete')
- Assignment: Optional, must be member of same household
- Due date: Optional, must be valid date (no past date check - past events allowed)

---

## RLS Policies

**Goal**: Household members can CRUD tasks for their household only. No admin restrictions - all members have equal access.

### Policy: `tasks_select_members`

**Operation**: SELECT  
**Allowed**: Authenticated users who are members of the task's household

```sql
create policy tasks_select_members
  on public.tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );
```

**Test**:
```sql
-- User A in household X
SELECT * FROM tasks WHERE household_id = 'household-x-uuid';
-- ✅ Returns tasks for household X

SELECT * FROM tasks WHERE household_id = 'household-y-uuid';
-- ❌ Returns 0 rows (RLS blocks cross-household access)
```

---

### Policy: `tasks_insert_members`

**Operation**: INSERT  
**Allowed**: Authenticated users creating tasks for their own household

```sql
create policy tasks_insert_members
  on public.tasks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );
```

**Test**:
```sql
-- User A in household X
INSERT INTO tasks (household_id, title, status)
VALUES ('household-x-uuid', 'Test task', 'incomplete');
-- ✅ Succeeds (user is member of household X)

INSERT INTO tasks (household_id, title, status)
VALUES ('household-y-uuid', 'Test task', 'incomplete');
-- ❌ Permission denied (user not member of household Y)
```

---

### Policy: `tasks_update_members`

**Operation**: UPDATE  
**Allowed**: Authenticated users updating tasks in their household

```sql
create policy tasks_update_members
  on public.tasks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );
```

**Note**: Both `USING` and `WITH CHECK` clauses ensure user can only update tasks they have access to AND can only update them to stay within their household.

**Test**:
```sql
-- User A in household X
UPDATE tasks SET status = 'complete' WHERE household_id = 'household-x-uuid';
-- ✅ Succeeds (user is member of household X)

UPDATE tasks SET status = 'complete' WHERE household_id = 'household-y-uuid';
-- ❌ 0 rows updated (RLS blocks cross-household update)
```

---

### Policy: `tasks_delete_members`

**Operation**: DELETE  
**Allowed**: Authenticated users deleting tasks in their household

```sql
create policy tasks_delete_members
  on public.tasks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );
```

**Test**:
```sql
-- User A in household X
DELETE FROM tasks WHERE household_id = 'household-x-uuid';
-- ✅ Succeeds (user is member of household X)

DELETE FROM tasks WHERE household_id = 'household-y-uuid';
-- ❌ 0 rows deleted (RLS blocks cross-household delete)
```

---

## Query Patterns

### Primary Query: Get all tasks for my household

```sql
SELECT id, title, status, assigned_to, due_date, created_at
FROM tasks
WHERE household_id = 'current-user-household-id'
ORDER BY created_at DESC;
```

**Performance**: Uses `tasks_household_id_idx` index, very fast

---

### Secondary Query: Get tasks assigned to me

```sql
SELECT id, title, status, due_date, created_at
FROM tasks
WHERE household_id = 'current-user-household-id'
  AND assigned_to = auth.uid()
ORDER BY due_date ASC NULLS LAST;
```

**Performance**: Uses both `tasks_household_id_idx` and `tasks_assigned_to_idx`, fast

---

### Optional Query: Get overdue tasks

```sql
SELECT id, title, assigned_to, due_date, created_at
FROM tasks
WHERE household_id = 'current-user-household-id'
  AND status = 'incomplete'
  AND due_date < CURRENT_DATE
ORDER BY due_date ASC;
```

**Performance**: No index on due_date (acceptable for < 100 tasks), sequential scan

---

## Migration Path

### Create Migration

```bash
# Generate migration file
npx supabase migration new tasks_table

# File created: supabase/migrations/20260125000000_009_tasks_table.sql
```

### Apply Locally

```bash
# Reset database with all migrations
npx supabase db reset

# Or apply incrementally
npx supabase migration up
```

### Apply to Production

```bash
# Link to production project
npx supabase link --project-ref <prod-ref>

# Push migration
npx supabase db push
```

### Rollback (if needed)

```sql
-- Drop policies
DROP POLICY IF EXISTS tasks_delete_members ON public.tasks;
DROP POLICY IF EXISTS tasks_update_members ON public.tasks;
DROP POLICY IF EXISTS tasks_insert_members ON public.tasks;
DROP POLICY IF EXISTS tasks_select_members ON public.tasks;

-- Drop indexes
DROP INDEX IF EXISTS tasks_assigned_to_idx;
DROP INDEX IF EXISTS tasks_household_id_idx;

-- Drop trigger
DROP TRIGGER IF EXISTS set_tasks_updated_at ON public.tasks;

-- Drop table
DROP TABLE IF EXISTS public.tasks;
```

---

## Future Enhancements (Out of Scope for MVP)

**Potential additions when needed**:
- `priority` field (low/medium/high) for task ordering
- `recurring` field (daily/weekly/monthly) for recurring tasks
- `tags` JSONB field for categorization
- `completed_by` FK to track who completed the task (audit trail)
- `completed_at` timestamp for completion tracking
- Soft delete pattern (`deleted_at` timestamp instead of hard delete)

**Why deferred**:
- MVP focuses on core functionality (create, view, complete)
- Adding fields now violates Principle III (Minimal Changes)
- Easy to add with new migration when user demand emerges
