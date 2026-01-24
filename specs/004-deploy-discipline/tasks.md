# Tasks: Deploy Discipline & CI/CD Automation

**Feature ID**: 004  
**Input**: plan.md, spec.md from `/specs/004-deploy-discipline/`  
**Target Completion**: 2026-01-31 (Phase 4)

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story/phase this task belongs to
- Include exact file paths in descriptions

**Tests**: Not included - no automated tests requested for this feature (focus on infrastructure)

---

## Phase 0: Infrastructure Setup (Prerequisite for All Workflows)

**Purpose**: Deploy production infrastructure and configure Azure OIDC - MUST complete before any workflow tasks

**⚠️ CRITICAL**: This phase is a hard prerequisite. No workflow implementation can begin until infrastructure exists.

- [X] T001 [INFRA] Run `./scripts/setup-azure-oidc.sh` to configure GitHub → Azure OIDC authentication
- [X] T002 [INFRA] Verify OIDC secrets set in GitHub repository: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID
- [X] T003 [INFRA] Deploy Azure infrastructure using `azure/deploy/main.bicep` (creates dev + prod resource groups and SWAs)
- [X] T004 [INFRA] Document Azure SWA resource names from deployment outputs for both dev and prod environments
- [X] T005 [INFRA] Retrieve Azure SWA deployment token for dev using `az staticwebapp secrets list` command
- [X] T006 [INFRA] Retrieve Azure SWA deployment token for prod using `az staticwebapp secrets list` command
- [X] T007 [INFRA] Create Supabase production project at https://supabase.com/dashboard (name: trackly-home-prod)
- [X] T008 [INFRA] Document Supabase prod credentials: project URL, anon key, service role key, project ref, db password
- [X] T009 [INFRA] Fill `.secrets/.env.dev` with dev credentials, then run `./scripts/setup-github-secrets-auto.sh` option 1
- [X] T010 [INFRA] Fill `.secrets/.env.prod` with prod credentials, then run `./scripts/setup-github-secrets-auto.sh` option 2
- [X] T011 [INFRA] Verify infrastructure: Test dev Azure SWA URL loads, prod Azure SWA URL loads
- [X] T012 [INFRA] Verify infrastructure: Test Supabase dev project (run query in SQL Editor)
- [X] T013 [INFRA] Verify infrastructure: Test Supabase prod project (run query in SQL Editor)
- [X] T014 [INFRA] Verify all secrets configured: `gh secret list --env dev`, `gh secret list --env prod`, `gh secret list`

**Checkpoint**: Infrastructure deployed and validated - workflow implementation can now begin

---

## Phase 1: User Story 1 - PR Quality Gates (Priority: P0) 🎯

**Goal**: Prevent broken code from merging to main with automated lint and build checks

**Independent Test**: Create PR with lint error, verify workflow fails and blocks merge; fix error, verify workflow passes and allows merge

### Implementation for User Story 1

- [X] T015 [US1] Create `.github/workflows/pr-check.yml` with triggers for pull_request to main branch
- [X] T016 [US1] Add lint job to `.github/workflows/pr-check.yml` running `npm run lint` in apps/web directory
- [X] T017 [US1] Add build job to `.github/workflows/pr-check.yml` running `npm run build` in apps/web directory
- [X] T018 [US1] Add concurrency control to `.github/workflows/pr-check.yml`: group `pr-check-${{ github.ref }}`, cancel-in-progress true
- [X] T019 [US1] Add comprehensive GitHub Actions summary to `.github/workflows/pr-check.yml` (follow supabase-deploy-dev.yml pattern)
- [ ] T020 [US1] Configure branch protection rule on main branch: require pr-check status checks, require up-to-date branches
- [ ] T021 [US1] Test PR check workflow: Create test PR with intentional lint error, verify workflow fails
- [ ] T022 [US1] Test PR check workflow: Fix lint error, push update, verify workflow re-runs and passes
- [ ] T023 [US1] Test branch protection: Verify merge button disabled when checks fail, enabled when checks pass

**Checkpoint**: PR quality gates working - broken code cannot merge to main

---

## Phase 2: User Story 2 - Production Environment Validation (Priority: P0)

**Goal**: Verify GitHub production environment has approval gates and all required secrets configured

**Independent Test**: View GitHub environment settings, verify approval required; attempt to deploy to prod, verify approval request appears

### Implementation for User Story 2

