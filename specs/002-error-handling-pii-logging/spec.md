# Feature Specification: Error Handling & PII Logging Security

**Feature Branch**: `002-error-handling-pii-logging`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: "Standardize error response format across all Edge Functions and review PII logging to ensure no sensitive data is exposed in logs"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Standardized Error Responses (Priority: P1)

**As a** frontend developer,  
**I want** all Edge Function errors to follow a consistent format with machine-readable error codes,  
**So that** I can implement proper error handling and provide better user feedback.

**Why this priority**: Current error handling is inconsistent across Edge Functions, making it difficult to implement conditional logic on the client (e.g., retry on server errors vs. show validation message). This is part of Phase 2 Security Hardening (task 2.8) and must be completed before Phase 3 UX improvements.

**Independent Test**: Call each Edge Function with invalid inputs and verify error responses include `{ message, code, status }` fields. Test can be performed with curl/Postman without requiring UI changes.

**Acceptance Scenarios**:

1. **Given** I call create-household with missing name, **When** I inspect the error response, **Then** I receive `{ error: { message: "Missing household name", code: "MISSING_FIELD", status: 400 } }`

2. **Given** I call create-invite as a non-admin user, **When** the function checks my role, **Then** I receive `{ error: { message: "Only admins can create invites", code: "NOT_ADMIN", status: 403 } }`

3. **Given** I call accept-invite with an expired token, **When** the function validates the token, **Then** I receive `{ error: { message: "Invite expired", code: "INVITE_EXPIRED", status: 410 } }`

4. **Given** existing client code checks `if (response.error)`, **When** the new error format is deployed, **Then** the client code continues to work without breaking (backward compatibility)

5. **Given** a database error occurs, **When** the Edge Function catches the error, **Then** I receive a generic error code without exposing internal details: `{ error: { message: "Database error occurred", code: "DATABASE_ERROR", status: 500 } }`

---

### User Story 2 - PII Elimination from Logs (Priority: P0)

**As a** security-conscious user,  
**I want** my personal information (email, household name) to never appear in application logs,  
**So that** my privacy is protected even if logs are accessed by administrators or leaked.

**Why this priority**: This is a **constitutional requirement** (Principle I: Security First - "No Personally Identifiable Information (PII) SHALL be written to application logs"). This is P0 because PII exposure is a security violation that must be fixed immediately. This is Phase 2 task 2.9.

**Independent Test**: Trigger all error scenarios and success paths in each Edge Function while monitoring Supabase logs. Verify no emails, household names, or tokens appear in logs. This can be tested independently without UI changes.

**Acceptance Scenarios**:

1. **Given** I create an invite with email "user@example.com", **When** the function executes successfully, **Then** the email address does NOT appear in any console.log or error log

2. **Given** I create a household with name "Smith Family", **When** a validation error occurs, **Then** the household name does NOT appear in error logs (only generic "Household name validation failed")

3. **Given** I accept an invite with a token, **When** the token is invalid, **Then** the token value does NOT appear in logs (only "Invalid token" message)

4. **Given** a Supabase database error occurs, **When** the Edge Function catches the error, **Then** the raw error message (which may contain table/column names) is NOT returned to the client or logged

5. **Given** I trigger any Edge Function error scenario, **When** I review Supabase function logs, **Then** I find zero occurrences of: email addresses, household names, invite tokens, or user-identifiable data

---

### User Story 3 - Error Code Documentation (Priority: P2)

**As a** frontend developer,  
**I want** a reference guide of all error codes and their meanings,  
**So that** I can implement proper error handling without guessing.

**Why this priority**: Nice-to-have improvement that enables better client-side error handling. Not blocking for Phase 2 completion but valuable for Phase 3 UX work.

**Independent Test**: Review documentation and verify all error codes used in Edge Functions are documented with examples.

**Acceptance Scenarios**:

1. **Given** I need to handle errors in the frontend, **When** I read supabase/functions/README.md, **Then** I find a complete list of error codes with HTTP status codes and example scenarios

2. **Given** a new error code is added to an Edge Function, **When** code review occurs, **Then** the documentation is updated to include the new code

