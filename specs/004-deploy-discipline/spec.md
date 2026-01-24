# Feature Specification: Deploy Discipline (Revised)

**Feature ID**: 004  
**Feature Name**: Deploy Discipline (CI/CD Automation)  
**Phase**: Phase 4  
**Priority**: P0 (Critical infrastructure for production readiness)  
**Created**: 2026-01-22  
**Revised**: 2026-01-22 (incorporating existing workflows from old repo)  
**Status**: Specification  
**Branch**: 004-deploy-discipline

## Overview

### Problem Statement

The project has **partial deployment infrastructure** from the old repo but lacks complete production automation and quality gates.

**Current State (NEW REPO - adapting from old repo patterns)**:

✅ **Existing in New Repo**:
- GitHub Environments configured: `dev`, `prod`, `copilot` (with secrets already set)
- Reference workflows from old repo available (in `specs/004-deploy-discipline/oldrepo/`)
- **Dev infrastructure deployed**:
  - Azure Static Web App (dev) ✅ deployed
  - Supabase project (dev) ✅ deployed
- Bicep templates ready: `azure/deploy/main.bicep` (for infrastructure deployment)

❌ **Missing Gaps (Need to Address)**:
1. **Azure OIDC not configured**: New repo needs GitHub → Azure OIDC federated credentials setup
2. **Production infrastructure NOT deployed**:
   - Azure Static Web App (prod) ❌ not deployed yet
   - Supabase project (prod) ❌ not deployed yet
3. **Workflows not migrated**: Old repo workflows need to be adapted to new repo structure
4. **PR Quality Gates**: No automated checks before merge (lint, typecheck, build)
5. **Automated Production Deploys**: No workflows for auto-deploy on main
6. **Supabase Production Workflow**: Need to create prod version (only dev exists in old repo)
7. **Secrets Documentation**: No centralized reference for required GitHub secrets

**Deployment Pattern to Implement**:
```
┌─────────────────┐
│ Feature Branch  │
└────────┬────────┘
         │ PR
         ▼
┌─────────────────┐    ❌ NEW: Add PR checks
│    PR Checks    │    (lint, typecheck, build)
│  (NEW WORKFLOW) │
└────────┬────────┘
         │ Approve + Merge
         ▼
┌─────────────────┐
│   main branch   │
└────┬───────┬────┘
     │       │
     │       ▼
     │  ┌──────────────────┐    ✅ EXISTS (manual)
     │  │ Prod SWA Deploy  │    🔧 UPDATE: Add auto trigger
     │  │  (workflow_disp) │       on push to main
     │  └──────────────────┘
     │
     ▼
┌──────────────────┐    ❌ NEW: Create from
│ Prod Supabase    │    dev workflow template
│  (MISSING)       │
└──────────────────┘

┌─────────────────┐
│   dev branch    │
└────┬───────┬────┘
     │       │
     │       ▼
     │  ┌──────────────────┐    ✅ EXISTS (auto)
     │  │  Dev SWA Deploy  │    No changes needed
     │  │  (push to dev)   │
     │  └──────────────────┘
     │
     ▼
┌──────────────────┐    ✅ EXISTS (auto)
│  Dev Supabase    │    No changes needed
│  (push to dev)   │
└──────────────────┘
```

### User Value

**Primary Beneficiary**: Development team (and indirectly, end users)

**Value Delivered**:
1. **Reduce deployment risk**: Automated checks catch errors before merge
2. **Faster feedback**: PR checks run automatically, no manual verification needed
3. **Production safety**: Approval gates prevent accidental production deployments
4. **Clear process**: Documented deployment workflow reduces confusion
5. **Confidence**: Every merge is validated, production deploys are gated

**Success Metrics**:
- 100% of PRs run automated checks before merge
- Zero broken builds on main branch
- Production deployments require explicit approval
- All deployment workflows documented
- Dev auto-deploys continue to work (preserve existing functionality)

