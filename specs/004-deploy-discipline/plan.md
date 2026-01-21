# Implementation Plan: Deploy Discipline (Revised)

**Feature ID**: 004  
**Feature Name**: Deploy Discipline (CI/CD Automation)  
**Created**: 2026-01-22  
**Revised**: 2026-01-22 (incorporating existing workflows)  
**Target Completion**: 2026-01-31 (Phase 4)

---

## Overview

This plan outlines implementation of complete CI/CD automation, building on existing workflows from the old repo. We have **3 workflows to create**, **1 workflow to update**, and **1 documentation file to create**.

**Existing Infrastructure** (from old repo):
- ✅ `.github/workflows/swa-app-deploy.yml` - SWA deployment (dev auto + manual prod)
- ✅ `.github/workflows/supabase-deploy-dev.yml` - Supabase dev deployment
- ✅ `.github/workflows/azure-infra-deploy.yml` - Bicep infrastructure
- ✅ GitHub environments: dev, prod, copilot (already configured)
- ✅ Azure SWAs: dev and prod (already deployed)
- ✅ Supabase projects: dev and prod (already created)

**Work Required**:
- ✨ **CREATE**: PR check workflow (lint, typecheck, build)
- ✨ **CREATE**: Supabase production workflow (copy from dev)
- ✨ **CREATE**: Secrets documentation (.github/SECRETS.md)
- 🔧 **UPDATE**: SWA workflow (add auto-trigger for main)
- ✅ **VALIDATE**: Verify prod environment has approval gates

---

## Implementation Phases

### Phase 1: PR Quality Gates (Priority: P0, Est: 1 day)

**Objective**: Create automated PR checks to prevent broken code from merging

**Tasks**:

1. **Create PR Check Workflow** (2 hours)
   - File: `.github/workflows/pr-check.yml`
   - Reference: Use existing workflow patterns from swa-app-deploy.yml
   - Jobs:
     - Lint job: `npm run lint` in apps/web
     - Build job: `npm run build` in apps/web (includes typecheck)
   - Concurrency:
     - Group: `pr-check-${{ github.ref }}`
     - Cancel-in-progress: true
   - Triggers: `pull_request` targeting `main`
   - Summary: Generate comprehensive GitHub Actions summary (like supabase-deploy-dev.yml)

2. **Configure Branch Protection** (1 hour)
   - Branch: `main`
   - Required status checks: pr-check (lint, build jobs)
   - Require branches to be up to date: YES
   - Allow force push: NO
   - Require PR reviews: 0 (single developer)

3. **Test PR Check Workflow** (1 hour)
   - Create test PR with intentional lint error
   - Verify workflow runs and fails
   - Fix error, verify workflow re-runs and passes
   - Verify merge blocked when checks fail
   - Verify merge enabled when checks pass

**Deliverables**:
- ✅ `.github/workflows/pr-check.yml` created
- ✅ Branch protection rule configured on `main`
- ✅ PR checks working (tested with real PR)

**Dependencies**: None (independent task)

---

### Phase 2: Validate Production Environment (Priority: P0, Est: 0.5 days)

**Objective**: Verify existing GitHub environment "prod" is properly configured

**Tasks**:

1. **Verify Environment Configuration** (1 hour)
   - Navigate to GitHub Settings → Environments → prod
   - Verify required reviewers configured
   - Verify deployment branches: `main` only
   - Verify wait timer: 0 minutes (manual approval)
   - Document current protection rules

2. **Audit Production Secrets** (2 hours)
   - Reference old repo workflows for required secrets
   - Check GitHub Environment secrets for "prod":
     - **Azure SWA**: AZURE_SWA_DEPLOYMENT_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
     - **Supabase**: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
     - **Edge Functions**: SB_SUPABASE_URL, SB_SUPABASE_ANON_KEY, SB_SUPABASE_SERVICE_ROLE_KEY, SB_DATABASE_URL, SB_DIRECT_URL, SB_JWT_SECRET, SB_SITE_URL, SB_CORS_ORIGINS, SB_SMTP_*
   - List missing secrets
   - Add missing secrets (if any) using Azure Portal + Supabase Dashboard

3. **Verify OIDC Configuration** (1 hour)
   - Check Azure OIDC federated credentials
   - Verify AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID
   - Reference azure-infra-deploy.yml for correct configuration
   - Test OIDC login works (dry-run of azure-infra-deploy.yml)

