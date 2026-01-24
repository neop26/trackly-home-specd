# Supabase Production Deploy Testing (Tasks T061-T065)

**Test Date**: 2026-01-24  
**Tester**: [Your Name]  
**Status**: ⏳ Pending

---

## Test T061: Regression Test - Dev Supabase Auto-Deploy Still Works

### Purpose
Verify that existing dev Supabase deployment was NOT broken

### Setup
1. Switch to dev branch:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Create trivial migration to trigger deploy:
   ```bash
   # Create test migration file
   cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_test_dev_deploy.sql << 'EOF'
   -- Test migration for dev deploy validation
   -- This is a no-op migration for testing purposes
   SELECT 1;
   EOF
   
   git add supabase/migrations/
   git commit -m "test: verify dev Supabase deploy works"
   git push origin dev
   ```

### Expected Results
- ✅ `supabase-deploy-dev.yml` workflow triggers automatically
- ✅ Environment selected: `dev`
- ✅ No approval request (dev deploys automatically)
- ✅ Migration applied to dev Supabase
- ✅ Workflow completes successfully

### Validation Checklist
- [ ] Workflow triggered within 30 seconds of push
- [ ] Workflow name: "Deploy Supabase (Dev)"
- [ ] Environment badge shows: `dev`
- [ ] No approval step appeared
- [ ] "Link project" step completed
- [ ] "Push migrations" step completed
- [ ] "Deploy functions" step completed
- [ ] Comprehensive summary generated with dashboard link
- [ ] Summary shows migration file name

### Verify in Supabase Dashboard
1. Navigate to dev Supabase project: https://supabase.com/dashboard/project/<DEV_PROJECT_REF>

2. Go to Database → Migrations tab

3. Verify test migration appears in history

4. Check timestamp matches deployment

### Validation Checklist (Supabase Dashboard)
- [ ] Can access dev Supabase dashboard
- [ ] Migrations tab shows test migration
- [ ] Migration status: "Applied"
- [ ] Timestamp matches workflow run time
- [ ] No errors in migration history

### Screenshots
- [ ] Screenshot of workflow run in Actions tab
- [ ] Screenshot showing "dev" environment
- [ ] Screenshot of Supabase migrations tab with test migration

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T062: Feature Test - Create Migration and Deploy to Prod

### Purpose
Verify production Supabase deployment workflow works end-to-end

### Setup
1. Create test branch with real migration:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b test/supabase-prod-deploy
   ```

2. Create test migration:
   ```bash
   # Create a simple test table migration
   cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_test_prod_deployment.sql << 'EOF'
   -- Test migration for production deployment validation
   -- Creates a temporary test table
   
   CREATE TABLE IF NOT EXISTS test_deployment_validation (
     id SERIAL PRIMARY KEY,
     deployed_at TIMESTAMPTZ DEFAULT NOW(),
     test_message TEXT DEFAULT 'Production deployment test'
   );
   
   -- Add a test row
   INSERT INTO test_deployment_validation (test_message) 
   VALUES ('Deployed on ' || NOW()::TEXT);
   EOF
   
   git add supabase/migrations/
   git commit -m "test: verify prod Supabase deploy workflow"
   git push origin test/supabase-prod-deploy
   ```

3. Create PR targeting `main`:
   - Ensure PR checks pass
   - Merge PR

### Expected Results BEFORE Approval
- ✅ `supabase-deploy-prod.yml` workflow triggers automatically on merge
- ✅ Environment selected: `prod`
- ✅ Workflow shows "Waiting for approval"
- ✅ Workflow paused before deployment

### Expected Results AFTER Approval
- ✅ "Link project" connects to prod Supabase
- ✅ "Push migrations" applies the test migration
- ✅ "Deploy functions" succeeds (even if no function changes)
- ✅ Comprehensive summary generated

### Validation Checklist (Before Approval)
- [ ] Workflow triggered automatically on merge to main
- [ ] Workflow shows environment badge: `prod`
- [ ] "Waiting for approval" status visible
- [ ] Workflow is paused

### Validation Checklist (Approval Step)
- [ ] Navigate to Actions → workflow run
- [ ] "Review pending deployments" button visible
- [ ] Click button → approval modal shows `prod` environment
- [ ] Click "Approve and deploy"

### Validation Checklist (After Approval)
- [ ] Workflow resumes execution
- [ ] "Link project" step shows correct prod project ref
- [ ] "Push migrations" step shows migration file being applied
- [ ] No errors in migration push (check logs for "yes | supabase db push")
- [ ] "Set function secrets" step completes (9 secrets set)
- [ ] "Deploy functions" step completes
- [ ] Summary includes dashboard link to prod project
- [ ] Summary lists the test migration file

### Screenshots
- [ ] Screenshot of "Waiting for approval" status
- [ ] Screenshot of workflow after approval (completed)
- [ ] Screenshot of deployment summary with migration listed

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T063: Verify Migrations Applied in Supabase Dashboard

### Purpose
Confirm migration was actually applied to production database

### Steps
1. Navigate to prod Supabase dashboard:
   ```
   https://supabase.com/dashboard/project/<PROD_PROJECT_REF>
   ```

2. Go to Database → Migrations tab

3. Verify test migration appears

4. Check migration details:
   - Status: "Applied"
   - Applied at: Recent timestamp
   - SQL content matches the migration file

### Validation Checklist
- [ ] Can access prod Supabase dashboard
- [ ] Migrations tab loads successfully
- [ ] Test migration `*_test_prod_deployment.sql` appears in list
- [ ] Migration status shows "Applied" (not pending or failed)
- [ ] Timestamp matches workflow completion time (within minutes)
- [ ] Can view migration SQL content in dashboard

### Screenshots
- [ ] Screenshot of Supabase migrations page showing applied migration
- [ ] Screenshot of migration details view

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T064: Query Prod Database to Confirm Changes

### Purpose
Verify migration actually modified the database schema and data

### Steps
1. In prod Supabase dashboard, go to SQL Editor

2. Run query to verify test table exists:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'test_deployment_validation';
   ```
   
   **Expected**: Should return 1 row with table name

