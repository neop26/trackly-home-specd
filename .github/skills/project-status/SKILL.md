````skill
---
name: project-status
description: Get quick insight into project state, last commit, current phase, and expected work. Use when resuming work after a break, validating if a feature request exists in PRD, or checking what should be finished next.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Requires git
allowed-tools: Bash(git:*) Read
---

# Project Status Skill

Provides quick context for resuming work on Trackly Home after any break.

## When to Use

- Resuming work after hours/days away
- Starting a new development session
- Checking if a feature request is already tracked
- Understanding what should be completed next
- Validating current priorities against PRD

## Quick Status Check

Run these commands to get current project state:

### 1. Last Commit Context

```bash
# Show last 5 commits with dates and messages
git log --oneline -5 --date=short --format="%h %ad %s"

# Show last commit details
git log -1 --stat
```

### 2. Current Branch and Phase

```bash
# Current branch
git branch --show-current

# Check if on feature branch
git branch --show-current | grep -E "^[0-9]{3}-" && echo "On feature branch"
```

### 3. Read Project Status

Check these files in order:

1. **PROJECT_TRACKER.md** - Current phase, task status, what's in progress
2. **TRACKLY_HOME_PRD.md** - MVP status, next milestones, feature scope

## Status Summary Template

When resuming work, compile this summary:

```markdown
## Session Resume Summary

**Date:** [Today's date]
**Last Commit:** [hash] - [message] ([date])
**Current Branch:** [branch name]
**Current Phase:** Phase [X] - [Name] ([progress]%)

### What Was In Progress
- [Task ID]: [Description] - [Status]
- [Task ID]: [Description] - [Status]

### Next Priority Tasks
1. [Task ID]: [Description]
2. [Task ID]: [Description]

### Blockers (if any)
- [Description of blocker]
```

## Feature Request Validation

When a new feature or request is mentioned, check if it exists:

### Step 1: Search PRD

```bash
# Search for feature in PRD
grep -i "[feature keyword]" docs/TRACKLY_HOME_PRD.md
```

### Step 2: Search PROJECT_TRACKER

```bash
# Search for feature in tracker
grep -i "[feature keyword]" docs/PROJECT_TRACKER.md
```

### Step 3: Decision Matrix

| PRD Status | Tracker Status | Action |
|------------|----------------|--------|
| Not found | Not found | Add to PRD as new version item (Not Started) |
| Found (✅ MVP) | Found (🟢 Done) | Already implemented |
| Found (⏳ V1) | Not found | Already planned for V1 |
| Found (🔮 V2) | Not found | Already planned for V2 |
| Not found | Found | Inconsistency - sync PRD with tracker |

### Step 4: Add New Feature to PRD

If feature doesn't exist, add to `docs/TRACKLY_HOME_PRD.md`:

1. Find the appropriate version section (V1/V2/V3)
2. Add as new requirement with status `⏳ [Version]`
3. Use next available requirement ID (FR-X.X, NFR-X.X)

Example:
```markdown
| FR-11.1 | [Feature description] | ⏳ V2 | P2 |
```

## Project Tracker Structure

### Current Phase Location

```markdown
## Quick Status Overview

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| Phase 6 | Task Editing | 🟡 In Progress | 85% |
```

### Active Tasks Location

Look for `🟡 In Progress` status in current phase section:

```markdown
| 6.7 | Performance optimization | P1 | 🟡 In Progress | 2026-02-15 |
```

### Notes & Decisions Section

Contains session summaries and key decisions:

```markdown
## Notes & Decisions

### 2026-02-03 - Phase 6 85% Complete 🟡
- **Task Editing Features Complete**: All core editing functionality
```

## PRD Structure

### MVP Status Section

```markdown
## 4. MVP Status

| Phase | Feature | Status |
|-------|---------|--------|
| 6 | Task Editing & Filters | 🟡 85% Complete |
```

### Version Roadmaps

- **V1 Release Roadmap** (Section 11) - Next release features
- **V2 Vision** (Section 12) - Medium-term features
- **V3 Vision** (Section 13) - Long-term vision

## Workflow: New Feature Request

When user requests a feature not in PRD/Tracker:

### 1. Validate Request
```
Is this feature:
- [ ] Within project scope (household coordination)?
- [ ] Not already implemented?
- [ ] Not already planned (V1/V2/V3)?
```

### 2. Determine Version Fit

| Complexity | User Impact | Timeline | Version |
|------------|-------------|----------|---------|
| Low | High | Urgent | V1 |
| Medium | Medium | Soon | V1/V2 |
| High | Any | Can wait | V2/V3 |
| Requires research | Any | Unknown | V2/V3 |

### 3. Add to PRD

Location: Appropriate section in `docs/TRACKLY_HOME_PRD.md`

**V1 Features** → Section 11 (V1 Release Roadmap)
**V2 Features** → Section 12 (V2 Vision)
**V3 Features** → Section 13 (V3 Vision)

Add:
```markdown
### [Feature Category]

| ID | Requirement | Status | Priority |
|----|-------------|--------|----------|
| FR-X.X | [Description] | 🔴 Not Started | P[X] |
```

### 4. Notify User

```markdown
Added "[Feature name]" to PRD as V[X] feature:
- ID: FR-X.X
- Status: 🔴 Not Started
- Priority: P[X]

This will be tracked for the V[X] release.
```

## Session Handoff Template

Before ending a session, update PROJECT_TRACKER.md:

```markdown
### [Date] - Session Summary

**Completed:**
- [Task X.X]: [What was done]

**In Progress:**
- [Task X.X]: [Current state, blockers]

**Next Session:**
- [ ] [Specific next step]
- [ ] [Specific next step]
```

## Quick Commands Reference

```bash
# Full status check
git log -1 --format="%h %ad %s" --date=short && \
  echo "Branch: $(git branch --show-current)" && \
  head -30 docs/PROJECT_TRACKER.md

# Search for feature
grep -i "keyword" docs/TRACKLY_HOME_PRD.md docs/PROJECT_TRACKER.md

# Check current phase tasks
grep -A 20 "## Phase 6" docs/PROJECT_TRACKER.md

# Check MVP status
grep -A 15 "## 4. MVP Status" docs/TRACKLY_HOME_PRD.md
```

## File Locations

| Document | Purpose | Path |
|----------|---------|------|
| Project Tracker | Current state, tasks, phases | `docs/PROJECT_TRACKER.md` |
| PRD | Requirements, roadmap, vision | `docs/TRACKLY_HOME_PRD.md` |
| Constitution | Core principles, governance | `.specify/memory/constitution.md` |
| Current Spec | Active feature specification | `specs/[current-feature]/` |

## Integration with Other Skills

- **feature-development**: After validating feature exists, use this skill to implement
- **documentation**: After adding feature to PRD, keep docs in sync
- **code-review**: Reference PRD requirements in review comments

````