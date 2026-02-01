---
name: security-audit
description: Perform security audits on RLS policies, Edge Functions, and frontend code. Use when reviewing security before deployment, after database changes, or when auditing existing policies. Ensures zero cross-household data leaks.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Supabase CLI with local database
allowed-tools: Bash(supabase:*) Bash(psql:*) Read
---

# Security Audit Skill

Comprehensive security auditing for Trackly Home's defense-in-depth architecture.

## When to Use

- Before merging to `main` branch
- After database schema changes
- After Edge Function modifications
- Periodic security reviews
- When adding new RLS policies

## Security Layers

Trackly Home enforces security at three layers:

1. **Database (RLS)** - Row Level Security policies
2. **Server (Edge Functions)** - JWT validation, role checks
3. **Client (Frontend)** - Auth state, no secrets exposure

## RLS Audit Checklist

### profiles Table

```sql
-- Test: Users can only see their own profile
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-1';

-- Should return exactly 1 row (own profile)
SELECT COUNT(*) FROM profiles;

-- Should return 0 rows (other user's profile)
SELECT * FROM profiles WHERE user_id = 'user-uuid-2';
```

- [ ] RLS enabled
- [ ] SELECT: Own row only
- [ ] INSERT: Own row only
- [ ] UPDATE: Own row only
- [ ] DELETE: Not allowed (or own row only)

### households Table

```sql
-- Test: Only members can see household
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'member-user-uuid';

-- Should return household if user is member
SELECT * FROM households WHERE id = 'household-uuid';

-- Test cross-household access
SET LOCAL request.jwt.claims.sub TO 'non-member-user-uuid';

-- Should return 0 rows
SELECT * FROM households WHERE id = 'household-uuid';
```

- [ ] RLS enabled
- [ ] SELECT: Members only
- [ ] INSERT: Via edge function only
- [ ] UPDATE: Owner only
- [ ] DELETE: Not allowed (or owner only)

### household_members Table

```sql
-- Test: Only members can see membership list
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'member-user-uuid';

-- Should return all members of own household
SELECT * FROM household_members WHERE household_id = 'household-uuid';

-- Test cross-household access
SET LOCAL request.jwt.claims.sub TO 'non-member-user-uuid';

-- Should return 0 rows
SELECT * FROM household_members WHERE household_id = 'household-uuid';
```

- [ ] RLS enabled
- [ ] SELECT: Household members only
- [ ] INSERT: Via edge function only
- [ ] UPDATE: Admins only
- [ ] DELETE: Not allowed (managed via functions)
- [ ] Last admin protection trigger works

### invites Table

```sql
-- Test: Only household members can see invites
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'member-user-uuid';

-- Should return invites for own household
SELECT * FROM invites WHERE household_id = 'household-uuid';

-- Test: Only admins can create invites
-- (Should be blocked by RLS or handled via function)
```

- [ ] RLS enabled
- [ ] SELECT: Household members only
- [ ] INSERT: Admins only (or via function)
- [ ] Tokens stored as hashes (never plaintext)
- [ ] Expiry enforced

### tasks Table

```sql
-- Test: Only members can access tasks
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'member-user-uuid';

-- Should return tasks from own household
SELECT * FROM tasks WHERE household_id = 'household-uuid';

-- Test cross-household task access
SET LOCAL request.jwt.claims.sub TO 'non-member-user-uuid';

-- Should return 0 rows
SELECT * FROM tasks WHERE household_id = 'household-uuid';
```

- [ ] RLS enabled
- [ ] SELECT: Members only
- [ ] INSERT: Members only (validated household)
- [ ] UPDATE: Members only
- [ ] DELETE: Members only

## Edge Function Audit

### For Each Function

```bash
# List all functions
ls supabase/functions/
```

| Function | verify_jwt | Admin Check | Service Key Usage |
|----------|-----------|-------------|-------------------|
| create-household | ✅ | N/A | ✅ for insert |
| create-invite | ✅ | ✅ | ✅ for insert |
| accept-invite | ✅ | N/A | ✅ for update |
| manage-roles | ✅ | ✅ | ✅ for update |

### Verification Steps

For each function, verify:

