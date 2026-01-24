# Test Validation Guide

**Feature**: Deploy Discipline (004-deploy-discipline)  
**Created**: 2026-01-24  
**Purpose**: Step-by-step guides for validating CI/CD workflows

---

## Overview

This directory contains detailed test validation procedures for the Deploy Discipline feature. Each test document provides step-by-step instructions, expected results, validation checklists, and space for recording test outcomes.

## Test Documents

### 1. [PR Quality Gates Testing](PR_QUALITY_GATES_TEST.md) - Phase 1 (Tasks T021-T023)

**What it Tests**: Automated PR checks prevent broken code from merging  
**Duration**: ~1 hour  
**Prerequisites**: None (works on current branch)

**Tests**:
- T021: Verify workflow fails with lint error
- T022: Fix error and verify workflow re-runs
- T023: Verify branch protection blocks/allows merge

**Start Here**: Create a test branch with intentional lint error

---

### 2. [SWA Production Deploy Testing](SWA_PRODUCTION_DEPLOY_TEST.md) - Phase 3 (Tasks T045-T048)

**What it Tests**: Frontend auto-deploys to production Azure SWA when merging to main  
**Duration**: ~3 hours  
**Prerequisites**: 
- Phase 1 tests complete (PR checks working)
- Production Azure SWA deployed
- Prod environment secrets configured

**Tests**:
- T045: Dev auto-deploy regression test (ensure not broken)
- T046: Main branch triggers prod deploy with approval
- T047: Verify deployed change is live in production
- T048: Manual workflow_dispatch still works

**Start Here**: Test dev regression first (low risk)

---

### 3. [Supabase Production Deploy Testing](SUPABASE_PRODUCTION_DEPLOY_TEST.md) - Phase 4 (Tasks T061-T065)

**What it Tests**: Database migrations and Edge Functions deploy to production Supabase when merging to main  
**Duration**: ~3 hours  
**Prerequisites**:
- Phase 1 tests complete (PR checks working)
- Production Supabase project created
- Prod environment secrets configured

**Tests**:
- T061: Dev Supabase auto-deploy regression test
- T062: Create migration and deploy to prod
- T063: Verify migration applied in Supabase Dashboard
- T064: Query prod database to confirm changes
- T065: Verify Edge Functions deployed

**Start Here**: Test dev regression first (low risk)

---

## Recommended Testing Sequence

### Day 1: Low-Risk Validations (3-4 hours)

**Morning**: Phase 1 - PR Quality Gates
1. Execute [PR_QUALITY_GATES_TEST.md](PR_QUALITY_GATES_TEST.md)
2. Complete all checkboxes
3. Sign off on results

**Afternoon**: Regression Tests (ensure existing functionality not broken)
1. Execute T045 from [SWA_PRODUCTION_DEPLOY_TEST.md](SWA_PRODUCTION_DEPLOY_TEST.md)
2. Execute T061 from [SUPABASE_PRODUCTION_DEPLOY_TEST.md](SUPABASE_PRODUCTION_DEPLOY_TEST.md)
3. Verify dev deployments still work

---

### Day 2: Production Deployment Validations (4-5 hours)

**Morning**: Phase 3 - SWA Production Deploy
1. Complete T046-T048 from [SWA_PRODUCTION_DEPLOY_TEST.md](SWA_PRODUCTION_DEPLOY_TEST.md)
2. Verify frontend deploys to production with approval
3. Test manual workflow dispatch

**Afternoon**: Phase 4 - Supabase Production Deploy
1. Complete T062-T065 from [SUPABASE_PRODUCTION_DEPLOY_TEST.md](SUPABASE_PRODUCTION_DEPLOY_TEST.md)
2. Verify backend deploys to production with approval
3. Query database to confirm migration applied

---

### Day 3: End-to-End Validation (2-3 hours)

**Phase 6 E2E Testing** (after individual workflows validated):
1. Make changes affecting both frontend and backend
2. Create PR, verify PR checks pass
3. Merge to main
4. Approve both SWA and Supabase deployments
5. Verify full stack works in production

---

## Test Execution Tips

