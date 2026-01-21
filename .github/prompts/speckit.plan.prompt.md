---
agent: speckit.plan
---

## Goal

Create an implementation plan (`plan.md`) for a feature specification. This command analyzes the spec, researches technical approaches, and produces a detailed plan for implementation.

## User Input

```text
$ARGUMENTS
```

## Prerequisites

Run the prerequisite checker first:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json
```

This requires:
- Being on a feature branch (e.g., `001-feature-name`)
- Having a `spec.md` in the feature directory

## Execution Steps

### 1. Initialize Plan

Run the setup script to create the plan file:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/setup-plan.sh --json
```

### 2. Load Feature Spec

Read `specs/[BRANCH_NAME]/spec.md` to understand:
- User stories and priorities
- Functional requirements
- Success criteria
- Key entities

### 3. Research Phase (Phase 0)

For each technical decision, research and document in `research.md`:

- **Framework choices**: How does this fit with React 18 + TypeScript + Tailwind?
- **Database design**: What tables/columns are needed? RLS policies?
- **Edge functions**: What server-side logic is required?
- **Security implications**: How do we maintain household isolation?

### 4. Fill Technical Context

Update `plan.md` with Trackly Home specifics:

```markdown
**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18, Tailwind CSS, @supabase/supabase-js
**Storage**: PostgreSQL (via Supabase) with RLS
**Testing**: Manual testing (future: Vitest, Playwright)
**Target Platform**: Web (Azure Static Web Apps)
**Project Type**: web (frontend + backend)
**Performance Goals**: LCP < 2.5s, Edge function response < 500ms
**Constraints**: Household data isolation, single-use invite tokens
**Scale/Scope**: 2-person households (MVP)
```

### 5. Constitution Check

Verify alignment with core principles:

- [ ] **Security First**: RLS policies defined? Auth validation planned?
- [ ] **Vertical Slices**: Can we deliver user stories independently?
- [ ] **Minimal Changes**: Is this the simplest solution?
- [ ] **Document As You Go**: Migration README updates needed?
- [ ] **Test Before Deploy**: Local testing approach defined?

### 6. Define Project Structure

For Trackly Home, use the web application structure:

```text
apps/web/src/
├── components/     # React components
├── screens/        # Page-level components
├── services/       # API/Supabase service functions
├── lib/            # Utilities (supabaseClient.ts)
└── router/         # React Router configuration

supabase/
├── migrations/     # SQL migrations
└── functions/      # Edge Functions (Deno)
```

### 7. Create Design Artifacts (if needed)

For data-heavy features, create:
- `data-model.md` - Entity definitions, relationships, RLS policies
- `contracts/` - API contracts for Edge Functions
- `quickstart.md` - Local setup and testing instructions

### 8. Output

```
✅ Implementation plan created: specs/[BRANCH_NAME]/plan.md

Artifacts:
  - plan.md (required)
  - research.md (if technical research needed)
  - data-model.md (if database changes)
  - contracts/ (if new Edge Functions)

Next step: Run /speckit.tasks to generate the task list.
```

## Trackly Home Technical Reference

**Existing Edge Functions**:
- `create-household` - Creates household + owner membership
- `create-invite` - Generates secure invite tokens (admin-only)
- `accept-invite` - Validates and accepts invites
- `manage-roles` - Admin role management

**Database Helper Functions**:
- `is_household_admin(user_id, household_id)` - Check admin status
- `get_household_for_user(user_id)` - Get user's household

**Frontend Services** (`apps/web/src/services/`):
- `household.ts` - Household CRUD operations
- `members.ts` - Member management
- `profile.ts` - Profile operations

**Security Patterns**:
- Edge functions use service role key for writes
- RLS policies enforce read access
- Tokens hashed with SHA-256 before storage
- CORS restricted to `CORS_ORIGINS` allowlist