### Scope

**In Scope**:
- ✨ **NEW**: GitHub Actions workflow for PR quality checks (lint, typecheck, build)
- ✨ **NEW**: Supabase production deployment workflow (copy from dev template)
- ✨ **NEW**: Secrets documentation (.github/SECRETS.md)
- 🔧 **UPDATE**: Add auto-trigger for prod SWA deploy on push to main
- ✅ **VALIDATE**: Verify existing workflows still work (dev auto-deploy)
- ✅ **VALIDATE**: Verify prod environment has approval gates configured

**Out of Scope**:
- Automated testing framework (deferred to later phase)
- Performance testing / benchmarking
- Blue-green deployments or canary releases
- Monitoring / observability setup (separate feature)
- Database backup automation (future enhancement)
- Modifying existing Bicep infrastructure workflow (already complete)

**Constraints**:
- Must preserve existing dev auto-deploy behavior (push to dev → deploy)
- Must work with existing Azure Static Web Apps setup
- Must work with Supabase hosted projects
- Must not require paid GitHub features (use free tier)
- Deployment workflows must be idempotent (safe to re-run)

---

## User Stories

### User Story 1: PR Quality Gates (P0) - **NEW**

**As a** developer  
**I want** automated checks to run on every pull request  
**So that** broken code is caught before merging to main

**Implementation Notes**:
- Create new `.github/workflows/pr-check.yml` (not in old repo)
- Follow existing workflow patterns:
  - Concurrency control like swa-app-deploy.yml
  - Comprehensive summaries like supabase-deploy-dev.yml
- Reuse existing environment variable patterns from swa-app-deploy.yml

**Acceptance Criteria**:
- [ ] AC1.1: PR workflow runs on all PRs targeting `main` branch
- [ ] AC1.2: Workflow checks: `npm run lint`, `npm run build` (apps/web)
- [ ] AC1.3: PR status shows green ✅ if all checks pass, red ❌ if any fail
- [ ] AC1.4: Branch protection rule blocks merge if checks fail
- [ ] AC1.5: Workflow completes in < 5 minutes (fast feedback)
- [ ] AC1.6: Follows existing workflow style (concurrency, summary format)

**Priority**: P0 - Critical for code quality

---

### User Story 2: Production Environment Validation (P0) - **VALIDATE EXISTING**

**As a** DevOps engineer  
**I want** to verify the production GitHub environment is properly configured  
**So that** production deployments have approval gates and proper secrets

**Implementation Notes**:
- Environment "prod" already exists in GitHub (visible in screenshot)
- Verify existing protection rules match requirements
- Document existing secret configuration from old repo workflows:

**Required Secrets (per old workflows)**:
- **Azure SWA** (per environment: dev, prod):
  - AZURE_SWA_DEPLOYMENT_TOKEN
  - VITE_SUPABASE_URL
  - VITE_SUPABASE_ANON_KEY
- **Supabase** (shared):
  - SUPABASE_ACCESS_TOKEN
- **Supabase** (per environment: dev, prod):
  - SUPABASE_PROJECT_REF
  - SUPABASE_DB_PASSWORD
  - SB_SUPABASE_URL
  - SB_SUPABASE_ANON_KEY
  - SB_SUPABASE_SERVICE_ROLE_KEY
  - SB_DATABASE_URL
  - SB_DIRECT_URL
  - SB_JWT_SECRET
  - SB_SITE_URL
  - SB_CORS_ORIGINS
  - SB_SMTP_* (email configuration)
- **Azure Infrastructure** (OIDC, not stored):
  - AZURE_CLIENT_ID
  - AZURE_TENANT_ID
  - AZURE_SUBSCRIPTION_ID

