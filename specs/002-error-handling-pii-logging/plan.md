# Implementation Plan: Error Handling & PII Logging Security

**Branch**: `002-error-handling-pii-logging` | **Date**: 2026-01-21 | **Spec**: [spec.md](spec.md)
**Input**: Complete Phase 2 Security Hardening by standardizing error responses and eliminating PII from logs

## Summary

Standardize error response format across all 4 Edge Functions (create-household, create-invite, accept-invite, manage-roles) to provide consistent client-side error handling, and audit all functions for PII exposure (emails, names, user IDs) in console logs or error messages. This completes Phase 2 Security Hardening (tasks 2.8 and 2.9) by establishing secure logging practices and predictable error contracts.

**Technical Approach**: Define TypeScript error response interface with status code, message, and error code enum. Refactor all Edge Functions to use standardized error helper. Audit console.log statements and error messages to ensure no PII leakage. Document error codes for client reference.

## Technical Context

**Language/Version**: TypeScript 5.x (Deno runtime for Edge Functions)  
**Primary Dependencies**: Deno 1.x, @supabase/supabase-js  
**Storage**: N/A (no database changes)  
**Testing**: Manual testing via curl/Postman + error scenario validation  
**Target Platform**: Supabase Edge Functions (Deno Deploy)  
**Project Type**: Backend refactoring (Edge Functions only)  
**Performance Goals**: No impact - refactoring existing logic only  
**Constraints**: Must maintain backward compatibility with existing client code  
**Scale/Scope**: 4 Edge Functions (create-household, create-invite, accept-invite, manage-roles)

**Current Error Pattern Analysis**:
- ✅ All functions return `{ error: string }` for errors (consistent)
- ❌ Inconsistent HTTP status codes (some use 500 for validation errors)
- ❌ No structured error codes (clients can't distinguish error types programmatically)
- ⚠️ Potential PII exposure: email addresses in error messages, Supabase error messages may leak info

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|✅ | Directly addresses PII logging requirement from constitution |
| II. Vertical Slices | ✅ | Two independent user stories: (1) Error standardization, (2) PII audit |
| III. Minimal Changes | ✅ | Refactoring only - no new features, no database changes |
| IV. Document As You Go | ✅ | Will document error codes in supabase/functions/README.md |
| V. Test Before Deploy | ✅ | Manual testing plan: trigger all error scenarios, verify no PII in logs
| V. Test Before Deploy | ☐ | Local testing approach? Manual smoke test plan? |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research (if needed)
├── data-model.md        # Database design (if DB changes)
├── quickstart.md        # Setup/testing guide (if complex)
├── contracts/           # API contracts (if new Edge Functions)
└── tasks.md             # Task list (created by /speckit.tasks)
```

### Source Code (Trackly Home structure)

```text
apps/web/src/
├── components/          # React components
│   └── [NewComponent].tsx
├── screens/             # Page-level components
│   └── [NewScreen].tsx
├── services/            # API/Supabase service functions
│   └── [newService].ts
├── lib/                 # Utilities
│   └── supabaseClient.ts (existing)
└── router/              # React Router configuration
    └── AppRouter.tsx (existing)

supabase/
├── migrations/          # SQL migrations
│   └── [timestamp]_[num]_[description].sql
├── functions/           # Edge Functions (Deno)
│   ├── [new-function]/
│   │   ├── index.ts
│   │   └── deno.json
│   └── _shared/         # Shared utilities (existing)
│       ├── cors.ts
│       ├── crypto.ts
│       └── supabase.ts
└── config.toml          # Local CLI config
```

**Structure Decision**: Web application with frontend (apps/web) and backend (supabase)

## Database Design *(if feature involves data changes)*
**No database changes required** - This is a backend refactoring effort only.
| [table] | UPDATE | [who can update] |

## Edge Functions *(if new server-side logic)*

| Function | Auth Required | Admin Only | Purpose |
|----------|---------------|------------|---------|
| [name] | ☐ | ☐ | [description] |

## Frontend Components *(if UI changes)*

| Component | Location | Purpose |
|-----------|----------|---------|
| [Name] | apps/web/src/components/ | [description] |
| [Screen] | apps/web/src/screens/ | [description] |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Neexisting functions to refactor)*

| Function | Changes Required | PII Audit |
|----------|-----------------|-----------|
| create-household | ✅ Standardize error responses | ✅ Remove household name from error logs |
| create-invite | ✅ Standardize error responses | ✅ Remove email from error messages |
| accept-invite | ✅ Standardize error responses | ✅ Sanitize token references in logs |
| manage-roles | ✅ Standardize error responses | ✅ Remove user IDs from error messages |
**No frontend changes required** - Error response shape remains backward compatible:

**Current client expectation**:
```typescript
{ error: string }  // e.g., { error: "Missing household name" }
```

**New response format**:
**No violations** - This refactoring adheres to all constitution principles.
    status: number     // NEW: explicit status (redundant but helpful)
  }
}
```

**Backward Compatibility**: Clients checking `if (response.error)` will still work. Clients can optionally use `response.error.code` for programmatic handling.

**Fx] New tables have RLS enabled — **N/A: No database changes**
- [x] Edge functions validate JWT (verify_jwt = true) — **Already enforced, not changing**
- [x] Admin-only features check role — **Already enforced, not changing**
- [x] No service role key exposure — **Already enforced, not changing**
- [x] Tokens hashed before storage (if applicable) — **Already enforced, not changing**
- [x] CORS configured correctly — **Already enforced, not changing**
- [ ] **No PII in logs** — ✅ **PRIMARY GOAL: Will audit and remove all PII**

