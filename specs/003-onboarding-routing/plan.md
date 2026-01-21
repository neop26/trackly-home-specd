# Implementation Plan: Onboarding State Machine & Routing

**Branch**: `003-onboarding-routing` | **Date**: 2026-01-21 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-onboarding-routing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

Centralize routing logic and implement onboarding state machine to guide users through authentication, household setup, and invite flows. Currently, routing decisions are scattered across AppShell.tsx (household checks) and ProtectedRoute.tsx (auth-only checks), causing maintenance issues and potential race conditions.

**Primary Goals**:
1. Create centralized routing guard that makes all redirect decisions in one place
2. Implement onboarding state machine using existing `profiles.onboarding_status` field
3. Add sign-out capability to all pages for security best practice
4. Improve loading states to prevent content flashing

**Technical Approach**: Create new `useRouteGuard` hook that checks auth state + onboarding status + household membership, then makes routing decisions. Update Edge Functions (create-household, accept-invite) to set onboarding_status to 'in_household'. Move routing logic out of page components into centralized guard.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, React Router v6, Tailwind CSS, @supabase/supabase-js  
**Storage**: PostgreSQL (via Supabase) with RLS - profiles.onboarding_status already exists  
**Testing**: Manual testing (auth flows, routing redirects, edge cases)  
**Target Platform**: Web (Azure Static Web Apps)  
**Project Type**: web (frontend in apps/web, backend in supabase)  
**Performance Goals**: Loading states < 200ms perceived delay, no content flash during redirects  
**Constraints**: No breaking changes to existing flows, preserve ?next= deep linking, household isolation via RLS  
**Scale/Scope**: Single-page routing logic, 3 onboarding states (new → in_household), 4 main routes (/login, /setup, /join, /app)  
**Existing Code**: ProtectedRoute.tsx (auth check), AppShell.tsx (household check), AppRouter.tsx (route config), profiles.onboarding_status field (migration 001)

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ | No new RLS policies needed (using existing profiles table). Sign-out adds security (users can always log out). onboarding_status updates server-side only (Edge Functions) to prevent client tampering. Route guard validates household membership, not just status field. |
| II. Vertical Slices | ✅ | 4 user stories independently deliverable: (1) State machine logic standalone, (2) Centralized guard standalone, (3) Sign-out button standalone, (4) Loading states standalone. Each delivers user value without requiring others. |
| III. Minimal Changes | ⚠️ | Refactoring existing routing logic (not adding new features). Creates new RouteGuard but removes logic from AppShell + ProtectedRoute (net simplification). See Complexity Tracking for justification. |
| IV. Document As You Go | ✅ | No DB migrations (field exists). Will add JSDoc to RouteGuard hook. Will update PROJECT_TRACKER.md on completion. No Edge Function docs needed (only 2-line updates to set status). |
| V. Test Before Deploy | ✅ | Manual smoke test plan: 16 test scenarios defined in spec.md Success Criteria table. Test all routing paths (authenticated/not, with/without household, valid/invalid tokens). Verify sign-out on all 4 pages. |

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

### Source Code (Feature 003 changes)

```text
apps/web/src/
├── components/          
│   └── AppHeader.tsx    # MODIFIED: Add sign-out button
├── hooks/               # NEW DIRECTORY
│   └── useRouteGuard.ts # NEW: Centralized routing logic hook
├── router/              
│   └── AppRouter.tsx    # MODIFIED: Use new RouteGuard
├── screens/             
│   ├── AppShell.tsx     # MODIFIED: Remove household redirect logic
│   ├── LoginPage.tsx    # MODIFIED: Show sign-out if authenticated
│   ├── SetupPage.tsx    # MODIFIED: Show sign-out
│   └── JoinPage.tsx     # MODIFIED: Show sign-out
└── ProtectedRoute.tsx   # REVIEW: May refactor to use useRouteGuard

supabase/functions/
├── create-household/
│   └── index.ts         # MODIFIED: Set onboarding_status = 'in_household'
├── accept-invite/
│   └── index.ts         # MODIFIED: Set onboarding_status = 'in_household'
└── _shared/
    └── supabase.ts      # No changes (already has admin client)

specs/003-onboarding-routing/
├── plan.md              # This file
├── spec.md              # Feature specification (complete)
└── quickstart.md        # NEW: Local testing guide
```

