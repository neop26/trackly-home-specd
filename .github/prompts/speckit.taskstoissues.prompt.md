---
agent: speckit.taskstoissues
---

## Goal

Convert tasks from `tasks.md` into GitHub Issues for project management and tracking. This enables team collaboration and integration with GitHub Projects.

## User Input

```text
$ARGUMENTS
```

The user input may specify:
- Which tasks to convert (e.g., "Phase 2", "all", "T005-T010")
- Whether to create a milestone
- Label preferences

## Prerequisites

Run the prerequisite checker:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Requires:
- Being on a feature branch
- `tasks.md` exists with tasks to convert

## Execution Steps

### 1. Load Tasks

Read `specs/[BRANCH_NAME]/tasks.md` and parse:
- Task IDs (T001, T002, etc.)
- Task descriptions
- Phase grouping
- Parallel markers [P]
- User story associations [US1, US2, etc.]
- File paths mentioned

### 2. Determine Scope

Based on user input:
- **all**: Convert all incomplete tasks
- **Phase N**: Convert tasks in that phase only
- **T001-T010**: Convert specific task range
- **US1**: Convert tasks for specific user story

### 3. Generate Issue Content

For each task, create issue with:

**Title**: `[TXXX] Task description`

**Body**:
```markdown
## Task Details

**Feature Branch**: [BRANCH_NAME]
**Phase**: [Phase N]
**User Story**: [USX - Story Title]
**Parallel**: [Yes/No]

## Description

[Full task description from tasks.md]

## Files to Modify

- `path/to/file1.ts`
- `path/to/file2.tsx`

## Acceptance Criteria

- [ ] Implementation complete
- [ ] Local testing passed
- [ ] Code follows Trackly Home conventions

## Dependencies

- Blocked by: [T00X, T00Y] (if applicable)
- Blocks: [T00Z] (if applicable)

## Related

- Spec: specs/[BRANCH_NAME]/spec.md
- Plan: specs/[BRANCH_NAME]/plan.md
```

**Labels** (suggest based on task type):
- `phase-1-setup`, `phase-2-foundation`, `phase-3-feature`, etc.
- `database` for migration tasks
- `edge-function` for Supabase function tasks
- `frontend` for React component tasks
- `security` for RLS/auth tasks
- `documentation` for doc tasks
- `parallel` for tasks marked [P]

**Milestone**: Feature branch name (create if needed)

### 4. Create Issues via GitHub CLI

Generate commands to create issues:

```bash
# Create milestone (if needed)
gh milestone create "[BRANCH_NAME]" --description "Feature: [Description]"

# Create issues
gh issue create \
  --title "[T001] Create migration for tasks table" \
  --body "$(cat issue-T001.md)" \
  --label "database,phase-2-foundation" \
  --milestone "[BRANCH_NAME]"

gh issue create \
  --title "[T002] Add RLS policies for tasks" \
  --body "$(cat issue-T002.md)" \
  --label "database,security,phase-2-foundation,parallel" \
  --milestone "[BRANCH_NAME]"
```

### 5. Update tasks.md with Issue Links

After creating issues, update `tasks.md`:

```markdown
- [ ] T001 Create migration (#123)
- [ ] T002 [P] Add RLS policies (#124)
```

### 6. Output

```
✅ Created GitHub Issues from tasks.md

Issues Created: 15
  - Phase 1: 3 issues
  - Phase 2: 5 issues
  - Phase 3 (US1): 4 issues
  - Phase 4 (US2): 3 issues

Milestone: 001-task-management

Labels Applied:
  - database: 4
  - frontend: 6
  - edge-function: 2
  - security: 3

tasks.md updated with issue links.

View issues: https://github.com/neop26/trackly-home-specd/milestone/1
```

---

## Trackly Home Label Conventions

### Phase Labels
- `phase-1-setup` - Project structure, dependencies
- `phase-2-foundation` - Database, shared services
- `phase-3-feature` - User story implementation
- `phase-n-polish` - Documentation, cleanup

### Component Labels
- `database` - SQL migrations, RLS policies
- `edge-function` - Supabase Edge Functions
- `frontend` - React components, screens
- `service` - Service layer functions
- `documentation` - README, inline docs

### Type Labels
- `security` - RLS, auth, data isolation
- `parallel` - Can be worked on in parallel
- `blocking` - Blocks other tasks
- `bug` - Fix for existing functionality
- `enhancement` - Improvement to existing feature

### Priority Labels
- `priority-p1` - MVP critical
- `priority-p2` - Important but not blocking
- `priority-p3` - Nice to have

---

## Issue Templates

### Database Migration Issue

```markdown
## Task Details

**Type**: Database Migration
**Table**: [table_name]

## Migration Content

- [ ] CREATE TABLE statement
- [ ] Enable RLS
- [ ] SELECT policy
- [ ] INSERT policy
- [ ] UPDATE policy (if needed)
- [ ] DELETE policy (if needed)
- [ ] Helper functions (if needed)

## Testing

- [ ] `supabase db reset` succeeds
- [ ] RLS policies tested with SQL queries
- [ ] Cross-household access blocked

## Files

- `supabase/migrations/[timestamp]_[num]_[description].sql`
- `supabase/migrations/README.md` (update)
```

### Edge Function Issue

```markdown
## Task Details

**Type**: Edge Function
**Function Name**: [name]
**Auth Required**: Yes/No
**Admin Required**: Yes/No

## Implementation

- [ ] Create function scaffold
- [ ] Add deno.json
- [ ] Implement logic
- [ ] Handle CORS
- [ ] Add error handling
- [ ] Set verify_jwt = true

## Testing

- [ ] `supabase functions serve` works
- [ ] Test with curl/Postman
- [ ] Auth validation works
- [ ] Error responses are clean

## Files

- `supabase/functions/[name]/index.ts`
- `supabase/functions/[name]/deno.json`
```

### Frontend Component Issue

```markdown
## Task Details

**Type**: React Component
**Component Name**: [Name]
**Screen**: [Screen where used]

## Implementation

- [ ] Create component file
- [ ] Define Props interface
- [ ] Implement UI with Tailwind
- [ ] Add loading state
- [ ] Add error state
- [ ] Wire to service

## Testing

- [ ] Component renders correctly
- [ ] Loading state displays
- [ ] Error state displays
- [ ] Happy path works

## Files

- `apps/web/src/components/[Name].tsx`
- `apps/web/src/services/[name].ts` (if needed)
```

