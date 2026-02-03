---
name: branch-pruning
description: Prune local branches that no longer exist on remote. Use when cleaning up stale branches after PRs are merged. Always validates and confirms with user before deleting any branches.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git
allowed-tools: Bash(git:*) Read
---

# Branch Pruning Skill

Safely identify and remove local branches that have been deleted from remote (typically after PR merges).

## When to Use

- After merging PRs to clean up workspace
- Before starting new work to remove clutter
- When local branch list is out of sync with remote
- Periodic maintenance to keep branches organized

## Safety Rules

1. **NEVER delete branches without user confirmation**
2. **NEVER delete current branch**
3. **NEVER delete `main`, `dev`, or `master` branches**
4. **NEVER delete branches with unpushed commits** (warn user)
5. **Always show what will be deleted before deleting**

## Workflow

### Step 1: Identify Current Branch

```bash
# Get current branch
git branch --show-current
```

**Protection**: Never delete the branch you're currently on.

### Step 2: Update Remote Tracking

```bash
# Fetch and prune remote references
git fetch --prune

# Alternative: prune without fetching
git remote prune origin
```

This updates the local tracking of what exists remotely.

### Step 3: Find Stale Branches

```bash
# List branches whose remote tracking branch is gone
git branch -vv | grep ': gone]'
```

**Example output:**
```
  feature/old-task    abc1234 [origin/feature/old-task: gone] Fix: old bug
  spec/archived-spec  def5678 [origin/spec/archived-spec: gone] Add: archived feature
```

### Step 4: Parse and Categorize

Extract branch names and check for:

1. **Protected branches**: `main`, `dev`, `master`
2. **Current branch**: Don't show for deletion
3. **Unpushed commits**: Check if local is ahead

```bash
# Check if branch has unpushed commits
git rev-list --count origin/branch-name..branch-name 2>/dev/null
```

If count > 0, the branch has unpushed commits (WARN user).

### Step 5: Present Candidates to User

Format output clearly:

```markdown
## Stale Local Branches (Remote Deleted)

The following local branches no longer exist on remote:

✅ **Safe to delete** (fully merged):
  1. feature/task-123 (merged 5 days ago)
  2. spec/006-completed (merged 2 weeks ago)

⚠️ **Has unpushed commits** (review before deleting):
  3. feature/experimental (3 commits ahead of origin)

🔒 **Protected** (will NOT delete):
  - main, dev

🚫 **Current branch** (cannot delete):
  - feature/active-work

Would you like to delete the safe branches?
  [a] Delete all safe branches (1-2)
  [s] Select specific branches to delete
  [r] Review unpushed branches first
  [n] No, keep everything
```

### Step 6: Confirm Before Deletion

**ALWAYS use `ask_user` tool to confirm deletion.**

Present options:
- Delete all safe branches
- Select specific branches
- Review unpushed commits
- Cancel operation

### Step 7: Delete Confirmed Branches

```bash
# Delete local branch (force)
git branch -D <branch-name>
```

Use `-D` (force delete) because the remote is already gone.

### Step 8: Report Results

```markdown
## Pruning Complete

✅ Deleted (3 branches):
  - feature/task-123
  - spec/006-completed
  - feature/old-experiment

⚠️ Kept (unpushed commits):
  - feature/experimental (3 commits)

💡 Suggestion: Review unpushed branches with:
   git log origin/branch-name..branch-name
```

## Implementation Pattern

```bash
# 1. Safety check - get current branch
CURRENT_BRANCH=$(git branch --show-current)

# 2. Update remote tracking
git fetch --prune

# 3. Find stale branches
git branch -vv | grep ': gone]' | awk '{print $1}'

# 4. For each stale branch:
#    - Skip if protected (main, dev, master)
#    - Skip if current branch
#    - Check for unpushed commits
#    - Categorize as safe or needs-review

# 5. Present to user with ask_user tool

# 6. Delete only confirmed branches
git branch -D <confirmed-branch>

# 7. Report results
```

## Example Scenarios

### Scenario 1: All Branches Merged

```
User merged 3 feature PRs yesterday.

Output:
  ✅ feature/login-fix (merged)
  ✅ feature/add-footer (merged)
  ✅ spec/007-analytics (merged)

Confirmation: "Delete all 3 branches? [y/N]"
Result: Deleted 3 branches.
```

### Scenario 2: Mixed State

```
User has some merged, some with local work.

Output:
  ✅ feature/merged-pr (safe)
  ⚠️ feature/local-work (5 unpushed commits)
  
Confirmation: "Delete 'feature/merged-pr' only? Review 'feature/local-work'?"
Result: Deleted 1, kept 1 with warning.
```

### Scenario 3: Protected Branch

```
User accidentally deleted 'dev' remote branch.

Output:
  🔒 dev (protected - will NOT delete even if gone)
  
Result: No deletion, warn user about protected branch status.
```

## Error Handling

### Remote Not Found

```bash
if ! git remote get-url origin &>/dev/null; then
  echo "❌ No remote 'origin' configured"
  exit 1
fi
```

### No Stale Branches

```
✅ All local branches are up-to-date with remote.
No branches to prune.
```

### Git Errors

```bash
if [ $? -ne 0 ]; then
  echo "❌ Failed to delete branch: $branch_name"
  echo "Try manually: git branch -D $branch_name"
fi
```

## User Confirmation Template

Always use `ask_user` with clear options:

```
Found 5 stale local branches (remote deleted).

Safe to delete:
  • feature/task-101
  • feature/task-102
  • spec/005-archived

Has unpushed commits:
  • feature/wip (2 commits)
  • feature/experiment (7 commits)

What would you like to do?
```

**Choices:**
1. Delete all safe branches (3)
2. Let me select which to delete
3. Show me the unpushed commits first
4. Keep everything (no changes)

## Post-Pruning

After successful pruning:

```bash
# Show remaining branches
echo "Remaining local branches:"
git branch --list

# Optionally show remote branches
echo -e "\nRemote branches:"
git branch -r
```

## Recovery

If user accidentally confirms deletion:

```
⚠️ Branch deleted but commits are recoverable.

Recent branch delete:
  feature/my-work (SHA: abc1234)

To recover:
  git checkout -b feature/my-work abc1234

Commits are kept in reflog for ~30 days.
```

## Related Commands

```bash
# View all branches (local + remote)
git branch -a

# View merged branches (into current branch)
git branch --merged

# View unmerged branches
git branch --no-merged

# Manual prune (dry-run)
git remote prune origin --dry-run

# See reflog for recovery
git reflog
```

## Best Practices

1. **Always fetch first** - Ensures accurate remote state
2. **Check unpushed commits** - Prevent data loss
3. **Protect critical branches** - Never delete main/dev
4. **Confirm with user** - No automatic deletions
5. **Report clearly** - Show what was deleted, what was kept
6. **Provide recovery info** - SHA + reflog guidance

## Integration with Workflow

Run this skill:
- After merging multiple PRs
- Before starting a new feature cycle
- Weekly/monthly maintenance
- When branch list becomes cluttered

**Do NOT run:**
- When you have uncommitted work
- When you're unsure about branch state
- Before checking with team (shared repos)
