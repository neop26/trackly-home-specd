---
name: testing
description: Manual and automated testing for Trackly Home. Use when creating test plans, running smoke tests, validating RLS policies, or verifying feature functionality. Covers the testing strategy documented in SDLC.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Node.js, Supabase CLI, browser for manual testing
allowed-tools: Bash(npm:*) Bash(supabase:*) Bash(curl:*) Read
---

# Testing Skill

Comprehensive testing guidance for Trackly Home's manual and automated testing workflow.

## When to Use

- Creating test plans for new features
- Running manual smoke tests
- Testing RLS policies
- Validating Edge Functions
- Pre-deployment verification

## Testing Strategy

| Layer | Type | Tool | Coverage |
|-------|------|------|----------|
| UI | Manual | Browser | All user flows |
| API | Manual | curl/Postman | Edge Functions |
| DB | Manual | SQL Editor | RLS policies |
| Unit | Automated | Vitest (future) | Critical logic |
| E2E | Automated | Playwright (future) | User journeys |

## Manual Testing

### Pre-Release Checklist

#### Authentication

- [ ] Magic link sign-in works
- [ ] Magic link email received (check spam)
- [ ] Session persists on refresh
- [ ] Sign-out works correctly
- [ ] Invalid email shows error
- [ ] Expired magic link shows error

#### Household Setup

- [ ] New user can create household
- [ ] Household name validation works (1-100 chars)
- [ ] User becomes owner after creation
- [ ] Cannot create multiple households
- [ ] Redirected to dashboard after creation

#### Invite Flow

- [ ] Admin can create invite
- [ ] Non-admin cannot see invite option
- [ ] Invite link copies correctly
- [ ] Partner can join via link
- [ ] Expired invite shows error (after 7 days)
- [ ] Used invite shows error
- [ ] Invalid token shows error

#### Role Management

- [ ] Admin can view ManageRolesCard
- [ ] Member cannot view ManageRolesCard
- [ ] Role changes are saved
- [ ] Cannot remove last admin
- [ ] Cannot demote owner

#### Task Management

- [ ] View household tasks
- [ ] Create task with title
- [ ] Title validation works (1-500 chars)
- [ ] Mark task complete
- [ ] Mark task incomplete
- [ ] Assign task to member
- [ ] Set due date
- [ ] Overdue indicator shows correctly
- [ ] "Unassigned" placeholder shows
- [ ] "No due date" placeholder shows

### Smoke Test Script

```bash
# 1. Start local environment
supabase start
cd apps/web && npm run dev

# 2. Open browser to http://localhost:5173

# 3. Manual test flow:
# - Sign in with test email
# - Create household
# - Create invite (if admin)
# - Create tasks
# - Mark tasks complete
# - Sign out
```

## RLS Policy Testing

### Setup Test Environment

```sql
-- In Supabase SQL Editor or local psql

-- Create test scenario
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'test-user-uuid';
```

### Test Queries

#### profiles Table

```sql
-- Test: User can only see own profile
SELECT * FROM profiles;
-- Expected: 1 row (own profile)

-- Test: Cannot see other user's profile
SELECT * FROM profiles WHERE user_id = 'other-user-uuid';
-- Expected: 0 rows
```

#### households Table

```sql
-- Test: Member can see own household
SELECT * FROM households WHERE id = 'member-household-uuid';
-- Expected: 1 row

-- Test: Cannot see other household
SELECT * FROM households WHERE id = 'other-household-uuid';
-- Expected: 0 rows
```

#### Cross-Household Isolation

```sql
-- Critical test: Zero cross-household data leaks

-- As User A
SET LOCAL request.jwt.claims.sub TO 'user-a-uuid';

-- Attempt to access Household B data
SELECT * FROM households WHERE id = 'household-b-uuid';
SELECT * FROM household_members WHERE household_id = 'household-b-uuid';
SELECT * FROM tasks WHERE household_id = 'household-b-uuid';
SELECT * FROM invites WHERE household_id = 'household-b-uuid';

-- All queries should return 0 rows
```

### RLS Test Script Location

```bash
# Comprehensive RLS test script
cat supabase/test_rls_audit.sql
```

