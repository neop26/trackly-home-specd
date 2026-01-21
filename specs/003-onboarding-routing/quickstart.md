# Quickstart Guide: Feature 003 - Onboarding & Routing

**Purpose**: Local development and testing guide for onboarding state machine and routing feature

## Prerequisites

- ✅ Phase 1 complete (invite flow working)
- ✅ Phase 2 complete (error handling implemented)
- ✅ Supabase local CLI running (`supabase start`)
- ✅ Frontend dev server running (`npm run dev` in apps/web)

## Local Development Setup

### 1. Start Development Environment

```bash
# Terminal 1: Start Supabase (if not running)
cd /path/to/trackly-home-specd
supabase start

# Terminal 2: Start frontend dev server
cd apps/web
npm run dev
```

### 2. Verify Existing Data

```bash
# Check profiles table has onboarding_status column
supabase db diff --schema public

# Expected output should include:
# profiles table with onboarding_status text not null default 'new'
```

### 3. Test Current Routing Behavior (Before Feature 003)

**Current State** (should observe these issues):
1. Visit `http://localhost:5173/app` without logging in → redirected to /login ✅ (working)
2. After login, AppShell.tsx checks household → redirects to /setup if none ✅ (working)
3. **Issue**: Routing logic scattered in AppShell + ProtectedRoute (hard to debug)
4. **Issue**: No sign-out button on /login, /setup, /join pages (security gap)
5. **Issue**: Brief flash of wrong page before redirect (race condition)

## Testing After Implementation

### Phase 0: Onboarding State Machine (User Story 1)

**Test Scenario 1: New User Flow**
```bash
# 1. Open incognito window
# 2. Navigate to http://localhost:5173/login
# 3. Sign in with magic link (check inbox for link)
# 4. After auth callback, should redirect to /setup (onboarding_status='new')
# 5. Create household
# 6. Should update onboarding_status to 'in_household' and redirect to /app?setup=1

# Verify in database:
supabase db psql -c "SELECT user_id, onboarding_status FROM profiles WHERE display_name = 'Test User';"
# Expected: onboarding_status = 'in_household'
```

**Test Scenario 2: Invite Flow**
```bash
# 1. As admin user, create invite via /app (Invite Partner card)
# 2. Copy invite link (e.g., http://localhost:5173/join?token=abc123)
# 3. Open new incognito window, sign in with different email
# 4. Paste invite link → should stay on /join page (not redirect away)
# 5. Accept invite
# 6. Should update onboarding_status to 'in_household' and redirect to /app?joined=1

# Verify in database:
supabase db psql -c "SELECT user_id, onboarding_status FROM profiles WHERE display_name = 'Partner User';"
# Expected: onboarding_status = 'in_household'
```

**Test Scenario 3: Existing User (Prevent Duplicate Household)**
```bash
# 1. Sign in as user who already has household
# 2. Manually navigate to http://localhost:5173/setup
# 3. Should immediately redirect to /app (cannot create second household)
```

### Phase 1: Centralized Routing Guard (User Story 2)

**Test Scenario 4: Code Review**
```bash
# Verify all routing logic is in useRouteGuard hook:
cat apps/web/src/hooks/useRouteGuard.ts
# Should contain all redirect decision logic

# Verify AppShell no longer has routing logic:
cat apps/web/src/screens/AppShell.tsx | grep -i redirect
# Should NOT find redirect logic (moved to hook)

# Verify ProtectedRoute is simplified:
cat apps/web/src/ProtectedRoute.tsx
# Should only check auth, not household
```

**Test Scenario 5: No Infinite Loops**
```bash
# 1. Add console.log in useRouteGuard to track redirects
# 2. Test all routing paths (see Testing Plan in plan.md)
# 3. Monitor browser console for redirect loops
# Expected: Each navigation should have max 1 redirect
```

### Phase 2: Sign-Out Button (User Story 3)

**Test Scenario 6: Sign-Out Everywhere**
```bash
# Test on /login:
# 1. Sign in, then navigate back to /login
# 2. Verify "Sign Out" button appears
# 3. Click sign-out → redirected to /login, session cleared

# Test on /setup:
# 1. Sign in as new user (lands on /setup)
# 2. Verify "Sign Out" button appears
# 3. Click sign-out → redirected to /login

# Test on /join:
# 1. Sign in with invite token in URL
# 2. Verify "Sign Out" button appears on /join page
# 3. Click sign-out → redirected to /login

# Test on /app:
# 1. Sign in with household
# 2. Verify "Sign Out" button in AppHeader
# 3. Click sign-out → redirected to /login
```

**Test Scenario 7: Multi-Tab Sign-Out**
```bash
# 1. Open app in 2 tabs (both showing /app)
# 2. Sign out in Tab 1
# 3. Switch to Tab 2
# Expected: Tab 2 should detect session change and redirect to /login
# (Supabase auth listener should handle this)
```