- [ ] T024 [US2] Navigate to GitHub Settings → Environments → prod and verify required reviewers configured
- [ ] T025 [US2] Verify prod environment deployment branches set to `main` only
- [ ] T026 [US2] Verify prod environment wait timer set to 0 minutes (manual approval, no auto-approval)
- [ ] T027 [US2] Document current prod environment protection rules in `.github/SECRETS.md` (create file structure first)
- [ ] T028 [P] [US2] Audit prod environment secrets for Azure SWA: AZURE_SWA_DEPLOYMENT_TOKEN, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
- [ ] T029 [P] [US2] Audit prod environment secrets for Supabase: SUPABASE_PROJECT_REF, SUPABASE_DB_PASSWORD
- [ ] T030 [P] [US2] Audit prod environment secrets for Edge Functions: SB_URL, SB_ANON_KEY, SB_SERVICE_ROLE_KEY, SITE_URL, ALLOWED_ORIGINS
- [ ] T031 [US2] List any missing prod secrets and add them using retrieval instructions from helper script
- [ ] T032 [US2] Verify Azure OIDC configuration: Check federated credentials exist for main, dev, pull_request branches
- [ ] T033 [US2] Verify repository secrets: AZURE_CLIENT_ID, AZURE_TENANT_ID, AZURE_SUBSCRIPTION_ID are set
- [ ] T034 [US2] Test OIDC authentication: Trigger azure-infra-deploy.yml workflow (if exists) or create test workflow

**Checkpoint**: Production environment validated - ready for deployment workflows

---

## Phase 3: User Story 3 - SWA Production Auto-Deploy (Priority: P1)

**Goal**: Automatically deploy frontend to production Azure SWA when PR merges to main

**Independent Test**: Merge PR to main with frontend change, verify workflow triggers, approve deployment, verify change live on prod SWA URL

### Implementation for User Story 3

