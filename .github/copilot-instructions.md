# Copilot Instructions for Trackly Home

## Project Overview

Trackly Home is a household coordination MVP built with Vite + React + TypeScript (frontend) and Supabase (backend). The codebase uses a **spec-driven development** workflow with feature specifications in `specs/` directories.

**MVP Target:** 2026-02-28  
**Current Phase:** Phase 5 (Planner feature - in progress)

## Build, Test, and Lint Commands

### Frontend (apps/web)

```bash
# Install dependencies
cd apps/web && npm install

# Development server
npm run dev              # Starts Vite dev server on localhost:5173

# Build
npm run build            # TypeScript compile + Vite build
npm run postbuild        # Copies staticwebapp.config.json to dist/

# Lint
npm run lint             # ESLint (required to pass before merging)

# Preview production build
npm run preview
```

### Backend (Supabase)

```bash
# Start local Supabase (requires Docker)
supabase start

# Reset database (applies all migrations)
supabase db reset

# Serve edge functions locally
supabase functions serve

# Create new migration
supabase migration new description_of_change

# Deploy to dev/prod (via GitHub Actions)
# Push to dev/main branches triggers automatic deployment
```

### Running a Single Test

Currently no automated test suite. Manual testing workflow documented in `docs/SDLC_PROCESS.md` § 5.2.

## Architecture

### Stack

- **Frontend:** Vite + React 18 + TypeScript + Chakra UI
- **Backend:** Supabase (PostgreSQL with RLS, Edge Functions in Deno, Magic Link Auth)
- **Hosting:** Azure Static Web Apps (frontend), Supabase Cloud (backend)
- **CI/CD:** GitHub Actions (see `.github/workflows/`)

### Data Flow

```
React App (apps/web/src/)
    ↓ Supabase JS Client
Supabase Auth (magic link email)
    ↓
Edge Functions (supabase/functions/) - validates JWT, privileged operations
    ↓
PostgreSQL + RLS (supabase/migrations/) - household data isolation
```

### Directory Layout

```
apps/web/src/
  ├── components/     # Reusable UI components
  ├── screens/        # Page-level components (routes)
  ├── router/         # React Router setup
  ├── hooks/          # Custom React hooks
  ├── services/       # Supabase API calls
  ├── lib/            # Utilities
  └── types/          # TypeScript interfaces

supabase/
  ├── migrations/     # Sequential SQL files (numbered)
  ├── functions/      # Edge Functions (Deno TypeScript)
  │   ├── _shared/    # Shared utilities (cors, errors, crypto)
  │   ├── create-household/
  │   ├── create-invite/
  │   └── ...
  └── config.toml     # Local CLI config

specs/                # Feature specifications (spec-driven development)
  ├── 001-audit-and-strengthen/
  ├── 002-error-handling-pii-logging/
  ├── 003-onboarding-routing/
  ├── 004-deploy-discipline/
  └── 005-planner-mvp/
      ├── spec.md     # Requirements
      ├── plan.md     # Implementation plan
      ├── tasks.md    # Task breakdown
      └── checklists/ # Validation checklists
```

## Key Conventions

### Branching & Deployment

- `feature/*` → `dev` → `main`
- **dev branch:** Auto-deploys to dev environment (no approval)
- **main branch:** Auto-deploys to prod (requires manual approval in GitHub Actions)
- **PR to main:** Must pass `pr-check.yml` (lint + build)

See `.github/BRANCHING_STRATEGY.md` for complete workflow.

### Security Model

1. **Row Level Security (RLS)** enforces household data isolation - MUST be enabled on all tables
2. **Edge Functions** validate auth via JWT before privileged operations (`verify_jwt: true` in `config.toml`)
3. **Service role key** never exposed to browser - only in Edge Functions
4. **Invite tokens** are hashed in database (never plaintext)
5. **PII logging forbidden** - no email/name/token values in logs

### Database Migrations

- Migrations are **numbered sequentially** (e.g., `20260106203424_001_profiles.sql`)
- Always include **RLS policies** for new tables
- Test locally with `supabase db reset` before pushing
- Consider rollback strategy (reversibility)
- Use helper functions for complex RLS logic (avoid stack depth issues)

Example migration pattern:
```sql
-- Create table
CREATE TABLE public.my_table (...);

-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users see own household data" ON public.my_table
  FOR SELECT USING (
    household_id IN (SELECT household_id FROM household_members WHERE user_id = auth.uid())
  );
```

### Edge Functions

- Located in `supabase/functions/`
- Shared utilities in `_shared/` (cors, errors, crypto)
- Always handle CORS (OPTIONS preflight + headers in response)
- Use consistent error shapes from `_shared/errors.ts`
- Validate JWT in function config: `verify_jwt = true`
- Never log PII (email, tokens, sensitive data)
- Secrets must NOT start with `SUPABASE_` (reserved prefix)

Required secrets (set via Supabase CLI or Dashboard):
- `SB_URL`, `SB_ANON_KEY`, `SB_SERVICE_ROLE_KEY`
- `SITE_URL` (for CORS), `INVITE_TOKEN_SECRET`

