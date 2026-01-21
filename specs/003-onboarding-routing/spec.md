# Feature Specification: Onboarding State Machine & Routing

**Feature Branch**: `003-onboarding-routing`  
**Created**: 2026-01-21  
**Status**: Draft  
**Input**: "Implement onboarding state machine and centralized routing logic to guide users through setup, join, and app flows with proper authentication gates"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Onboarding State Machine (Priority: P0)

**As a** new user,  
**I want** the app to automatically guide me to the correct page based on my onboarding status,  
**So that** I don't get stuck or see the wrong screen for my situation.

**Why this priority**: MVP-critical. Without proper onboarding flow, users will be confused about what to do next. Currently, routing logic is scattered across multiple components (AppShell, ProtectedRoute) making it brittle and hard to maintain. Centralizing this logic prevents bugs and improves UX.

**Independent Test**: Can be fully tested by creating users in different states (new, needs_household, in_household) and verifying they land on the correct page. Does not require implementing sign-out or other Phase 3 features.

**Acceptance Scenarios**:

1. **Given** I just signed in for the first time (onboarding_status = 'new'), **When** I land on the app, **Then** I'm redirected to /setup to create my household

2. **Given** I have a household invite token in URL (/join?token=abc), **When** I'm logged in, **Then** I stay on /join page to accept the invite (not redirected away)

3. **Given** I already have a household (onboarding_status = 'in_household'), **When** I try to visit /setup, **Then** I'm redirected to /app (my household dashboard)

4. **Given** I already have a household, **When** I visit /app, **Then** I see my household dashboard immediately without loading flicker

5. **Given** I create a household successfully, **When** setup completes, **Then** my onboarding_status is updated to 'in_household' and I'm redirected to /app?setup=1

6. **Given** I accept an invite successfully, **When** join completes, **Then** my onboarding_status is updated to 'in_household' and I'm redirected to /app?joined=1

---

### User Story 2 - Centralized Route Guard (Priority: P0)

**As a** developer,  
**I want** all routing logic in one place (not scattered across components),  
**So that** I can understand the entire user flow at a glance and make changes safely.

**Why this priority**: MVP-critical for maintainability. Currently, AppShell has business logic to redirect users, ProtectedRoute only checks auth, and there's no single source of truth. This leads to race conditions and confusing redirects. Centralizing prevents bugs and makes testing easier.

**Independent Test**: Can be tested by reviewing code structure - all routing decisions should be in one guard component/hook, not spread across pages. Existing flows should continue working unchanged.

**Acceptance Scenarios**:

1. **Given** routing logic is centralized, **When** I need to understand redirect rules, **Then** I can read them all in one file (e.g., RouteGuard.tsx)

2. **Given** user is not authenticated, **When** they visit /app, **Then** they're redirected to /login?next=/app

3. **Given** user is authenticated but has no household, **When** they visit /app, **Then** they're redirected to /setup

4. **Given** user is authenticated and has a household, **When** they visit /setup, **Then** they're redirected to /app (preventing duplicate households)

5. **Given** routing logic is centralized, **When** a redirect happens, **Then** there's no infinite redirect loop or race condition

---

### User Story 3 - Sign-Out from Any Page (Priority: P0)

**As a** user,  
**I want** to sign out from any page (even before completing onboarding),  
**So that** I can switch accounts or stop the session if I made a mistake.

**Why this priority**: MVP-critical security best practice. Users should always be able to sign out. Currently, auth pages (login, setup, join) don't show sign-out, potentially trapping users in unwanted sessions.

**Independent Test**: Can be tested by navigating to /login, /setup, /join, /app and verifying sign-out button appears and works on all pages.

**Acceptance Scenarios**:

1. **Given** I'm on the login page, **When** I look at the page, **Then** I see a "Sign Out" button if I'm already logged in

2. **Given** I'm on /setup creating a household, **When** I realize I logged in with the wrong account, **Then** I can click "Sign Out" to start over

3. **Given** I'm on /join accepting an invite, **When** I want to use a different account, **Then** I can click "Sign Out" and switch accounts

4. **Given** I'm on /app (household dashboard), **When** I click "Sign Out", **Then** I'm signed out and redirected to /login

5. **Given** I click "Sign Out" from any page, **When** sign-out completes, **Then** my session is cleared and I cannot access protected routes

---

### User Story 4 - Loading States (Priority: P2)

**As a** user,  
**I want** to see proper loading indicators instead of blank screens or flickers,  
**So that** I know the app is working and not broken.

**Why this priority**: Nice-to-have polish. Improves perceived performance but not blocking for MVP. Current "Loading…" text works but skeleton screens would be better.

**Independent Test**: Can be tested by throttling network in DevTools and verifying skeleton screens appear during data fetching.

**Acceptance Scenarios**:

1. **Given** I'm navigating to /app, **When** household data is loading, **Then** I see a skeleton layout (not just "Loading…" text)

2. **Given** routing is determining where to send me, **When** onboarding_status is being fetched, **Then** I see a loading indicator (not blank screen)

3. **Given** I'm accepting an invite, **When** the Edge Function is processing, **Then** I see a loading state on the button

---

### Edge Cases

**Onboarding Status Edge Cases:**
- What if onboarding_status is null or an invalid value? → Default to 'new', show setup page
- What if user manually changes their onboarding_status in DB? → Route guard should re-check household membership, not just trust status
- What if user deletes their household? → Need to reset onboarding_status to 'new' (migration 008 already handles this)