---

### Edge Cases

- **Supabase error messages**: Some Postgres errors may leak table/column names → Must wrap all database errors in generic messages
- **Multi-language support**: Error messages currently English-only → Out of scope for MVP, document for future i18n work
- **Error logging for debugging**: Need generic errors for users but detailed logs for debugging → Use error codes for client, log full stack traces server-side (without PII)
- **Backward compatibility**: Existing clients expect `{ error: string }` → New format `{ error: { message, code, status } }` must be backward compatible
- **Email validation errors**: "Invalid email" is safe, but don't include the actual email in the error → Already safe, verify in audit
- **User IDs in errors**: UUIDs are not PII but unnecessary to expose → Remove from logs but can remain in responses where needed

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All Edge Function error responses MUST include `{ message: string, code: string, status: number }`
- **FR-002**: Error codes MUST be defined as TypeScript enum for type safety
- **FR-003**: All error responses MUST include appropriate HTTP status codes (400, 401, 403, 404, 409, 410, 500)
- **FR-004**: Error messages MUST be user-friendly (no technical jargon or internal implementation details)
- **FR-005**: Backward compatibility MUST be maintained - existing client code checking `if (response.error)` must continue working
- **FR-006**: Database errors MUST be wrapped in generic messages before returning to client
- **FR-007**: All Edge Functions MUST use shared error utility for consistency

### Security Requirements (PII Elimination)

- **SR-001**: Edge Functions MUST NOT log email addresses in console.log or error messages
- **SR-002**: Edge Functions MUST NOT log household names in console.log or error messages
- **SR-003**: Edge Functions MUST NOT log invite tokens (plaintext or hashed) in console.log or error messages
- **SR-004**: Edge Functions MUST wrap Supabase error messages to prevent internal details leakage
- **SR-005**: Success responses MUST NOT include PII in logged messages
- **SR-006**: Error helper utility MUST sanitize all error messages before logging
- **SR-007**: All existing console.log statements MUST be audited and removed if they contain PII

### Documentation Requirements

- **DR-001**: All error codes MUST be documented in supabase/functions/README.md
- **DR-002**: Error code documentation MUST include: code enum value, HTTP status, example scenario, user-facing message
- **DR-003**: PII logging policy MUST be documented for future Edge Function development
- **DR-004**: Migration guide for frontend developers MUST explain how to use new error codes

### Key Entities

**New Shared Module** (supabase/functions/_shared/errors.ts):

```typescript
export interface ErrorResponse {
  error: {
    message: string;      // User-friendly message
    code: ErrorCode;      // Machine-readable error code
    status: number;       // HTTP status code
  };
}

export enum ErrorCode {
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
```

**Modified Functions** (no schema changes, refactoring only):
- create-household/index.ts
- create-invite/index.ts
- accept-invite/index.ts
- manage-roles/index.ts
- _shared/supabase.ts (add error wrapping utility)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% error standardization** - All 4 Edge Functions return errors in new format with message, code, and status
- **SC-002**: **Zero PII exposure** - Manual audit of all 4 Edge Functions finds zero instances of PII in logs or error messages
- **SC-003**: **Backward compatibility** - All 18 error scenarios tested with old client code, zero breaking changes
- **SC-004**: **Error code coverage** - All 16 error scenarios mapped to appropriate error codes
- **SC-005**: **Documentation complete** - README.md includes all error codes with examples
- **SC-006**: **Manual testing complete** - All 18 error paths tested via curl/Postman with verified responses
- **SC-007**: **PII audit passing** - Search for console.log, email patterns, token references finds zero violations

### Test Coverage

| Function | Error Scenarios | PII Audit |
|----------|----------------|-----------|
| create-household | 4 scenarios | ✅ No household names in logs |
| create-invite | 5 scenarios | ✅ No emails or tokens in logs |
| accept-invite | 5 scenarios | ✅ No tokens in logs |
| manage-roles | 6 scenarios | ✅ No user IDs in logs |

**Total**: 20 error scenarios to test + 4 success path PII audits
