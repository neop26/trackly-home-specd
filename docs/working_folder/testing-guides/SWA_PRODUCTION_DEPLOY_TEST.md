# SWA Production Deploy Testing (Tasks T045-T048)

**Test Date**: 2026-01-24  
**Tester**: [Your Name]  
**Status**: ⏳ Pending

---

## Test T045: Regression Test - Dev Auto-Deploy Still Works

### Purpose
Verify that existing dev auto-deploy functionality was NOT broken by adding prod deploy

### Setup
1. Switch to dev branch:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Make trivial change to trigger deploy:
   ```bash
   echo "\n<!-- Test change $(date) -->" >> apps/web/README.md
   git add apps/web/README.md
   git commit -m "test: verify dev auto-deploy works"
   git push origin dev
   ```

### Expected Results
- ✅ `swa-app-deploy.yml` workflow triggers automatically
- ✅ Environment selected: `dev` (not prod)
- ✅ No approval request (dev deploys automatically)
- ✅ Workflow completes successfully
- ✅ Change visible on dev Azure SWA URL

### Validation Checklist
- [ ] Workflow triggered within 30 seconds of push
- [ ] Workflow shows environment badge: `dev`
- [ ] No approval step appeared (auto-deploy)
- [ ] Build step passed
- [ ] Deploy step passed
- [ ] Deployment summary shows correct environment
- [ ] Dev SWA URL loads successfully
- [ ] Can verify timestamp in README (if accessible)

### Get Dev SWA URL
```bash
# If you have Azure CLI configured:
az staticwebapp show \
  --name <swa-dev-name> \
  --resource-group rg-tr-hme-dev \
  --query defaultHostname -o tsv
```

**Dev SWA URL**: https://________________

### Screenshots
- [ ] Screenshot of workflow run in Actions tab
- [ ] Screenshot showing "dev" environment
- [ ] Screenshot of deployment summary

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T046: Feature Test - Main Branch Triggers Prod Deploy with Approval

### Purpose
Verify that merging to main triggers production deployment workflow requiring approval

### Setup
1. Create test branch with frontend change:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/prod-deploy-approval
   ```

2. Make small visible change:
   ```bash
   # Edit apps/web/src/App.tsx - add comment or minor UI change
   # Example: Add "<!-- Test prod deploy -->" in HTML or add console.log
   ```

3. Commit and push:
   ```bash
   git add apps/web/src/App.tsx
   git commit -m "test: verify prod deploy approval workflow"
   git push origin test/prod-deploy-approval
   ```

4. Create PR targeting `main`:
   - Ensure PR checks pass first (from Test T021-T023)
   - Merge PR

### Expected Results BEFORE Approval
- ✅ `swa-app-deploy.yml` workflow triggers automatically on merge
- ✅ Environment selected: `prod`
- ✅ Workflow shows "Waiting for approval"
- ✅ Email/notification sent to required approvers
- ✅ Workflow paused at deployment step

### Expected Results AFTER Approval
- ✅ Deployment proceeds after approval
- ✅ Build completes successfully
- ✅ Deploy to prod Azure SWA succeeds
- ✅ Change visible on prod SWA URL

### Validation Checklist (Before Approval)
- [ ] Workflow triggered automatically on merge to main
- [ ] Workflow shows environment badge: `prod`
- [ ] "Waiting for approval" status visible
- [ ] Approval request appears (check email or GitHub notifications)
- [ ] Workflow is paused, not running deployment yet

### Validation Checklist (Approval Step)
- [ ] Navigate to Actions → workflow run
- [ ] "Review pending deployments" button visible
- [ ] Click button → approval modal appears
- [ ] Modal shows environment: `prod`
- [ ] Can approve or reject
- [ ] Click "Approve and deploy"

### Validation Checklist (After Approval)
- [ ] Workflow resumes execution
- [ ] Build step completes
- [ ] Deploy step completes
- [ ] Deployment summary generated
- [ ] Prod SWA URL loads successfully
- [ ] Test change visible in production

### Get Prod SWA URL
```bash
# If you have Azure CLI configured:
az staticwebapp show \
  --name <swa-prod-name> \
  --resource-group rg-tr-hme-prod \
  --query defaultHostname -o tsv
```

**Prod SWA URL**: https://________________

### Screenshots
- [ ] Screenshot of "Waiting for approval" status
- [ ] Screenshot of approval modal
- [ ] Screenshot of workflow after approval (completed)
- [ ] Screenshot of prod SWA URL with change

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T047: Verify Change Live on Production

### Purpose
Confirm the deployed change is actually visible in production

### Steps
1. Open prod SWA URL in browser: https://________________

2. Verify change is visible:
   - If you added a console.log: Open DevTools → Console
   - If you modified UI: Visually verify change
   - If you edited README: View source or check deployed files

3. Verify deployment timestamp:
   - Check deployment summary from workflow
   - Compare with current time

### Validation Checklist
- [ ] Prod URL loads without errors
- [ ] Test change is visible
- [ ] No console errors in browser DevTools
- [ ] Latest deployment timestamp matches workflow run time
- [ ] Application functions correctly (can navigate, no broken features)

### Screenshots
- [ ] Screenshot of prod application showing change
- [ ] Screenshot of DevTools console (if applicable)

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T048: Regression Test - Manual Workflow Dispatch Still Works

### Purpose
Verify that manual workflow dispatch (emergency deploy) still functions

### Setup
1. Navigate to GitHub Actions → "Deploy Web App (Azure SWA)"

2. Click "Run workflow" button

3. Configure workflow:
   - Branch: `main`
   - Target: `prod`

4. Click "Run workflow"

### Expected Results
- ✅ Workflow starts immediately
- ✅ Approval request appears
- ✅ After approval, deployment proceeds
- ✅ Manual deploy completes successfully

### Validation Checklist
- [ ] "Run workflow" button visible and clickable
- [ ] Can select `prod` from target dropdown
- [ ] Workflow starts after clicking "Run workflow"
- [ ] Triggered by: `workflow_dispatch` (visible in workflow logs)
- [ ] Approval request appears
- [ ] After approval, deployment succeeds
- [ ] Same behavior as push-triggered deployment

### Screenshots
- [ ] Screenshot of "Run workflow" modal
- [ ] Screenshot of workflow run (triggered via workflow_dispatch)
- [ ] Screenshot of successful manual deployment

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Cleanup

After completing all tests:

```bash
# Switch back to feature branch
git checkout 004-deploy-discipline

# The test branch was merged to main, so no cleanup needed
# (unless you want to revert the test commit from main)
```

---

## Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| T045: Dev Regression Test | [ ] PASS / [ ] FAIL | |
| T046: Prod Deploy Approval | [ ] PASS / [ ] FAIL | |
| T047: Change Live in Prod | [ ] PASS / [ ] FAIL | |
| T048: Manual Dispatch | [ ] PASS / [ ] FAIL | |

**Overall Phase 3 Testing**: [ ] PASS / [ ] FAIL

**Critical Issues Found**: ________________  
**Sign-off**: ________________  
**Date**: ________________
