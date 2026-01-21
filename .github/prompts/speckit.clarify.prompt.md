---
agent: speckit.clarify
---

## Goal

Interactively clarify ambiguous or incomplete requirements in a feature specification. This command helps resolve `[NEEDS CLARIFICATION]` markers and fill gaps in the spec.

## User Input

```text
$ARGUMENTS
```

The user input may specify which aspect to clarify or provide answers to previous questions.

## Execution Steps

### 1. Load Current Spec

If on a feature branch, run:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json --paths-only
```

Read `specs/[BRANCH_NAME]/spec.md` to find:
- Items marked `[NEEDS CLARIFICATION: reason]`
- Vague requirements without measurable criteria
- Missing acceptance criteria
- Undefined edge cases

### 2. Prioritize Clarifications

Categorize unclear items by impact:

**Blocking** (must resolve before implementation):
- Security-related ambiguities
- Data model uncertainties
- Core user flow gaps

**Important** (should resolve before implementation):
- Non-functional requirements without metrics
- Edge cases without defined behavior
- UI/UX decisions

**Nice-to-have** (can resolve during implementation):
- Minor wording improvements
- Optional feature details

### 3. Ask Clarifying Questions

For each unclear item, formulate specific questions:

**Bad**: "What should this feature do?"
**Good**: "When an admin demotes themselves, should the system: (A) prevent it if they're the last admin, (B) require selecting a replacement admin first, or (C) allow it and auto-promote another member?"

Provide context from existing Trackly Home patterns where relevant.

### 4. Trackly Home Context for Decisions

When clarifying, consider existing patterns:

**Authentication**:
- Magic link is the only auth method (MVP)
- Session handled by Supabase Auth
- Profile created on first login

**Authorization**:
- Three roles: owner → admin → member
- Owner: full control, created household
- Admin: can invite, manage roles (except owner)
- Member: read-only access to household features

**Data Isolation**:
- All data is household-scoped
- RLS enforces isolation at database level
- No cross-household visibility ever

**Security Defaults**:
- When in doubt, choose the more restrictive option
- Tokens always expire (default: 7 days)
- Tokens always single-use
- Always hash sensitive data

### 5. Update Spec

After receiving answers:
1. Remove `[NEEDS CLARIFICATION]` markers
2. Add concrete requirements with measurable criteria
3. Document decisions in spec comments if non-obvious

### 6. Output

```
✅ Clarifications resolved in spec.md

Resolved:
  - FR-003: Admin self-demotion behavior defined
  - Edge case: Empty household handling documented

Remaining unclear items: 0

Next step: Run /speckit.plan to create implementation plan.
```

## Common Clarification Patterns for Trackly Home

### Role/Permission Questions

**Template**: "For [action], which roles should be allowed?"

Options to present:
- Owner only
- Owner and Admin
- All members
- Configurable per household (future)

### Data Retention Questions

**Template**: "How long should [data type] be retained?"

Common answers:
- Invites: 7 days (then expire)
- Accepted invites: Keep record indefinitely (audit trail)
- Deleted members: Soft delete vs hard delete

### Error Handling Questions

**Template**: "When [error condition] occurs, should the system:"

Options to present:
- Show user-friendly error and allow retry
- Silently fail and log
- Redirect to specific page
- Show detailed error (dev mode only)

### Edge Case Questions

**Template**: "What happens when [edge condition]?"

Common edge cases for Trackly Home:
- Last admin tries to leave/demote themselves
- User already in another household tries to join
- Invite link used by different email than intended
- Owner tries to delete household with members
- User signs up but never creates/joins household

### UI/UX Questions

**Template**: "For [feature], should users see:"

Options to present:
- Immediate feedback (optimistic UI)
- Loading state then result
- Confirmation dialog first
- Toast notification after

