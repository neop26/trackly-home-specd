# Branching Strategy

This document outlines the branching strategy and deployment workflow for the Trackly Home project.

## Branch Structure

```
main (production)
  ↑
  PR with approval
  ↑
dev (development/staging)
  ↑
  PR with checks
  ↑
feature/* (feature branches)
```

### Branch Descriptions

- **`main`**: Production branch
  - Protected branch with required status checks
  - Auto-deploys to production Azure SWA on merge
  - Auto-deploys Supabase migrations/functions to prod on merge
  - Requires PR review and approval for deployments
  - All merges must pass lint and build checks

- **`dev`**: Development/staging branch
  - Integration branch for all features
  - Auto-deploys to dev Azure SWA on push
  - Auto-deploys Supabase to dev environment on push
  - No approval required for deployments
  - Used for testing before production release

- **`feature/*`**: Feature branches
  - Created from `dev` for new features or fixes
  - Must pass PR checks before merging to `dev`
  - Branch naming convention: `feature/descriptive-name` or `<issue-number>-descriptive-name`

## Development Workflow

### 1. Starting New Work

```bash
# Ensure you're on dev and up to date
git checkout dev
git pull origin dev

# Create a feature branch
git checkout -b feature/my-new-feature
# or for spec-based work:
git checkout -b 005-feature-name
```

### 2. During Development

```bash
# Make your changes
# Commit frequently with clear messages
git add .
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/my-new-feature
```

### 3. Creating a Pull Request to Dev

1. Push your feature branch to GitHub
2. Create a PR from `feature/my-new-feature` → `dev`
3. PR checks will run automatically:
   - **Lint Code**: ESLint validation
   - **Build Application**: Vite build test
4. If checks pass, merge to `dev`
5. Dev environment auto-deploys (no approval needed)

### 4. Promoting to Production

1. After testing in dev, create a PR from `dev` → `main`
2. PR checks will run again (lint + build)
3. If checks pass, request review from team
4. After approval, merge to `main`
5. Production deployments trigger:
   - Azure SWA deployment (requires approval)
   - Supabase deployment (requires approval)
6. Approve deployments in GitHub Actions tab
7. Verify production deployment succeeded

## Deployment Triggers

### Automatic Deployments

| Trigger | Environment | Approval Required | Workflows Triggered |
|---------|-------------|-------------------|---------------------|
| Push to `dev` (apps/web/**) | Dev | No | Azure SWA Deploy |
| Push to `dev` (supabase/**) | Dev | No | Supabase Deploy |
| Push to `main` (apps/web/**) | Prod | **Yes** | Azure SWA Deploy |
| Push to `main` (supabase/**) | Prod | **Yes** | Supabase Deploy |
| PR to `main` | N/A | N/A | PR Quality Gates |

### Manual Deployments

Use GitHub Actions workflow dispatch for manual deployments:

1. Go to **Actions** → Select workflow
2. Click **Run workflow**
3. Choose target environment (dev/prod)
4. Approve if deploying to prod

## Branch Protection Rules

### Main Branch Protection

- ✅ Require status checks to pass: `Lint Code`, `Build Application`
- ✅ Require branches to be up to date before merging
- ✅ No force pushes allowed
- ✅ No deletions allowed

### Dev Branch

- No protection rules (flexible for rapid development)
- Optional: Can add similar protections if needed

## Environment Protection Rules

### Production Environment

- ✅ Required reviewer: @neop26 (or team leads)
- ✅ Wait timer: 0 minutes (manual approval only)
- ✅ Deployment branches: Protected branches only (main)

### Development Environment

- No protection rules
- Open for all deployments from dev branch

## Examples

### Example 1: New Feature

```bash
# 1. Start from dev
git checkout dev
git pull origin dev

# 2. Create feature branch
git checkout -b feature/add-budget-tracking

# 3. Make changes and commit
git add .
git commit -m "feat: add budget tracking module"
git push origin feature/add-budget-tracking

# 4. Create PR: feature/add-budget-tracking → dev
# 5. Merge after checks pass
# 6. Dev auto-deploys

# 7. Test in dev environment

# 8. Create PR: dev → main
# 9. Get approval and merge
# 10. Approve prod deployments in Actions tab
```

### Example 2: Hotfix to Production

```bash
# 1. Create hotfix from main
git checkout main
git pull origin main
git checkout -b hotfix/fix-login-bug

# 2. Fix the bug
git add .
git commit -m "fix: resolve login authentication issue"
git push origin hotfix/fix-login-bug

# 3. Create PR: hotfix/fix-login-bug → main
# 4. Get emergency approval
# 5. Merge and approve prod deployment

# 6. Backport to dev
git checkout dev
git cherry-pick <commit-hash>
git push origin dev
```

### Example 3: Manual Deployment

1. Navigate to https://github.com/neop26/trackly-home-specd/actions
2. Select workflow (e.g., "Deploy Web App (Azure SWA)")
3. Click **Run workflow**
4. Select branch: `main` or `dev`
5. Select target: `prod` or `dev`
6. Click **Run workflow**
7. Approve if deploying to prod

## Quality Gates

All PRs to `main` must pass:

1. **Lint Code**: No ESLint errors or warnings
2. **Build Application**: Successful production build
3. **Manual Review**: At least one approval from authorized reviewer

## Secrets Management

Secrets are environment-specific:

- **Dev secrets**: For `dev` environment and branch
- **Prod secrets**: For `prod` environment and `main` branch
- **Repository secrets**: OIDC credentials for Azure authentication

See [SECRETS.md](.github/SECRETS.md) for details (to be created in Phase 5).

## Best Practices

1. **Always pull latest dev** before creating feature branches
2. **Keep feature branches short-lived** (< 3 days if possible)
3. **Merge dev into your feature branch** regularly to avoid conflicts
4. **Test thoroughly in dev** before promoting to production
5. **Write clear commit messages** following conventional commits
6. **Never commit secrets** - use GitHub Secrets
7. **Squash commits** when merging to main for clean history (optional)

## Rollback Strategy

If a production deployment fails or causes issues:

### Option 1: Revert Commit

```bash
git checkout main
git revert <bad-commit-hash>
git push origin main
# Approve emergency prod deployment
```

### Option 2: Hotfix

```bash
git checkout main
git checkout -b hotfix/rollback-feature
# Make fixes
git commit -m "fix: rollback problematic feature"
git push origin hotfix/rollback-feature
# Create PR, get approval, merge, approve deployment
```

### Option 3: Manual Redeploy Previous Version

1. Go to Actions → Select workflow
2. Find last successful deployment run
3. Re-run workflow from that commit

## Support

For questions or issues with the branching strategy:

- Review this document
- Check GitHub Actions logs for deployment details
- Refer to [docs/SDLC_PROCESS.md](../docs/SDLC_PROCESS.md)
- Contact the development team

---

**Last Updated**: 2026-01-24  
**Version**: 1.0  
**Maintained by**: Development Team
