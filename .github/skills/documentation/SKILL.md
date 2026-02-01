---
name: documentation
description: Create and maintain documentation following Trackly Home's minimal documentation policy. Use when updating READMEs, PRD, project tracker, or creating working documents. Ensures docs stay current with code changes.
metadata:
  author: trackly-home
  version: "1.0"
allowed-tools: Read Edit
---

# Documentation Skill

Create and maintain documentation following Trackly Home's minimal documentation policy.

## When to Use

- Updating documentation after code changes
- Creating feature documentation
- Updating PROJECT_TRACKER.md
- Working with docs/working_folder/
- Creating or updating README files

## Minimal Documentation Policy

### Key Rules

1. **One README per top-level folder** - No READMEs in subfolders
2. **No unnecessary summary documents** - Don't create without explicit request
3. **Document as you go** - Docs are part of "done"
4. **Working documents go to working_folder** - Temporary docs in `docs/working_folder/`

### Document Routing

| Document Type | Location | Example |
|---------------|----------|---------|
| Permanent docs | `docs/` | PRD, SDLC_PROCESS |
| Working docs | `docs/working_folder/` | Research, drafts, summaries |
| Feature specs | `specs/###-feature/` | spec.md, plan.md, tasks.md |
| Folder README | Top-level folder root | `supabase/README.md` |
| Root README | Repository root | `README.md` |

## Required Documentation Updates

### After Database Changes

Update `supabase/migrations/README.md`:
- Add migration description
- Document new tables/columns
- Note RLS policies added

### After Edge Function Changes

Update `supabase/functions/README.md`:
- Add function description
- Document request/response format
- Note required secrets

### After Feature Implementation

Update:
1. `tasks.md` - Mark tasks complete
2. `docs/PROJECT_TRACKER.md` - Update status
3. `docs/TRACKLY_HOME_PRD.md` - If requirements change
4. Feature README if user-facing

### After Config Changes

Update:
- `apps/web/.env.example` - New environment variables
- `.secrets/README.md` - New secrets required

## README Template

```markdown
# [Folder Name]

Brief description of what this folder contains.

## Contents

- `file1.ts` - Description
- `file2.ts` - Description
- `subfolder/` - Description

## Usage

How to use the contents of this folder.

## Related Documentation

- [Link to related docs]
```

## Project Tracker Format

Location: `docs/PROJECT_TRACKER.md`

### Phase Entry Format

```markdown
## Phase X: [Name] 🟢/🟡/🔴

**Status:** Complete / In Progress / Not Started
**Completed:** YYYY-MM-DD (if complete)

| ID | Task | Priority | Status | Completed | Notes |
|----|------|----------|--------|-----------|-------|
| X.1 | Task description | P0 | 🟢 Done | 2026-01-XX | Notes |
| X.2 | Task description | P1 | 🟡 In Progress | — | Notes |
```

### Status Icons

- 🟢 Complete / On Track
- 🟡 In Progress / At Risk
- 🔴 Not Started / Blocked
- ⚪ Blocked / Dependency Issue

### Update Process

1. Mark task status as work progresses
2. Add completion dates when done
3. Update milestone dates if timeline shifts
4. Add notes under "Notes & Decisions"
5. Keep risk register current

## PRD Update Format

Location: `docs/TRACKLY_HOME_PRD.md`

### Requirements Table Format

```markdown
| ID | Requirement | Status | Priority |
|----|-------------|--------|----------|
| FR-1.1 | Description | ✅ MVP / ⏳ V1 | P0 |
```

### Status Symbols

- ✅ MVP - Implemented in MVP
- ⏳ V1 - Planned for V1
- 🔮 V2 - Future (V2)
- ❌ Cut - Removed from scope

## Working Documents

### When to Use working_folder

- Temporary summaries and status reports
- Meeting notes and discussion transcripts
- Exploratory research
- Draft specifications before finalization
- Agent-generated summaries without long-term value

### Working Document Header

```markdown
# [Document Title]

**Type:** Research / Draft / Summary / Notes
**Date:** YYYY-MM-DD
**Author:** [Name]
**Expires:** YYYY-MM-DD (optional)

---

[Content]
```

## Code Documentation

### JSDoc Format

```typescript
/**
 * Creates a new task in the household.
 * 
 * @param householdId - The household to add the task to
 * @param title - Task title (1-500 characters)
 * @param assignedTo - Optional user ID to assign task to
 * @returns The created task object
 * @throws {Error} If user is not a household member
 */
export async function createTask(
  householdId: string,
  title: string,
  assignedTo?: string
): Promise<Task> {
  // Implementation
}
```

### When to Add Comments

- Complex business logic
- Non-obvious decisions
- Workarounds or hacks
- Security-sensitive code
- Performance optimizations

### When NOT to Add Comments

- Self-explanatory code
- Standard patterns
- Obvious type definitions
- Code that should be refactored instead

## Commit Message Documentation

### Format

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation only
- `style` - Formatting (no code change)
- `refactor` - Code change (no feature/fix)
- `test` - Adding tests
- `chore` - Maintenance

### Examples

```
feat(tasks): add due date field to task creation

- Added date picker component
- Updated task service with due_date parameter
- Added overdue visual indicator

Closes #123
```

```
docs(readme): update deployment instructions

Added manual deployment steps for production environment.
```

## Migration README Format

Location: `supabase/migrations/README.md`

```markdown
# Database Migrations

## Migration List

| # | File | Description | Date |
|---|------|-------------|------|
| 009 | 20260125..._009_tasks_table.sql | Add tasks table | 2026-01-25 |

## Migration 009: Tasks Table

**Purpose:** Add task management functionality

**Tables Added:**
- `tasks` - Household task tracking

**RLS Policies:**
- Members can CRUD tasks in their household

**Indexes:**
- `idx_tasks_household_id`
- `idx_tasks_assigned_to`
```

## Edge Function README Format

Location: `supabase/functions/README.md`

```markdown
# Edge Functions

## Function List

| Function | Auth | Admin | Purpose |
|----------|------|-------|---------|
| create-household | ✅ | No | Create new household |
| create-invite | ✅ | Yes | Generate invite link |

## create-household

**Purpose:** Creates a new household with the caller as owner.

**Request:**
```json
{
  "name": "My Household"
}
```

**Response:**
```json
{
  "data": {
    "id": "uuid",
    "name": "My Household"
  }
}
```

**Errors:**
- 400: Invalid name
- 409: Already has household
```

## Documentation Checklist

### Before PR

```markdown
- [ ] Code comments for complex logic
- [ ] JSDoc for exported functions
- [ ] README updated if structure changed
- [ ] PROJECT_TRACKER.md updated
- [ ] PRD updated if requirements changed
- [ ] .env.example updated if new env vars
```

### After Feature Complete

```markdown
- [ ] tasks.md marked complete
- [ ] PROJECT_TRACKER phase updated
- [ ] Migration README updated (if DB changes)
- [ ] Function README updated (if function changes)
- [ ] User-facing docs updated (if applicable)
```
