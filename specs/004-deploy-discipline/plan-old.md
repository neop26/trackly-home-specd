# Implementation Plan: Deploy Discipline (CI/CD Automation)

**Branch**: `004-deploy-discipline` | **Date**: 2026-01-22 | **Spec**: [spec.md](./spec.md)  
**Status**: Planning  
**Input**: Feature specification from `/specs/004-deploy-discipline/spec.md`

## Summary

Establish automated quality gates and production deployment workflows to reduce deployment risk and ensure code quality. Currently, the project lacks automated PR checks and production deployment discipline. This feature implements GitHub Actions workflows for PR validation, production deployments with approval gates, and comprehensive deployment documentation.

**Primary Goals**:
1. Create PR check workflow that validates lint, typecheck, and build before merge
2. Configure branch protection rules to enforce quality gates
3. Set up production GitHub environment with manual approval
4. Implement production deployment workflows (Azure SWA + Supabase)
5. Document all secrets and deployment procedures

**Technical Approach**: Create GitHub Actions workflows using YAML configuration, leverage GitHub environments for production approval gates, document secrets naming conventions, and establish deployment best practices aligned with constitution principles.

## Technical Context

**Language/Version**: YAML (GitHub Actions), Node.js 18+, TypeScript 5.x  
**Primary Dependencies**: GitHub Actions (free tier), Azure CLI, Supabase CLI  
**Infrastructure**: Azure Static Web Apps, Supabase hosted projects, GitHub Environments  
**Testing**: Manual workflow testing, PR validation testing  
**Target Platform**: GitHub Actions runners (ubuntu-latest)  
**Project Type**: Infrastructure/DevOps (workflow automation)  
**Performance Goals**: PR checks < 5 minutes, Production deploy < 10 minutes  
**Constraints**: Must use GitHub free tier, workflows must be idempotent, no paid features required  
**Scale/Scope**: 3 workflow files, 1 documentation file, branch protection configuration  
**Existing Code**: No existing workflows (greenfield), existing Azure SWA deployment target

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ✅ | Production secrets isolated in GitHub environment (not repository secrets). Manual approval required for production deploys. No secrets logged in workflow output. All workflows use GitHub's built-in secret masking. |
| II. Vertical Slices | ✅ | 5 user stories independently deliverable: (1) PR checks standalone, (2) Production environment standalone, (3) SWA deployment standalone, (4) Supabase deployment standalone, (5) Documentation standalone. Each delivers value without requiring others. |
| III. Minimal Changes | ✅ | No application code changes (only workflow configuration). Workflows follow GitHub Actions best practices (no over-engineering). Reuse existing Azure SWA setup, no new infrastructure provisioning required. |
| IV. Document As You Go | ✅ | .github/SECRETS.md created documenting all secrets. Workflow YAML files include inline comments. PROJECT_TRACKER.md updated on completion. README.md updated with workflow status badges. |
| V. Test Before Deploy | ✅ | Manual testing plan: Test PR checks with intentional failures, test production approval flow, test E2E deployment, validate secrets configuration. All workflows tested before enabling branch protection. |

**Complexity Tracking**:

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | All changes align with minimal changes principle |

## Project Structure

### Documentation (this feature)

```text
specs/004-deploy-discipline/
├── spec.md              # Feature specification (5 user stories)
├── plan.md              # This file
├── tasks.md             # Task breakdown (generated next)
└── quickstart.md        # Workflow usage guide (TBD)
```

### Workflow Files (to be created)

```text
.github/
├── workflows/
│   ├── pr-check.yml               # PR quality gates (US1)
│   ├── deploy-prod.yml            # Production SWA deployment (US3)
│   └── deploy-supabase-prod.yml   # Production Supabase deployment (US4)
└── SECRETS.md                     # Secrets documentation (US5)
```

### GitHub Configuration (manual setup)

- Branch protection rules for `main` (US1)
- GitHub environment: `production` with approval (US2)
- Secrets configured in production environment (US5)

## Phase 0: Research & Discovery

**Goal**: Understand existing infrastructure and identify requirements

### Research Tasks

