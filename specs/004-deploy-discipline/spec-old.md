# Feature Specification: Deploy Discipline

**Feature ID**: 004  
**Feature Name**: Deploy Discipline (CI/CD Automation)  
**Phase**: Phase 4  
**Priority**: P0 (Critical infrastructure for production readiness)  
**Created**: 2026-01-22  
**Status**: Specification  
**Branch**: TBD (004-deploy-discipline)

## Overview

### Problem Statement

Currently, the project has a manual deployment workflow and minimal quality gates. Code can be merged without automated verification, increasing the risk of broken deployments. There's no distinction between development and production environments, and the deployment process lacks proper approval gates for production releases.

**Current State**:
- No automated PR checks (linting, type checking, builds can fail after merge)
- Manual deployment process (no workflow automation)
- No production environment configured (only dev environment exists)
- Unclear secrets naming conventions (SB_* vs SUPABASE_*)
- No automated Supabase migrations for production
- Risk of deploying broken code to production

**Desired State**:
- Automated PR checks block merge if quality gates fail
- Production deployment workflow with approval gates
- Clear environment separation (dev vs prod)
- Documented secrets management
- Automated Supabase deployment workflow
- Confidence in production deployments

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

### Scope

**In Scope**:
- GitHub Actions workflow for PR quality checks (lint, typecheck, build)
- Production deployment workflow with manual approval
- GitHub environment configuration (dev + production)
- Secrets naming documentation
- Supabase production deployment workflow
- End-to-end deploy testing

**Out of Scope**:
- Automated testing framework (deferred to later phase)
- Performance testing / benchmarking
- Blue-green deployments or canary releases
- Monitoring / observability setup (separate feature)
- Database backup automation (future enhancement)

**Constraints**:
- Must work with existing Azure Static Web Apps setup
- Must work with Supabase hosted projects
- Must not require paid GitHub features (use free tier)
- Deployment workflows must be idempotent (safe to re-run)

## User Stories

### User Story 1: PR Quality Gates (P0)

**As a** developer  
**I want** automated checks to run on every pull request  
**So that** broken code is caught before merging to main

**Acceptance Criteria**:
- [X] AC1.1: PR workflow runs on all PRs targeting `main` or `dev`
- [X] AC1.2: Workflow checks: `npm run lint`, `npm run build` (frontend)
- [X] AC1.3: PR status shows green ✅ if all checks pass, red ❌ if any fail
- [X] AC1.4: Branch protection rule blocks merge if checks fail
- [X] AC1.5: Workflow completes in < 5 minutes (fast feedback)

**Priority**: P0 - Critical for code quality

---

### User Story 2: Production Environment Setup (P0)

**As a** developer  
**I want** a separate production GitHub environment with approval gates  
**So that** production deployments are controlled and auditable

**Acceptance Criteria**:
- [X] AC2.1: GitHub environment named "production" created
- [X] AC2.2: Environment requires manual approval before deployment
- [X] AC2.3: Only repository admins can approve production deployments
- [X] AC2.4: Deployment history shows who approved and when
- [X] AC2.5: Production secrets isolated from dev secrets

**Priority**: P0 - Required for safe production deployments

---

### User Story 3: Production Deployment Workflow (P1)

**As a** developer  
**I want** a manual workflow to deploy to production  
**So that** I can control when production releases happen

**Acceptance Criteria**:
- [X] AC3.1: Workflow triggered manually via GitHub Actions UI
- [X] AC3.2: Workflow deploys Static Web App to production environment
- [X] AC3.3: Workflow waits for approval before deploying
- [X] AC3.4: Deployment summary shows: branch, commit SHA, deployer
- [X] AC3.5: Workflow fails gracefully with clear error messages

**Priority**: P1 - Important for production releases

---

### User Story 4: Supabase Production Deployment (P1)

**As a** developer  
**I want** automated Supabase migration workflow for production  
**So that** database changes are deployed consistently

**Acceptance Criteria**:
- [X] AC4.1: Workflow applies Supabase migrations to production project
- [X] AC4.2: Workflow deploys Edge Functions to production
- [X] AC4.3: Workflow validates migration success before continuing
- [X] AC4.4: Rollback instructions documented if deployment fails
- [X] AC4.5: Migration history tracked in Supabase project