**Structure Decision**: Refactor existing routing components + add new centralized hook. No new database tables or migrations needed (profiles.onboarding_status exists from migration 001).

## Database Design *(if feature involves data changes)*

**No database changes required for this feature.**

### Existing Schema (utilized)

| Table | Column | Type | Existing RLS |
|-------|--------|------|-------------|
| profiles | onboarding_status | text not null default 'new' | ✅ Users can SELECT/UPDATE own profile |
| household_members | user_id, household_id, role | uuid, uuid, text | ✅ SELECT own household only |

**Notes**:
- `profiles.onboarding_status` already exists (migration 001) with default 'new'
- Values will be: 'new' (default), 'in_household' (set by Edge Functions)
- 'needs_household' state reserved for future (not MVP)
- Migration 008 already handles resetting status to 'new' when household deleted
- RLS policies already enforce: users can only read/update their own profile
- No new migrations needed

## Edge Functions *(modifications to existing)*

| Function | Change | Auth Required | Admin Only | Purpose |
|----------|--------|---------------|------------|---------|
| create-household | Add 1 line: Update onboarding_status | ✅ | ❌ | Set creator's status to 'in_household' after household creation |
| accept-invite | Add 1 line: Update onboarding_status | ✅ | ❌ | Set acceptor's status to 'in_household' after join |

**Implementation Details**:
```typescript
// In create-household/index.ts after household creation:
await supabaseAdmin
  .from('profiles')
  .update({ onboarding_status: 'in_household' })
  .eq('user_id', session.user.id);

// In accept-invite/index.ts after member insertion:
await supabaseAdmin
  .from('profiles')
  .update({ onboarding_status: 'in_household' })
  .eq('user_id', session.user.id);
```

**No new Edge Functions needed** - only 2-line additions to existing functions.

## Frontend Components *(modifications and new code)*

### New Hook (Core Logic)

| Component | Location | Purpose |
|-----------|----------|---------|
| useRouteGuard | apps/web/src/hooks/useRouteGuard.ts | **NEW**: Centralized routing logic. Checks auth + onboarding_status + household membership. Returns redirect target or null. |

### Modified Components

| Component | Location | Change |
|-----------|----------|--------|
| AppRouter | apps/web/src/router/AppRouter.tsx | Use useRouteGuard to wrap routes. Remove catch-all redirect to /app. |
| AppHeader | apps/web/src/components/AppHeader.tsx | Add sign-out button visible to authenticated users. Call supabase.auth.signOut(). |
| AppShell | apps/web/src/screens/AppShell.tsx | **REMOVE** household redirect logic (moved to useRouteGuard). Keep banner flags. |
| ProtectedRoute | apps/web/src/ProtectedRoute.tsx | Simplify to only check auth. Onboarding logic now in useRouteGuard. |
| LoginPage | apps/web/src/screens/LoginPage.tsx | Show sign-out button if already authenticated. |
| SetupPage | apps/web/src/screens/SetupPage.tsx | Show sign-out button in header. |
| JoinPage | apps/web/src/screens/JoinPage.tsx | Show sign-out button in header. |

### Loading States

| Component | Loading Indicator |
|-----------|------------------|
| useRouteGuard | Return `isLoading: true` while fetching profile/household data |
| AppShell | Show skeleton layout if isLoading (P2 - nice to have) |

**Component Count**: 1 new hook, 7 modified components, 0 new screens

## Complexity Tracking

> **Justification for Constitution Principle III (Minimal Changes) warning**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Refactoring existing routing logic across 7 components | Current routing logic is scattered across AppShell.tsx (household checks) and ProtectedRoute.tsx (auth checks) causing maintenance burden and race conditions. Users report seeing wrong pages briefly before redirects. Centralizing prevents bugs and makes flow testable. | **Patch approach rejected**: Could add more if/else logic to existing components, but this would worsen the problem. Scattered logic is the root cause. **No-op rejected**: Cannot defer - Phase 3 tasks 3.1, 3.2 are P0 (MVP-blocking) per PROJECT_TRACKER.md. Sign-out is security best practice (P0). |

**Net Complexity**: Despite touching 7 files, this is a **simplification**. Current state has routing logic in 4 places (AppRouter, ProtectedRoute, AppShell, individual screens). New state: 1 place (useRouteGuard hook). Lines of routing logic: ~80 lines scattered → ~60 lines centralized. Easier to test and reason about.

