# Supabase Edge Functions

This directory contains serverless Edge Functions for Trackly Home, deployed on Supabase/Deno Deploy.

## Functions

| Function | Purpose | Auth Required | Admin Only |
|----------|---------|---------------|------------|
| create-household | Create a new household with caller as owner | ✅ | ❌ |
| create-invite | Generate invite link for household (email optional) | ✅ | ✅ |
| accept-invite | Accept invite and join household | ✅ | ❌ |
| manage-roles | Change member role (admin/member) | ✅ | ✅ |

## Error Handling

All Edge Functions return standardized error responses following this format:

```typescript
{
  "error": {
    "message": "User-friendly error message",
    "code": "ERROR_CODE",
    "status": 400
  }
}
```

### Error Codes Reference

| Code | HTTP Status | Category | Example Scenario |
|------|-------------|----------|------------------|
| **Authentication (401)** | | | |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT token | No Authorization header, invalid token |
| **Authorization (403)** | | | |
| `FORBIDDEN` | 403 | Generic authorization failure | Operation not permitted |
| `NOT_ADMIN` | 403 | Non-admin attempting admin action | Regular member trying to create invite |
| `NOT_HOUSEHOLD_MEMBER` | 403 | User not in household | Caller not a member of target household |
| `CANNOT_CHANGE_OWNER` | 403 | Attempting to modify owner role | Trying to change owner's role via manage-roles |
| **Validation (400)** | | | |
| `INVALID_REQUEST` | 400 | Malformed request data | Invalid JSON body, name too long |
| `MISSING_FIELD` | 400 | Required field not provided | Missing household_id, email, token, etc. |
| `INVALID_EMAIL` | 400 | Email format validation failed | "not-an-email" submitted |
| `INVALID_ROLE` | 400 | Role value not in allowed list | Role other than "admin" or "member" |
| **Business Logic (404/409/410)** | | | |
| `NOT_FOUND` | 404 | Generic resource not found | Fallback for missing data |
| `INVITE_NOT_FOUND` | 404 | Invite token doesn't exist | Invalid or deleted invite token |
| `USER_NOT_FOUND` | 404 | Target user not in household | manage-roles target doesn't exist |
| `ALREADY_IN_HOUSEHOLD` | 409 | User already has household | Calling create-household when already a member |
| `INVITE_ALREADY_USED` | 409 | Invite has been accepted | Trying to reuse a token |
| `LAST_ADMIN` | 409 | Cannot remove only admin | Demoting last admin in household |
| `INVITE_EXPIRED` | 410 | Invite past expiration date | Token expired (7 days default) |
| **Server Error (500)** | | | |
| `INTERNAL_ERROR` | 500 | Unexpected server error | Uncaught exceptions, system failures |
| `DATABASE_ERROR` | 500 | Database operation failed | Supabase query errors (sanitized) |

### Error Code Usage by Function

**create-household**
- `UNAUTHORIZED` - Missing/invalid JWT
- `INVALID_REQUEST` - Invalid JSON, name too long
- `MISSING_FIELD` - Missing household name
- `ALREADY_IN_HOUSEHOLD` - User already belongs to a household
- `DATABASE_ERROR` - Database query failures

**create-invite**
- `UNAUTHORIZED` - Missing/invalid JWT
- `INVALID_REQUEST` - Invalid JSON body
- `MISSING_FIELD` - Missing household_id or email
- `INVALID_EMAIL` - Email format validation failed
- `NOT_HOUSEHOLD_MEMBER` - Caller not in household
- `NOT_ADMIN` - Caller is not admin/owner
- `DATABASE_ERROR` - Database query failures

**accept-invite**
- `UNAUTHORIZED` - Missing/invalid JWT
- `INVALID_REQUEST` - Invalid JSON body
- `MISSING_FIELD` - Missing token
- `INVITE_NOT_FOUND` - Token doesn't exist
- `INVITE_ALREADY_USED` - Invite already accepted
- `INVITE_EXPIRED` - Invite past expiration date
- `DATABASE_ERROR` - Database query failures

**manage-roles**
- `UNAUTHORIZED` - Missing/invalid JWT
- `INVALID_REQUEST` - Invalid JSON body
- `MISSING_FIELD` - Missing household_id, target_user_id, or new_role
- `INVALID_ROLE` - Role not "admin" or "member"
- `NOT_HOUSEHOLD_MEMBER` - Caller not in household
- `NOT_ADMIN` - Caller is not admin/owner
- `USER_NOT_FOUND` - Target user not in household
- `CANNOT_CHANGE_OWNER` - Attempting to change owner role
- `LAST_ADMIN` - Cannot demote last admin
- `DATABASE_ERROR` - Database query failures

