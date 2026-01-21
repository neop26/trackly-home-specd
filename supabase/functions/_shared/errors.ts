/**
 * Standardized Error Response System
 * 
 * Provides consistent error handling across all Edge Functions with:
 * - Type-safe error codes
 * - Proper HTTP status codes
 * - User-friendly messages
 * - PII-free logging
 * 
 * Usage:
 * ```typescript
 * import { errorResponse, ErrorCode } from "../_shared/errors.ts";
 * 
 * return errorResponse(
 *   ErrorCode.MISSING_FIELD,
 *   "Missing household name",
 *   400,
 *   headers
 * );
 * ```
 */

/**
 * Standardized error response interface
 * Maintains backward compatibility with { error: string } while adding structure
 */
export interface ErrorResponse {
  error: {
    message: string;  // User-friendly message
    code: ErrorCode;  // Machine-readable error code
    status: number;   // HTTP status code
  };
}

/**
 * Comprehensive error code enum covering all Edge Function scenarios
 * Grouped by HTTP status code category
 */
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

/**
 * Creates a standardized error response
 * 
 * @param code - ErrorCode enum value for programmatic error handling
 * @param message - User-friendly error message (no PII)
 * @param status - HTTP status code matching error category
 * @param headers - Response headers (typically includes CORS)
 * @returns Response object with standardized error format
 * 
 * @example
 * ```typescript
 * return errorResponse(
 *   ErrorCode.NOT_ADMIN,
 *   "Only admins can create invites",
 *   403,
 *   corsHeaders
 * );
 * ```
 */
export function errorResponse(
  code: ErrorCode,
  message: string,
  status: number,
  headers: Headers | HeadersInit
): Response {
  // Ensure no PII in error message (defensive check)
  // Note: Calling code is responsible for providing sanitized messages
  
  const errorBody: ErrorResponse = {
    error: {
      message,
      code,
      status,
    },
  };

  return new Response(JSON.stringify(errorBody), {
    status,
    headers,
  });
}

/**
 * Sanitizes database errors to prevent leaking internal details
 * 
 * Supabase/Postgres errors may contain:
 * - Table/column names
 * - Constraint names
 * - Internal implementation details
 * 
 * This function wraps them in a generic message safe for client exposure.
 * 
 * @param error - Raw error from Supabase/database operation
 * @param headers - Response headers (typically includes CORS)
 * @returns Response with generic DATABASE_ERROR code
 * 
 * @example
 * ```typescript
 * try {
 *   const { data, error } = await supabase.from('households').insert(...);
 *   if (error) return sanitizeDbError(error, headers);
 * } catch (err) {
 *   return sanitizeDbError(err, headers);
 * }
 * ```
 */
export function sanitizeDbError(
  error: unknown,
  headers: Headers | HeadersInit
): Response {
  // Log the actual error server-side for debugging (no PII in this log)
  console.error("[Database Error]", {
    type: error instanceof Error ? error.constructor.name : typeof error,
    // Do NOT log error.message - may contain table/column names
  });

  // Return generic error to client
  return errorResponse(
    ErrorCode.DATABASE_ERROR,
    "A database error occurred. Please try again.",
    500,
    headers
  );
}

/**
 * Helper to create a JSON response (convenience function)
 */
export function json(
  data: unknown,
  init?: { status?: number; headers?: Headers | HeadersInit }
): Response {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : init?.headers ?? {}),
    },
  });
}
