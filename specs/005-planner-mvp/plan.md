# Implementation Plan: Planner MVP (Task Management)

**Branch**: `005-planner-mvp` | **Date**: 2026-01-25 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-planner-mvp/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

**Primary Requirement**: Create a household task management system that allows members to collaboratively create, view, and complete shared tasks with proper household isolation.

**Technical Approach**: 
- **Database Layer**: Create `tasks` table with RLS policies for household isolation (members read/write their household's tasks only)
**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, **Chakra UI 2.x** (migrating from Tailwind CSS), @supabase/supabase-js  
**Storage**: PostgreSQL (via Supabase) with RLS  
**Testing**: Manual testing (future: Vitest, Playwright)  
**Target Platform**: Web (Azure Static Web Apps)  
**Project Type**: web (frontend in apps/web, backend in supabase)  
**Performance Goals**: LCP < 2.5s, task list render < 2s, task creation round-trip < 1s  
**Constraints**: Household data isolation, member-level access (no admin restrictions on tasks)  
**Scale/Scope**: 2-person households (MVP), up to 100 tasks per household without performance degradation  
**UI Framework Migration**: Full migration from Tailwind CSS to Chakra UI (user requirement - Phase 5 prerequisite)  
**Development Approach**: 
1. **Phase 0**: UI migration prerequisite (Tailwind → Chakra UI across all existing components)
2. **Phase 1**: Database foundation (tasks table + RLS policies)
3. **Phase 2**: Task viewing (TaskList component with Chakra UI)
4. **Phase 3**: Task creation (AddTask component with Chakra UI)
5. **Phase 4**: Task completion (status toggle functionality)
6. **Phase 5**: Optional enhancements (assignment, due dates
**Storage**: PostgreSQL (via Supabase) with RLS  
**Testing**: Manual testing (future: Vitest, Playwright)  
**Target Platform**: Web (Azure Static Web Apps)  
**Project Type**: web (frontend in apps/web, backend in supabase)  
**Performance Goals**: LCP < 2.5s, Edge function response < 500ms  
**Constraints**: Household data isolation, single-use invite tokens, admin-gated features  
**Scale/Scope**: 2-person households (MVP), expandable to 10+ members (future)

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ | RLS policies designed for tasks table (members can only access their household's tasks). No Edge Functions needed - Supabase client with RLS is sufficient. No PII in task titles (user responsibility). |
| II. Vertical Slices | ✅ | User stories independently deliverable: US1 (view), US2 (create), US3 (complete), US4 (assign), US5 (due dates). Each story delivers standalone value. P0 stories (US1-US3) form minimal viable increment. |
| III. Minimal Changes | ⚠️ | **COMPLEXITY JUSTIFIED**: Chakra UI migration violates "minimal changes" but justified by user requirement for dashboard/chart foundation and improved component consistency. See Complexity Tracking section below. |
| IV. Document As You Go | ✅ | Migration README will be updated with tasks table schema and RLS policies. JSDoc comments added to task service functions. PROJECT_TRACKER.md updated on completion. |
| V. Test Before Deploy | ✅ | Manual smoke test plan documented below. RLS verification queries included. Build validation (npm run build + lint) before merge. |

**Re-check Post-Design**: Constitution check passed with one justified complexity (Chakra UI migration).

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research (if needed)
├── data-model.md        # Database design (if DB changes)
├── quickstart.md        # Setup/testing guide (if complex)
├── contracts/           # API contracts (if new Edge Functions)
└── tasks.md             # Task list (created by /speckit.tasks)
```

### Source Code (Trackly Home structure)

```text
apps/web/src/
├── components/          # React components
│   └── [NewComponent].tsx
├── screens/             # Page-level components
│   └── [NewScreen].tsx
├── services/            # API/Supabase service functions
│   └── [newService].ts
├── lib/                 # Utilities
│   └── supabaseClient.ts (existing)
└── router/              # React Router configuration
    └── AppRouter.tsx (existing)

supabase/
├── migrations/          # SQL migrations
│   └── [timestamp]_[num]_[description].sql
├── functions/           # Edge Functions (Deno)
│   ├── [new-function]/
│   │   ├── index.ts
│   │   └── deno.json
│   └── _shared/         # Shared utilities (existing)
│       ├── cors.ts
│       ├── crypto.ts
│       └── supabase.ts
└── config.toml          # Local CLI config
```

**Structure Decision**: Web application with frontend (apps/web) and backend (supabase)

## Database Design

**Migration Number**: `20260125000000_009_tasks_table.sql`

### New Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| tasks | Store household to-do items with title, status, optional assignment, and due date | ✅ Enabled |

**Schema Details**:
```sql
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 500),
  status text not null default 'incomplete' check (status in ('incomplete', 'complete')),
  assigned_to uuid references public.profiles(user_id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Index for household queries (primary access pattern)
create index if not exists tasks_household_id_idx on public.tasks(household_id);

-- Index for assignment queries (optional feature)
create index if not exists tasks_assigned_to_idx on public.tasks(assigned_to);

-- Update timestamp trigger
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function extensions.moddatetime(updated_at);
```

**Field Rationale**:
- `household_id`: Foreign key for household isolation (required for RLS)
- `title`: Task description (max 500 chars to prevent abuse)
- `status`: Enum-like constraint ('incomplete' | 'complete') - simple toggle model
- `assigned_to`: Optional FK to profiles.user_id (P1 feature, nullable)
- `due_date`: Optional date field (P1 feature, nullable)
- `created_at`/`updated_at`: Audit trail timestamps

### New Columns (existing tables)

*No changes to existing tables required.*

### RLS Policies Required

| Table | Operation | Policy Name | Logic |
|-------|-----------|-------------|-------|
| tasks | SELECT | tasks_select_members | Members can read tasks where household_id matches their household membership |
| tasks | INSERT | tasks_insert_members | Members can create tasks for their household only (household_id must match membership) |
| tasks | UPDATE | tasks_update_members | Members can update tasks in their household only (household_id must match membership) |
| tasks | DELETE | tasks_delete_members | Members can delete tasks in their household only (household_id must match membership) |

**RLS Policy Implementation**:
```sql
alter table public.tasks enable row level security;

-- SELECT: Members can view their household's tasks
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

-- INSERT: Members can create tasks for their household
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

-- UPDATE: Members can update their household's tasks
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

-- DELETE: Members can delete their household's tasks
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

**Policy Pattern**: Same as existing household_members and invites tables - use subquery to verify user's household membership via `household_members` join.

## Edge Functions

**No Edge Functions required for this feature.**

**Rationale**: Task CRUD operations are simple enough to be handled directly from the frontend using Supabase client with RLS policies. RLS provides sufficient security isolation by household. No complex business logic requiring server-side execution.

**Data Access Pattern**: Direct Supabase client queries from frontend service layer (`apps/web/src/services/tasks.ts`).

## Frontend Components

### Phase 0: Chakra UI Migration (Prerequisite)

**Migration Strategy**: Full replacement of Tailwind CSS with Chakra UI across all existing components.

| Component | Location | Changes Required |
|-----------|----------|------------------|
| App.tsx | apps/web/src/App.tsx | Wrap with ChakraProvider, remove Tailwind imports |
| LoginPage | apps/web/src/screens/LoginPage.tsx | Replace Tailwind classes with Chakra Box, Input, Button |
| SetupPage | apps/web/src/screens/SetupPage.tsx | Replace Tailwind classes with Chakra Box, Input, Button |
| JoinPage | apps/web/src/screens/JoinPage.tsx | Replace Tailwind classes with Chakra Box, Input, Button |
| AppShell | apps/web/src/screens/AppShell.tsx | Replace Tailwind classes with Chakra Box, Container, VStack |
| AppHeader | apps/web/src/components/AppHeader.tsx | Replace Tailwind classes with Chakra Flex, Heading, Button |
| InvitePartnerCard | apps/web/src/components/InvitePartnerCard.tsx | Replace Tailwind classes with Chakra Card, Input, Button |
| ManageRolesCard | apps/web/src/components/ManageRolesCard.tsx | Replace Tailwind classes with Chakra Card, Select, Button |
| ProtectedRoute | apps/web/src/ProtectedRoute.tsx | Minimal changes (mostly logic, little styling) |

**Dependencies to Add**:
```json
{
  "@chakra-ui/react": "^2.8.2",
  "@emotion/react": "^11.11.3",
  "@emotion/styled": "^11.11.0",
  "framer-motion": "^10.18.0"
}
```

**Dependencies to Remove**:
```json
{
  "@tailwindcss/vite": "^4.0.0",
  "tailwindcss": "^4.0.0"
}
```

**Files to Delete**:
- `apps/web/src/index.css` (Tailwind directives)
- Remove Tailwind-specific CSS imports from components

**Theme Configuration** (new file: `apps/web/src/theme.ts`):
```typescript
import { extendTheme } from '@chakra-ui/react';

export const theme = extendTheme({
  colors: {
    brand: {
      50: '#e3f2fd',
      100: '#bbdefb',
      // ... Material Design Blue palette
      900: '#0d47a1',
    },
  },
  fonts: {
    heading: "'Inter', sans-serif",
    body: "'Inter', sans-serif",
  },
});
```

### Phase 1-4: Task Management Components (New)

| Component | Location | Purpose | Chakra Components Used |
|-----------|----------|---------|------------------------|
| TaskList | apps/web/src/components/TaskList.tsx | Display household tasks with completion status | VStack, Box, Checkbox, Text, Badge |
| TaskItem | apps/web/src/components/TaskItem.tsx | Individual task row with toggle + metadata | Flex, Checkbox, Text, IconButton |
| AddTask | apps/web/src/components/AddTask.tsx | Task creation form (title, optional assignment, due date) | Box, Input, Select, Button, FormControl |
| TasksService | apps/web/src/services/tasks.ts | Supabase queries for task CRUD operations | N/A (TypeScript service) |

**Component Architecture**:
```
AppShell
└── TasksScreen (new, replaces placeholder)
    ├── AddTask (task creation form at top)
    └── TaskList (scrollable task list below)
        └── TaskItem[] (individual task rows)
```

**Empty State Component** (within TaskList):
```tsx
<Box textAlign="center" py={10}>
  <Text fontSize="lg" color="gray.500">
    No tasks yet. Create your first task to get started!
  </Text>
</Box>
```

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| **Principle III: Minimal Changes** - Chakra UI migration touches 8 existing components | User requirement: "I would like chakra-ui to be leveraged going forward" with "full migration" strategy chosen. This feature is the foundation for future dashboard and chart components. | **Keep Tailwind CSS**: Rejected because user explicitly chose full migration strategy over hybrid approach. Maintaining two UI frameworks increases maintenance burden and creates inconsistent UX. **Hybrid approach (Chakra + Tailwind)**: Rejected per user preference - mixing frameworks creates complexity with conflicting class names, styling paradigms, and bundle size overhead. |

**Justification Summary**: 
- User-driven decision: Explicit requirement to migrate to Chakra UI for dashboard/chart capabilities
- Long-term benefit: Single UI framework reduces maintenance complexity and improves consistency
- Timing: Phase 5 is the ideal migration point (before adding task UI) - migrating now prevents refactoring task components later
- Scope control: Migration is confined to UI layer only - no changes to business logic, services, or database

**Impact Assessment**:
- **Lines of code changed**: ~500-700 lines (8 existing components + App.tsx + theme setup)
- **Risk level**: Medium (UI-only changes, no business logic affected, can be validated visually)
- **Rollback plan**: Git revert migration commit, restore Tailwind dependencies
- **Testing approach**: Manual visual comparison before/after migration (screenshots + smoke tests)

## Security Considerations

- [x] New tables have RLS enabled (`tasks` table has 4 policies: SELECT, INSERT, UPDATE, DELETE)
- [x] Edge functions validate JWT (N/A - no Edge Functions in this feature)
- [x] Admin-only features check role (N/A - tasks are member-level, not admin-gated)
- [x] No service role key exposure (frontend uses anon key + RLS policies only)
- [x] Tokens hashed before storage (N/A - no tokens in this feature)
- [x] CORS configured correctly (N/A - no new Edge Functions)
- [x] No PII in logs (task titles are user-controlled content, not PII; no logging of task content planned)

**Additional Security Notes**:
- **Household Isolation**: RLS policies enforce household_id matching via `household_members` join - identical pattern to existing invites and household_members tables
- **SQL Injection**: Protected by Supabase client parameterized queries (no raw SQL from frontend)
- **XSS Prevention**: React's built-in XSS protection for rendering task titles (no dangerouslySetInnerHTML used)
- **Authorization**: All operations require authenticated user (`to authenticated` in RLS policies)
- **Data Validation**: Database constraints enforce title length (500 chars max) and status values ('incomplete' | 'complete')

**Cross-Household Attack Vectors Mitigated**:
1. **Direct API manipulation**: RLS policies prevent accessing tasks with different household_id
2. **Browser console tampering**: RLS enforced server-side regardless of client input
3. **Parameter manipulation**: RLS subquery verifies membership even if household_id is spoofed

## Testing Plan

### Phase 0: Chakra UI Migration Testing

**Visual Regression Checklist**:
- [ ] LoginPage renders correctly (magic link form + sign-out button)
- [ ] SetupPage renders correctly (household creation form)
- [ ] JoinPage renders correctly (invite acceptance + household name display)
- [ ] AppShell renders correctly (header + content area + navigation)
- [ ] AppHeader displays household name and role correctly
- [ ] InvitePartnerCard renders correctly (admin-only visual gate)
- [ ] ManageRolesCard renders correctly (admin-only role management)
- [ ] All buttons, inputs, and interactive elements are clickable
- [ ] Responsive behavior maintained (mobile + desktop views)
- [ ] No console errors or warnings

**Migration Smoke Test**:
```bash
# 1. Build succeeds
npm run build

# 2. Lint passes
npm run lint

# 3. No Tailwind CSS classes remain in codebase
grep -r "className=\".*\\(bg-\\|text-\\|p-\\|m-\\|flex\\|grid\\)" apps/web/src/

# 4. Chakra Provider wraps app
# Verify <ChakraProvider> in App.tsx

# 5. Visual comparison
npm run dev
# Open http://localhost:5173 and compare with screenshots from Tailwind version
```

### Phase 1: Database Testing

**Migration Application**:
```bash
# Apply migration locally
npx supabase migration new tasks_table
# Copy SQL from Database Design section above
npx supabase db reset
```

**RLS Verification Queries**:
```sql
-- Test 1: Cross-household access blocked
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';  -- Household B
-- Expected: 0 rows (RLS blocks cross-household access)

-- Test 2: Same-household access allowed
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
SELECT * FROM tasks WHERE household_id = 'household-a-uuid';  -- Same household
-- Expected: Returns all tasks for household A

-- Test 3: INSERT blocked for wrong household
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
INSERT INTO tasks (household_id, title, status)
VALUES ('household-b-uuid', 'Test task', 'incomplete');  -- Different household
-- Expected: Permission denied (RLS blocks)

-- Test 4: INSERT allowed for own household
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
INSERT INTO tasks (household_id, title, status)
VALUES ('household-a-uuid', 'Test task', 'incomplete');  -- Same household
-- Expected: Success

-- Test 5: UPDATE blocked for cross-household
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
UPDATE tasks SET status = 'complete' WHERE household_id = 'household-b-uuid';
-- Expected: 0 rows updated (RLS blocks)

-- Test 6: DELETE blocked for cross-household
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';  -- User in household A
DELETE FROM tasks WHERE household_id = 'household-b-uuid';
-- Expected: 0 rows deleted (RLS blocks)
```

### Phase 2-4: Task Management Testing

**Manual Testing Checklist**:
- [ ] **US1 - View Tasks**
  - [ ] Task list displays all household tasks (title + status)
  - [ ] Completed tasks visually distinct from incomplete (strikethrough + checkmark)
  - [ ] Empty state shows "No tasks yet" message
  - [ ] No tasks from other households visible
- [ ] **US2 - Create Tasks**
  - [ ] AddTask form accepts task title input
  - [ ] Form validation: empty title shows error, no task created
  - [ ] New task appears in list immediately after creation
  - [ ] Form clears after successful creation
  - [ ] Task creation round-trip completes in < 1 second
- [ ] **US3 - Complete Tasks**
  - [ ] Checkbox toggles task status (incomplete ↔ complete)
  - [ ] Status change reflects immediately in UI
  - [ ] Status persists after page reload
  - [ ] Other household members see status change (test in 2nd browser tab)
- [ ] **US4 - Task Assignment (P1)**
  - [ ] Assignment dropdown shows all household members
  - [ ] Assigned task displays assignee name
  - [ ] Unassigned task shows "Unassigned" or blank
  - [ ] Assignment can be changed to different member
- [ ] **US5 - Due Dates (P1)**
  - [ ] Due date picker accepts date selection
  - [ ] Task displays due date in list view
  - [ ] Overdue tasks have visual warning (red text/icon)
  - [ ] Due date can be cleared (set back to null)

**Error Scenarios**:
- [ ] Network error during task creation shows error message
- [ ] Network error during status update shows error message
- [ ] Long task title (500+ chars) is rejected with validation error
- [ ] Invalid household_id attempt returns 0 tasks (RLS protection)

**Performance Testing**:
- [ ] Task list with 100 tasks renders in < 2 seconds
- [ ] Task creation round-trip completes in < 1 second
- [ ] Status toggle updates in < 500ms

**Multi-User Concurrency**:
- [ ] Alice and Bob both view task list (same household)
- [ ] Alice creates task
- [ ] Bob refreshes page, sees new task
- [ ] Bob marks task complete
- [ ] Alice refreshes page, sees completed task
- [ ] No data loss or corruption with concurrent updates

### Final Validation

**Pre-Merge Checklist**:
- [ ] `npm run build` succeeds without errors
- [ ] `npm run lint` passes without warnings
- [ ] All manual test scenarios pass (above)
- [ ] RLS verification queries pass (6/6 tests)
- [ ] No console errors in browser
- [ ] Migration README updated with tasks table schema
- [ ] PROJECT_TRACKER.md updated with Phase 5 completion

**Success Criteria Validation** (from spec.md):
- [ ] **SC-001**: Task list loads in < 2 seconds ✅
- [ ] **SC-002**: Zero cross-household data exposure (RLS tests pass) ✅
- [ ] **SC-003**: Task creation round-trip < 1 second ✅
- [ ] **SC-004**: Status updates reflected within 2 seconds ✅
- [ ] **SC-005**: 95% first-task success rate (test with 5+ users) ✅
- [ ] **SC-006**: Functional with 100 tasks per household ✅
