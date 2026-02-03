---
name: branch-rebase
description: Rebase current branch with its parent branch following Trackly Home branching strategy. Feature/spec branches rebase with dev, dev rebases with main. Handles conflicts and validates before pushing.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git
allowed-tools: Bash(git:*) Read
---

# Branch Rebase Skill

Rebase current branch with its parent branch according to Trackly Home's branching strategy.

## When to Use

- Before creating PR (ensure up-to-date with parent)
- After parent branch receives updates (stay in sync)
- To maintain clean linear history
- Before merging feature to dev
- Before merging dev to main

## Branching Strategy

```
feature/* ──rebase──> dev ──rebase──> main
   │                   │
spec/*  ──rebase──────┘
```

### Parent Branch Rules

| Current Branch | Parent Branch | Example |
|----------------|---------------|---------|
| `feature/*` | `dev` | `feature/login` → `dev` |
| `spec/*` | `dev` | `spec/005-planner` → `dev` |
| `dev` | `main` | `dev` → `main` |
| `main` | ❌ No parent | Already at top |

## Safety Rules

1. **NEVER rebase if working tree is dirty** (uncommitted changes)
2. **NEVER rebase main branch** (it's the source of truth)
3. **NEVER force-push to main or dev** (protected branches)
4. **ALWAYS verify no conflicts before pushing**
5. **ALWAYS confirm rebase with user if conflicts detected**

## Workflow

### Step 1: Pre-Rebase Validation

```bash
# 1. Check for uncommitted changes
git status --porcelain

# 2. Get current branch
CURRENT_BRANCH=$(git branch --show-current)

# 3. Determine parent branch
# If feature/* or spec/* → parent is dev
# If dev → parent is main
# If main → ERROR (no parent)
```

**Validations:**
- ❌ Dirty working tree → Ask user to commit or stash
- ❌ Current branch is `main` → No rebase needed
- ❌ Detached HEAD → Cannot rebase
- ✅ Clean working tree + valid parent → Proceed

### Step 2: Fetch Latest Parent

```bash
# Fetch latest from remote
git fetch origin

# Get parent branch name
if [[ $CURRENT_BRANCH == feature/* ]] || [[ $CURRENT_BRANCH == spec/* ]]; then
  PARENT="dev"
elif [[ $CURRENT_BRANCH == "dev" ]]; then
  PARENT="main"
else
  echo "❌ Unknown branch pattern: $CURRENT_BRANCH"
  exit 1
fi
```

### Step 3: Check Divergence

```bash
# Count commits behind parent
BEHIND=$(git rev-list --count HEAD..origin/$PARENT)

# Count commits ahead of parent
AHEAD=$(git rev-list --count origin/$PARENT..HEAD)

echo "Current branch: $CURRENT_BRANCH"
echo "Parent branch: $PARENT"
echo "Commits behind: $BEHIND"
echo "Commits ahead: $AHEAD"
```

**Decision:**
- If `BEHIND = 0` → Already up-to-date, no rebase needed
- If `BEHIND > 0` → Rebase required

### Step 4: Present Status to User

```markdown
## Rebase Status

**Current branch:** feature/task-management
**Parent branch:** dev

📊 **Divergence:**
  - 5 commits behind dev
  - 12 commits ahead of dev

🔄 **Rebase will:**
  1. Fetch latest 'dev' from remote
  2. Replay your 12 commits on top of updated 'dev'
  3. Update your branch to include 5 new commits from 'dev'

⚠️ **Note:** If conflicts occur, you'll need to resolve them.

Proceed with rebase?
```

**Choices:**
1. Yes, rebase now
2. Show me what commits I'll be rebasing
3. No, cancel

### Step 5: Show Commits (If Requested)

```bash
# Show commits that will be rebased
git log --oneline origin/$PARENT..HEAD

# Example output:
# abc1234 feat(tasks): add filter UI
# def5678 fix(tasks): handle empty state
# ghi9012 refactor(tasks): extract hook
```

### Step 6: Perform Rebase

```bash
# Start interactive rebase
git rebase origin/$PARENT

# Check if conflicts occurred
if [ $? -ne 0 ]; then
  # Conflicts detected
  echo "⚠️ Conflicts detected during rebase"
  git status
fi
```

### Step 7: Handle Conflicts

If conflicts are detected:

```markdown
## Rebase Conflicts Detected

The following files have conflicts:
  📝 apps/web/src/components/TaskList.tsx
  📝 apps/web/src/hooks/useTasks.ts

**Your options:**
1. Open files and resolve conflicts manually
2. Abort rebase (go back to pre-rebase state)
3. Get help with conflict resolution

What would you like to do?
```

**Choices:**
1. I'll resolve conflicts (show me how)
2. Abort rebase
3. Show me the conflicting sections

#### Conflict Resolution Guide

```bash
# 1. View conflicting files
git status

# 2. Open file in editor and look for conflict markers:
# <<<<<<< HEAD (your changes)
# Your code here
# =======
# Their code here
# >>>>>>> origin/dev

# 3. Edit file to resolve conflict (remove markers, keep desired code)

# 4. Stage resolved file
git add <file>

# 5. Continue rebase
git rebase --continue

# If more conflicts, repeat steps 2-5
# When done, rebase completes automatically
```

#### Abort Rebase

```bash
# Abort and return to pre-rebase state
git rebase --abort
```

### Step 8: Verify Rebase Success

```bash
# Check status
git status

# Verify branch is clean
if [ -z "$(git status --porcelain)" ]; then
  echo "✅ Rebase completed successfully"
else
  echo "⚠️ Working tree not clean after rebase"
fi

# Show new commit graph
git log --oneline --graph -10
```

### Step 9: Push Rebased Branch

```markdown
## Rebase Complete ✅

Your branch 'feature/task-management' has been rebased onto 'dev'.

**Next step:** Push your rebased branch to remote.

⚠️ **IMPORTANT:** You'll need to force-push because rebase rewrites history.

**Command:**
  git push origin feature/task-management --force-with-lease

**Note:** `--force-with-lease` is safer than `--force` - it fails if someone else pushed to your branch.

Push now?
```

**Choices:**
1. Yes, push with --force-with-lease
2. No, I'll push manually later
3. Show me the changes first

### Step 10: Execute Force Push

```bash
# Force push with safety check
git push origin $CURRENT_BRANCH --force-with-lease

# Verify push succeeded
if [ $? -eq 0 ]; then
  echo "✅ Branch pushed successfully"
else
  echo "❌ Push failed. Check for errors above."
fi
```

### Step 11: Report Results

```markdown
## Rebase Complete! 🎉

✅ **Summary:**
  - Rebased 'feature/task-management' onto 'dev'
  - Applied 12 commits on top of latest 'dev'
  - Pushed to remote with --force-with-lease

📊 **Before:** 5 commits behind, 12 ahead
📊 **After:** 0 commits behind, 12 ahead

**Your branch is now up-to-date with dev!**

💡 **Next steps:**
  - Continue development, or
  - Create PR to merge into dev
```

## Pre-Rebase Checklist

```markdown
Before starting rebase:
- [ ] Working tree is clean (no uncommitted changes)
- [ ] Current branch is NOT main
- [ ] Know the parent branch (feature/spec → dev, dev → main)
- [ ] Fetched latest from remote
- [ ] Aware that force-push will be needed
```

## Conflict Resolution Strategies

### Strategy 1: Accept Theirs (Parent Branch)

```bash
# For specific file
git checkout --theirs <file>
git add <file>
git rebase --continue
```

### Strategy 2: Accept Ours (Current Branch)

```bash
# For specific file
git checkout --ours <file>
git add <file>
git rebase --continue
```

### Strategy 3: Manual Merge

```bash
# Edit file manually to combine both changes
# Remove conflict markers: <<<<<<<, =======, >>>>>>>
# Stage resolved file
git add <file>
git rebase --continue
```

### Strategy 4: Use Merge Tool

```bash
# Launch merge tool (if configured)
git mergetool

# After resolving
git rebase --continue
```

## Common Scenarios

### Scenario 1: Clean Rebase (No Conflicts)

```
Current: feature/new-ui (3 commits ahead, 2 behind dev)

Steps:
1. git fetch origin
2. git rebase origin/dev
   → Auto-applies all commits
3. git push origin feature/new-ui --force-with-lease

Result: ✅ Clean rebase, linear history
```

### Scenario 2: Conflicts During Rebase

```
Current: feature/refactor (10 commits ahead, 5 behind dev)

Steps:
1. git fetch origin
2. git rebase origin/dev
   → ⚠️ Conflict in file.ts
3. Resolve conflict in file.ts
4. git add file.ts
5. git rebase --continue
   → ⚠️ Another conflict in other.ts
6. Resolve conflict in other.ts
7. git add other.ts
8. git rebase --continue
   → ✅ Rebase complete
9. git push origin feature/refactor --force-with-lease

Result: ✅ Conflicts resolved, rebase complete
```

### Scenario 3: Abort on Too Many Conflicts

```
Current: feature/major-change (50 commits ahead, 30 behind dev)

Steps:
1. git fetch origin
2. git rebase origin/dev
   → ⚠️ 15 files with conflicts
3. User decides too complex
4. git rebase --abort
5. Consider merge strategy instead

Result: ❌ Rebase aborted, branch unchanged
```

### Scenario 4: Dev Rebasing onto Main

```
Current: dev (preparing for production release)

Steps:
1. git fetch origin
2. git rebase origin/main
   → Should be clean (dev is ahead of main)
3. git push origin dev --force-with-lease

Result: ✅ Dev updated with any hotfixes from main

⚠️ **Note:** This should be rare. Typically merge main → dev, not rebase.
```

## Error Handling

### Dirty Working Tree

```bash
# Check for changes
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working tree is dirty. Commit or stash changes first."
  git status
  exit 1
fi
```

**User Options:**
1. Commit changes now
2. Stash changes (`git stash`)
3. Cancel rebase

### Detached HEAD

```bash
# Check if in detached HEAD state
if [ "$(git symbolic-ref -q HEAD)" = "" ]; then
  echo "❌ In detached HEAD state. Checkout a branch first."
  exit 1
fi
```

### No Parent Branch

```bash
# Current branch is main
if [ "$CURRENT_BRANCH" = "main" ]; then
  echo "❌ Cannot rebase 'main' - it has no parent branch."
  exit 1
fi
```

### Force Push Rejected

```bash
# Someone else pushed to your branch
if ! git push origin $CURRENT_BRANCH --force-with-lease; then
  echo "⚠️ Force-push rejected. Someone else updated your branch."
  echo "Fetch latest and rebase again, or use --force (unsafe)."
fi
```

**User Options:**
1. Fetch and try rebase again
2. Force push anyway (dangerous)
3. Cancel and review remote changes

## Best Practices

### DO ✅

- Rebase feature branches before creating PR
- Use `--force-with-lease` instead of `--force`
- Resolve conflicts carefully (understand both changes)
- Communicate with team if rebasing shared branch
- Test after rebase to ensure no breakage

### DON'T ❌

- Rebase branches that others are working on
- Force-push to `main` or `dev` (protected)
- Rebase if you don't understand the changes
- Skip conflict resolution (leads to broken code)
- Rebase frequently if team uses merge workflow

## Alternative: Merge vs Rebase

### Use Rebase When:
- Working on personal feature branch
- Want clean linear history
- Feature branch is short-lived
- No one else is working on the branch

### Use Merge When:
- Multiple people on same branch
- Want to preserve branch history
- Long-lived feature branch
- Updating shared branches (dev, main)

```bash
# Merge alternative (preserves history)
git merge origin/dev
git push origin feature/my-branch
# No force-push needed
```

## Recovery

### If Rebase Goes Wrong

```bash
# Find commit before rebase started
git reflog

# Example reflog output:
# abc1234 HEAD@{0}: rebase finished: returning to refs/heads/feature/my-branch
# def5678 HEAD@{1}: rebase: commit message
# ghi9012 HEAD@{2}: checkout: moving from feature/my-branch to origin/dev

# Reset to before rebase (HEAD@{2} in example)
git reset --hard HEAD@{2}
```

### If Force-Push Was Wrong

```bash
# Check remote reflog (if available)
git reflog show origin/feature/my-branch

# Force-push previous state
git push origin HEAD@{1}:feature/my-branch --force
```

## Integration with Trackly Home Workflow

### Before Creating PR

1. Ensure branch is rebased with parent
2. All tests passing
3. Lint checks pass
4. Manual testing complete

```bash
# Typical PR preparation
git checkout feature/my-feature
git fetch origin
git rebase origin/dev
# Resolve conflicts if any
npm run lint && npm run build
git push origin feature/my-feature --force-with-lease
# Create PR: feature/my-feature → dev
```

### Before Merging to Production

```bash
# Ensure dev is up-to-date with main
git checkout dev
git fetch origin
git merge origin/main  # Use merge, not rebase for shared branches
git push origin dev
```

## Related Commands

```bash
# Interactive rebase (edit commits)
git rebase -i origin/dev

# Abort rebase
git rebase --abort

# Continue after resolving conflict
git rebase --continue

# Skip conflicting commit
git rebase --skip

# View rebase status
git status

# View reflog (recovery)
git reflog
```

## Summary

1. **Validate** - Clean working tree, valid parent branch
2. **Fetch** - Get latest from remote
3. **Rebase** - Apply commits on top of parent
4. **Resolve** - Handle conflicts if any
5. **Verify** - Check rebase succeeded
6. **Push** - Force-push with --force-with-lease
7. **Report** - Confirm completion to user