**Priority**: P1 - Required for database parity with frontend

---

### User Story 5: Secrets Documentation (P0)

**As a** developer  
**I want** clear documentation on secrets naming conventions  
**So that** I know which secrets to configure for each environment

**Acceptance Criteria**:
- [X] AC5.1: Document secrets for dev environment (SB_* vs SUPABASE_*)
- [X] AC5.2: Document secrets for production environment
- [X] AC5.3: Document where secrets are stored (GitHub environments)
- [X] AC5.4: Include example workflow using secrets
- [X] AC5.5: Document how to rotate secrets

**Priority**: P0 - Critical for proper configuration

---

## Functional Requirements

### FR-001: PR Check Workflow
**Description**: Automated GitHub Actions workflow validates code quality on every PR

**Requirements**:
1. Workflow file: `.github/workflows/pr-check.yml`
2. Triggers: `pull_request` event targeting `main` or `dev` branches
3. Jobs:
   - **Lint**: Run `npm run lint` in `apps/web`
   - **TypeCheck**: Run `npm run build` in `apps/web` (includes tsc)
   - **Build**: Verify production build succeeds
4. Fail fast: If any job fails, workflow fails
5. Status badge: Add to README.md showing workflow status

**Acceptance**: All checks must pass for PR to be mergeable

---

### FR-002: Branch Protection Rules
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

### FR-003: Production GitHub Environment
**Description**: Separate GitHub environment for production deployments

**Requirements**:
1. Environment name: `production`
2. Approval required: YES (manual approval before deployment)
3. Reviewers: Repository admins only
4. Wait timer: 0 minutes (no auto-approval)
5. Deployment branches: `main` only

**Acceptance**: Production deployments require explicit approval

---

### FR-004: Production Deployment Workflow
**Description**: Manual workflow deploys frontend to Azure Static Web Apps

**Requirements**:
1. Workflow file: `.github/workflows/deploy-prod.yml`
2. Trigger: `workflow_dispatch` (manual only)
3. Inputs:
   - Branch to deploy (default: `main`)
   - Deployment comment (optional)
4. Environment: `production`
5. Steps:
   - Checkout code
   - Setup Node.js
   - Install dependencies
   - Build frontend (`npm run build`)
   - Deploy to Azure Static Web App (production)
   - Post deployment summary

**Acceptance**: Workflow deploys successfully to production Azure SWA

---

### FR-005: Supabase Production Workflow
**Description**: Deploy Supabase migrations and Edge Functions to production

**Requirements**:
1. Workflow file: `.github/workflows/deploy-supabase-prod.yml`
2. Trigger: `workflow_dispatch` (manual only)
3. Environment: `production`
4. Prerequisites: Supabase CLI installed in workflow
5. Steps:
   - Link to production Supabase project
   - Run `supabase db push` (apply migrations)
   - Run `supabase functions deploy` (all functions)
   - Validate deployment (health check queries)

**Acceptance**: Migrations and functions deployed to production Supabase

---

### FR-006: Secrets Documentation
**Description**: Markdown file documenting all required secrets

**Requirements**:
1. File: `.github/SECRETS.md`
2. Content:
   - List all required secrets (dev + prod)
   - Explain naming conventions (SUPABASE_* for project URL/key)
   - Document where to find secret values
   - Include rotation procedures
   - Example workflow usage
3. Format: Table with columns: Secret Name, Environment, Purpose, Example Value

**Acceptance**: Complete secrets reference available in repo

---

## Non-Functional Requirements

### NFR-001: Performance
- PR check workflow completes in < 5 minutes (P0)
- Production deployment completes in < 10 minutes (P1)
- Supabase deployment completes in < 5 minutes (P1)

**Rationale**: Fast feedback improves developer productivity

### NFR-002: Reliability
- Workflows fail gracefully with clear error messages (P0)
- Idempotent: Safe to re-run workflows (P1)
- No race conditions in deployment workflows (P1)

**Rationale**: Deployment failures should be debuggable

### NFR-003: Security
- Production secrets isolated in GitHub environment (P0)
- No secrets logged in workflow output (P0)
- Approval required for production deployments (P0)