### Phase 3: Loading States (User Story 4 - P2, Optional)

**Test Scenario 8: No Content Flash**
```bash
# 1. Open DevTools → Network tab → Throttle to "Slow 3G"
# 2. Sign in and navigate to /app
# 3. Should see loading indicator while fetching household data
# Expected: No flash of wrong page, smooth loading state

# Without skeleton (current): See "Loading..." text
# With skeleton (P2 enhancement): See skeleton layout
```

## Edge Case Testing

### Test Scenario 9: Invalid onboarding_status

```sql
-- Manually corrupt onboarding_status in database:
UPDATE profiles SET onboarding_status = 'corrupted_value' WHERE user_id = 'test-user-id';

-- Then refresh app:
-- Expected: Should default to 'new', redirect to /setup
```

### Test Scenario 10: Expired Invite Token

```bash
# 1. Create invite, copy link
# 2. Manually expire token in database:
supabase db psql -c "UPDATE invites SET expires_at = NOW() - INTERVAL '1 day' WHERE token_hash = 'hash-value';"

# 3. Try to accept invite via link
# Expected: Show error message, redirect to /app
```

### Test Scenario 11: Network Failure During Redirect

```bash
# 1. Open DevTools → Network tab → Set to "Offline"
# 2. Try to navigate between pages
# Expected: Show error message, don't leave user stuck
# (Supabase client should handle offline gracefully)
```

## Performance Testing

### Measure Loading State Delays

```javascript
// Add timing logs in useRouteGuard:
console.time('route-guard');
// ... routing logic ...
console.timeEnd('route-guard');
// Expected: < 200ms for routing decision
```

### Measure Content Flash

```bash
# 1. Record screen while navigating
# 2. Count frames where wrong page is visible before redirect
# Expected: 0 frames (immediate redirect or loading state)
```

## Troubleshooting

### Issue: onboarding_status not updating after household creation

**Check**: Edge Function logs
```bash
supabase functions logs create-household
# Look for errors in UPDATE profiles query
```

**Fix**: Verify supabaseAdmin client has service role key
```typescript
// In supabase/functions/_shared/supabase.ts
const supabaseAdmin = createClient(url, serviceRoleKey); // Should NOT be anon key
```

### Issue: Infinite redirect loop

**Check**: useRouteGuard logic
```typescript
// Common bug: Redirecting based on current path without checking destination
// BAD:
if (currentPath === '/app') return '/setup'; // Can loop if already on /setup

// GOOD:
if (needsSetup && currentPath !== '/setup') return '/setup';
```

**Fix**: Add guard conditions to prevent same-destination redirects

### Issue: Sign-out doesn't work

**Check**: Supabase client instance
```typescript
// Verify using correct client:
import { supabase } from '@/lib/supabaseClient';
await supabase.auth.signOut(); // Should use singleton instance
```

**Fix**: Don't create new client instance, use existing one

## Success Criteria Verification

After completing all phases, verify against spec.md Success Criteria:

- [ ] **SC-001**: 100% routing accuracy (all 16 test scenarios pass)
- [ ] **SC-002**: Zero redirect loops (monitor console during testing)
- [ ] **SC-003**: Sign-out works on 4/4 pages (/login, /setup, /join, /app)
- [ ] **SC-004**: Loading states < 200ms (measure with console.time)
- [ ] **SC-005**: Routing logic in ≤2 files (useRouteGuard + AppRouter)
- [ ] **SC-006**: No stuck users (all edge cases handled gracefully)

## Database Queries for Debugging

```sql
-- Check all users' onboarding status:
SELECT display_name, onboarding_status, created_at 
FROM profiles 
ORDER BY created_at DESC 
LIMIT 10;

-- Find users without households:
SELECT p.display_name, p.onboarding_status 
FROM profiles p
LEFT JOIN household_members hm ON p.user_id = hm.user_id
WHERE hm.user_id IS NULL;

-- Check household membership:
SELECT p.display_name, h.name AS household_name, hm.role
FROM profiles p
JOIN household_members hm ON p.user_id = hm.user_id
JOIN households h ON hm.household_id = h.id;
```

## Cleanup After Testing

```bash
# Reset test users:
supabase db reset

# Re-run migrations:
supabase db reset --linked

# Or manually delete test data:
supabase db psql -c "DELETE FROM profiles WHERE display_name LIKE 'Test%';"
```

## Next Steps After Feature 003

Once all tests pass:
1. Update PROJECT_TRACKER.md (mark Phase 3 tasks complete)
2. Commit changes to 003-onboarding-routing branch
3. Merge to main (after code review)
4. Begin Phase 4: Deploy Discipline (PR checks, production workflow)