## Frontend Integration

### Handling Errors

```typescript
const response = await fetch('/functions/v1/create-household', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({ name: 'Smith Family' })
});

const data = await response.json();

if (data.error) {
  // New format: error is an object with message, code, and status
  const { message, code, status } = data.error;
  
  // Conditional error handling by code
  switch (code) {
    case 'MISSING_FIELD':
      showValidationError(message);
      break;
    case 'ALREADY_IN_HOUSEHOLD':
      redirectToHouseholdDashboard();
      break;
    case 'DATABASE_ERROR':
    case 'INTERNAL_ERROR':
      showRetryableError(message);
      break;
    default:
      showGenericError(message);
  }
}
```

### Backward Compatibility

Existing client code checking `if (response.error)` will continue to work:

```typescript
// Old client code (still works)
if (data.error) {
  console.error(data.error); // Logs entire error object
}

// New client code (recommended)
if (data.error) {
  console.error(`[${data.error.code}] ${data.error.message}`);
}
```

## PII Logging Policy

**CRITICAL**: Edge Functions must NEVER log Personally Identifiable Information (PII).

### Prohibited in Logs

- ❌ Email addresses (even in success paths)
- ❌ Household names
- ❌ Invite tokens (plaintext or hashed)
- ❌ User IDs (unless absolutely required for debugging)
- ❌ Raw Supabase error messages (may contain table/column names)

### Safe Logging Practices

✅ **Use generic error codes** instead of specific details
```typescript
// ❌ BAD
console.log('Failed to create household', { name: household.name });

// ✅ GOOD
console.log('Failed to create household', { error_code: 'DATABASE_ERROR' });
```

✅ **Sanitize database errors** before returning to client
```typescript
// ❌ BAD
return json({ error: dbError.message }, { status: 500 });

// ✅ GOOD
return sanitizeDbError(dbError, headers);
```

✅ **Use placeholders** for PII in error messages
```typescript
// ❌ BAD
return errorResponse(ErrorCode.INVALID_EMAIL, `Email ${email} is invalid`, 400, headers);

// ✅ GOOD
return errorResponse(ErrorCode.INVALID_EMAIL, 'Invalid email format', 400, headers);
```

## Development

### Local Testing

```bash
# Start Supabase locally
supabase start

# Serve all functions (auto-reload on file changes)
supabase functions serve

# Test with curl
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Origin: http://localhost:5173" \
  -d '{"name":"Test Household"}' \
  http://127.0.0.1:54321/functions/v1/create-household
```

### Deployment

```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy create-household
```

### Environment Variables

Required secrets (set via `supabase secrets set`):

- `SB_URL` - Supabase project URL
- `SB_ANON_KEY` - Supabase anon key
- `SB_SERVICE_ROLE_KEY` - Supabase service role key
- `SITE_URL` - Frontend URL (for CORS and invite links)
- `INVITE_TOKEN_SECRET` - Secret for token hashing
- `RESEND_API_KEY` - Resend API key (optional, for email invites)
- `RESEND_FROM` - "From" email address (optional)
- `CORS_ORIGINS` - Additional allowed origins (CSV, optional)

## Shared Utilities

Located in `_shared/`:

- `cors.ts` - CORS handling with origin allowlist
- `crypto.ts` - Token hashing utilities
- `supabase.ts` - Supabase client initialization and auth helpers
- `errors.ts` - Standardized error response utilities (**NEW in Feature 002**)

### Using Error Utilities

```typescript
import { errorResponse, sanitizeDbError, ErrorCode } from '../_shared/errors.ts';

// Return validation error
if (!email) {
  return errorResponse(ErrorCode.MISSING_FIELD, 'Missing email', 400, headers);
}

// Sanitize database error
try {
  const { data, error } = await supabase.from('households').insert(...);
  if (error) return sanitizeDbError(error, headers);
} catch (err) {
  return sanitizeDbError(err, headers);
}
```

## Testing

Manual testing checklist for each function:

1. **Happy path** - Valid request succeeds
2. **Auth failure** - Missing/invalid token returns `UNAUTHORIZED`
3. **Validation failures** - Missing/invalid fields return appropriate error codes
4. **Business logic** - Edge cases (already exists, not found, etc.)
5. **Database errors** - Simulate DB failures, verify sanitization
6. **PII audit** - Check logs for any PII exposure

See `specs/002-error-handling-pii-logging/test-errors.sh` for automated validation.
