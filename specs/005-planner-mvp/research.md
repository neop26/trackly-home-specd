# Phase 0 Research: Technical Decisions & Best Practices

**Created**: 2026-01-25  
**Feature**: Planner MVP (Task Management)  
**Purpose**: Document technical research and decisions for implementation

---

## 1. UI Framework Migration (Tailwind CSS → Chakra UI)

### Decision: Full Migration to Chakra UI

**Chosen**: Chakra UI v2.8.2 with full replacement of Tailwind CSS

**Rationale**:
- User requirement: "I would like chakra-ui to be leveraged going forward" with "full migration" strategy
- Foundation for future dashboard and chart components
- Better component composition model for complex interactions
- Built-in accessibility (WAI-ARIA compliant)
- Consistent theming system via extendTheme

**Alternatives Considered**:
1. **Keep Tailwind CSS**: Rejected - user explicitly requested migration
2. **Hybrid Approach (Both frameworks)**: Rejected - creates maintenance burden, bundle size overhead, conflicting styling paradigms
3. **Headless UI + Tailwind**: Rejected - doesn't provide chart/dashboard components needed for future phases

**Best Practices for Migration**:
- Wrap App in `<ChakraProvider theme={theme}>` at root level
- Use Chakra's layout primitives: `Box`, `Flex`, `VStack`, `HStack`, `Container`
- Replace Tailwind utility classes with Chakra's style props:
  - `bg-blue-500` → `bg="blue.500"`
  - `text-white` → `color="white"`
  - `p-4` → `p={4}` (Chakra uses spacing scale: 1 = 0.25rem)
  - `flex items-center justify-between` → `display="flex" alignItems="center" justifyContent="space-between"`
- Use semantic components when available: `Button`, `Input`, `Card`, `Heading`, `Text`
- Maintain responsive design with Chakra's responsive syntax: `fontSize={{ base: "md", md: "lg" }}`

**Migration Order**:
1. Install dependencies, configure theme
2. Migrate App.tsx (add ChakraProvider)
3. Migrate simple components first (AppHeader, ProtectedRoute)
4. Migrate form-heavy components (LoginPage, SetupPage, JoinPage)
5. Migrate complex components (InvitePartnerCard, ManageRolesCard)
6. Migrate AppShell last (integrates all components)
7. Remove Tailwind dependencies and config files

---

## 2. Database Schema Design

### Decision: Simple Status Enum with Text Constraint

**Chosen**: `status text not null check (status in ('incomplete', 'complete'))`

**Rationale**:
- Simple toggle model matches user story requirements (mark complete/incomplete)
- Text type with CHECK constraint provides enum-like behavior without custom type
- Easier to extend in future if needed (e.g., add 'archived' status)
- Supabase client automatically validates against constraint

**Alternatives Considered**:
1. **Boolean `is_complete`**: Rejected - less semantic, harder to extend for future statuses
2. **Custom ENUM type**: Rejected - over-engineering for 2 values, complicates migrations
3. **Integer status codes**: Rejected - less readable, requires mapping layer

**Best Practices**:
- Use descriptive status values ('incomplete', 'complete') not codes (0, 1)
- Always include CHECK constraint to enforce valid values at database level
- Default to 'incomplete' for new tasks
- Index not needed - status filtering is secondary to household_id filtering

---

## 3. RLS Policy Pattern

### Decision: Household Membership Subquery Pattern

**Chosen**: RLS policies using `EXISTS` subquery against `household_members` table

**Rationale**:
- Consistent with existing patterns in codebase (see migrations 003, 006)
- Avoids RLS stack depth issues (learned from migration 003)
- Declarative approach - database enforces security regardless of client code
- Performance: household_members has indexes on household_id and user_id

**Pattern**:
```sql
using (
  exists (
    select 1
    from public.household_members hm
    where hm.household_id = tasks.household_id
      and hm.user_id = auth.uid()
  )
)
```

**Why Not Helper Functions**:
- Helper functions risk recursion when calling RLS-protected tables
- Subquery approach is transparent and auditable
- Matches existing architecture decisions (see constitution reference to 003 migration)

**Best Practices**:
- Use `EXISTS` instead of `COUNT(*)` for better performance
- Use `select 1` instead of `select *` (we only care about existence)
- Apply same logic to both `USING` and `WITH CHECK` clauses on UPDATE
- Always reference auth.uid() for current user context

---

## 4. Frontend Data Access Pattern

### Decision: Direct Supabase Client Queries (No Edge Functions)

**Chosen**: Service layer (`apps/web/src/services/tasks.ts`) with direct Supabase client calls

**Rationale**:
- Simple CRUD operations with no complex business logic
- RLS policies provide sufficient security at database layer
- Reduces latency (no Edge Function round-trip)
- Simpler debugging and error handling
- Consistent with household service pattern (see `services/household.ts`)

**When to Use Edge Functions**:
- Complex multi-step transactions
- Server-side secrets needed (e.g., third-party API keys)
- Email sending, external webhooks
- Heavy computation that shouldn't run client-side

