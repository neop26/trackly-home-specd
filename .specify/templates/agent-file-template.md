# Trackly Home Development Guidelines

Auto-generated from feature plans. Last updated: [DATE]

## Project Overview

**Trackly Home** is a consumer MVP for household coordination. Two-person households coordinate day-to-day life with privacy-first data isolation.

**Current Phase**: Phase 2 (Security) / Phase 3 (UX Routing)
**MVP Target**: 2026-02-28

## Active Technologies

- TypeScript 5.x + React 18 + Tailwind CSS (frontend)
- Supabase (Auth, PostgreSQL with RLS, Edge Functions - Deno)
- Azure Static Web Apps (hosting)
- GitHub Actions (CI/CD)

## Project Structure

```text
apps/web/src/
├── components/     # React components (InvitePartnerCard, ManageRolesCard, AppHeader)
├── screens/        # Page components (LoginPage, SetupPage, JoinPage, AppShell)
├── services/       # API functions (household.ts, members.ts, profile.ts)
├── lib/            # Utilities (supabaseClient.ts)
└── router/         # React Router config (AppRouter.tsx)

supabase/
├── migrations/     # SQL migrations (RLS, triggers, helpers)
├── functions/      # Edge Functions (create-household, create-invite, accept-invite, manage-roles)
│   └── _shared/    # Shared utilities (cors.ts, crypto.ts, supabase.ts)
└── config.toml     # Local CLI config

azure/
├── deploy/         # Bicep infrastructure
└── modules/        # Bicep modules
```

## Commands

### Frontend Development
```bash
cd apps/web
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build
npm run lint         # ESLint check
```

### Supabase Development
```bash
supabase start       # Start local Supabase
supabase db reset    # Reset database and apply migrations
supabase functions serve  # Serve Edge Functions locally
supabase migration new [name]  # Create new migration
```

### Deployment
```bash
# Automatic on push to dev branch
# Manual for production (future)
```

## Code Style

### TypeScript
- Strict mode enabled
- Explicit return types on exported functions
- No `any` types (use `unknown` if needed)
- Prefer interfaces over type aliases for objects

### React
- Functional components with hooks
- Props interfaces defined explicitly
- Handle loading and error states
- Use Tailwind for styling

### Supabase
- All tables MUST have RLS enabled
- Use helper functions for complex policy logic
- Migrations must be tested locally before push
- Edge Functions must validate JWT

### Security (Non-negotiable)
- Service role key NEVER exposed to client
- Invite tokens MUST be hashed
- CORS restricted to known origins
- No PII in logs

## Data Model

### Key Entities
- `profiles` - User profiles (user_id, display_name, timezone)
- `households` - Household entity (id, name, owner_user_id)
- `household_members` - Membership (user_id, household_id, role)
- `invites` - Invitations (token_hash, expires_at, invited_email)

### Role Hierarchy
- **owner**: Full control, created household
- **admin**: Can invite, manage roles (except owner)
- **member**: Read-only household access

### Helper Functions
- `is_household_admin(user_id, household_id)` - Check admin status
- `get_household_for_user(user_id)` - Get user's household

## Recent Changes

- Phase 1 Complete: RBAC (roles, permissions, admin constraints)
- Phase 2 In Progress: Security hardening (RLS audit, function security)
- Phase 3 In Progress: UX routing (onboarding state machine)

## Key Patterns

### Edge Function Pattern
```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { createSupabaseClient, getAuthUser } from '../_shared/supabase.ts';

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return handleCors();
  
  const supabase = createSupabaseClient(req);
  const user = await getAuthUser(supabase);
  
  // Logic here...
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
```

### RLS Policy Pattern
```sql
CREATE POLICY "Members can view own household data"
  ON public.table_name FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.household_members hm
      WHERE hm.household_id = table_name.household_id
        AND hm.user_id = auth.uid()
    )
  );
```

### Service Function Pattern
```typescript
import { supabase } from '../lib/supabaseClient';

export async function getData(householdId: string) {
  const { data, error } = await supabase
    .from('table_name')
    .select('*')
    .eq('household_id', householdId);
  
  if (error) throw new Error(error.message);
  return data ?? [];
}
```

## Constitution Principles

1. **Security First** - Consider security implications in all changes
2. **Vertical Slices** - Deliver features end-to-end independently
3. **Minimal Changes** - Smallest change that solves the problem
4. **Document As You Go** - Update docs with each change
5. **Test Before Deploy** - Validate locally before merging

## Documentation

- [PRD](docs/TRACKLY_HOME_PRD.md) - Product requirements
- [Tracker](docs/PROJECT_TRACKER.md) - Task tracking
- [SDLC](docs/SDLC_PROCESS.md) - Development process
- [Constitution](.specify/memory/constitution.md) - Core principles

<!-- MANUAL ADDITIONS START -->
<!-- Add project-specific notes here that should persist across updates -->
<!-- MANUAL ADDITIONS END -->

