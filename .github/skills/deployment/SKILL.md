---
name: deployment
description: Deploy Trackly Home to Azure Static Web Apps and Supabase environments. Use when deploying to dev or production, troubleshooting deployments, or managing CI/CD workflows. Covers the three-tier deployment workflow.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git, GitHub CLI (gh), Azure CLI (optional)
allowed-tools: Bash(git:*) Bash(gh:*) Bash(npm:*) Read
---

# Deployment Skill

Deploy Trackly Home following the three-tier promotion workflow (Local → Staging → Production).

## When to Use

- Deploying features to dev environment
- Promoting to production
- Troubleshooting deployment failures
- Managing GitHub Actions workflows
- Rolling back deployments

## Three-Tier Workflow

```
Tier 1: Local Development
         ↓ (100% complete)
Tier 2: Staging (Azure Dev)
         ↓ (100% validated + approval)
Tier 3: Production (Azure Prod)
```

## Tier 1: Local Development

### Requirements Before Promoting

- [ ] All spec tasks complete in `tasks.md`
- [ ] Manual smoke tests passing
- [ ] Build passes: `npm run build`
- [ ] Lint passes: `npm run lint`
- [ ] RLS policies tested (if DB changes)
- [ ] Database migrations validated locally

### Local Testing Commands

```bash
# Start local Supabase
supabase start

# Reset database (applies all migrations)
supabase db reset

# Run frontend
cd apps/web && npm run dev

# Build and lint
npm run build
npm run lint
```

## Tier 2: Staging (Dev Environment)

### Automatic Deployment

Push to `dev` branch triggers automatic deployment:

```bash
# Merge feature to dev
git checkout dev
git pull origin dev
git merge feature/my-feature
git push origin dev
```

### Workflows Triggered

| Workflow | Trigger | What it Does |
|----------|---------|--------------|
| `swa-app-deploy.yml` | `apps/web/**` changes | Deploys frontend to Azure SWA Dev |
| `supabase-deploy-dev.yml` | `supabase/**` changes | Deploys DB + functions to Supabase Dev |

### Monitor Deployment

```bash
# View workflow runs
gh run list --workflow=swa-app-deploy.yml
gh run list --workflow=supabase-deploy-dev.yml

# Watch specific run
gh run watch <run-id>

# View logs
gh run view <run-id> --log
```

### Staging Validation Checklist

- [ ] Site loads without errors
- [ ] Login flow works (magic link)
- [ ] Household creation works
- [ ] Invite flow works
- [ ] Task management works (if applicable)
- [ ] Console shows no errors
- [ ] Supabase logs clean
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Mobile responsiveness verified

## Tier 3: Production

### Prerequisites

- [ ] All staging tests passing
- [ ] Security review complete
- [ ] Documentation updated
- [ ] Approval obtained

### Automatic Deployment (on merge to main)

```bash
# Create PR from dev to main
gh pr create --base main --head dev --title "Release: [Feature Name]"

# PR must pass pr-check.yml (lint + build)

# After PR merge, workflows trigger automatically
# Approval required in GitHub Actions UI
```

### Manual Deployment

```bash
# Navigate to GitHub Actions
# Select workflow → Run workflow → Select branch → Confirm

# Or via CLI
gh workflow run swa-app-deploy.yml --ref main -f target=prod
gh workflow run supabase-deploy-prod.yml --ref main
```

### Production Approval

1. Go to GitHub Actions
2. Find pending deployment run
3. Click "Review deployments"
4. Select environment (prod)
5. Click "Approve and deploy"

### Post-Deployment Validation

- [ ] Site loads without errors
- [ ] Login flow works
- [ ] Create/join household works
- [ ] Core features functional
- [ ] Console shows no errors
- [ ] Supabase logs clean
- [ ] Monitoring alerts configured

## CI/CD Workflows

### pr-check.yml

**Purpose:** Quality gates for PRs to main

**Trigger:** Pull request to `main`

**Jobs:**
1. Lint (`npm run lint`)
2. Build (`npm run build`)
3. Summary

### swa-app-deploy.yml

**Purpose:** Deploy frontend to Azure Static Web Apps

**Trigger:** Push to `dev` or `main` with `apps/web/**` changes

**Environment Selection:**
- Push to `dev` → Deploys to dev environment
- Push to `main` → Deploys to prod (requires approval)
- Manual dispatch → Select target (dev/prod)

### supabase-deploy-dev.yml

**Purpose:** Deploy database + functions to Supabase Dev

**Trigger:** Push to `dev` with `supabase/**` changes

**Jobs:**
1. Deploy migrations
2. Deploy edge functions

### supabase-deploy-prod.yml

**Purpose:** Deploy database + functions to Supabase Prod

**Trigger:** Push to `main` with `supabase/**` changes

**Requires:** Manual approval

## Troubleshooting

### Build Fails

```bash
# Check build locally
cd apps/web
npm run build

# Common issues:
# - TypeScript errors
# - Missing dependencies
# - Import errors
```

### Lint Fails

```bash
# Check lint locally
cd apps/web
npm run lint

# Auto-fix some issues
npm run lint -- --fix
```

### SWA Deployment Fails

Check:
1. Build produces `dist/` folder
2. `staticwebapp.config.json` exists in dist
3. Environment secrets set correctly
4. Azure SWA deployment token valid

### Supabase Deployment Fails

Check:
1. Migration SQL syntax
2. Supabase project ref correct
3. Database password valid
4. Access token not expired

### Edge Function Errors

```bash
# View function logs
gh run view <run-id> --log

# Check function locally
supabase functions serve
curl -X POST http://localhost:54321/functions/v1/function-name
```

## Rollback Procedures

### Frontend Rollback

```bash
# Option 1: Revert commit
git revert <bad-commit-sha>
git push origin main

# Option 2: Deploy previous commit
gh workflow run swa-app-deploy.yml --ref <good-commit-sha> -f target=prod
```

### Database Rollback

```bash
# Create reverse migration
supabase migration new rollback_bad_migration

# Write SQL to undo changes
# Test locally: supabase db reset
# Deploy: push to main
```

### Edge Function Rollback

```bash
# Revert function code
git revert <bad-commit-sha>
git push origin main
# Functions auto-deploy on push
```

## Environment Secrets

### GitHub Environments

| Environment | Approval | Secrets |
|-------------|----------|---------|
| dev | No | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SWA_DEPLOYMENT_TOKEN |
| prod | Yes | VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SWA_DEPLOYMENT_TOKEN |

### Supabase Secrets

| Secret | Purpose |
|--------|---------|
| SUPABASE_PROJECT_REF | Project identifier |
| SUPABASE_DB_PASSWORD | Database password |
| SUPABASE_ACCESS_TOKEN | CLI authentication |

### Viewing Secrets Status

```bash
# List environments
gh api repos/{owner}/{repo}/environments

# Note: Cannot view secret values, only names
```

## Concurrency Control

Workflows use concurrency groups to prevent parallel deployments:

```yaml
concurrency:
  group: swa-web-${{ github.ref_name }}
  cancel-in-progress: true
```

Effect: New runs cancel previous runs for same branch.

## Deployment Checklist

### Before Deploying to Staging

```markdown
- [ ] All spec tasks complete
- [ ] Build passes locally
- [ ] Lint passes locally
- [ ] Manual smoke test complete
- [ ] RLS policies tested (if DB changes)
- [ ] Documentation updated
```

### Before Deploying to Production

```markdown
- [ ] Staging validation complete
- [ ] Cross-browser tested
- [ ] Security checklist passed
- [ ] PR approved
- [ ] Rollback plan ready
```
