---
name: documentation-sync
description: Comprehensive documentation synchronization before PR to main. Use when preparing a PR from dev or feature branch to main. Ensures all internal docs (README, PRD, PROJECT_TRACKER, spec files, folder READMEs) are current and consistent with code changes.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git, Node.js for build validation
allowed-tools: Bash(git:*) Bash(npm:*) Read Edit
---

# Documentation Sync Skill

Synchronize all internal documentation before creating a PR to main branch.

## When to Use

- **Before PR to main** - Primary use case
- After completing a feature branch
- When preparing for release
- During documentation audits
- Before deployment to production

## Documentation Scope

This skill ensures consistency across:

1. **Root Documentation**
   - `README.md`
   - `docs/TRACKLY_HOME_PRD.md`
   - `docs/PROJECT_TRACKER.md`

2. **Folder READMEs**
   - `apps/web/README.md`
   - `supabase/README.md`
   - `supabase/migrations/README.md`
   - `supabase/functions/README.md`
   - `.github/workflows/README.md`

3. **Specification Docs**
   - `specs/###-feature/spec.md`
   - `specs/###-feature/plan.md`
   - `specs/###-feature/tasks.md`

4. **Configuration**
   - `apps/web/.env.example`
   - `.secrets/README.md` (if exists)

## Pre-Sync Checklist

```bash
# 1. Verify you're not on main
git branch --show-current  # Should NOT be main

# 2. All changes committed
git status  # Should be clean

# 3. Build passes
cd apps/web && npm run build

# 4. Lint passes
npm run lint
```

## Synchronization Steps

### Step 1: Code State Analysis

Analyze what has changed to determine documentation updates needed:

```bash
# Get branch name
CURRENT_BRANCH=$(git branch --show-current)

# Compare to main
git diff main...HEAD --name-only

# Group by area
git diff main...HEAD --name-only | grep "supabase/migrations" || echo "No DB changes"
git diff main...HEAD --name-only | grep "supabase/functions" || echo "No function changes"
git diff main...HEAD --name-only | grep "apps/web/src" || echo "No frontend changes"
git diff main...HEAD --name-only | grep "\.github/workflows" || echo "No workflow changes"
```

### Step 2: Update PROJECT_TRACKER.md

Location: `docs/PROJECT_TRACKER.md`

Update phase status and add completion notes in "Notes & Decisions" section.

### Step 3: Update PRD Requirements

Location: `docs/TRACKLY_HOME_PRD.md`

Mark requirements complete and update MVP status section.

### Step 4: Update Root README.md

Update phase status table and verify deployment badges.

### Step 5: Update Database Migration README

Location: `supabase/migrations/README.md`

Document new migrations with RLS policies, indexes, and testing notes.

### Step 6: Update Edge Functions README

Location: `supabase/functions/README.md`

Document new/modified functions with request/response formats, error codes, and testing examples.

### Step 7: Update Frontend README

Location: `apps/web/README.md`

Document new components, screens, and services.

### Step 8: Update GitHub Workflows README

Location: `.github/workflows/README.md`

Document new/modified workflows.

### Step 9: Update Environment Variables

Location: `apps/web/.env.example`

Add new environment variables with comments.

### Step 10: Update Spec Files

Mark tasks complete in `tasks.md`, add completion notes to `spec.md` and `plan.md`.

### Step 11: Verify Documentation Consistency

```bash
# Check for TODO/FIXME markers
grep -r "TODO\|FIXME\|XXX\|HACK" docs/ specs/ README.md

# Check for placeholder text
grep -r "\[TBD\]\|\[TODO\]\|\[XXX\]" docs/

# Check for outdated dates
grep -r "2025" docs/ README.md

# Check for broken internal links
grep -r "\[.*\](.*\.md)" docs/ README.md
```

## Post-Sync Validation

```markdown
- [ ] PROJECT_TRACKER.md phase status updated
- [ ] PRD requirements marked complete
- [ ] Root README.md phase table updated
- [ ] Migration README updated (if DB changes)
- [ ] Functions README updated (if function changes)
- [ ] Frontend README updated (if components added)
- [ ] Workflows README updated (if workflows changed)
- [ ] .env.example updated (if new env vars)
- [ ] Spec files marked complete (if spec branch)
- [ ] No TODO/FIXME in documentation
- [ ] No placeholder text remaining
- [ ] Dates current (no 2025 references)
```

## Quick Reference

### Files to Always Check

1. `docs/PROJECT_TRACKER.md` - Phase status
2. `docs/TRACKLY_HOME_PRD.md` - Requirements
3. `README.md` - Phase table
4. `supabase/migrations/README.md` - If DB changes
5. `supabase/functions/README.md` - If function changes

### Commands to Run

```bash
# Verify build
cd apps/web && npm run build && npm run lint

# Check git status
git status
git diff main...HEAD --name-only
```