**Rationale**: Prevent accidental secret exposure and unauthorized deploys

### NFR-004: Maintainability
- Workflow YAML files well-commented (P1)
- DRY: Shared steps extracted to reusable actions (P2)
- Secrets documentation kept up-to-date (P0)

**Rationale**: Future developers can understand and modify workflows

---

## Success Criteria

| ID | Criterion | Measurement | Target |
|----|-----------|-------------|--------|
| SC-001 | PR checks automated | 100% of PRs run pr-check workflow | ✅ All PRs checked |
| SC-002 | Zero broken merges | No broken builds on `main` after PR merge | ✅ 0 failures |
| SC-003 | Production approval | 100% of production deploys require approval | ✅ Manual approval |
| SC-004 | Workflow speed | PR checks complete in < 5 minutes | ✅ < 5min |
| SC-005 | Documentation complete | All secrets documented in .github/SECRETS.md | ✅ Complete |
| SC-006 | E2E deployment | Full deploy (SWA + Supabase) works end-to-end | ✅ Working |

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
**Expected**: Workflow fails with error details  
**Handling**: Developer reviews error, fixes migration, re-runs workflow

### Edge Case 5: Secret Rotation
**Scenario**: Supabase API key rotated, workflows start failing  
**Expected**: Workflows fail with authentication error  
**Handling**: Update GitHub secret with new key, re-run workflow

---

## Dependencies

### External Dependencies
1. **GitHub Actions**: Free tier (sufficient for this workflow)
2. **Azure Static Web Apps**: Existing deployment target
3. **Supabase CLI**: Required for migrations (`supabase` npm package)
4. **GitHub Environment**: Feature available on all GitHub plans

### Internal Dependencies
1. **Existing dev workflow**: `.github/workflows/azure-static-web-apps-dev.yml`
2. **Supabase project**: Production project must exist
3. **Azure production SWA**: Must be created before deployment
4. **Branch protection**: Requires admin access to configure

### Prerequisites
- Azure production Static Web App provisioned
- Supabase production project created
- GitHub repository admin access (for branch protection rules)
- Production secrets configured in GitHub environment

---

## Testing Plan

### Manual Testing Scenarios

**Test 1: PR Check Workflow**
1. Create feature branch with intentional lint error
2. Open PR targeting `main`
3. Verify `pr-check` workflow runs automatically
4. Verify workflow fails with lint error
5. Fix error, push update
6. Verify workflow re-runs and passes

**Test 2: Branch Protection**
1. Attempt to merge PR with failing checks
2. Verify merge button disabled
3. Fix checks
4. Verify merge button enabled

**Test 3: Production Deployment**
1. Navigate to Actions → Deploy Production
2. Trigger workflow manually
3. Verify approval request appears
4. Approve deployment
5. Verify deployment succeeds
6. Visit production URL, verify site loads

**Test 4: Supabase Deployment**
1. Add new migration file
2. Trigger Supabase production workflow
3. Verify migrations applied
4. Query production database to confirm changes

**Test 5: E2E Deployment**
1. Make code change requiring both SWA + Supabase update
2. Deploy Supabase (migrations + functions)
3. Deploy SWA (frontend)
4. Verify full feature works in production

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Workflow breaks due to GitHub Actions changes | Low | Medium | Pin action versions, monitor GitHub changelog |
| Production secrets leaked | Low | Critical | Use GitHub environment secrets, never log |
| Accidental production deploy | Medium | High | Require approval, limit to `main` branch |
| Migration breaks production DB | Medium | High | Test migrations locally first, document rollback |
| Azure SWA quota exceeded | Low | Medium | Monitor usage, upgrade plan if needed |

---

## Related Documents

- [PROJECT_TRACKER.md](../../docs/PROJECT_TRACKER.md) - Phase 4 task list
- [SDLC_PROCESS.md](../../docs/SDLC_PROCESS.md) - Deployment workflow documentation
- [Constitution](../../.specify/memory/constitution.md) - Governance and deployment process
- [Azure README](../../azure/README.md) - Azure infrastructure documentation

---

**Prepared by**: GitHub Copilot  
**Reviewed by**: TBD  
**Approved by**: TBD  
**Last Updated**: 2026-01-22