1. **Azure Static Web Apps deployment**:
   - Current deployment method: Manual or existing workflow?
   - Azure SWA deployment token location
   - Production vs dev SWA resources

2. **Supabase deployment**:
   - Supabase CLI version and authentication method
   - Migration strategy (db push vs link + migrate)
   - Edge Functions deployment process

3. **GitHub Actions best practices**:
   - Workflow concurrency control
   - Secret masking and security
   - Caching strategies for Node.js dependencies

### Discovery Findings

**Azure SWA**:
- Dev deployment: Unknown (check if workflow exists)
- Production SWA: Must be provisioned before deployment
- Deployment method: Azure/static-web-apps-deploy action

**Supabase**:
- Current setup: Local development with `supabase start`
- Production project: Must be created and linked
- Migrations: 8 migrations exist in `supabase/migrations/`
- Edge Functions: 4 functions in `supabase/functions/`

**GitHub Actions**:
- Free tier: 2,000 minutes/month (sufficient)
- Environment protection: Available on free tier
- Branch protection: Available on free tier

## Phase 1: PR Quality Gates (User Story 1)

**Goal**: Automated checks on every PR targeting main/dev

### Implementation Steps

1. **Create PR check workflow** (`.github/workflows/pr-check.yml`):
   ```yaml
   name: PR Quality Checks
   on:
     pull_request:
       branches: [main, dev]
   jobs:
     lint:
       runs-on: ubuntu-latest
       steps:
         - Checkout code
         - Setup Node.js 18
         - Install dependencies (with cache)
         - Run npm run lint in apps/web
     
     build:
       runs-on: ubuntu-latest
       steps:
         - Checkout code
         - Setup Node.js 18
         - Install dependencies (with cache)
         - Run npm run build in apps/web
   ```

2. **Configure branch protection** (GitHub UI):
   - Navigate to Settings → Branches → Branch protection rules
   - Add rule for `main` branch
   - Enable: "Require status checks to pass before merging"
   - Required checks: `lint`, `build`
   - Enable: "Require branches to be up to date before merging"

3. **Test PR check workflow**:
   - Create test branch with intentional lint error
   - Open PR, verify workflow runs and fails
   - Fix error, verify workflow passes
   - Attempt merge with failing checks (should be blocked)

**Acceptance Criteria**:
- ✅ Workflow runs on all PRs to main/dev
- ✅ Lint and build jobs run in parallel
- ✅ Workflow completes in < 5 minutes
- ✅ Branch protection blocks merge if checks fail
- ✅ Status visible in PR UI

## Phase 2: Production Environment Setup (User Story 2)

**Goal**: GitHub environment with approval gates

### Implementation Steps

1. **Create production environment** (GitHub UI):
   - Navigate to Settings → Environments
   - Click "New environment"
   - Name: `production`
   - Configure protection rules:
     - Required reviewers: Repository admins
     - Wait timer: 0 minutes
   - Deployment branches: `main` only

2. **Configure production secrets** (GitHub UI):
   - In production environment, add secrets:
     - `AZURE_STATIC_WEB_APPS_API_TOKEN_PROD`
     - `SUPABASE_ACCESS_TOKEN`
     - `SUPABASE_PROJECT_ID`
     - `SUPABASE_DB_PASSWORD` (if needed)

3. **Test environment approval**:
   - Create test workflow using production environment
   - Trigger workflow, verify approval request appears
   - Approve as admin, verify deployment proceeds

**Acceptance Criteria**:
- ✅ Production environment created
- ✅ Manual approval required before deployment
- ✅ Only admins can approve
- ✅ Deployment history tracked
- ✅ Secrets isolated from dev

## Phase 3: Production Deployment Workflow (User Story 3)

**Goal**: Manual Azure SWA deployment to production

### Implementation Steps

1. **Create production deploy workflow** (`.github/workflows/deploy-prod.yml`):
   ```yaml
   name: Deploy to Production
   on:
     workflow_dispatch:
       inputs:
         branch:
           description: 'Branch to deploy'
           required: true
           default: 'main'
         comment:
           description: 'Deployment comment'
           required: false
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: production
       steps:
         - Checkout specified branch
         - Setup Node.js 18
         - Install dependencies
         - Build frontend (npm run build in apps/web)
         - Deploy to Azure SWA (production token)
         - Post deployment summary (branch, SHA, deployer)
   ```

