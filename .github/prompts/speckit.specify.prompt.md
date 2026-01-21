---
agent: speckit.specify
---

## Goal

Create or refine a feature specification (`spec.md`) for a new feature in Trackly Home. This command captures user requirements and transforms them into structured, testable specifications.

## User Input

```text
$ARGUMENTS
```

## Execution Steps

### 1. Create Feature Branch & Spec File

Run the feature creation script to set up the branch and initial spec file:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/create-new-feature.sh --json "$ARGUMENTS"
```

Parse the JSON output for `BRANCH_NAME`, `SPEC_FILE`, and `FEATURE_NUM`.

### 2. Gather Context

Before writing the spec, review these project documents for alignment:

- **PRD**: `docs/TRACKLY_HOME_PRD.md` - Check existing requirements and MVP scope
- **Tracker**: `docs/PROJECT_TRACKER.md` - Check current phase and priorities
- **Constitution**: `.specify/memory/constitution.md` - Ensure alignment with core principles

### 3. Clarify Requirements (if needed)

If the user's input is ambiguous, ask clarifying questions about:

- **User stories**: Who is the user? What action? What outcome?
- **Acceptance criteria**: How do we know it's working?
- **Edge cases**: What happens when things go wrong?
- **Priority**: Is this P1 (MVP-critical), P2, or P3?

### 4. Write the Specification

Fill the spec template at `SPEC_FILE` with:

**User Scenarios & Testing** (mandatory):
- Prioritized user stories (P1, P2, P3) with acceptance scenarios
- Each story must be independently testable
- Use Given/When/Then format for acceptance criteria

**Requirements** (mandatory):
- Functional requirements (FR-001, FR-002, etc.)
- Mark unclear items with `[NEEDS CLARIFICATION: reason]`
- Include key entities if the feature involves data

**Success Criteria** (mandatory):
- Measurable outcomes (SC-001, SC-002, etc.)
- Technology-agnostic metrics

### 5. Validate Against Constitution

Check the spec against Trackly Home principles:

- [ ] **Security First**: Does this feature handle household data? RLS implications?
- [ ] **Vertical Slices**: Can each user story be delivered independently?
- [ ] **Minimal Changes**: Is the scope appropriately limited for MVP?
- [ ] **Document As You Go**: Are acceptance criteria clear enough to document?
- [ ] **Test Before Deploy**: Are scenarios testable locally?

### 6. Output

Confirm the spec file location and suggest next command:

```
✅ Specification created: specs/[BRANCH_NAME]/spec.md

Next step: Run /speckit.plan to create the implementation plan.
```

## Trackly Home Context

**Current Phase**: Phase 2 (Security Hardening) / Phase 3 (UX Routing)
**MVP Target**: 2026-02-28
**Tech Stack**: Vite + React 18 + TypeScript + Tailwind CSS + Supabase (Auth, PostgreSQL, Edge Functions) + Azure Static Web Apps

**Key Entities**:
- `profiles` - User profiles (user_id, display_name, timezone)
- `households` - Household entity (id, name, owner_user_id)
- `household_members` - Membership (user_id, household_id, role)
- `invites` - Invitations (token_hash, expires_at, invited_email)

**Roles**: owner → admin → member

**Security Requirements**:
- All tables must have RLS enabled
- Edge functions must validate JWT
- Invite tokens must be hashed
- No cross-household data access