- [ ] `verify_jwt = true` in `supabase/config.toml`
- [ ] Authorization header extracted and validated
- [ ] `supabase.auth.getUser()` called to verify token
- [ ] Role check before admin operations
- [ ] Service role key used only for privileged operations
- [ ] Service role key never in response body
- [ ] No PII in console.log statements
- [ ] Error messages sanitized (no internal details)

### PII Logging Audit

Search for potential PII exposure:

```bash
# Search for console.log in functions
grep -r "console.log" supabase/functions/ --include="*.ts"

# Check for email logging
grep -rE "(email|Email|EMAIL)" supabase/functions/ --include="*.ts"

# Check for token logging
grep -rE "(token|Token|TOKEN)" supabase/functions/ --include="*.ts"
```

**Forbidden patterns:**
- `console.log(email)`
- `console.log(user.email)`
- `console.log(token)`
- `console.log(req.body)` (may contain PII)

**Allowed patterns:**
- `console.log("Operation completed")`
- `console.log("Error code:", error.code)`
- `console.error("Database error:", error.code)`

## Frontend Audit

### Secrets Exposure Check

```bash
# Search for potential secrets in frontend code
grep -rE "(service.?role|SERVICE.?ROLE)" apps/web/src/

# Check for hardcoded keys
grep -rE "eyJ[A-Za-z0-9_-]+" apps/web/src/ --include="*.ts" --include="*.tsx"

# Check environment variable usage
grep -r "import.meta.env" apps/web/src/
```

- [ ] No service role key in frontend code
- [ ] Only `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` used
- [ ] No hardcoded JWT tokens
- [ ] No API keys in source code

### Auth State Check

For protected routes, verify:

- [ ] Auth state checked before API calls
- [ ] Unauthenticated users redirected to login
- [ ] Admin-only features gated by role check
- [ ] Error messages don't leak internal details

## Cross-Household Isolation Test

The most critical security requirement is **zero cross-household data leaks**.

### Test Procedure

1. Create two test households (A and B)
2. Create users: UserA (in HouseholdA), UserB (in HouseholdB)
3. As UserA, try to access HouseholdB data:

```sql
-- Set up as UserA
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'userA-uuid';

-- Attempt cross-household access (all should return 0 rows)
SELECT * FROM households WHERE id = 'householdB-uuid';
SELECT * FROM household_members WHERE household_id = 'householdB-uuid';
SELECT * FROM tasks WHERE household_id = 'householdB-uuid';
SELECT * FROM invites WHERE household_id = 'householdB-uuid';
```

**Expected Result:** All queries return 0 rows.

## Helper Function Audit

Check for potential infinite recursion:

```sql
-- List all helper functions
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
```

For functions that query RLS-protected tables:

- [ ] Uses `SECURITY DEFINER` (bypasses RLS)
- [ ] Contains `SET search_path = public` for security
- [ ] Does not call other functions that might recurse
- [ ] Stack depth tested (no infinite loops)

## CORS Audit

```bash
# Check CORS configuration in functions
grep -r "Access-Control" supabase/functions/

# Check for wildcard origins
grep -r "Allow-Origin.*\*" supabase/functions/
```

- [ ] No wildcard (`*`) origins in production
- [ ] `SITE_URL` or `CORS_ORIGINS` environment variable used
- [ ] OPTIONS preflight handled correctly

## Security Audit Report Template

```markdown
# Security Audit Report

**Date:** YYYY-MM-DD
**Auditor:** [Name]
**Scope:** [Feature/Full audit]

## Summary

| Area | Status | Issues |
|------|--------|--------|
| RLS Policies | ✅/⚠️/❌ | [count] |
| Edge Functions | ✅/⚠️/❌ | [count] |
| Frontend | ✅/⚠️/❌ | [count] |
| Cross-Household | ✅/⚠️/❌ | [count] |

## Findings

### Critical
- [None / List issues]

### High
- [None / List issues]

### Medium
- [None / List issues]

### Low
- [None / List issues]

## Recommendations

1. [Action item]
2. [Action item]

## Conclusion

[Pass/Fail with conditions]
```

## Quick Security Checklist (Pre-Merge)

```markdown
- [ ] RLS enabled on all new tables
- [ ] SELECT policies enforce household membership
- [ ] INSERT policies validate target household
- [ ] Edge functions have verify_jwt = true
- [ ] Admin operations check role
- [ ] No PII in logs
- [ ] No secrets in frontend
- [ ] Cross-household access tested
- [ ] Error messages sanitized
```