## Edge Function Testing

### Local Testing

```bash
# Start function server
supabase functions serve

# Test in another terminal
```

### Test create-household

```bash
curl -X POST http://localhost:54321/functions/v1/create-household \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Household"}'

# Expected: 200 with household data
# Error cases: 400 (invalid name), 409 (already has household)
```

### Test create-invite

```bash
curl -X POST http://localhost:54321/functions/v1/create-invite \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"email": "partner@example.com"}'

# Expected: 200 with invite token
# Error cases: 403 (not admin), 400 (invalid email)
```

### Test accept-invite

```bash
curl -X POST http://localhost:54321/functions/v1/accept-invite \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"token": "invite-token-here"}'

# Expected: 200 with success
# Error cases: 400 (invalid token), 410 (expired)
```

### Test manage-roles

```bash
curl -X POST http://localhost:54321/functions/v1/manage-roles \
  -H "Authorization: Bearer <admin-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"targetUserId": "user-uuid", "newRole": "admin"}'

# Expected: 200 with updated role
# Error cases: 403 (not admin), 400 (last admin)
```

## Build & Lint Testing

```bash
cd apps/web

# TypeScript compilation
npm run build
# Expected: Successful build, dist/ folder created

# ESLint
npm run lint
# Expected: No errors (warnings acceptable)

# Combined check
npm run build && npm run lint
```

## Performance Testing

### Task List Performance

```sql
-- Create 100 test tasks
INSERT INTO tasks (household_id, title, status, created_by)
SELECT 
  'household-uuid',
  'Task ' || generate_series,
  'incomplete',
  'user-uuid'
FROM generate_series(1, 100);
```

Load task list page:
- [ ] Renders in < 2 seconds
- [ ] No visible lag when scrolling
- [ ] Complete action responds in < 800ms

### Bundle Size Check

```bash
cd apps/web
npm run build

# Check dist folder size
du -sh dist/
# Target: < 500KB total

# Check individual chunks
ls -la dist/assets/*.js
```

## Test Data Generation

### Create Test Household

```sql
-- Insert test household
INSERT INTO households (id, name, owner_user_id)
VALUES ('test-hh-uuid', 'Test Household', 'owner-uuid');

-- Add members
INSERT INTO household_members (user_id, household_id, role)
VALUES 
  ('owner-uuid', 'test-hh-uuid', 'owner'),
  ('admin-uuid', 'test-hh-uuid', 'admin'),
  ('member-uuid', 'test-hh-uuid', 'member');
```

### Create Test Tasks

```sql
INSERT INTO tasks (household_id, title, status, assigned_to, due_date, created_by)
VALUES
  ('test-hh-uuid', 'Task 1', 'incomplete', 'member-uuid', '2026-02-01', 'owner-uuid'),
  ('test-hh-uuid', 'Task 2', 'complete', NULL, NULL, 'admin-uuid'),
  ('test-hh-uuid', 'Overdue Task', 'incomplete', 'owner-uuid', '2026-01-01', 'member-uuid');
```

## Test Report Template

```markdown
# Test Report: [Feature Name]

**Date:** YYYY-MM-DD
**Tester:** [Name]
**Environment:** Local / Dev / Prod

## Summary

| Category | Total | Passed | Failed |
|----------|-------|--------|--------|
| Authentication | X | X | 0 |
| Household | X | X | 0 |
| Tasks | X | X | 0 |
| RLS | X | X | 0 |

## Test Results

### Authentication
- [x] Magic link sign-in: PASS
- [x] Session persistence: PASS
- [x] Sign-out: PASS

### [Category]
- [x] Test case: PASS / FAIL
  - Notes: [if failed]

## Issues Found

1. [Issue description]
   - Steps to reproduce
   - Expected vs actual
   - Severity: Critical / High / Medium / Low

## Conclusion

[Pass / Fail with conditions]
```

## Continuous Testing Commands

```bash
# Watch mode for development
cd apps/web
npm run dev  # Vite with HMR

# In another terminal, watch for TypeScript errors
npx tsc --watch --noEmit

# Run lint on save (if configured)
npm run lint -- --watch
```
