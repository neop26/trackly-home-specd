---
agent: speckit.analyze
---

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command runs after `/speckit.tasks` has produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do NOT modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any edits).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is non-negotiable. Constitution conflicts are automatically CRITICAL.

## User Input

```text
$ARGUMENTS
```

## Execution Steps

### 1. Initialize Analysis Context

Run the prerequisite checker:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json --require-tasks --include-tasks
```

Parse JSON for `FEATURE_DIR` and `AVAILABLE_DOCS`. Derive paths:
- `SPEC = FEATURE_DIR/spec.md`
- `PLAN = FEATURE_DIR/plan.md`
- `TASKS = FEATURE_DIR/tasks.md`

Abort if any required file is missing.

### 2. Load Artifacts

**From spec.md:**
- Functional Requirements (FR-*)
- User Stories with priorities
- Edge Cases
- Success Criteria

**From plan.md:**
- Architecture/stack choices
- Data Model references
- Technical constraints

**From tasks.md:**
- Task IDs and descriptions
- Phase grouping
- Parallel markers [P]
- File paths

**From constitution:**
- Load `.specify/memory/constitution.md` for principle validation

### 3. Detection Passes

#### A. Duplication Detection
- Near-duplicate requirements
- Redundant tasks

#### B. Ambiguity Detection
- Vague terms without metrics (fast, scalable, secure, intuitive)
- Unresolved placeholders (TODO, TKTK, ???, `[NEEDS CLARIFICATION]`)

#### C. Underspecification
- Requirements missing measurable outcomes
- User stories missing acceptance criteria
- Tasks referencing undefined files/components

#### D. Constitution Alignment
Check against Trackly Home principles:
- **Security First**: Are RLS policies specified? Auth validation included?
- **Vertical Slices**: Can each user story be delivered independently?
- **Minimal Changes**: Any over-engineering detected?
- **Document As You Go**: Documentation tasks included?
- **Test Before Deploy**: Testing approach defined?

#### E. Coverage Gaps
- Requirements with zero associated tasks
- Tasks with no mapped requirement
- Non-functional requirements not in tasks (performance, security)

#### F. Inconsistency
- Terminology drift (same concept named differently)
- Data entities in plan but not spec (or vice versa)
- Task ordering contradictions

### 4. Severity Assignment

- **CRITICAL**: Violates constitution MUST, missing core artifact, zero coverage for baseline functionality
- **HIGH**: Duplicate/conflicting requirement, ambiguous security attribute, untestable criterion
- **MEDIUM**: Terminology drift, missing non-functional coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy

### 5. Output Report

```markdown
## Specification Analysis Report

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L20-35 | Similar requirements... | Merge into single FR |

**Coverage Summary:**

| Requirement | Has Task? | Task IDs | Notes |
|-------------|-----------|----------|-------|
| FR-001 | ✅ | T004, T005 | — |
| FR-002 | ❌ | — | Missing implementation |

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**
- Total Requirements: X
- Total Tasks: Y
- Coverage %: Z%
- Critical Issues: N
```

### 6. Next Actions

- If CRITICAL issues exist: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed with improvements suggested
- Suggest specific commands: e.g., "Run /speckit.specify with refinement", "Edit tasks.md to add coverage"

### 7. Offer Remediation

Ask: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply automatically.)

## Trackly Home Specific Checks

**Security Requirements** (always verify):
- [ ] New tables have RLS policies in tasks
- [ ] Edge functions include JWT validation
- [ ] No service key exposure planned
- [ ] Invite tokens hashed before storage

**Data Model Consistency**:
- [ ] Entities match between spec, plan, and existing schema
- [ ] Foreign keys reference existing tables (profiles, households, household_members, invites)
- [ ] Role references use existing enum (owner, admin, member)

**Path Conventions**:
- [ ] Frontend paths use `apps/web/src/...`
- [ ] Migrations use `supabase/migrations/...`
- [ ] Functions use `supabase/functions/...`