**Routing Edge Cases:**
- What if user has multiple tabs open and logs out in one? → Auth listener should update all tabs, redirect to login
- What if user bookmarks /setup but later has a household? → Route guard redirects to /app
- What if user has /join?token=xyz bookmarked? → Valid token: allow join. Expired/used: show error, redirect to /app
- What if network fails during redirect? → Show error message, don't leave user stuck

**Sign-Out Edge Cases:**
- What if sign-out API call fails? → Clear local session anyway, redirect to /login, show error message
- What if user is mid-form when they sign out? → Warn about unsaved changes (future enhancement, not MVP)

**Race Conditions:**
- What if onboarding_status updates while route guard is running? → Use timestamp/version check, prefer server state
- What if user creates household and immediately refreshes? → Server state wins, onboarding_status should be correct


## Requirements *(mandatory)*

### Functional Requirements

#### Onboarding State Machine

- **FR-001**: System MUST support three onboarding states: 'new' (just signed up), 'needs_household' (signed up but no household yet), and 'in_household' (has household)
- **FR-002**: System MUST update onboarding_status to 'in_household' when user creates a household via create-household Edge Function
- **FR-003**: System MUST update onboarding_status to 'in_household' when user accepts an invite via accept-invite Edge Function
- **FR-004**: System MUST fetch user's current onboarding_status from profiles table on app load
- **FR-005**: Route guard MUST verify actual household membership (not just onboarding_status) to prevent trust issues

#### Routing Logic

- **FR-006**: System MUST redirect unauthenticated users to /login from any protected route
- **FR-007**: System MUST redirect authenticated users with no household to /setup (unless they're on /join with valid token)
- **FR-008**: System MUST redirect authenticated users with household to /app from /setup or /login
- **FR-009**: System MUST preserve ?next= parameter through login flow for deep linking
- **FR-010**: System MUST allow /join?token=xyz for both authenticated and unauthenticated users

#### Sign-Out

- **FR-011**: System MUST show "Sign Out" button on all pages when user is authenticated
- **FR-012**: System MUST clear session and redirect to /login when user signs out
- **FR-013**: AppHeader MUST include sign-out button for authenticated users
- **FR-014**: Auth pages (/login, /setup, /join) MUST show minimal header with sign-out if authenticated

#### Loading States

- **FR-015**: System MUST show loading indicator while checking authentication state
- **FR-016**: System MUST show loading indicator while fetching onboarding_status
- **FR-017**: System MUST avoid content flash (showing wrong page briefly before redirect)

### Security Requirements

- **SR-001**: onboarding_status updates MUST only happen server-side (via Edge Functions) to prevent client tampering
- **SR-002**: Route guard MUST re-validate household membership on every navigation (not cache indefinitely)
- **SR-003**: Sign-out MUST clear all client-side session tokens
- **SR-004**: /join route MUST validate invite token server-side before allowing accept

### Key Entities

**Modified Entity: profiles**
- Existing `onboarding_status` field (already in schema): text field with values 'new', 'needs_household', 'in_household'
- Default value: 'new' (already configured in migration 001)
- Updated by: create-household Edge Function, accept-invite Edge Function

**State Transitions:**
```
new → in_household (via create-household)
new → in_household (via accept-invite)
new → needs_household (future: if they skip setup, not MVP)
in_household → new (if household deleted, migration 008 handles)
```


## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **100% routing accuracy** - Users in each onboarding state land on correct page 100% of the time (no wrong redirects)
- **SC-002**: **Zero redirect loops** - No user can get stuck in infinite redirect (verified via manual testing)
- **SC-003**: **Sign-out always works** - Sign-out button appears and functions on all pages (4/4 pages tested)
- **SC-004**: **Loading states < 200ms perceived delay** - Skeleton screens appear immediately, no blank screen flash
- **SC-005**: **Centralized routing** - All routing logic consolidated into ≤2 files (down from current 4+ files)
- **SC-006**: **Onboarding completion rate** - Users who reach /setup successfully create household or navigate away (no stuck users)

### Test Coverage

| User State | Expected Route | Test Method |
|------------|---------------|-------------|
| Not authenticated | /login | Try accessing /app → redirected |
| Authenticated, onboarding_status='new', no household | /setup | Land on /app → redirected to /setup |
| Authenticated, has household | /app | Direct access works |
| Authenticated, has household | /setup | Try accessing /setup → redirected to /app |
| Authenticated, has valid token | /join?token=xyz | Stays on /join page |
| Any state with sign-out | /login | Click sign-out → redirected, session cleared |

**Total Test Scenarios**: 12 routing paths + 4 sign-out locations = 16 tests

### Dependencies

- ✅ create-household Edge Function exists (Phase 1)
- ✅ accept-invite Edge Function exists (Phase 1)
- ✅ profiles.onboarding_status column exists (migration 001)
- ⚠️ Edge Functions need to update onboarding_status (NEW: must add this logic)

## Technical Constraints

1. **No breaking changes**: Existing user flows must continue working
2. **React Router v6**: Use Navigate component for redirects, not window.location
3. **Supabase auth state**: Use supabase.auth.onAuthStateChange() listener
4. **TypeScript strict mode**: All code must type-check
5. **Mobile-responsive**: Sign-out button must work on small screens