2. **Add deployment summary**:
   - Use GitHub Actions summary API
   - Show: branch deployed, commit SHA, timestamp, deployer
   - Link to production URL

3. **Test production deployment**:
   - Trigger workflow from Actions UI
   - Approve deployment
   - Verify site deployed to production Azure SWA
   - Check deployment summary

**Acceptance Criteria**:
- ✅ Workflow triggered manually only
- ✅ Deploys to production Azure SWA
- ✅ Requires approval before deployment
- ✅ Deployment summary visible
- ✅ Fails gracefully with clear errors

## Phase 4: Supabase Production Deployment (User Story 4)

**Goal**: Automated Supabase migrations and Edge Functions deployment

### Implementation Steps

1. **Create Supabase deploy workflow** (`.github/workflows/deploy-supabase-prod.yml`):
   ```yaml
   name: Deploy Supabase to Production
   on:
     workflow_dispatch:
   
   jobs:
     deploy:
       runs-on: ubuntu-latest
       environment: production
       steps:
         - Checkout code
         - Setup Supabase CLI
         - Link to production project (using secrets)
         - Apply migrations (supabase db push)
         - Deploy Edge Functions (supabase functions deploy)
         - Validate deployment (run health check query)
   ```

2. **Add migration validation**:
   - After db push, query migration history
   - Verify latest migration applied
   - Fail workflow if validation fails

3. **Document rollback procedure**:
   - Add to quickstart.md
   - Manual rollback: Connect to production, run previous migration
   - Automated rollback: Future enhancement

4. **Test Supabase deployment**:
   - Create test migration
   - Deploy to dev first
   - Deploy to production (with approval)
   - Verify migration applied in production DB

**Acceptance Criteria**:
- ✅ Workflow applies migrations to production
- ✅ Workflow deploys Edge Functions
- ✅ Validation step confirms success
- ✅ Rollback procedure documented
- ✅ Migration history tracked

## Phase 5: Secrets Documentation (User Story 5)

**Goal**: Complete secrets reference documentation

### Implementation Steps

1. **Create secrets documentation** (`.github/SECRETS.md`):
   - Header: Purpose and scope
   - Table: Secret name, environment, purpose, example
   - Sections:
     - Development secrets (SB_* prefix)
     - Production secrets (SUPABASE_* prefix)
     - Azure secrets (AZURE_*)
   - Rotation procedures
   - Example workflow usage

2. **Document secret locations**:
   - Dev secrets: GitHub repository secrets (or local .env)
   - Production secrets: GitHub production environment
   - Where to find values: Azure portal, Supabase dashboard

3. **Add example workflow**:
   - Show how to reference secrets in YAML
   - Demonstrate secret masking
   - Best practices: Never log secrets, use environment variables

**Acceptance Criteria**:
- ✅ All required secrets documented
- ✅ Naming conventions explained
- ✅ Storage locations documented
- ✅ Example workflow included
- ✅ Rotation procedures documented

## Testing Plan

### Manual Test Checklist

**PR Check Workflow (US1)**:
- [ ] Create branch with lint error, open PR → workflow fails
- [ ] Fix lint error → workflow passes
- [ ] Create branch with build error → workflow fails
- [ ] Fix build error → workflow passes
- [ ] Attempt merge with failing checks → blocked
- [ ] Workflow completes in < 5 minutes

**Production Environment (US2)**:
- [ ] Trigger production workflow → approval request appears
- [ ] Non-admin attempts approval → denied
- [ ] Admin approves → deployment proceeds
- [ ] Deployment history shows approver and timestamp
- [ ] Production secrets accessible in workflow

**Production Deployment (US3)**:
- [ ] Trigger deploy-prod workflow
- [ ] Approve deployment
- [ ] Verify Azure SWA updated
- [ ] Visit production URL → site loads correctly
- [ ] Deployment summary shows correct info
- [ ] Trigger workflow with invalid branch → fails gracefully

