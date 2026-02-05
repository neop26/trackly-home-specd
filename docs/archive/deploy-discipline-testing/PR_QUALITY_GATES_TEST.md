# PR Quality Gates Testing (Tasks T021-T023)

**Test Date**: 2026-01-24  
**Tester**: [Your Name]  
**Status**: ⏳ Pending

---

## Test T021: Verify Workflow Fails with Lint Error

### Setup
1. Create test branch:
   ```bash
   git checkout -b test/pr-quality-gates-fail
   ```

2. Introduce intentional lint error in `apps/web/src/App.tsx`:
   ```bash
   # Add unused variable at top of any function
   echo "  const unusedVar = 'test';" >> apps/web/src/App.tsx
   ```

3. Commit and push:
   ```bash
   git add apps/web/src/App.tsx
   git commit -m "test: add intentional lint error"
   git push origin test/pr-quality-gates-fail
   ```

4. Create PR targeting `main`:
   - Go to GitHub repository
   - Click "Pull requests" → "New pull request"
   - Base: `main`, Compare: `test/pr-quality-gates-fail`
   - Title: "TEST: Verify PR checks fail with lint error"
   - Create pull request

### Expected Results
- ✅ PR check workflow triggers automatically within 30 seconds
- ✅ Workflow shows "In progress" status on PR page
- ✅ Lint job fails with error about unused variable
- ✅ Build job may pass or be skipped
- ✅ Overall workflow status shows ❌ red X
- ✅ PR shows "Checks failed" with details link

### Validation Checklist
- [ ] Workflow triggered automatically (didn't need manual trigger)
- [ ] Workflow name is "PR Quality Gates"
- [ ] Lint job failed as expected
- [ ] Error message mentions "unusedVar" or "unused variable"
- [ ] GitHub shows ❌ status on PR conversation tab
- [ ] GitHub shows ❌ status in "Checks" tab

### Screenshots
- [ ] Screenshot of PR with failed checks
- [ ] Screenshot of failed lint job log

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T022: Fix Lint Error and Verify Re-run

### Setup
1. Fix the lint error:
   ```bash
   git checkout test/pr-quality-gates-fail
   # Remove the added line from apps/web/src/App.tsx
   git diff apps/web/src/App.tsx  # verify the lint error line is visible
   # Edit file and remove the unused variable line
   ```

2. Commit fix:
   ```bash
   git add apps/web/src/App.tsx
   git commit -m "fix: remove unused variable"
   git push origin test/pr-quality-gates-fail
   ```

### Expected Results
- ✅ Workflow automatically re-triggers on push
- ✅ Previous run is cancelled (due to cancel-in-progress)
- ✅ New workflow run starts
- ✅ Lint job passes ✅
- ✅ Build job passes ✅
- ✅ Overall workflow status shows ✅ green checkmark
- ✅ PR shows "All checks have passed"

### Validation Checklist
- [ ] New workflow run triggered automatically
- [ ] Old workflow run was cancelled (check Actions tab)
- [ ] Lint job shows green checkmark
- [ ] Build job shows green checkmark
- [ ] Summary job shows "All quality checks passed"
- [ ] GitHub shows ✅ status on PR conversation tab
- [ ] Build summary includes file list from `apps/web/dist/`

### Screenshots
- [ ] Screenshot of PR with passing checks
- [ ] Screenshot of Actions tab showing cancelled + successful runs
- [ ] Screenshot of workflow summary

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T023: Verify Branch Protection Blocks Merge

### Part A: Verify Cannot Merge When Checks Fail

1. Go back to failed state:
   ```bash
   # Revert the fix commit
   git revert HEAD
   git push origin test/pr-quality-gates-fail
   ```

2. Wait for workflow to fail again

3. Check PR merge button:
   - Navigate to PR conversation tab
   - Scroll to bottom where merge button is

### Expected Results
- ✅ Merge button is DISABLED or shows "Checks have failed"
- ✅ Error message: "Required status check 'PR Quality Gates' has not passed"
- ✅ Cannot click "Merge pull request" button

### Validation Checklist (Part A)
- [ ] Merge button is disabled/greyed out
- [ ] Tooltip or message explains why merge is blocked
- [ ] Message mentions failed status checks
- [ ] Cannot bypass (no "Merge without waiting" option for non-admins)

### Part B: Verify Can Merge When Checks Pass

1. Fix lint error again (repeat Test T022 fix steps)

2. Wait for checks to pass

3. Check PR merge button:
   - Navigate to PR conversation tab
   - Scroll to bottom

### Expected Results
- ✅ Merge button is ENABLED (green)
- ✅ Button text: "Merge pull request"
- ✅ Message: "All checks have passed" or "This branch has no conflicts with the base branch"
- ✅ Can click merge button (DO NOT MERGE - just verify enabled)

### Validation Checklist (Part B)
- [ ] Merge button is enabled and green
- [ ] No blocking messages about failed checks
- [ ] "All checks have passed" message visible
- [ ] Merge button is clickable

### Screenshots
- [ ] Screenshot of disabled merge button (checks failed)
- [ ] Screenshot of enabled merge button (checks passed)

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Cleanup

After completing all tests:

```bash
# Close the test PR without merging
# (Navigate to PR on GitHub → Close pull request)

# Delete test branch locally and remotely
git checkout 004-deploy-discipline
git branch -D test/pr-quality-gates-fail
git push origin --delete test/pr-quality-gates-fail
```

---

## Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| T021: Workflow Fails | [ ] PASS / [ ] FAIL | |
| T022: Workflow Re-runs | [ ] PASS / [ ] FAIL | |
| T023: Branch Protection | [ ] PASS / [ ] FAIL | |

**Overall Phase 1 Testing**: [ ] PASS / [ ] FAIL

**Sign-off**: ________________  
**Date**: ________________