- [X] T035 [US3] Read reference workflow `specs/004-deploy-discipline/oldrepo/swa-app-deploy.yml` and document current triggers
- [X] T036 [US3] Create `.github/workflows/swa-app-deploy.yml` adapted from old repo workflow for new repo structure
- [X] T037 [US3] Add push trigger for dev branch (apps/web/**) to `.github/workflows/swa-app-deploy.yml`
- [X] T038 [US3] Add push trigger for main branch (apps/web/**) to `.github/workflows/swa-app-deploy.yml`
- [X] T039 [US3] Add workflow_dispatch trigger with target input (dev/prod choice) to `.github/workflows/swa-app-deploy.yml`
- [X] T040 [US3] Implement dynamic environment logic in `.github/workflows/swa-app-deploy.yml`: workflow_dispatch → inputs.target, push to main → prod, push to dev → dev
- [X] T041 [US3] Add concurrency control to `.github/workflows/swa-app-deploy.yml`: group `swa-web-${{ github.ref_name }}`, cancel-in-progress true
- [X] T042 [US3] Add build-time env vars to `.github/workflows/swa-app-deploy.yml`: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY from secrets
- [X] T043 [US3] Add Azure/static-web-apps-deploy@v1 action to `.github/workflows/swa-app-deploy.yml` with working directory apps/web
- [X] T044 [US3] Test YAML syntax: `yamllint .github/workflows/swa-app-deploy.yml` or validate in GitHub
- [ ] T045 [US3] Regression test: Make trivial change to apps/web/README.md, push to dev, verify dev auto-deploy works
- [ ] T046 [US3] Feature test: Merge PR to main with frontend change, verify workflow triggers, verify approval request for prod
- [ ] T047 [US3] Feature test: Approve prod deployment, verify deployment succeeds, visit prod SWA URL, verify change live
- [ ] T048 [US3] Regression test: Trigger workflow_dispatch manually, select prod, verify manual deploy works

**Checkpoint**: SWA production auto-deploy working - frontend changes auto-deploy on merge to main

---

## Phase 4: User Story 4 - Supabase Production Deployment (Priority: P1)

**Goal**: Deploy database migrations and Edge Functions to production Supabase when changes merge to main

**Independent Test**: Add test migration, merge to main, approve deployment, verify migration applied in prod Supabase dashboard

### Implementation for User Story 4

- [X] T049 [US4] Read reference workflow `specs/004-deploy-discipline/oldrepo/supabase-deploy-dev.yml` (149 lines) and document structure
- [X] T050 [US4] Create `.github/workflows/supabase-deploy-dev.yml` by copying old repo workflow for dev environment
- [X] T051 [US4] Update dev workflow triggers in `.github/workflows/supabase-deploy-dev.yml`: push to dev (supabase/**), workflow_dispatch
- [X] T052 [US4] Update dev workflow concurrency in `.github/workflows/supabase-deploy-dev.yml`: group `supabase-dev`, cancel-in-progress true
- [X] T053 [US4] Copy `.github/workflows/supabase-deploy-dev.yml` to `.github/workflows/supabase-deploy-prod.yml`
- [X] T054 [US4] Update prod workflow triggers in `.github/workflows/supabase-deploy-prod.yml`: push to main (supabase/**), workflow_dispatch
- [X] T055 [US4] Change environment from dev to prod in `.github/workflows/supabase-deploy-prod.yml`
- [X] T056 [US4] Change concurrency group from `supabase-dev` to `supabase-prod` in `.github/workflows/supabase-deploy-prod.yml`
- [X] T057 [US4] Update secret references in `.github/workflows/supabase-deploy-prod.yml` to use prod environment secrets
- [X] T058 [US4] Preserve comprehensive summary format in `.github/workflows/supabase-deploy-prod.yml` (dashboard links, migrations list, functions list)
- [X] T059 [US4] Verify workflow includes: supabase link, `yes | supabase db push`, set 9 Edge Function secrets, supabase functions deploy
- [X] T060 [US4] Test YAML syntax for both dev and prod Supabase workflows
- [ ] T061 [US4] Regression test: Make trivial migration change, push to dev, verify dev workflow triggers and works
- [ ] T062 [US4] Feature test: Create test migration file (e.g., add test table), commit to main, verify prod workflow triggers
- [ ] T063 [US4] Feature test: Approve prod Supabase deployment, verify migrations applied in Supabase Dashboard
- [ ] T064 [US4] Feature test: Query prod database to confirm migration changes applied
- [ ] T065 [US4] Feature test: Make trivial Edge Function change, deploy to prod, verify function updated, test endpoint

**Checkpoint**: Supabase production deployment working - backend changes auto-deploy on merge to main

---

## Phase 5: User Story 5 - Secrets Documentation (Priority: P0)

**Goal**: Provide comprehensive documentation of all required GitHub secrets for easy setup and troubleshooting

**Independent Test**: Follow documented instructions to retrieve one Azure SWA token and one Supabase secret, verify accuracy

### Implementation for User Story 5

- [ ] T066 [P] [US5] Analyze `.github/workflows/swa-app-deploy.yml` and list all secrets used
- [ ] T067 [P] [US5] Analyze `.github/workflows/supabase-deploy-dev.yml` and list all secrets used
- [ ] T068 [P] [US5] Analyze `.github/workflows/supabase-deploy-prod.yml` and list all secrets used
- [ ] T069 [US5] Create inventory of all 14+ secrets: Azure SWA (3 per env), Supabase (3 shared/per env), Edge Functions (9 per env), OIDC (3)
- [ ] T070 [US5] Create `.github/SECRETS.md` with overview section explaining purpose and structure
- [ ] T071 [US5] Add secrets inventory table to `.github/SECRETS.md` with columns: name, scope (dev/prod/shared), purpose
- [ ] T072 [US5] Add "Secrets by Workflow" section to `.github/SECRETS.md` grouping secrets by swa-app-deploy, supabase-deploy-*, azure-infra-deploy
- [ ] T073 [US5] Add "How to Obtain Secrets" section to `.github/SECRETS.md` with Azure SWA token retrieval command
- [ ] T074 [US5] Add Supabase secret retrieval instructions to `.github/SECRETS.md` (Dashboard navigation for URL, keys, project ref)
- [ ] T075 [US5] Add Azure OIDC configuration instructions to `.github/SECRETS.md` (reference setup-azure-oidc.sh script)
- [ ] T076 [US5] Add rotation procedures section to `.github/SECRETS.md` explaining how to rotate each secret type
- [ ] T077 [US5] Add example workflow usage to `.github/SECRETS.md` showing how secrets are referenced in YAML
- [ ] T078 [US5] Add links to `.github/SECRETS.md`: Azure Portal, Supabase Dashboard, helper scripts
- [ ] T079 [US5] Validate documentation: Follow instructions to retrieve one Azure SWA deployment token
- [ ] T080 [US5] Validate documentation: Follow instructions to retrieve one Supabase secret (e.g., project URL)
- [ ] T081 [US5] Proofread `.github/SECRETS.md` for clarity, completeness, and accuracy

**Checkpoint**: Secrets documentation complete - team can set up secrets independently

---

## Phase 6: End-to-End Testing & Validation

**Purpose**: Validate entire CI/CD pipeline works end-to-end and no regressions introduced

- [ ] T082 [E2E] Create test feature branch `test/e2e-deploy` from main
- [ ] T083 [E2E] Make test changes: Update apps/web/src/App.tsx, add migration in supabase/migrations/, update Edge Function
- [ ] T084 [E2E] Create PR targeting main, verify pr-check workflow runs (lint, build)
- [ ] T085 [E2E] Verify PR checks pass (green status), merge PR to main
- [ ] T086 [E2E] Verify two workflows trigger: swa-app-deploy.yml and supabase-deploy-prod.yml
- [ ] T087 [E2E] Approve both deployments (SWA prod and Supabase prod)
- [ ] T088 [E2E] Verify both deployments succeed (check GitHub Actions logs)
- [ ] T089 [E2E] Visit production SWA URL, verify frontend change visible
- [ ] T090 [E2E] Test backend functionality: query prod DB, call Edge Function endpoint
- [ ] T091 [E2E] Verify backend changes applied (migration + function update)
- [ ] T092 [REGRESSION] Create test branch from dev, make trivial change to apps/web/README.md
- [ ] T093 [REGRESSION] Push to dev branch, verify dev SWA auto-deploy triggers (no approval needed)
- [ ] T094 [REGRESSION] Make trivial Supabase migration change, push to dev
- [ ] T095 [REGRESSION] Verify dev Supabase workflow triggers and deploys (no approval needed)
- [ ] T096 [MANUAL] Navigate to Actions → SWA App Deploy, click "Run workflow", select target "prod"
- [ ] T097 [MANUAL] Verify approval request appears, approve, verify deployment succeeds

**Checkpoint**: Full CI/CD pipeline validated - no regressions, all workflows working

---

## Phase 7: Documentation & Polish

**Purpose**: Update project documentation and clean up

- [ ] T098 [P] [DOCS] Update `docs/PROJECT_TRACKER.md` Phase 4 status to 100% complete
- [ ] T099 [P] [DOCS] Update `docs/SDLC_PROCESS.md` with deployment workflow documentation (link to workflows)
- [ ] T100 [P] [DOCS] Add workflow usage instructions to `README.md`: how to trigger deploys, view logs, approve deployments
- [ ] T101 [DOCS] Create `.github/workflows/README.md` documenting all workflows: purpose, triggers, secrets used
- [ ] T102 [DOCS] Update constitution memory in `.specify/memory/constitution.md` if deployment process changed
- [ ] T103 [POLISH] Review all workflow YAML files for consistent formatting and clear comments
- [ ] T104 [POLISH] Verify no hardcoded values in workflows (all use secrets or variables)
- [ ] T105 [POLISH] Add workflow badges to repository README.md showing status of pr-check workflow

**Checkpoint**: Phase 4 complete and documented

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 0 (Infrastructure)**: No dependencies - **MUST START FIRST AND COMPLETE BEFORE ANY OTHER WORK**
- **Phase 1 (PR Gates)**: No dependencies on other phases (can run in parallel with Phase 2)
- **Phase 2 (Validation)**: No dependencies on other phases (can run in parallel with Phase 1)
- **Phase 3 (SWA Deploy)**: Depends on Phase 0 complete (needs prod infrastructure) + Phase 2 complete (needs env validation)
- **Phase 4 (Supabase Deploy)**: Depends on Phase 0 complete (needs prod infrastructure) + Phase 2 complete (needs env validation)
- **Phase 5 (Secrets Docs)**: Depends on Phase 3 and Phase 4 complete (needs to document all workflows)
- **Phase 6 (E2E Testing)**: Depends on Phase 1, 3, 4 complete (needs all workflows working)
- **Phase 7 (Docs/Polish)**: Depends on all previous phases complete

### Critical Path

```
Phase 0 (Infrastructure) [1 day]
    ↓
    ├─→ Phase 1 (PR Gates) [0.5 day] ──┐
    │                                    │
    └─→ Phase 2 (Validation) [0.5 day] ─┤
                                         ↓
        Phase 3 (SWA Deploy) [1 day] ────┤
                                         │
        Phase 4 (Supabase) [1 day] ──────┤
                                         ↓
        Phase 5 (Docs) [0.5 day] ────────┤
                                         ↓
        Phase 6 (E2E Test) [0.5 day] ────┤
                                         ↓
        Phase 7 (Polish) [0.5 day]
```

Total: 5 days

### Parallel Opportunities

**After Phase 0 completes**:
- Phase 1 (PR Gates) and Phase 2 (Validation) can run in parallel
- Phase 3 (SWA Deploy) and Phase 4 (Supabase Deploy) can run in parallel after Phase 2

**Within Phase 0 (Infrastructure)**:
- T005 and T006 (retrieve SWA tokens) can run in parallel
- T009 and T010 (setup secrets) can run in parallel after T008
- T011, T012, T013 (verify infrastructure) can run in parallel

**Within Phase 2 (Validation)**:
- T028, T029, T030 (audit secrets) can run in parallel

**Within Phase 5 (Secrets Docs)**:
- T066, T067, T068 (analyze workflows) can run in parallel

**Within Phase 7 (Docs/Polish)**:
- T098, T099, T100 (update docs) can run in parallel

---

## Parallel Example: Infrastructure Setup (Phase 0)

After T008 completes (document Supabase prod credentials):

```bash
# Launch secret setup in parallel:
Task T009: Run setup-github-secrets.sh option 1 (dev secrets)
Task T010: Run setup-github-secrets.sh option 2 (prod secrets)

# Then launch infrastructure verification in parallel:
Task T011: Test dev Azure SWA URL
Task T012: Test Supabase dev project
Task T013: Test Supabase prod project
```

---

## Implementation Strategy

### Day-by-Day Execution

**Day 1 (2026-01-23)**: Phase 0 - Infrastructure Setup
- Morning: Tasks T001-T008 (OIDC + Azure + Supabase setup)
- Afternoon: Tasks T009-T014 (Secrets + verification)

**Day 2 (2026-01-24)**: Phase 1 + Phase 2
- Morning: Tasks T015-T023 (PR quality gates)
- Afternoon: Tasks T024-T034 (Environment validation)

**Day 3 (2026-01-25)**: Phase 3 - SWA Production Deploy
- Tasks T035-T048 (Create and test SWA workflow)

**Day 4 (2026-01-26)**: Phase 4 - Supabase Production Deploy
- Tasks T049-T065 (Create and test Supabase workflows)

**Day 5 (2026-01-27)**: Phase 5 + Phase 6 + Phase 7
- Morning: Tasks T066-T081 (Secrets documentation)
- Afternoon: Tasks T082-T097 (E2E testing)
- End of day: Tasks T098-T105 (Polish and docs)

**Buffer**: Days 2026-01-28 to 2026-01-31 (3 days)

### MVP Strategy

If time is constrained, deliver in this order:

1. **MVP 1** (After Phase 0 + Phase 1): PR quality gates working
   - Prevents broken code from merging
   - No production deploy yet, but code quality enforced

2. **MVP 2** (After Phase 3): Production SWA auto-deploy working
   - Frontend can auto-deploy to production
   - Backend still manual

3. **MVP 3** (After Phase 4): Full stack auto-deploy
   - Both frontend and backend auto-deploy
   - Full CI/CD pipeline operational

4. **Complete** (After Phase 5-7): Documentation and polish
   - Team can self-service secrets setup
   - All workflows documented

---

## Notes

- [P] tasks = different files or independent operations, can run in parallel
- [Story] label: INFRA (infrastructure), US1-US5 (user stories), E2E (testing), REGRESSION (regression tests), MANUAL (manual tests), DOCS (documentation), POLISH (cleanup)
- **Phase 0 is CRITICAL**: Do not skip or rush infrastructure setup, everything else depends on it
- Helper scripts (`setup-azure-oidc.sh`, `setup-github-secrets.sh`) automate manual steps
- Each workflow phase (3, 4) includes both implementation AND testing tasks
- E2E testing (Phase 6) validates entire pipeline, regression tests ensure no breakage
- Commit frequently (after each task or logical group of parallel tasks)
- Stop at any checkpoint to validate independently before proceeding

---

**Total Tasks**: 105  
**Estimated Duration**: 5 days  
**Critical Prerequisites**: Phase 0 (Infrastructure) must complete first  
**Parallel Opportunities**: 12+ tasks can run in parallel across phases