**Deliverables**:
- ✅ Production environment validated
- ✅ All 15+ secrets configured and documented
- ✅ OIDC authentication verified

**Dependencies**: None (independent task)

---

### Phase 3: SWA Production Auto-Deploy (Priority: P1, Est: 1 day)

**Objective**: Update existing SWA workflow to auto-deploy on push to main

**Tasks**:

1. **Analyze Existing Workflow** (1 hour)
   - Read `.github/workflows/swa-app-deploy.yml`
   - Document current triggers:
     - Push to dev (apps/web/**) → dev environment
     - Workflow_dispatch → user-selected environment (dev/prod)
   - Document current environment logic:
     ```yaml
     environment: ${{ github.event_name == 'workflow_dispatch' && inputs.target || 'dev' }}
     ```
   - Identify required changes

2. **Update Workflow File** (2 hours)
   - Add trigger: `push` to main (apps/web/**)
   - Update environment logic to handle 3 cases:
     ```yaml
     environment: ${{ 
       github.event_name == 'workflow_dispatch' && inputs.target ||
       github.ref == 'refs/heads/main' && 'prod' ||
       'dev'
     }}
     ```
   - Preserve existing concurrency: `swa-web-${{ github.ref_name }}`
   - Preserve existing build-time env vars: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
   - Test YAML syntax: `yamllint .github/workflows/swa-app-deploy.yml`

3. **Test Workflow** (2 hours)
   - **Test 1: Dev auto-deploy** (regression test)
     - Make trivial change to apps/web/README.md
     - Push to dev branch
     - Verify workflow triggers automatically
     - Verify deploys to dev environment
   - **Test 2: Main auto-deploy** (new functionality)
     - Merge PR to main with frontend change
     - Verify workflow triggers automatically
     - Verify approval request appears (prod environment)
     - Approve deployment
     - Verify deploys to prod
     - Visit production SWA URL, verify change live
   - **Test 3: Manual workflow_dispatch** (regression test)
     - Trigger workflow manually from Actions UI
     - Select "prod" as target
     - Verify deploys to prod

**Deliverables**:
- ✅ `.github/workflows/swa-app-deploy.yml` updated
- ✅ Dev auto-deploy still works (no regression)
- ✅ Main auto-deploy works (new feature)
- ✅ Manual workflow_dispatch still works

**Dependencies**: Phase 2 complete (prod environment validated)

---

### Phase 4: Supabase Production Deployment (Priority: P1, Est: 1 day)

**Objective**: Create production Supabase deployment workflow from dev template

**Tasks**:

1. **Copy Dev Workflow as Template** (1 hour)
   - Read `.github/workflows/supabase-deploy-dev.yml` (149 lines)
   - Copy to `.github/workflows/supabase-deploy-prod.yml`
   - Document workflow structure:
     - Link to Supabase project
     - Push migrations (non-interactive: `yes | supabase db push`)
     - Set Edge Function secrets (9 total)
     - Deploy functions
     - Generate comprehensive summary

2. **Modify for Production** (2 hours)
   - Change trigger:
     - From: `push` to dev (supabase/**)
     - To: `push` to main (supabase/**)
   - Change environment:
     - From: `dev`
     - To: `prod`
   - Change concurrency group:
     - From: `supabase-dev`
     - To: `supabase-prod`
   - Update secret references:
     - Use prod environment secrets (SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD)
     - Use prod SB_* secrets (9 total)
   - Preserve comprehensive summary format from dev workflow
   - Test YAML syntax

3. **Test Workflow** (2 hours)
   - **Test 1: Dev workflow regression**
     - Make trivial migration change
     - Push to dev branch
     - Verify dev workflow still triggers and works
   - **Test 2: Prod workflow new functionality**
     - Create new migration file (e.g., add test table)
     - Commit to main (or use workflow_dispatch)
     - Verify workflow triggers
     - Verify approval request appears
     - Approve deployment
     - Verify migrations applied (check Supabase Dashboard)
     - Query production DB to confirm changes
   - **Test 3: Edge Functions deployment**
     - Make trivial change to Edge Function
     - Deploy to prod
     - Verify function updated
     - Test function endpoint

**Deliverables**:
- ✅ `.github/workflows/supabase-deploy-prod.yml` created
- ✅ Dev workflow still works (no regression)
- ✅ Prod workflow works (migrations + functions)
- ✅ All 9 Edge Function secrets configured correctly

**Dependencies**: Phase 2 complete (prod environment validated)

---

### Phase 5: Secrets Documentation (Priority: P0, Est: 0.5 days)

**Objective**: Create comprehensive secrets documentation for all workflows

**Tasks**:

1. **Analyze All Workflows** (1 hour)
   - Read swa-app-deploy.yml: identify secrets used
   - Read supabase-deploy-dev.yml: identify secrets used
   - Read supabase-deploy-prod.yml: identify secrets used
   - Read azure-infra-deploy.yml: identify OIDC configuration
   - Create inventory: 15+ secrets total

2. **Create Secrets Documentation** (2 hours)
   - File: `.github/SECRETS.md`
   - Structure:
     - **Overview**: Purpose of this document
     - **Secrets Inventory**: Table with all secrets
     - **By Workflow**: Group secrets by workflow
     - **How to Obtain**: Instructions for each secret type
     - **Rotation Procedures**: How to rotate secrets
     - **Examples**: Example workflow usage
   - Secrets to document:
     - **Azure SWA** (3 per environment): AZURE_SWA_DEPLOYMENT_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
     - **Supabase** (1 shared + 2 per env): SUPABASE_ACCESS_TOKEN, SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
     - **Edge Functions** (9 per env): SB_SUPABASE_URL, SB_SUPABASE_ANON_KEY, SB_SUPABASE_SERVICE_ROLE_KEY, SB_DATABASE_URL, SB_DIRECT_URL, SB_JWT_SECRET, SB_SITE_URL, SB_CORS_ORIGINS, SB_SMTP_*
     - **Azure OIDC** (3): AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID
   - Include command examples:
     ```bash
     # Retrieve Azure SWA deployment token
     az staticwebapp secrets list \
       --name swa-tr-hme-prod \
       --resource-group rg-tr-hme-prod \
       --query properties.apiKey -o tsv
     ```
   - Link to Azure Portal: `https://portal.azure.com`
   - Link to Supabase Dashboard: `https://supabase.com/dashboard`

3. **Validate Documentation** (1 hour)
   - Follow instructions to retrieve one Azure SWA token
   - Follow instructions to retrieve one Supabase secret
   - Verify all instructions accurate
   - Verify all 15+ secrets documented
   - Proofread for clarity

**Deliverables**:
- ✅ `.github/SECRETS.md` created
- ✅ All 15+ secrets documented
- ✅ Retrieval instructions validated
- ✅ Examples included

**Dependencies**: Phase 2 complete (secrets inventory known)

---

## E2E Testing Plan (1 day)

After all phases complete, perform end-to-end validation:

### Test 1: Full PR-to-Production Flow

**Steps**:
1. Create feature branch: `git checkout -b test/e2e-deploy`
2. Make changes:
   - Frontend: Update apps/web/src/App.tsx (add test text)
   - Backend: Add new migration (supabase/migrations/test.sql)
   - Backend: Update Edge Function (supabase/functions/create-household/index.ts - add comment)
3. Create PR targeting `main`
4. Verify PR check workflow runs (lint, build)
5. Verify PR checks pass
6. Merge PR to `main`
7. Verify 2 workflows trigger:
   - `swa-app-deploy.yml` (SWA production deployment)
   - `supabase-deploy-prod.yml` (Supabase production deployment)
8. Approve both deployments
9. Verify both deployments succeed
10. Visit production SWA URL
11. Verify frontend change visible
12. Test backend functionality (query DB, call Edge Function)
13. Verify backend changes applied

**Expected Result**: Full stack deployed to production successfully

### Test 2: Regression Test (Dev Auto-Deploy)

**Steps**:
1. Create feature branch from dev: `git checkout dev && git checkout -b test/dev-deploy`
2. Make trivial change to apps/web/README.md
3. Push to dev branch
4. Verify `swa-app-deploy.yml` triggers automatically
5. Verify deploys to dev environment (no approval needed)
6. Make trivial migration change
7. Push to dev
8. Verify `supabase-deploy-dev.yml` triggers automatically
9. Verify deploys to dev environment

**Expected Result**: Dev auto-deploy still works (no regression)

### Test 3: Emergency Manual Deploy

**Steps**:
1. Navigate to Actions → SWA App Deploy
2. Click "Run workflow"
3. Select target: "prod"
4. Trigger workflow
5. Verify approval request appears
6. Approve
7. Verify deployment succeeds

**Expected Result**: Manual workflow_dispatch still works for emergency deploys

---

## Constitution Compliance

Validating this plan against project constitution:

### 1. Simplicity Principle
✅ **PASS**: Plan reuses existing workflows rather than creating new patterns. Only 3 new files created, 1 updated.

**Evidence**:
- Copying supabase-deploy-dev.yml as template (DRY)
- Reusing existing concurrency patterns
- Reusing existing secret naming conventions

### 2. Stakeholder Trust
✅ **PASS**: Plan transparently documents what exists vs what's new. Extensive validation and testing.

**Evidence**:
- Clear separation: CREATE vs UPDATE vs VALIDATE
- E2E testing plan includes regression testing
- Comprehensive secrets documentation
- Manual approval gates for production

### 3. Iterative Progress
✅ **PASS**: Plan broken into 5 independent phases. Each phase has clear deliverables.

**Evidence**:
- Phase 1 (PR checks) - 1 day, independent
- Phase 2 (Validate env) - 0.5 days, independent
- Phase 3 (SWA prod) - 1 day, depends on Phase 2
- Phase 4 (Supabase prod) - 1 day, depends on Phase 2
- Phase 5 (Docs) - 0.5 days, depends on Phase 2
- Total: 4 days (fits in 1 week sprint)

### 4. Efficiency Through Consistency
✅ **PASS**: Plan explicitly preserves existing patterns and tests for regressions.

**Evidence**:
- Dev auto-deploy regression tests in Phase 3 and 4
- Reuse existing workflow style (concurrency, summaries)
- Follow existing secret naming (SB_*, VITE_*, SUPABASE_*)

### 5. Measured Ambition
✅ **PASS**: Plan is realistic (4 days work), builds on proven infrastructure, extensive testing.

**Evidence**:
- Total estimate: 4 days (conservative)
- 3 new workflows, 1 update, 1 documentation file
- Multiple regression tests to catch breakage
- E2E testing plan (1 full day)
- Clear rollback strategy (git revert workflow changes)

**Overall**: ✅ **CONSTITUTION COMPLIANT**

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| **Breaking dev auto-deploy** | Regression tests in Phase 3 and 4; rollback plan (git revert) |
| **Missing production secrets** | Phase 2 audits all secrets before implementation |
| **Workflow syntax errors** | Lint YAML files; test in dev environment first |
| **Approval gates misconfigured** | Phase 2 validates environment configuration before use |
| **Migration breaks prod DB** | Test migrations locally; document rollback procedures |
| **Secret rotation causes failures** | Document all secrets in Phase 5 with rotation instructions |

---

## Timeline

**Total Duration**: 4 days (1 work week)  
**Target Completion**: 2026-01-31 (Phase 4 deadline)

**Day-by-Day Breakdown**:

- **Day 1** (2026-01-23):
  - Phase 1: PR Quality Gates (1 day)
  - Phase 2: Validate Production Environment (0.5 days)
  
- **Day 2** (2026-01-24):
  - Phase 3: SWA Production Auto-Deploy (1 day)
  
- **Day 3** (2026-01-25):
  - Phase 4: Supabase Production Deployment (1 day)
  
- **Day 4** (2026-01-26):
  - Phase 5: Secrets Documentation (0.5 days)
  - E2E Testing (0.5 days)

- **Buffer** (2026-01-27 to 2026-01-31):
  - 4 days buffer for unexpected issues
  - Documentation updates
  - PROJECT_TRACKER.md updates

---

## Deliverables Summary

### New Files Created (3):
1. ✅ `.github/workflows/pr-check.yml` - PR quality gates
2. ✅ `.github/workflows/supabase-deploy-prod.yml` - Supabase production deployment
3. ✅ `.github/SECRETS.md` - Secrets documentation

### Files Updated (1):
1. ✅ `.github/workflows/swa-app-deploy.yml` - Add auto-trigger for main

### Configuration Changes (1):
1. ✅ Branch protection rule on `main` - Require PR checks

### Validation Tasks (2):
1. ✅ Production environment configuration validated
2. ✅ All 15+ production secrets verified present

---

## Success Criteria

**Phase 4 Complete When**:
- [ ] All 5 phases complete (1-5)
- [ ] E2E testing passed (all 3 tests)
- [ ] No regressions in dev auto-deploy
- [ ] Production deployments require approval
- [ ] All secrets documented
- [ ] PROJECT_TRACKER.md updated
- [ ] Constitution compliance validated ✅ (already done)

---

**Prepared by**: GitHub Copilot  
**Reviewed by**: TBD  
**Approved by**: TBD  
**Last Updated**: 2026-01-22 (Revised)