**Service Layer Pattern**:
```typescript
// apps/web/src/services/tasks.ts
export const getTasks = async (householdId: string) => {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('household_id', householdId)
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  return data;
};
```

**Best Practices**:
- Always use parameterized queries (Supabase client handles this)
- Let RLS enforce security - don't rely solely on client-side filtering
- Handle errors gracefully and surface user-friendly messages
- Use TypeScript types for task entities (type safety)

---

## 5. Component Architecture

### Decision: Composition Pattern with Controlled Components

**Chosen**: 
- `TasksScreen` (container) → `AddTask` + `TaskList`
- `TaskList` → `TaskItem[]` (array of task rows)
- Controlled components (React state manages form inputs)

**Rationale**:
- Separation of concerns: container handles data fetching, children handle presentation
- Reusable TaskItem component can be used in future views (e.g., filtered lists)
- Controlled components provide single source of truth for form state
- Chakra UI components work best as controlled components

**Data Flow**:
```
TasksScreen (fetches tasks, provides callbacks)
  ↓ tasks[], onCreateTask(), onToggleStatus()
AddTask (controlled form, calls onCreateTask)
  
TaskList (maps tasks to TaskItem[])
  ↓ task, onToggle callback
TaskItem (presentational, emits toggle event)
```

**Best Practices**:
- Container components fetch data and manage state
- Presentational components receive props and emit events
- Use React hooks: `useState` for local state, `useEffect` for data fetching
- Use Chakra's `useToast` for success/error notifications
- Implement optimistic UI updates for better perceived performance

---

## 6. Optional Fields (Assignment & Due Dates)

### Decision: Nullable Columns with Frontend Conditional Rendering

**Chosen**: 
- `assigned_to uuid` (nullable, FK to profiles.user_id)
- `due_date date` (nullable)
- Frontend shows/hides assignment/due date UI based on feature flag or always visible with "optional" labeling

**Rationale**:
- P1 features (important but not blocking MVP)
- Nullable columns allow incremental adoption (users can ignore if not needed)
- No schema changes required later when users start using these features
- DATE type (not TIMESTAMP) because due dates are day-granular, not time-specific

**Best Practices**:
- Use `on delete set null` for assigned_to FK (task persists if member leaves household)
- Display "Unassigned" or blank when assigned_to is null
- Display "No due date" or blank when due_date is null
- Use Chakra's `FormLabel` with `isRequired={false}` to indicate optional fields
- Validate assignment: ensure assigned_to user is a member of the task's household

---

## 7. Performance Considerations

### Decision: Indexed Queries + Pagination (Future)

**Chosen**: 
- Index on `household_id` (primary access pattern)
- Index on `assigned_to` (for filtering assigned tasks)
- Current scope: No pagination (assume < 100 tasks per household)
- Future enhancement: Add pagination when task count exceeds 100

**Rationale**:
- Most queries filter by household_id first (RLS + user queries)
- Index accelerates household_id lookups
- Assignment filtering is secondary use case (filter tasks assigned to me)
- MVP scope: 2-person households with manageable task counts

**Best Practices**:
- Monitor query performance via Supabase dashboard (Query Performance tab)
- Add `.limit(100)` to queries as safeguard
- Plan for pagination when task count grows (use cursor-based pagination)
- Consider status index if filtering by completed/incomplete becomes common

---

## 8. Error Handling Strategy

### Decision: Standardized Error Responses (Constitution Pattern)

**Chosen**: Follow existing error handling pattern from Phase 2 (error-handling-pii-logging)

**Pattern**:
```typescript
try {
  const tasks = await getTasks(householdId);
  return tasks;
} catch (error) {
  // Sanitize database errors (don't expose internal details)
  toast({
    title: 'Error loading tasks',
    description: 'Please try again later.',
    status: 'error',
  });
  console.error('Task fetch error:', error); // Log for debugging, not user-facing
}
```

**Best Practices**:
- Never expose raw database errors to users
- Use Chakra's `useToast` for user-friendly error messages
- Log detailed errors to console for developer debugging
- Provide actionable error messages ("Please try again" vs "Error 500")
- No PII in error messages (don't log task titles or household names)

---

## Summary of Technical Decisions

| Decision Area | Choice | Rationale |
|---------------|--------|-----------|
| UI Framework | Chakra UI (full migration) | User requirement, dashboard foundation |
| Status Field | Text with CHECK constraint | Simple, extensible, semantic |
| RLS Pattern | Subquery EXISTS pattern | Consistent with existing migrations, no recursion |
| Data Access | Direct Supabase client | No complex logic needed, RLS sufficient |
| Component Architecture | Container/Presentational split | Separation of concerns, reusability |
| Optional Fields | Nullable columns | Incremental adoption, no schema changes later |
| Performance | Indexed queries, no pagination yet | < 100 tasks assumption for MVP |
| Error Handling | Standardized error responses | Follow Phase 2 pattern, no PII exposure |

---

## Next Steps

**All technical decisions resolved** - ready to proceed to implementation Phase 1 (Database migration).