### Before Starting
- [ ] Ensure you have repository admin access (for approvals)
- [ ] Have Azure CLI configured (`az login`)
- [ ] Have GitHub CLI configured (`gh auth login`)
- [ ] Know your Azure SWA resource names (dev and prod)
- [ ] Know your Supabase project refs (dev and prod)
- [ ] Review [../../.github/SECRETS.md](../../.github/SECRETS.md) for context

### During Testing
- **Take screenshots**: Capture evidence of success/failure
- **Record notes**: Write down unexpected behavior
- **Don't skip steps**: Even if you think you know what will happen
- **Check both UI and logs**: GitHub Actions UI + workflow logs
- **Verify approvals work**: Don't bypass the approval process

### After Each Test
- [ ] Complete all checkboxes in test document
- [ ] Mark test as PASS or FAIL
- [ ] Sign and date the test document
- [ ] Commit test results to repo (optional but recommended)

### If a Test Fails
1. **Do not proceed**: Fix the issue before continuing
2. **Document the failure**: Screenshot, error message, what you expected
3. **Debug**: Check workflow logs, GitHub secrets, Azure/Supabase dashboards
4. **Get help**: Reference [../SECRETS.md](../SECRETS.md) for troubleshooting
5. **Retest after fix**: Repeat the failed test to confirm resolution

---

## Common Issues and Quick Fixes

### "Secret not found" Error

**Symptom**: Workflow fails with "Secret X not found"

**Quick Fix**:
```bash
# Check what secrets are configured
gh secret list --env prod

# Compare with required secrets in SECRETS.md
# Add missing secret:
gh secret set SECRET_NAME --env prod --body "value"
```

---

### Workflow Doesn't Trigger

**Symptom**: Pushed to branch but workflow didn't start

**Quick Checks**:
1. Does workflow trigger on this branch? (Check `on:` section in YAML)
2. Did you modify the right file path? (Check `paths:` filters)
3. Wait 30-60 seconds (GitHub Actions can have slight delay)

**Debug**:
```bash
# Check repository actions are enabled
gh repo view --json hasIssuesEnabled,hasWikiEnabled,hasProjectsEnabled

# View recent workflow runs
gh run list --limit 10
```

---

### Approval Request Doesn't Appear

**Symptom**: Workflow waiting for approval but you didn't get notification

**Where to Find Approval**:
1. GitHub repo → Actions tab
2. Click the workflow run name (shows "Waiting")
3. Look for yellow "Review pending deployments" button
4. Click → Select environment → Approve

**Check Email**: GitHub sends approval request to required reviewers

---

### Deployment Succeeds but Change Not Visible

**Symptom**: Workflow shows success but production doesn't reflect changes

**SWA Troubleshooting**:
- Hard refresh browser (Ctrl+Shift+R / Cmd+Shift+R)
- Check Azure SWA URL exactly (not localhost)
- View page source to see HTML actually changed
- Check browser DevTools console for errors

**Supabase Troubleshooting**:
- Verify in Supabase Dashboard → Database → Migrations
- Run SQL query directly in SQL Editor
- Check migration timestamp matches deployment time
- Look at Edge Functions logs for errors

---

## Success Criteria

All tests are considered successful when:

- [ ] All checkboxes in all test documents completed
- [ ] All tests marked "PASS" (no "FAIL" results)
- [ ] No critical issues or blockers found
- [ ] Dev environments still working (regression tests passed)
- [ ] Prod deployments require approval and work correctly
- [ ] Test branches cleaned up (deleted)

---

## Next Steps After Testing

Once all tests pass:

1. **Update tasks.md**: Mark testing tasks T021-T065 as complete (`[X]`)
2. **Execute Phase 6**: End-to-end testing (T082-T097)
3. **Complete Phase 7**: Documentation and polish (T098-T105)
4. **Update PROJECT_TRACKER.md**: Mark Phase 4 as 100% complete
5. **Merge feature branch**: `004-deploy-discipline` → `main`

---

## Questions or Issues?

- **Secrets Configuration**: See [../../.github/SECRETS.md](../../.github/SECRETS.md)
- **Workflow Details**: See [../.github/workflows/](../.github/workflows/)
- **Specification**: See [../../specs/004-deploy-discipline/spec.md](../../specs/004-deploy-discipline/spec.md)
- **Task Breakdown**: See [../../specs/004-deploy-discipline/tasks.md](../../specs/004-deploy-discipline/tasks.md)

---

**Happy Testing!** 🚀
