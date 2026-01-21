---
agent: speckit.tasks
---

## Goal

Generate a task list (`tasks.md`) from the feature specification and implementation plan. Tasks are organized by user story to enable independent implementation and delivery.

## User Input

```text
$ARGUMENTS
```

## Prerequisites

Run the prerequisite checker:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json
```

Requires:
- Being on a feature branch
- `spec.md` exists (for user stories)
- `plan.md` exists (for technical approach)

## Execution Steps

### 1. Load Artifacts

Read from `specs/[BRANCH_NAME]/`:
- `spec.md` - User stories with priorities (P1, P2, P3)
- `plan.md` - Technical approach and structure
- `data-model.md` (if exists) - Database entities
- `contracts/` (if exists) - API contracts

### 2. Generate Tasks by User Story

For each user story in the spec, create tasks following this structure:

**Phase 1: Setup (Shared Infrastructure)**
- Project structure changes
- Dependencies installation
- Configuration updates

**Phase 2: Foundational (Blocking Prerequisites)**
- Database migrations
- RLS policies
- Edge Function scaffolding
- Shared services

**Phase 3+: User Story Implementation**
Each user story gets its own phase:
- Tests (if requested) - Written FIRST
- Models/types
- Services
- UI components
- Integration

**Final Phase: Polish**
- Documentation updates
- Code cleanup
- Cross-story integration

### 3. Task Format

Use this format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, etc.)
- Include exact file paths

**Trackly Home Path Conventions**:
- Frontend components: `apps/web/src/components/[Name].tsx`
- Screens: `apps/web/src/screens/[Name].tsx`
- Services: `apps/web/src/services/[name].ts`
- Migrations: `supabase/migrations/[timestamp]_[number]_[description].sql`
- Edge Functions: `supabase/functions/[name]/index.ts`

### 4. Validate Task Coverage

Ensure every requirement from `spec.md` maps to at least one task:
- [ ] All functional requirements (FR-*) have implementing tasks
- [ ] All user stories have complete task sets
- [ ] Security requirements are addressed (RLS, auth, etc.)
- [ ] Documentation updates are included

### 5. Mark Parallel Opportunities

Tasks that can run in parallel:
- Different component files
- Independent service functions
- Separate migration files (if no dependencies)
- Tests for different stories

### 6. Output

Write `tasks.md` to `specs/[BRANCH_NAME]/tasks.md` with:

```markdown
# Tasks: [Feature Name]

## Phase 1: Setup
- [ ] T001 [P] Task description in apps/web/src/...

## Phase 2: Foundational
- [ ] T002 Create migration in supabase/migrations/...
- [ ] T003 [P] Add RLS policies in same migration

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP
**Goal**: [What this delivers]

- [ ] T004 [US1] Create component in apps/web/src/components/...
- [ ] T005 [US1] Add service function in apps/web/src/services/...

## Phase 4: User Story 2 - [Title] (Priority: P2)
...

## Dependencies
- Phase 2 blocks all user stories
- User stories can proceed in parallel after Phase 2
```

```
✅ Task list created: specs/[BRANCH_NAME]/tasks.md

Tasks: X total
  - Setup: Y tasks
  - Foundational: Z tasks
  - User Stories: W tasks

Next step: Run /speckit.implement to begin implementation.
```

## Trackly Home Task Patterns

**Database Migration Tasks**:
```
- [ ] TXXX Create migration supabase/migrations/[timestamp]_[num]_[desc].sql
- [ ] TXXX [P] Add RLS policies for [table] in same migration
- [ ] TXXX [P] Add helper function [name] in same migration
```

**Edge Function Tasks**:
```
- [ ] TXXX Create function scaffold supabase/functions/[name]/index.ts
- [ ] TXXX [P] Add deno.json for function
- [ ] TXXX Implement [endpoint] logic
- [ ] TXXX Add CORS handling using _shared/cors.ts
```

**Frontend Component Tasks**:
```
- [ ] TXXX Create [Component] in apps/web/src/components/[Name].tsx
- [ ] TXXX Add service function in apps/web/src/services/[name].ts
- [ ] TXXX Wire component to service in screen
- [ ] TXXX Add loading/error states
```

**Security Tasks** (always include):
```
- [ ] TXXX Verify RLS policies with test queries
- [ ] TXXX Ensure verify_jwt=true on Edge Function
- [ ] TXXX Test cross-household access blocked
```

