# Trackly Home — SDLC Process Guide

**Version:** 1.0  
**Last Updated:** 2026-01-18

---

## Table of Contents

1. [Overview](#1-overview)
2. [Development Workflow](#2-development-workflow)
3. [Branching Strategy](#3-branching-strategy)
4. [Code Quality Standards](#4-code-quality-standards)
5. [Testing Requirements](#5-testing-requirements)
6. [Security Checklist](#6-security-checklist)
7. [Deployment Process](#7-deployment-process)
8. [Change Management](#8-change-management)
9. [Documentation Standards](#9-documentation-standards)
10. [Review Process](#10-review-process)

---

## 1. Overview

This document defines the Software Development Lifecycle (SDLC) process for Trackly Home. Following this process ensures code quality, security, and reliable deployments.

### Core Principles

1. **Security First**: All changes must consider security implications
2. **Minimal Changes**: Make the smallest change that solves the problem
3. **Test Before Deploy**: Validate all changes locally before merging
4. **Document As You Go**: Update documentation with each change
5. **Vertical Slices**: Deliver working features end-to-end

---

## 2. Development Workflow

### 2.1 Starting New Work

1. **Check the PRD**: Ensure the work aligns with [TRACKLY_HOME_PRD.md](../TRACKLY_HOME_PRD.md)
2. **Check the Tracker**: Update [PROJECT_TRACKER.md](../PROJECT_TRACKER.md) status
3. **Create a branch**: From `dev` branch using naming convention
4. **Set up local environment**: Follow README.md instructions

### 2.2 Development Cycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Implement  │───▶│    Test     │───▶│   Review    │
│             │    │   Locally   │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Commit    │    │   Fix       │    │   Iterate   │
│   Changes   │    │   Issues    │    │   or Merge  │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 2.3 Local Testing Checklist

Before pushing any changes:

- [ ] `npm run build` passes without errors
- [ ] `npm run dev` runs without console errors
- [ ] Manual smoke test of affected features
- [ ] Supabase functions tested locally (if changed)
- [ ] RLS policies tested with test queries (if changed)

### 2.4 Commit Guidelines

Use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting (no code change)
- `refactor`: Code change that neither fixes nor adds
- `test`: Adding tests
- `chore`: Maintenance tasks

**Examples:**

```
feat(invite): add email validation to invite flow
fix(auth): handle expired session gracefully
docs(readme): update local development instructions
```

---

## 3. Branching Strategy

### 3.1 Branch Types

| Branch     | Purpose            | Base | Merges To  |
| ---------- | ------------------ | ---- | ---------- |
| `main`     | Production code    | —    | —          |
| `dev`      | Integration branch | main | main       |
| `feat/*`   | New features       | dev  | dev        |
| `fix/*`    | Bug fixes          | dev  | dev        |
| `docs/*`   | Documentation      | dev  | dev        |
| `hotfix/*` | Production fixes   | main | main + dev |

### 3.2 Branch Naming Convention

```
type/short-description

Examples:
feat/task-list-ui
fix/invite-token-expiry
docs/update-prd
hotfix/auth-callback-error
```

### 3.3 Merge Rules

1. **Feature → Dev**: Squash merge after review
2. **Dev → Main**: Merge commit (preserves history)
3. **Hotfix → Main**: Fast-forward if clean

---

## 4. Code Quality Standards

### 4.1 TypeScript Standards

- Use strict mode (`"strict": true`)
- Explicit return types on exported functions
- No `any` types (use `unknown` if needed)
- Prefer interfaces over type aliases for objects

### 4.2 React Standards

- Functional components with hooks
- Props interfaces defined explicitly
- Use React.memo for expensive renders
- Error boundaries for critical sections

### 4.3 Supabase/Database Standards

- All tables must have RLS enabled
- Use helper functions for complex policy logic
- Migrations must be reversible where possible
- Test migrations locally before push

### 4.4 Edge Function Standards

- Always validate JWT (`verify_jwt = true`)
- Return consistent error shapes
- Handle CORS properly
- Never log PII

### 4.5 Linting Rules

Run before committing:

```bash
cd apps/web
npm run lint    # ESLint
npm run build   # TypeScript check
```

---

## 5. Testing Requirements

### 5.1 Testing Strategy

| Layer | Type      | Tool         | Coverage                |
| ----- | --------- | ------------ | ----------------------- |
| UI    | Manual    | Browser      | All user flows          |
| API   | Manual    | curl/Postman | Edge functions          |
| DB    | Manual    | SQL Editor   | RLS policies            |
| Unit  | Automated | Vitest       | Critical logic (future) |
| E2E   | Automated | Playwright   | User journeys (future)  |

### 5.2 Manual Test Checklist

Before each release:

**Authentication:**

- [ ] Magic link sign-in works
- [ ] Session persists on refresh
- [ ] Sign-out works correctly
- [ ] Invalid email shows error

**Household Setup:**

- [ ] New user can create household
- [ ] User becomes owner after creation
- [ ] Cannot create multiple households

**Invite Flow:**

- [ ] Admin can create invite
- [ ] Non-admin cannot create invite
- [ ] Invite link copies correctly
- [ ] Partner can join via link
- [ ] Expired invite shows error
- [ ] Used invite shows error

**Role Management:**

- [ ] Admin can view ManageRolesCard
- [ ] Member cannot view ManageRolesCard
- [ ] Role changes are saved
- [ ] Cannot remove last admin

### 5.3 RLS Test Queries

Run in Supabase SQL Editor:

```sql
-- Test: User can only see own profile
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM profiles; -- Should return only own row

-- Test: Cross-household access blocked
-- (use two different household IDs)
SELECT * FROM households WHERE id = 'other-household-id';
-- Should return 0 rows
```

---

## 6. Security Checklist

### 6.1 Before Every PR

- [ ] No secrets in code
- [ ] No service keys exposed to client
- [ ] RLS policies enforce isolation
- [ ] Edge functions validate auth
- [ ] CORS allows only known origins
- [ ] No PII in logs
- [ ] Tokens are hashed/encrypted

### 6.2 Database Changes

- [ ] RLS enabled on new tables
- [ ] Policies enforce household isolation
- [ ] Sensitive columns (email, tokens) protected
- [ ] No SQL injection vectors
- [ ] Helper functions tested for recursion

### 6.3 Frontend Changes

- [ ] No sensitive data in localStorage
- [ ] Auth state checked before API calls
- [ ] Error messages don't leak internals
- [ ] User input sanitized

### 6.4 Edge Function Changes

- [ ] verify_jwt enabled
- [ ] Service role key not returned
- [ ] User authorized for action
- [ ] Error responses consistent

---

## 7. Deployment Process

### 7.1 Overview

Trackly Home uses GitHub Actions for automated CI/CD with separate workflows for frontend (Azure SWA) and backend (Supabase).

**Complete workflow documentation:** [.github/workflows/README.md](../../.github/workflows/README.md)

### 7.2 Development Environment

**Trigger:** Push to `dev` branch

**Workflows:**
- `swa-app-deploy.yml` - Deploys frontend when `apps/web/**` changes
- `supabase-deploy-dev.yml` - Deploys database + functions when `supabase/**` changes

**Steps:**

1. Frontend builds via `swa-app-deploy.yml`
2. Supabase deploys via `supabase-deploy-dev.yml`
3. Check workflow summaries for success

**Approval:** Not required (automatic deployment)

### 7.3 Production Environment

**Trigger:** Push to `main` branch or manual workflow dispatch

**Workflows:**
- `swa-app-deploy.yml` - Deploys frontend when `apps/web/**` changes
- `supabase-deploy-prod.yml` - Deploys database + functions when `supabase/**` changes

**Steps:**

1. Create PR from `dev` → `main`
2. Ensure PR quality gates pass (`pr-check.yml`)
3. Merge PR to `main`
4. Workflows trigger automatically
5. **Approve deployments** in GitHub Actions UI
6. Monitor deployment summaries

**Approval:** Required for production deployments

### 7.4 Pull Request Quality Gates

**Workflow:** `pr-check.yml`

**Trigger:** Pull request to `main` branch

**Checks:**
- Lint: `npm run lint` in `apps/web/`
- Build: `npm run build` in `apps/web/`

**Branch Protection:**
- Main branch requires PR checks to pass before merge
- Configuration: Settings → Branches → `main` → Branch protection rules

### 7.5 Manual Deployment

**Use Cases:**
- Emergency hotfix
- Deploy to prod without merging to main
- Re-deploy after rollback

**Steps:**

1. Navigate to Actions tab in GitHub
2. Select workflow:
   - Deploy Web App (Azure SWA)
   - Supabase Deploy (Dev)
   - Supabase Deploy (Prod)
3. Click "Run workflow"
4. Select branch and target environment
5. Click "Run workflow"
6. If prod, approve deployment when prompted

### 7.6 Deployment Artifacts

**Frontend (Azure SWA):**
- Build output: `apps/web/dist/`
- Deployed to: Azure Static Web Apps
- URL: Environment-specific (dev/prod)

**Backend (Supabase):**
- Migrations: `supabase/migrations/*.sql`
- Functions: `supabase/functions/*/index.ts`
- Deployed to: Supabase project (dev/prod)

### 7.7 Environment Variables & Secrets

**Frontend Build-time:**
| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | GitHub Environment secret | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | GitHub Environment secret | Supabase anonymous key |

**Backend (Edge Functions):**
| Secret | Source | Purpose |
|--------|--------|---------|
| `SB_URL` | Environment secret | Supabase URL |
| `SB_ANON_KEY` | Environment secret | Anon key |
| `SB_SERVICE_ROLE_KEY` | Environment secret | Service role key |
| `SITE_URL` | Environment secret | Allowed origin |
| `ALLOWED_ORIGINS` | Environment secret | CORS allowlist |
| `INVITE_TOKEN_SECRET` | Environment secret | Token signing |

**Supabase Deployment:**
| Secret | Purpose |
|--------|---------|
| `SUPABASE_PROJECT_REF` | Project identifier |
| `SUPABASE_DB_PASSWORD` | Database password |
| `SUPABASE_ACCESS_TOKEN` | CLI authentication |

**Complete secrets documentation:** [.github/SECRETS.md](../../.github/SECRETS.md)

### 7.8 Pre-Deployment Checklist

- [ ] All tests passing
- [ ] Manual smoke test complete
- [ ] Security checklist reviewed
- [ ] Documentation updated
- [ ] Tracker updated with completion
- [ ] PR quality gates passed (if applicable)
- [ ] Secrets verified for target environment

### 7.9 Post-Deployment Verification

- [ ] Site loads without errors
- [ ] Login flow works
- [ ] Create/join household works
- [ ] Console shows no errors
- [ ] Supabase logs clean
- [ ] Database migrations applied (check Supabase Dashboard)
- [ ] Edge Functions deployed (check Function logs)

### 7.10 Rollback Procedures

**Frontend Rollback:**
```bash
# Option 1: Revert commit
git revert <bad-commit-sha>
git push origin main

# Option 2: Manual workflow dispatch with older commit
git checkout <good-commit-sha>
# Actions → Deploy Web App → Run workflow (prod)
```

**Database Migration Rollback:**
```bash
# Create reverse migration
supabase migration new rollback_bad_migration

# Write SQL to undo changes in the new migration file
# Test locally: supabase db reset
# Deploy: push to main, approve prod deployment
```

**Edge Function Rollback:**
```bash
# Revert function code
git revert <bad-commit-sha>
git push origin main
# Function auto-deploys on push
```

### 7.11 Monitoring Deployments

**GitHub Actions:**
- View workflow runs in Actions tab
- Filter by workflow name, branch, or status
- Click workflow run for detailed logs

**Deployment Summaries:**
All workflows generate comprehensive summaries including:
- Environment deployed to
- Commit SHA and author
- Deployment status (success/failure)
- Links to Azure Portal, Supabase Dashboard
- List of deployed migrations/functions

**Azure Portal:**
- Monitor Azure SWA health and metrics
- View deployment history
- Access application logs

**Supabase Dashboard:**
- View migration history
- Monitor Edge Function logs and invocations
- Check database performance

### 7.12 Concurrency Control

All workflows use concurrency groups to prevent concurrent deployments:

| Workflow | Concurrency Group | Cancel in Progress |
|----------|-------------------|-------------------|
| pr-check.yml | `pr-check-${{ github.ref }}` | Yes |
| swa-app-deploy.yml | `swa-web-${{ github.ref_name }}` | Yes |
| supabase-deploy-dev.yml | `supabase-dev` | Yes |
| supabase-deploy-prod.yml | `supabase-prod` | Yes |

**Effect:** New workflow runs cancel old ones for the same group, preventing stale deployments.

---

## 8. Change Management

### 8.1 Making Database Changes

1. Create migration file:

   ```bash
   supabase migration new description_of_change
   ```

2. Write migration SQL with:
   - Forward migration (CREATE, ALTER)
   - Consider rollback strategy
   - RLS policies if new tables

3. Test locally:

   ```bash
   supabase db reset
   ```

4. Commit with description:
   ```
   feat(db): add tasks table with RLS policies
   ```

### 8.2 Making Edge Function Changes

1. Update function in `supabase/functions/`
2. Test locally:
   ```bash
   supabase functions serve
   ```
3. Test with curl/Postman
4. Commit with description

### 8.3 Making Frontend Changes

1. Update code in `apps/web/src/`
2. Run `npm run dev` and test
3. Run `npm run build` to verify
4. Commit with description

### 8.4 Breaking Changes

If a change breaks existing functionality:

1. Document the breaking change
2. Update affected documentation
3. Consider migration path for users
4. Communicate in PR description

---

## 9. Documentation Standards

### 9.1 Minimal Documentation Policy

- One README.md at the root of each top-level folder.
- No README.md files in subfolders (document subfolders in the nearest parent README).
- Exception: .github/workflows is documented in .github/README.md (no README in workflows/).
- Do not create summary or completion documents unless explicitly requested.

### 9.2 Required Documentation

| Change Type     | Documentation Required            |
| --------------- | --------------------------------- |
| New feature     | PRD update, README if user-facing |
| Database change | Migration README update           |
| API change      | Edge function comments            |
| Config change   | .env.example update               |

### 9.3 Code Documentation

- Document complex business logic
- Add JSDoc to exported functions
- Explain non-obvious decisions in comments
- Keep README files current

### 9.4 PRD Updates

When changing features:

1. Update requirements status
2. Add any new requirements
3. Update phase completion

### 9.5 Tracker Updates

After completing work:

1. Mark task as complete
2. Add completion date
3. Add any notes

---

## 10. Review Process

### 10.1 Self-Review Checklist

Before requesting review:

- [ ] Code compiles without errors
- [ ] No console warnings
- [ ] Changes tested locally
- [ ] Commit messages follow convention
- [ ] Documentation updated
- [ ] Security checklist completed

### 10.2 PR Requirements

**Title:** Use conventional commit format

```
feat(scope): brief description
```

**Description:**

- What changed
- Why it changed
- How to test
- Screenshots (if UI change)

### 10.3 Review Focus Areas

| Area            | Questions to Ask                            |
| --------------- | ------------------------------------------- |
| Security        | Does this expose data? Validate auth?       |
| Performance     | Does this add latency? Heavy queries?       |
| UX              | Is error handling graceful? Loading states? |
| Maintainability | Is code clear? Over-engineered?             |
| Testing         | Has it been tested? Edge cases?             |

### 10.4 Merge Requirements

- [ ] PR description complete
- [ ] All checks passing
- [ ] Self-review completed
- [ ] At least one approval (if team)
- [ ] Conflicts resolved

---

## Quick Reference

### Local Development Commands

```bash
# Start Supabase
supabase start

# Reset database
supabase db reset

# Serve edge functions
supabase functions serve

# Run web app
cd apps/web && npm run dev

# Build web app
cd apps/web && npm run build

# Lint code
cd apps/web && npm run lint
```

### Deployment Commands

```bash
# Link Supabase project
supabase link --project-ref <ref>

# Push migrations
supabase db push

# Deploy functions
supabase functions deploy

# Deploy all functions
supabase functions deploy --all
```

### Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Azure Portal](https://portal.azure.com)
- GitHub Actions: `https://github.com/{owner}/{repo}/actions`

---

_Follow this process consistently to ensure high-quality, secure releases._
