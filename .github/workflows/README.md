# GitHub Actions Workflows

This directory contains all CI/CD workflows for the Trackly Home project.

## Workflow Overview

| Workflow | Trigger | Purpose | Approval Required |
|----------|---------|---------|-------------------|
| [pr-check.yml](#pr-quality-gates) | PR to `main` | Lint + build quality gates | No |
| [swa-app-deploy.yml](#azure-swa-deployment) | Push to `dev`/`main`, manual | Deploy frontend to Azure SWA | Prod only |
| [supabase-deploy-dev.yml](#supabase-dev-deployment) | Push to `dev`, manual | Deploy DB + functions to dev | No |
| [supabase-deploy-prod.yml](#supabase-prod-deployment) | Push to `main`, manual | Deploy DB + functions to prod | Yes |

---

## PR Quality Gates

**File:** `pr-check.yml`

### Purpose
Automated quality checks for pull requests targeting the `main` branch. Prevents broken code from being merged.

### Triggers
- Pull request opened/updated targeting `main`
- Changes to `apps/web/**` or the workflow file itself

### Jobs

1. **Lint** (`lint`)
   - Runs ESLint on frontend code
   - Working directory: `apps/web`
   - Command: `npm run lint`

2. **Build** (`build`)
   - Builds the application to verify compilation
   - Working directory: `apps/web`
   - Command: `npm run build`
   - Generates artifact in `apps/web/dist/`

3. **Summary** (`summary`)
   - Aggregates results from lint and build jobs
   - Displays pass/fail status in GitHub Actions summary
   - Fails the workflow if any check fails

### Environment Variables
None required (uses public code only).

### Secrets Required
None.

### Branch Protection
This workflow is required to pass before PRs can be merged to `main`.

**Configuration in GitHub:**
- Settings → Branches → `main` → Branch protection rules
- Required status checks: `lint`, `build`

### Concurrency
- Group: `pr-check-${{ github.ref }}`
- Cancel in progress: Yes
- **Effect:** Only one run per PR at a time; new pushes cancel old runs

### Usage
This workflow runs automatically on every PR update. No manual intervention needed.

### Troubleshooting
- **Lint fails:** Fix ESLint errors in `apps/web/src/`
- **Build fails:** Check TypeScript errors and Vite configuration

---

## Azure SWA Deployment

**File:** `swa-app-deploy.yml`

### Purpose
Deploys the frontend application to Azure Static Web Apps (SWA) for dev and production environments.

### Triggers

**Automatic:**
- Push to `dev` branch with changes to `apps/web/**` → Deploys to **dev** environment
- Push to `main` branch with changes to `apps/web/**` → Deploys to **prod** environment

**Manual:**
- Workflow dispatch with target selection (dev/prod)

### Environment Selection Logic
```yaml
environment: ${{ 
  github.event_name == 'workflow_dispatch' && inputs.target ||
  (github.ref_name == 'main' && 'prod' || 'dev')
}}
```

- **workflow_dispatch:** Uses selected target (dev or prod)
- **Push to main:** Uses prod
- **Push to dev:** Uses dev

### Jobs

1. **Deploy** (`deploy`)
   - Installs Node.js dependencies
   - Builds the Vite application with environment-specific env vars
   - Deploys to Azure SWA using `Azure/static-web-apps-deploy@v1`
   - Generates comprehensive deployment summary

### Environment Variables (Build-time)
| Variable | Source | Purpose |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | GitHub Environment secret | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | GitHub Environment secret | Supabase anonymous key |

### Secrets Required

**Per Environment (dev/prod):**
| Secret | How to Obtain | Purpose |
|--------|---------------|---------|
| `AZURE_SWA_DEPLOYMENT_TOKEN` | `az staticwebapp secrets list --name <swa-name> --resource-group <rg-name> --query properties.apiKey -o tsv` | Azure SWA deployment authentication |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API | Supabase project URL (e.g., `https://xyz.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Supabase anonymous/public key |

**Repository Secret:**
| Secret | Purpose |
|--------|---------|
| `GITHUB_TOKEN` | Automatically provided by GitHub Actions |

See [.github/SECRETS.md](../SECRETS.md) for detailed secret retrieval instructions.

### Approval Requirements
- **Dev:** No approval required
- **Prod:** Requires manual approval from designated reviewers

**Configuration in GitHub:**
- Settings → Environments → `prod` → Required reviewers

### Concurrency
- Group: `swa-web-${{ github.ref_name }}`
- Cancel in progress: Yes
- **Effect:** One deployment per branch at a time

### Usage

**Automatic Deployment:**
```bash
# Deploy to dev
git checkout dev
git pull origin dev
# make changes to apps/web/**
git commit -m "feat(ui): update homepage"
git push origin dev
# Workflow triggers automatically → deploys to dev

# Deploy to prod
# Create PR from dev → main, merge
# Workflow triggers automatically → approval required → deploys to prod
```

**Manual Deployment:**
1. Navigate to Actions → Deploy Web App (Azure SWA)
2. Click "Run workflow"
3. Select branch (usually `dev` or `main`)
4. Select target environment (dev or prod)
5. Click "Run workflow"
6. If prod, approve deployment when prompted

### Troubleshooting
- **Build fails:** Check Vite config, TypeScript errors, or env var issues
- **Deployment fails:** Verify `AZURE_SWA_DEPLOYMENT_TOKEN` is correct for the environment
- **Site shows blank page:** Check `staticwebapp.config.json` in dist/, verify SPA fallback configured

---

## Supabase Dev Deployment

**File:** `supabase-deploy-dev.yml`

### Purpose
Deploys database migrations and Edge Functions to the development Supabase project.

### Triggers

**Automatic:**
- Push to `dev` branch with changes to `supabase/**`

**Manual:**
- Workflow dispatch

### Jobs

1. **Deploy** (`deploy`)
   - Links to Supabase dev project
   - Pushes database migrations (`supabase db push`)
   - Sets Edge Function secrets (9 total)
   - Deploys all Edge Functions
   - Generates comprehensive summary with dashboard links

### Environment Variables
None (uses secrets only).

### Secrets Required

**Environment: dev**
| Secret | How to Obtain | Purpose |
|--------|---------------|---------|
| `SUPABASE_PROJECT_REF` | Supabase Dashboard → Settings → General → Reference ID | Project identifier |
| `SUPABASE_DB_PASSWORD` | Set during project creation (or reset in Dashboard) | Database password |
| `SB_URL` | Supabase Dashboard → Settings → API → URL | Edge Function: Supabase URL |
| `SB_ANON_KEY` | Supabase Dashboard → Settings → API → anon key | Edge Function: Anon key |
| `SB_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role key | Edge Function: Service role key |
| `SITE_URL` | Azure SWA dev URL | Edge Function: Allowed origin |
| `ALLOWED_ORIGINS` | CSV of allowed origins (e.g., `https://dev.example.com`) | Edge Function: CORS |
| `INVITE_TOKEN_SECRET` | Generate: `openssl rand -base64 32` | Edge Function: Token signing |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | Supabase CLI authentication |

**9 Edge Function Secrets:**
All secrets prefixed with `SB_` are set on Edge Functions via `supabase secrets set`.

See [.github/SECRETS.md](../SECRETS.md) for detailed secret retrieval instructions.

### Approval Requirements
None (dev environment).

### Concurrency
- Group: `supabase-dev`
- Cancel in progress: Yes

### Usage

**Automatic Deployment:**
```bash
git checkout dev
# make changes to supabase/migrations/ or supabase/functions/
git commit -m "feat(db): add tasks table"
git push origin dev
# Workflow triggers automatically → deploys to dev
```

**Manual Deployment:**
1. Navigate to Actions → Supabase Deploy (Dev)
2. Click "Run workflow"
3. Select `dev` branch
4. Click "Run workflow"

### Troubleshooting
- **Migration fails:** Check SQL syntax, test locally with `supabase db reset`
- **Function deploy fails:** Verify all 9 secrets are set correctly in the `dev` environment
- **RLS errors:** Test RLS policies locally before deploying

---

## Supabase Prod Deployment

**File:** `supabase-deploy-prod.yml`

### Purpose
Deploys database migrations and Edge Functions to the production Supabase project.

### Triggers

**Automatic:**
- Push to `main` branch with changes to `supabase/**`

**Manual:**
- Workflow dispatch

### Jobs

1. **Deploy** (`deploy`)
   - Links to Supabase prod project
   - Pushes database migrations (`supabase db push`)
   - Sets Edge Function secrets (9 total)
   - Deploys all Edge Functions
   - Generates comprehensive summary with dashboard links

### Environment Variables
None (uses secrets only).

### Secrets Required

**Environment: prod**
| Secret | How to Obtain | Purpose |
|--------|---------------|---------|
| `SUPABASE_PROJECT_REF` | Supabase Dashboard (prod project) → Settings → General → Reference ID | Project identifier |
| `SUPABASE_DB_PASSWORD` | Set during prod project creation (or reset in Dashboard) | Database password |
| `SB_URL` | Supabase Dashboard (prod) → Settings → API → URL | Edge Function: Supabase URL |
| `SB_ANON_KEY` | Supabase Dashboard (prod) → Settings → API → anon key | Edge Function: Anon key |
| `SB_SERVICE_ROLE_KEY` | Supabase Dashboard (prod) → Settings → API → service_role key | Edge Function: Service role key |
| `SITE_URL` | Azure SWA prod URL | Edge Function: Allowed origin |
| `ALLOWED_ORIGINS` | CSV of allowed origins (e.g., `https://app.trackly.com`) | Edge Function: CORS |
| `INVITE_TOKEN_SECRET` | Generate: `openssl rand -base64 32` (different from dev) | Edge Function: Token signing |
| `SUPABASE_ACCESS_TOKEN` | Supabase Dashboard → Account → Access Tokens | Supabase CLI authentication |

**Important:** Production secrets MUST be different from development secrets (especially `INVITE_TOKEN_SECRET`).

See [.github/SECRETS.md](../SECRETS.md) for detailed secret retrieval instructions.

### Approval Requirements
**Yes** - Requires manual approval from designated reviewers before deployment.

**Configuration in GitHub:**
- Settings → Environments → `prod` → Required reviewers

### Concurrency
- Group: `supabase-prod`
- Cancel in progress: Yes

### Usage

**Automatic Deployment:**
```bash
# After merging PR to main
# Workflow triggers automatically → approval requested → approve → deploys to prod
```

**Manual Deployment:**
1. Navigate to Actions → Supabase Deploy (Prod)
2. Click "Run workflow"
3. Select `main` branch
4. Click "Run workflow"
5. **Approve deployment** when prompted

### Troubleshooting
- **Migration fails:** Verify migration was tested locally and in dev first
- **Function deploy fails:** Verify all 9 secrets are set correctly in the `prod` environment
- **Approval not showing:** Check environment protection rules in Settings → Environments → prod

---

## Secret Management

All workflows use GitHub Environments (`dev`, `prod`) for secret management.

**To view secrets:**
```bash
gh secret list --env dev
gh secret list --env prod
gh secret list  # repository secrets
```

**To set secrets:**
```bash
gh secret set SECRET_NAME --env dev --body "secret-value"
gh secret set SECRET_NAME --env prod --body "secret-value"
```

**Automated Setup:**
See `scripts/setup-github-secrets-auto.sh` for automated secret configuration.

**Complete Documentation:**
See [.github/SECRETS.md](../SECRETS.md) for comprehensive secret documentation, retrieval instructions, and rotation procedures.

---

## Concurrency Patterns

All workflows use concurrency control to prevent multiple deployments at once:

| Workflow | Concurrency Group | Cancel in Progress |
|----------|-------------------|-------------------|
| pr-check.yml | `pr-check-${{ github.ref }}` | Yes |
| swa-app-deploy.yml | `swa-web-${{ github.ref_name }}` | Yes |
| supabase-deploy-dev.yml | `supabase-dev` | Yes |
| supabase-deploy-prod.yml | `supabase-prod` | Yes |

**Effect:** New workflow runs cancel old ones for the same group, preventing stale deployments.

---

## Permissions

All workflows follow the principle of least privilege:

| Workflow | Permissions |
|----------|-------------|
| pr-check.yml | `contents: read`, `pull-requests: read` |
| swa-app-deploy.yml | `contents: read` |
| supabase-deploy-dev.yml | `contents: read` |
| supabase-deploy-prod.yml | `contents: read` |

No workflows have write access to the repository.

---

## Monitoring & Logs

**View workflow runs:**
- GitHub → Actions tab
- Filter by workflow name or branch

**View deployment logs:**
1. Click on a workflow run
2. Expand job steps to see detailed logs
3. Check "Generate deployment summary" for high-level status

**Deployment summaries include:**
- Environment deployed to
- Commit SHA and author
- Deployment status (success/failure)
- Links to Azure Portal, Supabase Dashboard
- List of deployed migrations/functions

---

## Best Practices

1. **Always test locally first**
   - Run `npm run build` before pushing
   - Test migrations with `supabase db reset`
   - Test functions with `supabase functions serve`

2. **Use dev environment for testing**
   - Push to `dev` branch for automatic dev deployment
   - Verify changes work in dev before merging to main

3. **Review deployment summaries**
   - Check GitHub Actions summary after each deployment
   - Verify expected migrations/functions were deployed

4. **Monitor after production deployments**
   - Visit production URL to verify changes live
   - Check Supabase logs for errors
   - Test critical user flows

5. **Keep secrets rotated**
   - Rotate production secrets regularly
   - Never commit secrets to code
   - Use `scripts/setup-github-secrets-auto.sh` for setup

---

## Emergency Procedures

### Rollback Frontend (Azure SWA)
```bash
# Revert to previous working commit
git revert <bad-commit-sha>
git push origin main

# Or use manual workflow dispatch with older commit
# 1. Checkout older commit: git checkout <good-commit-sha>
# 2. Actions → Deploy Web App → Run workflow (target: prod)
```

### Rollback Database Migration
```bash
# Create a reverse migration
supabase migration new rollback_bad_migration

# Write SQL to undo changes in the new migration file
# Test locally: supabase db reset
# Deploy: push to main, approve prod deployment
```

### Rollback Edge Function
```bash
# Revert function code
git revert <bad-commit-sha>
git push origin main

# Function will auto-deploy on push
```

---

## Related Documentation

- [Secrets Documentation](.github/SECRETS.md) - Complete secret setup guide
- [Branching Strategy](.github/BRANCHING_STRATEGY.md) - Git workflow
- [SDLC Process](docs/SDLC_PROCESS.md) - Development lifecycle
- [Project Tracker](docs/PROJECT_TRACKER.md) - Task tracking

---

**Last Updated:** 2026-01-25  
**Maintained By:** Trackly Home Development Team