**Acceptance Criteria**:
- [ ] AC2.1: GitHub environment "prod" has required reviewers configured
- [ ] AC2.2: Environment requires manual approval before deployment
- [ ] AC2.3: Production secrets documented and verified present
- [ ] AC2.4: Only main branch can deploy to production
- [ ] AC2.5: Deployment history visible in GitHub environment logs
- [ ] AC2.6: All 15+ secrets from old repo workflows are configured

**Priority**: P0 - Required for safe production deployments

---

### User Story 3: SWA Production Auto-Deploy (P1) - **UPDATE EXISTING**

**As a** developer  
**I want** merged PRs to main to automatically deploy the SWA to production  
**So that** approved changes reach users without manual intervention

**Implementation Notes**:
- **Existing workflow**: `.github/workflows/swa-app-deploy.yml`
- **Current triggers**: 
  - `push` to dev (apps/web/**) → auto-deploy to dev
  - `workflow_dispatch` → manual deploy to user-selected environment
- **Current environment logic**: `${{ github.event_name == 'workflow_dispatch' && inputs.target || 'dev' }}`
- **Required change**: Add trigger for `push` to main → auto-deploy to prod
- **Preserve**: Dev auto-deploy and manual workflow_dispatch still work

**Existing Pattern to Reuse**:
```yaml
on:
  push:
    branches: [dev]
    paths: ['apps/web/**']
  workflow_dispatch:
    inputs:
      target:
        type: choice
        options: [dev, prod]

jobs:
  deploy:
    environment: ${{ github.event_name == 'workflow_dispatch' && inputs.target || 'dev' }}
    concurrency:
      group: swa-web-${{ github.ref_name }}
      cancel-in-progress: true
    steps:
      - uses: Azure/static-web-apps-deploy@v1
        env:
          VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
```

**Acceptance Criteria**:
- [ ] AC3.1: Workflow triggers on push to main (PR merge)
- [ ] AC3.2: Uses "prod" environment with approval gates
- [ ] AC3.3: Deploys to production Azure SWA using AZURE_SWA_DEPLOYMENT_TOKEN
- [ ] AC3.4: Injects production VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] AC3.5: Workflow_dispatch still works for manual deploys (emergency)
- [ ] AC3.6: Dev auto-deploy on push to dev still works unchanged
- [ ] AC3.7: Deployment status visible in GitHub commit status

**Priority**: P1 - Important for production releases

---

### User Story 4: Supabase Production Deployment (P1) - **CREATE NEW**

**As a** developer  
**I want** Supabase migrations and Edge Functions deployed to production  
**So that** backend changes are synchronized with frontend deployments

**Implementation Notes**:
- **Existing workflow**: `.github/workflows/supabase-deploy-dev.yml` (dev only)
- **Current triggers**: 
  - `push` to dev (supabase/**) → auto-deploy to dev
  - `workflow_dispatch` → manual deploy to dev
- **Required change**: Create `.github/workflows/supabase-deploy-prod.yml`
- **Copy from dev workflow** with these modifications:
  - Trigger: `push` to main (instead of dev)
  - Environment: `prod` (instead of dev)
  - Concurrency group: `supabase-prod` (instead of supabase-dev)
  - Use prod-specific secrets: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
  - Keep same comprehensive summary format

**Existing Dev Workflow Steps** (replicate for prod):
1. **Link project**: `supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}`
2. **Push migrations**: `yes | supabase db push` (non-interactive, auto-confirm)
3. **Set Edge Function secrets** (9 total):
   - SB_SUPABASE_URL, SB_SUPABASE_ANON_KEY, SB_SUPABASE_SERVICE_ROLE_KEY
   - SB_DATABASE_URL, SB_DIRECT_URL, SB_JWT_SECRET
   - SB_SITE_URL, SB_CORS_ORIGINS, SB_SMTP_*
4. **Deploy functions**: `supabase functions deploy`
5. **Generate summary**:
   - Dashboard link: `https://supabase.com/dashboard/project/$PROJECT_REF`
   - List migrations applied
   - List functions deployed
   - Link to logs

**Acceptance Criteria**:
- [ ] AC4.1: New workflow triggers on push to main (supabase/**)
- [ ] AC4.2: Uses "prod" environment with approval gates
- [ ] AC4.3: Runs database migrations to production Supabase (non-interactive)
- [ ] AC4.4: Deploys all Edge Functions from supabase/functions/ directory
- [ ] AC4.5: Updates all 9 environment-specific secrets for Edge Functions
- [ ] AC4.6: Deployment summary matches dev workflow format
- [ ] AC4.7: Workflow_dispatch option for manual prod deployment
- [ ] AC4.8: Dev workflow continues unchanged

**Priority**: P1 - Required for backend production deployments

---

### User Story 5: Secrets Documentation (P0) - **NEW**

**As a** team member  
**I want** clear documentation of all required GitHub secrets  
**So that** I can set up or troubleshoot deployment workflows

**Implementation Notes**:
- Document all secrets currently used in existing workflows
- Based on old repo workflow analysis
- Group by workflow and environment

**Secrets Inventory from Old Workflows**:

**1. SWA Deployment** (per environment: dev, prod):
- `AZURE_SWA_DEPLOYMENT_TOKEN` - Azure Static Web App deployment token
- `VITE_SUPABASE_URL` - Build-time Supabase URL for Vite
- `VITE_SUPABASE_ANON_KEY` - Build-time Supabase anon key for Vite

**2. Supabase Deployment** (shared):
- `SUPABASE_ACCESS_TOKEN` - Supabase CLI access token (shared across envs)

**3. Supabase Deployment** (per environment: dev, prod):
- `SUPABASE_PROJECT_REF` - Supabase project reference ID
- `SUPABASE_DB_PASSWORD` - Supabase database password

**4. Edge Function Secrets** (per environment: dev, prod):
- `SB_SUPABASE_URL` - Supabase project URL for Edge Functions
- `SB_SUPABASE_ANON_KEY` - Supabase anon key for Edge Functions
- `SB_SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SB_DATABASE_URL` - PostgreSQL connection string (pooled)
- `SB_DIRECT_URL` - PostgreSQL connection string (direct)
- `SB_JWT_SECRET` - JWT signing secret
- `SB_SITE_URL` - Application site URL
- `SB_CORS_ORIGINS` - CORS allowed origins
- `SB_SMTP_*` - SMTP configuration for email

**5. Azure Infrastructure** (OIDC, not stored in GitHub):
- `AZURE_CLIENT_ID` - Service principal client ID
- `AZURE_TENANT_ID` - Azure tenant ID
- `AZURE_SUBSCRIPTION_ID` - Azure subscription ID

**Acceptance Criteria**:
- [ ] AC5.1: Document lists all GitHub secrets by workflow and environment
- [ ] AC5.2: Each secret includes: name, purpose, how to obtain value, scope
- [ ] AC5.3: Document stored in .github/SECRETS.md
- [ ] AC5.4: Instructions for retrieving Azure SWA deployment tokens
- [ ] AC5.5: Instructions for retrieving Supabase secrets
- [ ] AC5.6: Links to Azure Portal and Supabase Dashboard
- [ ] AC5.7: Note on OIDC authentication (no stored credentials)
- [ ] AC5.8: Example workflow usage for each secret

**Priority**: P0 - Critical for proper configuration

---

## Functional Requirements

### FR-001: PR Check Workflow (NEW)
**Description**: Automated GitHub Actions workflow validates code quality on every PR

**Requirements**:
1. Workflow file: `.github/workflows/pr-check.yml`
2. Triggers: `pull_request` event targeting `main` branch
3. Jobs:
   - **Lint**: Run `npm run lint` in `apps/web`
   - **TypeCheck**: Run `npm run build` in `apps/web` (includes tsc)
4. Concurrency:
   - Group: `pr-check-${{ github.ref }}`
   - Cancel-in-progress: true (cancel old runs on new push)
5. Summary: Comprehensive GitHub Actions summary like existing workflows

**Acceptance**: All checks must pass for PR to be mergeable

---

### FR-002: Branch Protection Rules (NEW)
**Description**: GitHub branch protection prevents merging broken code

**Requirements**:
1. Branch: `main`
2. Protection rules:
   - Require status checks to pass before merging
   - Required checks: `pr-check` workflow jobs (lint, build)
   - Require branches to be up to date
   - Require pull request reviews: 0 (single developer workflow)
3. Allow force push: NO
4. Allow deletions: NO

**Acceptance**: Cannot merge PR if `pr-check` workflow fails

---

### FR-003: Production Environment Validation (VALIDATE EXISTING)
**Description**: Verify GitHub environment "prod" is properly configured

**Requirements**:
1. Environment name: `prod` (already exists)
2. Approval required: YES (manual approval before deployment)
3. Reviewers: Repository admins only
4. Wait timer: 0 minutes (no auto-approval)
5. Deployment branches: `main` only
6. Verify all secrets configured (see US5 for list)

**Acceptance**: Production environment ready for deployments

---

### FR-004: SWA Production Auto-Deploy (UPDATE EXISTING)
**Description**: Update existing swa-app-deploy.yml to auto-deploy on push to main

**Requirements**:
1. Workflow file: `.github/workflows/swa-app-deploy.yml` (exists)
2. **Add trigger**: `push` to main (apps/web/**)
3. **Update environment logic**: 
   - Push to main → prod environment
   - Push to dev → dev environment
   - Workflow_dispatch → user-selected environment
4. Preserve existing:
   - Concurrency control: `swa-web-${{ github.ref_name }}`
   - Build-time env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   - Azure/static-web-apps-deploy@v1 action
   - Working directory: apps/web

**Acceptance**: Push to main auto-deploys to prod, dev still works

---

### FR-005: Supabase Production Workflow (CREATE NEW)
**Description**: Create production Supabase deployment workflow from dev template

**Requirements**:
1. Workflow file: `.github/workflows/supabase-deploy-prod.yml` (new)
2. Triggers: 
   - `push` to main (supabase/**)
   - `workflow_dispatch` (manual override)
3. Environment: `prod`
4. Concurrency:
   - Group: `supabase-prod`
   - Cancel-in-progress: true
5. Steps (copy from dev workflow):
   - Link to prod Supabase project
   - Run `yes | supabase db push` (non-interactive)
   - Set 9 Edge Function secrets (SB_*)
   - Run `supabase functions deploy`
   - Generate comprehensive summary
6. Use prod-specific secrets:
   - SUPABASE_PROJECT_REF (prod)
   - SUPABASE_DB_PASSWORD (prod)
   - All SB_* secrets from prod environment

**Acceptance**: Migrations and functions deployed to production Supabase

---

### FR-006: Secrets Documentation (CREATE NEW)
**Description**: Markdown file documenting all required secrets from old workflows

**Requirements**:
1. File: `.github/SECRETS.md`
2. Content:
   - List all 15+ secrets from old workflows
   - Group by workflow: SWA, Supabase, Azure infra
   - Document scope: dev, prod, or shared
   - Include purpose and how to obtain
   - Example workflow usage
   - Rotation procedures
3. Format: Tables with columns: Secret Name, Scope, Purpose, How to Obtain
4. Include command examples:
   - `az staticwebapp secrets list` for SWA tokens
   - Supabase Dashboard links for Supabase secrets
   - Azure Portal links for OIDC credentials

**Acceptance**: Complete secrets reference available in .github/SECRETS.md

---

## Non-Functional Requirements

### NFR-001: Performance
- PR check workflow completes in < 5 minutes (P0)
- Production SWA deployment completes in < 10 minutes (P1)
- Supabase deployment completes in < 5 minutes (P1)

**Rationale**: Fast feedback improves developer productivity

### NFR-002: Reliability
- Workflows fail gracefully with clear error messages (P0)
- Idempotent: Safe to re-run workflows (P1)
- No race conditions in deployment workflows (P1)
- Preserve existing dev auto-deploy functionality (P0)

**Rationale**: Deployment failures should be debuggable

### NFR-003: Security
- Production secrets isolated in GitHub environment (P0)
- No secrets logged in workflow output (P0)
- Approval required for production deployments (P0)
- OIDC authentication for Azure (no stored credentials) (P0)

**Rationale**: Prevent accidental secret exposure and unauthorized deploys

### NFR-004: Maintainability
- Workflow YAML files well-commented (P1)
- Follow existing workflow style from old repo (P0)
- Secrets documentation kept up-to-date (P0)
- DRY: Reuse patterns from existing workflows (P1)

**Rationale**: Future developers can understand and modify workflows

---

## Success Criteria

| ID | Criterion | Measurement | Target |
|----|-----------|-------------|--------|
| SC-001 | PR checks automated | 100% of PRs run pr-check workflow | ✅ All PRs checked |
| SC-002 | Zero broken merges | No broken builds on `main` after PR merge | ✅ 0 failures |
| SC-003 | Production approval | 100% of production deploys require approval | ✅ Manual approval |
| SC-004 | Workflow speed | PR checks complete in < 5 minutes | ✅ < 5min |
| SC-005 | Documentation complete | All secrets documented in .github/SECRETS.md | ✅ Complete (15+ secrets) |
| SC-006 | E2E deployment | Full deploy (SWA + Supabase) works end-to-end | ✅ Working |
| SC-007 | Dev preserved | Dev auto-deploy continues to work | ✅ No regression |

---

## Edge Cases & Error Handling

### Edge Case 1: PR Check Failure
**Scenario**: PR fails lint check  
**Expected**: Workflow fails, PR shows red ❌ status  
**Handling**: Developer fixes lint errors, pushes update, workflow re-runs

### Edge Case 2: Approval Timeout
**Scenario**: Production deployment requested but not approved for 24 hours  
**Expected**: Workflow waits indefinitely (no auto-cancel)  
**Handling**: Approver can approve or cancel manually

### Edge Case 3: Deployment Conflict
**Scenario**: Two production deployments triggered simultaneously  
**Expected**: Second deployment queues behind first (GitHub environment concurrency)  
**Handling**: Deployments run sequentially, not in parallel

### Edge Case 4: Migration Failure
**Scenario**: Supabase migration fails (e.g., syntax error in SQL)  
**Expected**: Workflow fails with error details, functions not deployed  
**Handling**: Developer reviews error, fixes migration, re-runs workflow

### Edge Case 5: Secret Rotation
**Scenario**: Supabase API key rotated, workflows start failing  
**Expected**: Workflows fail with authentication error  
**Handling**: Update GitHub secret with new key, re-run workflow

### Edge Case 6: Dev Workflow Regression
**Scenario**: Changes to workflow break existing dev auto-deploy  
**Expected**: Dev deployments continue to work unchanged  
**Handling**: Test dev workflow after changes, rollback if broken

---

## Dependencies

### External Dependencies
1. **GitHub Actions**: Free tier (sufficient for this workflow)
2. **Azure Static Web Apps**: Existing deployment targets (dev + prod)
3. **Supabase CLI**: Required for migrations (`supabase` npm package)
4. **GitHub Environments**: dev, prod, copilot (already configured)

### Internal Dependencies
1. **Existing workflows** (from old repo):
   - `.github/workflows/swa-app-deploy.yml` (to update)
   - `.github/workflows/supabase-deploy-dev.yml` (template for prod)
   - `.github/workflows/azure-infra-deploy.yml` (no changes needed)
2. **Supabase projects**: Dev + prod projects (already exist)
3. **Azure SWAs**: Dev + prod Static Web Apps (already exist)
4. **GitHub secrets**: All 15+ secrets configured in environments

### Prerequisites
- ✅ GitHub repository admin access
- ✅ GitHub environments configured (dev, prod) with secrets
- ✅ Dev infrastructure deployed (Azure SWA, Supabase)
- ❌ Azure OIDC not configured (need to set up for new repo)
- ❌ Azure production Static Web App NOT provisioned yet
- ❌ Supabase production project NOT created yet
- 🔧 Production secrets configured in GitHub (need to verify match new infrastructure)

---

## Testing Plan

### Manual Testing Scenarios

**Test 1: PR Check Workflow (NEW)**
1. Create feature branch with intentional lint error
2. Open PR targeting `main`
3. Verify `pr-check` workflow runs automatically
4. Verify workflow fails with lint error
5. Fix error, push update
6. Verify workflow re-runs and passes
7. Merge PR

**Test 2: Branch Protection (NEW)**
1. Attempt to merge PR with failing checks
2. Verify merge button disabled
3. Fix checks
4. Verify merge button enabled

**Test 3: SWA Production Auto-Deploy (UPDATE)**
1. Merge PR to main (small frontend change)
2. Verify swa-app-deploy.yml triggers automatically
3. Verify approval request appears (prod environment)
4. Approve deployment
5. Verify deployment succeeds
6. Visit production URL, verify change live
7. **REGRESSION TEST**: Push to dev, verify dev auto-deploy still works

**Test 4: Supabase Production Deployment (NEW)**
1. Add new migration file
2. Commit to main (or use workflow_dispatch)
3. Verify supabase-deploy-prod.yml triggers
4. Verify approval request appears
5. Approve deployment
6. Verify migrations applied
7. Query production database to confirm changes
8. **REGRESSION TEST**: Push to dev, verify dev Supabase deploy still works

**Test 5: E2E Production Deployment**
1. Make code change requiring both SWA + Supabase update
2. Create PR, verify PR checks pass
3. Merge PR to main
4. Approve Supabase prod deployment
5. Approve SWA prod deployment
6. Verify full feature works in production

**Test 6: Secrets Documentation**
1. Open .github/SECRETS.md
2. Verify all 15+ secrets documented
3. Follow instructions to retrieve one Azure SWA token
4. Follow instructions to retrieve one Supabase secret
5. Verify instructions accurate

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Workflow breaks due to GitHub Actions changes | Low | Medium | Pin action versions, monitor GitHub changelog |
| Production secrets leaked | Low | Critical | Use GitHub environment secrets, never log |
| Accidental production deploy | Medium | High | Require approval, limit to `main` branch |
| Migration breaks production DB | Medium | High | Test migrations locally first, document rollback |
| Breaking existing dev workflows | Medium | High | Test dev workflows after changes, rollback if needed |
| Azure SWA quota exceeded | Low | Medium | Monitor usage, upgrade plan if needed |

---

## Related Documents

- [PROJECT_TRACKER.md](../../docs/PROJECT_TRACKER.md) - Phase 4 task list
- [SDLC_PROCESS.md](../../docs/SDLC_PROCESS.md) - Deployment workflow documentation
- [Constitution](../../.specify/memory/constitution.md) - Governance and deployment process
- [Azure README](../../azure/deploy/README.md) - Azure infrastructure documentation
- [Old Repo Workflows](./oldrepo/) - Reference workflows from old repo

**Old Repo Workflow Files**:
- `oldrepo/swa-app-deploy.yml` - SWA deployment (dev + manual prod)
- `oldrepo/supabase-deploy-dev.yml` - Supabase dev deployment
- `oldrepo/azure-infra-deploy.yml` - Bicep infrastructure deployment

---

**Prepared by**: GitHub Copilot  
**Reviewed by**: TBD  
**Approved by**: TBD  
**Last Updated**: 2026-01-22 (Revised)