**Vertical Slice Compliance**: Each user story independently delivers value. Can implement stories 1-3 (state machine, guard, sign-out) without story 4 (loading states = P2).

## Security Considerations

- [x] **No new tables** - Using existing profiles table with RLS already enabled
- [x] **Edge functions validate JWT** - create-household and accept-invite already have verify_jwt = true (no changes to auth)
- [N/A] **Admin-only features** - This feature is not admin-gated (all authenticated users use routing)
- [x] **No service role key exposure** - Client code only uses supabase.auth (anon key). Edge Functions use supabaseAdmin for onboarding_status updates (server-side only)
- [N/A] **Tokens hashed** - Not applicable (no invite token changes in this feature)
- [x] **CORS configured correctly** - No Edge Function CORS changes needed (existing functions already configured)
- [x] **No PII in logs** - Sign-out button doesn't log user data. Route guard only logs navigation events (paths, not emails)
- [x] **onboarding_status updates server-side only** - Prevents client tampering (spec SR-001). Client cannot directly UPDATE profiles.onboarding_status (RLS policy enforced)
- [x] **Route guard validates household membership** - Doesn't trust onboarding_status blindly, queries household_members table to confirm (spec FR-005)
- [x] **Sign-out clears session** - Uses supabase.auth.signOut() which clears local storage tokens (spec SR-003)

**Security Impact**: This feature **improves** security by adding sign-out capability (users currently have no way to log out from auth pages). No new security risks introduced.

## Testing Plan

### Manual Testing (16 test scenarios from spec.md)

**Onboarding State Machine**:
- [ ] New user (onboarding_status='new') lands on /app → redirected to /setup
- [ ] User creates household → onboarding_status updated to 'in_household', redirected to /app?setup=1
- [ ] User with household visits /setup → redirected to /app (prevent duplicate households)
- [ ] User accepts invite → onboarding_status updated to 'in_household', redirected to /app?joined=1
- [ ] User with /join?token=xyz stays on /join page (not redirected away)
- [ ] User with household visits /app → dashboard loads immediately, no flicker

**Routing Guard**:
- [ ] Unauthenticated user visits /app → redirected to /login?next=/app
- [ ] Authenticated user with no household visits /app → redirected to /setup
- [ ] ?next= parameter preserved through login flow (e.g., /login?next=/app → /app after login)
- [ ] No infinite redirect loops in any scenario

**Sign-Out**:
- [ ] Sign-out button appears on /login if already logged in
- [ ] Sign-out button appears on /setup page
- [ ] Sign-out button appears on /join page
- [ ] Sign-out button appears on /app page (AppHeader)
- [ ] Clicking sign-out clears session and redirects to /login
- [ ] After sign-out, cannot access /app (redirected to /login)

**Edge Cases**:
- [ ] Invalid onboarding_status (null/corrupted) → defaults to 'new', shows /setup
- [ ] Expired invite token → show error, redirect to /app
- [ ] Network failure during redirect → show error message, don't leave user stuck
- [ ] Multi-tab: sign out in one tab → other tabs redirect to /login

### Smoke Test Checklist
- [ ] `npm run build` passes without errors
- [ ] `npm run lint` passes without warnings
- [ ] No console errors in browser DevTools
- [ ] Manual test: Complete new user flow (sign in → setup → dashboard)
- [ ] Manual test: Complete invite flow (sign in → join → dashboard)
- [ ] Manual test: Sign out from each page (/login, /setup, /join, /app)

### RLS Verification
**No new RLS policies needed** - Using existing profiles table policies:
```sql
-- Verify users can only read their own profile
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-A';
SELECT onboarding_status FROM profiles WHERE user_id = 'user-uuid-B';
-- Should return 0 rows (cannot read other user's profile)

-- Verify users can update their own profile (currently allowed, but Edge Functions will do updates)
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-A';
UPDATE profiles SET onboarding_status = 'in_household' WHERE user_id = 'user-uuid-A';
-- Should succeed (but client won't do this - server-side only)
```

**Note**: onboarding_status updates happen server-side via Edge Functions to prevent client tampering, even though RLS technically allows users to update their own profile.
