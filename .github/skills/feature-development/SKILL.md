---
name: feature-development
description: Develop new features using the SpecKit spec-driven workflow. Use when creating new features, implementing user stories, or working on specs/ directory. Handles the full lifecycle from specification to implementation.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git, Node.js, Supabase CLI
allowed-tools: Bash(git:*) Bash(npm:*) Read Edit
---

# Feature Development Skill

Guides the complete feature development lifecycle using SpecKit spec-driven development.

## When to Use

- Starting a new feature
- Implementing user stories from existing specs
- Working with `specs/` directories
- Following the spec → plan → tasks → implement workflow

## Workflow Overview

```
1. Create Feature Branch → 2. Write Spec → 3. Create Plan → 4. Generate Tasks → 5. Implement → 6. Validate
```

## Step 1: Create Feature Branch

Run the feature creation script:

```bash
.specify/scripts/bash/create-new-feature.sh "Feature description" --short-name "short-name"
```

This creates:
- Feature branch: `###-short-name`
- Spec directory: `specs/###-short-name/`
- Initial `spec.md` from template

## Step 2: Write Specification (spec.md)

Use `/speckit.specify` or follow template at `.specify/templates/spec-template.md`:

### Required Sections

1. **User Scenarios & Testing** - Prioritized user stories (P1/P2/P3)
2. **Requirements** - Functional (FR-xxx), Security (SR-xxx)
3. **Success Criteria** - Measurable outcomes (SC-xxx)

### User Story Format

```markdown
### User Story 1 - [Title] (Priority: P1)

[Description]

**Why this priority**: [Justification]
**Independent Test**: [How to verify standalone]

**Acceptance Scenarios**:
1. **Given** [state], **When** [action], **Then** [outcome]
```

## Step 3: Create Implementation Plan (plan.md)

Use `/speckit.plan` or follow template at `.specify/templates/plan-template.md`:

### Required Sections

1. **Summary** - Technical approach
2. **Technical Context** - Stack, constraints, performance goals
3. **Constitution Check** - 5 principles validation
4. **Project Structure** - File locations
5. **Database Design** - Tables, RLS policies (if applicable)
6. **Security Considerations** - Checklist

### Constitution Check Table

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ☐ | RLS policies defined? |
| II. Vertical Slices | ☐ | Stories independently deliverable? |
| III. Minimal Changes | ☐ | Simplest solution? |
| IV. Document As You Go | ☐ | Docs plan? |
| V. Test Before Deploy | ☐ | Testing approach? |

## Step 4: Generate Tasks (tasks.md)

Use `/speckit.tasks` or follow template at `.specify/templates/tasks-template.md`:

### Task Format

```markdown
- [ ] T001 [P] [US1] Description with exact file path
```

- `[P]` = Can run in parallel
- `[US1]` = User Story 1

### Phase Structure

1. **Phase 1: Setup** - Project initialization
2. **Phase 2: Foundational** - Blocking prerequisites
3. **Phase 3+: User Stories** - One phase per story

## Step 5: Implement

Use `/speckit.implement` or follow tasks manually:

### Pre-Implementation Checklist

```bash
# Verify prerequisites
.specify/scripts/bash/check-prerequisites.sh --json --require-tasks
```

### Implementation Rules

1. Follow task order (respect dependencies)
2. Mark tasks complete: `- [x] T001...`
3. Run tests at each checkpoint
4. Keep documentation current

## Step 6: Validate

### Before PR

```bash
cd apps/web
npm run lint
npm run build
```

### Manual Testing

- Happy path works
- Error states handled
- Role-based access verified
- RLS policies tested (if DB changes)

## File Locations

| Artifact | Location |
|----------|----------|
| Specification | `specs/###-feature/spec.md` |
| Plan | `specs/###-feature/plan.md` |
| Tasks | `specs/###-feature/tasks.md` |
| Checklists | `specs/###-feature/checklists/` |
| Frontend code | `apps/web/src/` |
| Database | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |

## Common Patterns

### Adding a New Screen

1. Create screen: `apps/web/src/screens/MyScreen.tsx`
2. Add route: `apps/web/src/router/index.tsx`
3. Use Chakra UI components
4. Test: `npm run dev`

### Adding Database Table

1. Create migration: `supabase migration new add_table_name`
2. Include RLS policies
3. Test: `supabase db reset`

### Adding Edge Function

1. Create: `supabase/functions/my-function/index.ts`
2. Import from `../_shared/`
3. Test: `supabase functions serve`

## References

- [Spec Template](references/spec-template.md)
- [Plan Template](references/plan-template.md)
- [Tasks Template](references/tasks-template.md)
- [Constitution](references/constitution.md)