3. Query test table contents:
   ```sql
   SELECT * FROM test_deployment_validation;
   ```
   
   **Expected**: Should return 1 row with test message and timestamp

4. Check table structure:
   ```sql
   \d test_deployment_validation
   ```
   
   **Expected**: Should show columns: id, deployed_at, test_message

### Validation Checklist
- [ ] Table `test_deployment_validation` exists
- [ ] Table has correct columns (id, deployed_at, test_message)
- [ ] Table contains 1 test row
- [ ] Test row has recent timestamp (matches deployment time)
- [ ] No SQL errors when querying

### Query Results
```
-- Paste query results here:


```

### Screenshots
- [ ] Screenshot of SQL query showing table exists
- [ ] Screenshot of SELECT * query results

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Test T065: Verify Edge Function Deployment

### Purpose
Confirm Edge Functions were deployed (even if no changes)

### Steps
1. In prod Supabase dashboard, go to Edge Functions

2. Verify all functions are listed:
   - Expected functions (from `supabase/functions/` directory):
     - `create-household`
     - (any other functions in your project)

3. Check function status:
   - Each function should show "Deployed" status
   - Recent deployment timestamp

4. Test a function endpoint (if safe to call):
   ```bash
   # Get prod Supabase URL from dashboard
   PROD_URL="https://<your-prod-project-ref>.supabase.co"
   
   # Test function with curl (adjust endpoint as needed)
   curl -X POST "${PROD_URL}/functions/v1/create-household" \
     -H "Authorization: Bearer <ANON_KEY>" \
     -H "Content-Type: application/json" \
     -d '{"name": "Test Household"}'
   ```
   
   **Note**: Only test if you understand the function's behavior. Skip if it modifies data.

### Validation Checklist
- [ ] Edge Functions tab accessible in dashboard
- [ ] All expected functions are listed
- [ ] Functions show "Deployed" status
- [ ] Deployment timestamp is recent (matches workflow time)
- [ ] Function URLs are accessible
- [ ] Function secrets are configured (9 total - check workflow logs)

### Function Secrets Verification
In workflow logs, verify all 9 secrets were set:
- [ ] SB_SUPABASE_URL
- [ ] SB_SUPABASE_ANON_KEY
- [ ] SB_SUPABASE_SERVICE_ROLE_KEY
- [ ] SB_DATABASE_URL
- [ ] SB_DIRECT_URL
- [ ] SB_JWT_SECRET
- [ ] SB_SITE_URL
- [ ] SB_CORS_ORIGINS
- [ ] (SB_SMTP_* if configured)

### Screenshots
- [ ] Screenshot of Edge Functions page showing deployed functions
- [ ] Screenshot of function deployment details

**Result**: [ ] PASS / [ ] FAIL  
**Notes**:

---

## Cleanup

After completing all tests:

```bash
# Switch back to feature branch
git checkout 004-deploy-discipline

# Optional: Remove test table from prod database
# (Do this in Supabase SQL Editor)
# DROP TABLE IF EXISTS test_deployment_validation;

# Or create a cleanup migration:
cat > supabase/migrations/$(date +%Y%m%d%H%M%S)_cleanup_test_table.sql << 'EOF'
-- Cleanup test table created during deployment validation
DROP TABLE IF EXISTS test_deployment_validation;
EOF

# Commit and deploy cleanup migration
git add supabase/migrations/
git commit -m "cleanup: remove test deployment validation table"
# Push to main and approve deployment
```

---

## Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| T061: Dev Regression Test | [ ] PASS / [ ] FAIL | |
| T062: Prod Deploy Workflow | [ ] PASS / [ ] FAIL | |
| T063: Migrations in Dashboard | [ ] PASS / [ ] FAIL | |
| T064: Database Query Verification | [ ] PASS / [ ] FAIL | |
| T065: Edge Functions Deployed | [ ] PASS / [ ] FAIL | |

**Overall Phase 4 Testing**: [ ] PASS / [ ] FAIL

**Critical Issues Found**: ________________  
**Sign-off**: ________________  
**Date**: ________________

---

## Notes

- The test migration creates a harmless test table that can be easily removed
- All Edge Function secrets are automatically configured during deployment
- Workflow uses `yes | supabase db push` for non-interactive migration application
- Comprehensive summary format matches dev workflow for consistency