### React/TypeScript Standards

- **Functional components** with hooks (no class components)
- **Explicit prop interfaces** for all components
- **No `any` types** - use `unknown` if type is truly unknown
- **Strict mode enabled** in `tsconfig.json`
- Use **Chakra UI** components (already imported)
- Error boundaries for critical sections
- React Router v6 for routing (`react-router-dom`)

### Commit Messages

Use **conventional commits**:
```
type(scope): description

Examples:
feat(invite): add email validation to invite flow
fix(auth): handle expired session gracefully
docs(readme): update local development instructions
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

### Spec-Driven Development Workflow

This project uses **SpecKit** for feature development:

1. **Specification:** Each feature has a `specs/{feature}/` directory containing:
   - `spec.md` - Requirements and user stories
   - `plan.md` - Technical design and implementation plan
   - `tasks.md` - Task breakdown with checkboxes
   - `checklists/` - Validation checklists (ux.md, security.md, etc.)

2. **Custom Agents:** Available in `.github/agents/` (prefixed with `speckit.`):
   - `speckit.implement` - Execute tasks from `tasks.md`
   - `speckit.analyze` - Cross-artifact consistency analysis
   - `speckit.checklist` - Generate custom checklists
   - See agent files for complete capabilities

3. **Before implementing a feature:** Check if a spec exists in `specs/` and read `spec.md`, `plan.md`, and `tasks.md` for context.

### Environment Variables

**Frontend (Vite) - `apps/web/.env.local`:**
```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

**Edge Functions (Supabase hosted):**
Set via `supabase secrets set` or Supabase Dashboard. Never commit secrets to git.

### Documentation

- **Minimal policy:** One README.md at root of each top-level folder
- **No README in subfolders** (document in parent README)
- **Update docs with code changes:** PRD, tracker, and relevant README files
- **No summary/completion docs** unless explicitly requested

Key docs:
- `docs/TRACKLY_HOME_PRD.md` - Product requirements
- `docs/SDLC_PROCESS.md` - Development lifecycle
- `docs/PROJECT_TRACKER.md` - Task tracking
- `.github/BRANCHING_STRATEGY.md` - Git workflow
- `.github/workflows/README.md` - CI/CD documentation

### Data Model

**Core tables (public schema):**
- `profiles` - One row per user (display_name, timezone)
- `households` - Household entity with owner_user_id
- `household_members` - Join table (user_id, household_id, role)
- `invites` - Invitation tokens (hashed, with expiry)

**Roles:**
- `owner` - Household creator, full control
- `admin` - Can invite members, manage roles
- `member` - Read-only household access

### Pre-commit Checklist

Before pushing changes:
- [ ] `npm run build` passes (in `apps/web/`)
- [ ] `npm run lint` passes (required for PR merge)
- [ ] Manual smoke test of affected features
- [ ] No secrets in code or `.env` files committed
- [ ] RLS policies tested if database changes
- [ ] Documentation updated if user-facing changes

### CI/CD Workflows

Located in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| `pr-check.yml` | PR to main | Lint + build quality gates |
| `swa-app-deploy.yml` | Push to dev/main | Deploy frontend to Azure SWA |
| `supabase-deploy-dev.yml` | Push to dev | Deploy DB + functions (dev) |
| `supabase-deploy-prod.yml` | Push to main | Deploy DB + functions (prod) |

**Concurrency control:** Workflows use concurrency groups to prevent concurrent deployments to the same environment.

See `.github/workflows/README.md` for complete documentation.

## Common Tasks

### Add a new database table

1. Create migration: `supabase migration new add_table_name`
2. Write SQL with table definition and RLS policies
3. Test locally: `supabase db reset`
4. Commit and push to `dev` branch

### Add a new Edge Function

1. Create function directory: `supabase/functions/my-function/`
2. Add `index.ts` with Deno.serve handler
3. Import shared utilities from `../_shared/`
4. Test locally: `supabase functions serve`
5. Deploy via push to `dev` or `main` branch

### Add a new React screen

1. Create screen in `apps/web/src/screens/MyScreen.tsx`
2. Add route in `apps/web/src/router/index.tsx`
3. Import and use Chakra UI components
4. Test with `npm run dev`

### Fix a production bug (hotfix)

1. Branch from `main`: `git checkout -b hotfix/description`
2. Fix and test locally
3. Create PR to `main` (must pass `pr-check.yml`)
4. Merge and approve prod deployment in GitHub Actions
5. Cherry-pick to `dev` or merge `main` → `dev`

## Core Principles (Constitution)

This project follows a formal constitution (`.specify/memory/constitution.md`) with these **non-negotiable** principles:

### I. Security First
- All tables **MUST** have RLS enabled
- Service role keys **MUST** never be exposed to client code
- Edge functions **MUST** validate authentication (verify_jwt = true)
- Invite tokens **MUST** be hashed in database
- CORS **MUST** be restricted to known origins only (no wildcards)
- No PII **SHALL** be written to application logs
- Zero-tolerance for cross-household data leaks