### Specific PII Audit Checklist

- [ ] Remove email (Error Scenarios)

**Test Each Error Code Path**:

1. **create-household**
   - [ ] Missing name → `MISSING_FIELD`
   - [ ] Name too long → `INVALID_REQUEST`
   - [ ] User already in household → `ALREADY_IN_HOUSEHOLD`
   - [ ] Success → No PII in logs

2. **create-invite**
   - [ ] Missing household_id → `MISSING_FIELD`
   - [ ] Invalid email → `INVALID_EMAIL`
   - [ ] Not household member → `NOT_HOUSEHOLD_MEMBER`
   - [ ] Not admin → `NOT_ADMIN`
   - [ ] Success → **Verify email NOT logged**

3. **accept-invite**
   - [ ] Missing token → `MISSING_FIELD`
   - [ ] Token not found → `INVITE_NOT_FOUND`
   - [ ] Already accepted → `INVITE_ALREADY_USED`
   - [ ] Expired token → `INVITE_EXPIRED`
   - [ ] Success → **Verify token NOT logged**

4. **manage-roles**
   - [ ] Missing fields → `MISSING_FIELD`
   - [ ] Invalid role → `INVALID_ROLE`
   - [ ] Not admin → `NOT_ADMIN`
   - [ ] Target not found → `USER_NOT_FOUND`
   - [ ] Cannot change owner → `CANNOT_CHANGE_OWNER`
   - [ ] Last admin → `LAST_ADMIN`
   - [ ] Success → **Verify user IDs NOT logged**

### PII Audit Verification

**Audit Methodology**:
1. Add `console.log` instrumentation to each function
2. Trigger all error scenarios via curl/Postman
3. Review Supabase logs for PII exposure
4. Ensure error responses don't contain PII
5. Remove all console.log statements before merge

**PII Detection Checklist**:
- [ ] Search all `.ts` files for `console.log` statements
- [ ] Search for email regex patterns in error messages
- [ ] Search for token references in logs
- [ ] Review Supabase error wrapping (no raw `error.message` passthrough)

### Backward Compatibility Test

**Ensure existing clients still work**:
```typescript
// Old client code should still work
const response = await fetch('/functions/v1/create-household', {
  method: 'POST',
  body: JSON.stringify({ name: 'Test' })
});

const data = await response.json();
if (data.error) {
  // OLD: data.error is a string
  // NEW: data.error is an object with { message, code, status }
  // Both work because error is truthy
  console.error(data.error);
}
```

**Test in browser console**:
- [ ] Trigger errors in existing app
- [ ] Verify error messages still display correctly
- [ ] No console errors from client code expecting old formatort enum ErrorCode {
  // Authentication (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  
  // Authorization (403)
  FORBIDDEN = "FORBIDDEN",
  NOT_ADMIN = "NOT_ADMIN",
  NOT_HOUSEHOLD_MEMBER = "NOT_HOUSEHOLD_MEMBER",
  
  // Validation (400)
  INVALID_REQUEST = "INVALID_REQUEST",
  MISSING_FIELD = "MISSING_FIELD",
  INVALID_EMAIL = "INVALID_EMAIL",
  INVALID_ROLE = "INVALID_ROLE",
  
  // Business Logic (409)
  ALREADY_IN_HOUSEHOLD = "ALREADY_IN_HOUSEHOLD",
  INVITE_ALREADY_USED = "INVITE_ALREADY_USED",
  LAST_ADMIN = "LAST_ADMIN",
  CANNOT_CHANGE_OWNER = "CANNOT_CHANGE_OWNER",
  
  // Not Found (404)
  NOT_FOUND = "NOT_FOUND",
  INVITE_NOT_FOUND = "INVITE_NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  
  // Gone (410)
  INVITE_EXPIRED = "INVITE_EXPIRED",
  
  // Server Error (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
}

export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  headers: Headers
): Response {
  return json(
    { error: { message, code, status } },
    { status, headers }
  );
}
```

### PII Sanitization Rules

| PII Type | Current Exposure | Mitigation |
|----------|-----------------|------------|
| Email addresses | `create-invite` error: "Invalid email" (safe), but logs full email on success | Remove email from success logs |
| Household names | `create-household` may log name in errors | Sanitize: "Household name validation failed" (no actual name) |
| User IDs | `manage-roles` returns user IDs in errors | Keep UUIDs (not PII), but don't log them |
| Invite tokens | `accept-invite` may log token on error | Never log tokens - use "Invalid token" only |
| Supabase errors | Raw `error.message` may leak table/column names | Wrap in generic "Database error occurred"

- [ ] New tables have RLS enabled
- [ ] Edge functions validate JWT (verify_jwt = true)
- [ ] Admin-only features check role
- [ ] No service role key exposure
- [ ] Tokens hashed before storage (if applicable)
- [ ] CORS configured correctly
- [ ] No PII in logs

## Testing Plan

### Manual Testing
- [ ] Happy path works
- [ ] Error states handled
- [ ] Loading states display
- [ ] Role-based access verified

### RLS Verification
```sql
-- Test: Cross-household access blocked
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM [new_table] WHERE household_id = 'other-household-id';
-- Should return 0 rows
```
