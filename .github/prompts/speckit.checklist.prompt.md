---
agent: speckit.checklist
---

## Goal

Generate a context-specific checklist for a feature or process in Trackly Home. Checklists help ensure quality, security, and completeness.

## User Input

```text
$ARGUMENTS
```

The user input specifies what type of checklist to generate (e.g., "security review", "pre-deploy", "RLS audit", "feature completion").

## Execution Steps

### 1. Determine Checklist Type

Based on user input, identify the checklist category:

- **Security Review**: RLS policies, auth validation, data isolation
- **Pre-Deploy**: Build verification, manual testing, documentation
- **RLS Audit**: Table-by-table policy verification
- **Feature Completion**: Requirements coverage, testing, documentation
- **Code Review**: TypeScript standards, React patterns, security
- **Database Migration**: Schema changes, RLS, rollback plan

### 2. Load Context (if feature-specific)

If on a feature branch, load relevant artifacts:
- `spec.md` - Requirements to verify
- `plan.md` - Technical approach
- `tasks.md` - Implementation checklist

### 3. Generate Checklist

Create a checklist tailored to Trackly Home using the appropriate template below.

### 4. Output

Write checklist to appropriate location or display inline.

---

## Trackly Home Checklist Templates

### Security Review Checklist

```markdown
# Security Review Checklist: [Feature Name]

**Purpose**: Verify security requirements before merge
**Feature**: [Link to spec.md]
**Date**: [DATE]

## Database Security

- [ ] SEC001 All new tables have RLS enabled
- [ ] SEC002 SELECT policies enforce household membership check
- [ ] SEC003 INSERT policies verify user belongs to target household
- [ ] SEC004 UPDATE policies restrict to admins where appropriate
- [ ] SEC005 DELETE policies exist (or table doesn't allow deletes)
- [ ] SEC006 No recursive helper function calls that could cause stack overflow

## Edge Function Security

- [ ] SEC007 verify_jwt = true in function config
- [ ] SEC008 User authentication checked before any operation
- [ ] SEC009 Admin role verified for privileged operations
- [ ] SEC010 Service role key never returned in response
- [ ] SEC011 Error messages don't leak internal details
- [ ] SEC012 No PII in console.log or error messages

## Frontend Security

- [ ] SEC013 No secrets in client-side code
- [ ] SEC014 No service role key usage
- [ ] SEC015 Auth state checked before API calls
- [ ] SEC016 User input sanitized before display
- [ ] SEC017 Error messages are user-friendly (no stack traces)

## Data Isolation

- [ ] SEC018 Cross-household access tested and blocked
- [ ] SEC019 Invite tokens are hashed (never plaintext in DB)
- [ ] SEC020 Token expiry enforced
- [ ] SEC021 Single-use tokens invalidated after acceptance
```

### Pre-Deploy Checklist

```markdown
# Pre-Deploy Checklist: [Feature/Release]

**Purpose**: Verify readiness for deployment
**Target Environment**: [dev/prod]
**Date**: [DATE]

## Build Verification

- [ ] DEP001 `npm run build` passes without errors
- [ ] DEP002 `npm run lint` passes without errors
- [ ] DEP003 No TypeScript errors in build output
- [ ] DEP004 Build produces dist/ folder correctly

## Local Testing

- [ ] DEP005 Magic link sign-in works
- [ ] DEP006 Household creation flow works
- [ ] DEP007 Invite creation works (as admin)
- [ ] DEP008 Invite acceptance works
- [ ] DEP009 Role management works (as admin)
- [ ] DEP010 Non-admin cannot access admin features

## Database

- [ ] DEP011 Migrations apply cleanly (`supabase db reset`)
- [ ] DEP012 No migration errors in output
- [ ] DEP013 RLS policies tested with SQL queries

## Edge Functions

- [ ] DEP014 Functions deploy without errors
- [ ] DEP015 Functions tested locally (`supabase functions serve`)
- [ ] DEP016 CORS headers return correctly

## Documentation

- [ ] DEP017 README.md updated if user-facing changes
- [ ] DEP018 Migration README updated if DB changes
- [ ] DEP019 PROJECT_TRACKER.md updated with completion status
```

### RLS Audit Checklist

```markdown
# RLS Audit Checklist

**Purpose**: Comprehensive review of Row Level Security policies
**Date**: [DATE]

## profiles Table

- [ ] RLS001 RLS enabled: `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY`
- [ ] RLS002 SELECT: User can only read own profile
- [ ] RLS003 INSERT: User can only insert own profile
- [ ] RLS004 UPDATE: User can only update own profile
- [ ] RLS005 Test: `SET LOCAL request.jwt.claims.sub TO 'other-user'; SELECT * FROM profiles;` returns 0 rows

## households Table

- [ ] RLS006 RLS enabled
- [ ] RLS007 SELECT: Only household members can read
- [ ] RLS008 INSERT: Via edge function only (service role)
- [ ] RLS009 UPDATE: Owner only
- [ ] RLS010 Test: Cross-household SELECT returns 0 rows

## household_members Table

- [ ] RLS011 RLS enabled
- [ ] RLS012 SELECT: Household members can see other members
- [ ] RLS013 INSERT: Via edge function only
- [ ] RLS014 UPDATE: Admins can update roles
- [ ] RLS015 DELETE: Protected by trigger (cannot remove last admin)
- [ ] RLS016 Test: Cannot modify other household's members

## invites Table

- [ ] RLS017 RLS enabled
- [ ] RLS018 SELECT: Household members can see invites
- [ ] RLS019 INSERT: Admins only
- [ ] RLS020 Token stored as hash, not plaintext
- [ ] RLS021 Test: Non-admin INSERT fails
```

### Feature Completion Checklist

```markdown
# Feature Completion Checklist: [Feature Name]

**Purpose**: Verify feature is complete and ready for review
**Spec**: [Link to spec.md]
**Date**: [DATE]

## Requirements Coverage

- [ ] FTR001 All FR-* requirements implemented
- [ ] FTR002 All user stories have working flows
- [ ] FTR003 Edge cases handled per spec

## Code Quality

- [ ] FTR004 TypeScript strict mode passing
- [ ] FTR005 No `any` types used
- [ ] FTR006 Components have proper Props interfaces
- [ ] FTR007 Services have proper return types
- [ ] FTR008 Error handling in place

## Testing

- [ ] FTR009 Happy path tested manually
- [ ] FTR010 Error states tested manually
- [ ] FTR011 Loading states display correctly
- [ ] FTR012 RLS policies verified with SQL

## Documentation

- [ ] FTR013 JSDoc on exported functions
- [ ] FTR014 Complex logic has comments
- [ ] FTR015 PRD status updated
- [ ] FTR016 Tracker task marked complete

## Security (if applicable)

- [ ] FTR017 Security checklist passed
- [ ] FTR018 No secrets in code
- [ ] FTR019 Auth validation in place
```