**Supabase Deployment (US4)**:
- [ ] Add test migration
- [ ] Trigger Supabase deploy workflow
- [ ] Approve deployment
- [ ] Verify migration applied in production DB
- [ ] Verify Edge Functions deployed
- [ ] Health check query succeeds

**Secrets Documentation (US5)**:
- [ ] All secrets documented in .github/SECRETS.md
- [ ] Naming conventions clear
- [ ] Example workflow demonstrates usage
- [ ] Rotation procedures documented
- [ ] No actual secret values in documentation

**End-to-End Test**:
- [ ] Make code change requiring SWA + Supabase update
- [ ] Deploy Supabase first (migrations + functions)
- [ ] Deploy SWA second (frontend)
- [ ] Verify full feature works in production
- [ ] Check deployment history for both workflows

## RLS Verification

**No RLS changes** - This feature only affects CI/CD workflows, no database schema changes.

**Security Validation**:
- All production secrets stored in GitHub environment (encrypted)
- Workflows use GitHub's automatic secret masking
- No secrets written to logs or output
- Manual approval required for production deployments
- Branch protection prevents bypassing PR checks

## Deployment Steps

### Prerequisites

1. **Azure Production SWA**:
   - Provision production Azure Static Web App
   - Obtain deployment token
   - Store in GitHub production environment secret

2. **Supabase Production Project**:
   - Create production Supabase project
   - Obtain project ID and API keys
   - Store in GitHub production environment secrets

3. **GitHub Permissions**:
   - Ensure admin access to repository
   - Verify ability to create environments
   - Verify ability to configure branch protection

### Implementation Order

**Day 1: PR Quality Gates**
1. Create `.github/workflows/pr-check.yml`
2. Test workflow on feature branch
3. Configure branch protection rules
4. Validate PR checks block merge

**Day 2: Production Environment**
1. Create production GitHub environment
2. Add approval requirement
3. Configure production secrets
4. Test approval flow

**Day 3: Production Deployment**
1. Create `.github/workflows/deploy-prod.yml`
2. Test deployment to production Azure SWA
3. Validate deployment summary
4. Test approval flow

**Day 4: Supabase Deployment**
1. Create `.github/workflows/deploy-supabase-prod.yml`
2. Test migration deployment
3. Test Edge Functions deployment
4. Validate health checks

**Day 5: Documentation & Testing**
1. Create `.github/SECRETS.md`
2. Document all secrets and procedures
3. Run end-to-end deployment test
4. Update PROJECT_TRACKER.md

## Success Criteria Validation

After implementation, verify against spec.md Success Criteria:

- [ ] **SC-001**: 100% of PRs run pr-check workflow automatically
- [ ] **SC-002**: Zero broken builds on main after enabling branch protection
- [ ] **SC-003**: 100% of production deploys require manual approval
- [ ] **SC-004**: PR check workflow completes in < 5 minutes
- [ ] **SC-005**: All secrets documented in .github/SECRETS.md
- [ ] **SC-006**: End-to-end deployment (SWA + Supabase) works successfully

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Workflow breaks future PRs | Test thoroughly before enabling branch protection; can disable rules if needed |
| Production secrets leaked | Use GitHub environment secrets (encrypted), never log secrets, use secret masking |
| Accidental production deploy | Require manual approval, limit to main branch only |
| Migration breaks production | Test all migrations locally first, document rollback, maintain migration history |
| GitHub Actions quota exceeded | Monitor usage, workflows optimized for speed, cache dependencies |

## Related Documents

- [spec.md](./spec.md) - Feature specification (5 user stories)
- [PROJECT_TRACKER.md](../../docs/PROJECT_TRACKER.md) - Phase 4 task tracking
- [Constitution](../../.specify/memory/constitution.md) - Deployment process governance
- [SDLC_PROCESS.md](../../docs/SDLC_PROCESS.md) - Deployment workflow documentation

---

**Prepared by**: GitHub Copilot  
**Reviewed by**: TBD  
**Approved for Implementation**: TBD  
**Last Updated**: 2026-01-22