### II. Vertical Slices
- Features **MUST** be broken into prioritized user stories (P1, P2, P3)
- Each user story **MUST** deliver standalone value
- User stories **MUST** be independently testable
- Implementation follows: Foundation → Story 1 → Story 2 → Story 3 (each deliverable)

### III. Minimal Changes
- Prefer simple solutions over complex abstractions
- Start simple; refactor when actual need emerges (YAGNI)
- Complexity **MUST** be justified explicitly (document in plan)
- Reject "just in case" or "for future use" features

### IV. Document As You Go
- Documentation is part of "done" (not optional)
- Database changes **MUST** update migration README
- User-facing features **MUST** update PRD requirements status
- Task completion **MUST** update PROJECT_TRACKER.md

### V. Test Before Deploy
- Manual smoke test **MUST** pass for affected features
- `npm run build` and `npm run lint` **MUST** pass
- Supabase functions **MUST** be tested locally
- RLS policies **MUST** be tested with SQL queries
- No untested code **SHALL** reach shared branches

## Three-Tier Deployment Workflow

All features follow a **staged promotion** workflow:

### Tier 1: Local Development
- All implementation completed and tested locally **first**
- All spec tasks validated and marked complete
- Manual smoke tests passing
- Build/lint checks passing
- RLS policies tested with SQL
- **No code moves to staging until 100% complete locally**

### Tier 2: Staging (Azure Dev)
- Promoted **ONLY** after local testing is complete
- Full validation in staging environment
- Cross-browser testing
- Performance validation
- Security review and RLS audit
- Integration testing with production-like data

### Tier 3: Production (Azure Prod)
- Promoted **ONLY** after staging validation is complete
- Manual approval gate required (GitHub Actions)
- Post-deployment validation checklist
- Rollback plan prepared

**Quality Gates:**
- Local → Staging: All spec tasks complete, manual tests passing, docs updated
- Staging → Production: All staging tests passing, security review complete, approval obtained

## Script Organization

Scripts are organized by function (database migrations are the **only** exception):

```
scripts/
├── azure/        # Azure deployment and infrastructure
├── github/       # GitHub Actions, secrets, OIDC setup
└── supabase/     # Supabase testing, data generation, utilities

supabase/migrations/  # ONLY timestamped migration files
```

**Script Placement Rules:**
- **Migration scripts ONLY:** `supabase/migrations/` (format: `YYYYMMDDHHMMSS_00X_description.sql`)
- **Test scripts:** `scripts/supabase/` (RLS tests, performance tests, data validation)
- **Data generation:** `scripts/supabase/` (seed data, test fixtures)
- **One-off utilities:** `scripts/supabase/` (manual queries, cleanup scripts)

**Why:** Separating migrations from utility scripts keeps migration directories clean and makes it clear which files are automatically applied by migration tools vs. manual execution.

## Secrets Management

All secrets **MUST** be stored in `.secrets/` folder at repository root:

```
.secrets/
├── .env.dev          # Development environment secrets
├── .env.prod         # Production environment secrets
└── README.md         # Documentation for secrets setup
```

**Requirements:**
- `.secrets/` folder **MUST** be in `.gitignore`
- All required secrets documented in `.secrets/README.md`
- Secrets **MUST** be environment-specific (no shared secrets between dev/prod)
- No secrets **SHALL** be committed to version control

## Working Documents vs. Permanent Docs

**Working Documents** go in `docs/working_folder/`:
- Temporary summaries and status reports
- Meeting notes and discussion transcripts
- Exploratory research and investigation docs
- Draft specifications before finalization
- Agent-generated summaries without long-term value

**Permanent Documentation** stays in regular `docs/`:
- Follow existing patterns (see docs/ directory)
- One README per top-level folder (no READMEs in subfolders)
- No unnecessary summary documents

**Rule:** If creating a working document, always put it in `docs/working_folder/`. Ask before creating project summary documents.

## Complexity Justification

When violating the "Minimal Changes" principle, justify it in the implementation plan under "Complexity Tracking":

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [specific violation] | [current need] | [why simpler approach insufficient] |

## Role Hierarchy

```
Owner  → Full control, can transfer ownership (future)
  ↓
Admin  → Can invite members, manage roles (except owner)
  ↓
Member → Read household data, use features
```

**Security Constraints:**
- Cannot remove last admin (database trigger prevents this)
- Tokens are single-use (invites invalidated after acceptance)
- Tokens expire (7-day expiry on all invites)
- No secrets in client (service role key never exposed to browser)
- Standardized errors (responses **MUST NOT** leak internal details)

## Constitution Compliance

- All PRs **MUST** be reviewed against the constitution
- Feature plans **MUST** include "Constitution Check" section
- Unjustified complexity or principle violations **SHALL** be rejected
- Constitution supersedes all other practices

See `.specify/memory/constitution.md` for complete governance framework.

## Additional Resources

- Supabase Dashboard: https://supabase.com/dashboard
- Azure Portal: https://portal.azure.com
- GitHub Actions: Check Actions tab for deployment status
- Conventional Commits: https://www.conventionalcommits.org/
- Project Constitution: `.specify/memory/constitution.md`
