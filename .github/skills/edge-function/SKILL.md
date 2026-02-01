---
name: edge-function
description: Create and modify Supabase Edge Functions (Deno TypeScript). Use when adding server-side logic, privileged operations, or API endpoints. Ensures proper CORS, auth validation, and error handling.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires Supabase CLI, Deno runtime
allowed-tools: Bash(supabase:*) Bash(curl:*) Read Edit
---

# Edge Function Skill

Create secure Supabase Edge Functions with proper authentication, CORS, and error handling.

## When to Use

- Adding server-side privileged operations
- Operations requiring service role key
- Complex validation logic
- Multi-step database operations
- Admin-only operations

## Directory Structure

```
supabase/functions/
├── _shared/              # Shared utilities
│   ├── cors.ts          # CORS configuration
│   ├── errors.ts        # Standardized error codes
│   ├── crypto.ts        # Token hashing utilities
│   └── supabase.ts      # Supabase client factory
├── create-household/    # Example function
│   └── index.ts
├── create-invite/
│   └── index.ts
└── [new-function]/
    └── index.ts
```

## Creating a New Function

```bash
# Create function directory
mkdir -p supabase/functions/my-function

# Create main file
touch supabase/functions/my-function/index.ts
```

## Function Template

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, handleCors } from "../_shared/cors.ts";
import { AppError, ErrorCodes, createErrorResponse } from "../_shared/errors.ts";

interface RequestBody {
  // Define expected request body
  title: string;
  householdId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCors();
  }

  try {
    // 1. Validate Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new AppError(ErrorCodes.AUTH_MISSING_TOKEN, "Missing authorization header", 401);
    }

    // 2. Create Supabase client with user's token
    const supabase = createClient(
      Deno.env.get("SB_URL") ?? "",
      Deno.env.get("SB_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // 3. Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new AppError(ErrorCodes.AUTH_INVALID_TOKEN, "Invalid or expired token", 401);
    }

    // 4. Parse request body
    const body: RequestBody = await req.json();
    
    // 5. Validate input
    if (!body.title || body.title.length < 1 || body.title.length > 500) {
      throw new AppError(ErrorCodes.VALIDATION_INVALID_INPUT, "Title must be 1-500 characters", 400);
    }

    // 6. Check authorization (e.g., admin role)
    const { data: membership } = await supabase
      .from("household_members")
      .select("role")
      .eq("user_id", user.id)
      .eq("household_id", body.householdId)
      .single();

    if (!membership || !["owner", "admin"].includes(membership.role)) {
      throw new AppError(ErrorCodes.AUTH_FORBIDDEN, "Admin access required", 403);
    }

    // 7. Perform privileged operation with service role
    const adminClient = createClient(
      Deno.env.get("SB_URL") ?? "",
      Deno.env.get("SB_SERVICE_ROLE_KEY") ?? ""
    );

    const { data, error } = await adminClient
      .from("my_table")
      .insert({
        household_id: body.householdId,
        title: body.title,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error.code); // Never log PII
      throw new AppError(ErrorCodes.DB_OPERATION_FAILED, "Failed to create record", 500);
    }

    // 8. Return success response
    return new Response(JSON.stringify({ data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    // Handle errors
    if (error instanceof AppError) {
      return createErrorResponse(error);
    }
    
    console.error("Unexpected error:", error instanceof Error ? error.message : "Unknown");
    return createErrorResponse(
      new AppError(ErrorCodes.UNKNOWN_ERROR, "An unexpected error occurred", 500)
    );
  }
});
```

## Shared Utilities

### CORS Helper (`_shared/cors.ts`)

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("SITE_URL") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export function handleCors() {
  return new Response(null, {
    status: 204,
    headers: corsHeaders,
  });
}
```

### Error Codes (`_shared/errors.ts`)

```typescript
export const ErrorCodes = {
  // Auth errors (1xxx)
  AUTH_MISSING_TOKEN: "AUTH_1001",
  AUTH_INVALID_TOKEN: "AUTH_1002",
  AUTH_FORBIDDEN: "AUTH_1003",
  
  // Validation errors (2xxx)
  VALIDATION_INVALID_INPUT: "VAL_2001",
  VALIDATION_MISSING_FIELD: "VAL_2002",
  
  // Database errors (3xxx)
  DB_OPERATION_FAILED: "DB_3001",
  DB_NOT_FOUND: "DB_3002",
  
  // Business logic errors (4xxx)
  BIZ_ALREADY_EXISTS: "BIZ_4001",
  BIZ_LIMIT_REACHED: "BIZ_4002",
  
  // Unknown errors (9xxx)
  UNKNOWN_ERROR: "ERR_9999",
};

export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function createErrorResponse(error: AppError) {
  return new Response(
    JSON.stringify({
      error: {
        message: error.message,
        code: error.code,
        status: error.status,
      },
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: error.status,
    }
  );
}
```

## Function Configuration

Add to `supabase/config.toml`:

```toml
[functions.my-function]
verify_jwt = true  # ALWAYS true for authenticated endpoints
```

## Required Secrets

Set via Supabase CLI or Dashboard:

| Secret | Purpose |
|--------|---------|
| `SB_URL` | Supabase project URL |
| `SB_ANON_KEY` | Supabase anon key |
| `SB_SERVICE_ROLE_KEY` | Service role key (privileged ops) |
| `SITE_URL` | Allowed CORS origin |
| `INVITE_TOKEN_SECRET` | Token signing (if needed) |

**Note:** Secrets must NOT start with `SUPABASE_` (reserved prefix).

## Testing Locally

```bash
# Start Supabase (includes functions)
supabase start

# Serve functions with hot reload
supabase functions serve

# Test with curl
curl -X POST http://localhost:54321/functions/v1/my-function \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "householdId": "uuid-here"}'
```

## Security Checklist

- [ ] `verify_jwt = true` in config.toml
- [ ] Authorization header validated
- [ ] User authenticated via `supabase.auth.getUser()`
- [ ] Role/permission checked before privileged operations
- [ ] Service role key used only for privileged operations
- [ ] Service role key never returned in response
- [ ] No PII in console.log statements
- [ ] Error messages don't leak internal details
- [ ] CORS restricted to known origins

## Common Patterns

### Admin-Only Check

```typescript
const { data: membership } = await supabase
  .from("household_members")
  .select("role")
  .eq("user_id", user.id)
  .eq("household_id", householdId)
  .single();

if (!membership || !["owner", "admin"].includes(membership.role)) {
  throw new AppError(ErrorCodes.AUTH_FORBIDDEN, "Admin access required", 403);
}
```

### Household Membership Check

```typescript
const { data: membership } = await supabase
  .from("household_members")
  .select("household_id")
  .eq("user_id", user.id)
  .eq("household_id", householdId)
  .single();

if (!membership) {
  throw new AppError(ErrorCodes.AUTH_FORBIDDEN, "Not a household member", 403);
}
```

### Token Hashing

```typescript
import { hashToken } from "../_shared/crypto.ts";

const tokenHash = await hashToken(plainToken);
// Store tokenHash in database, never the plain token
```

## Deployment

Functions deploy automatically via GitHub Actions when pushing to `dev` or `main` branches.

Manual deployment:
```bash
supabase functions deploy my-function
```
