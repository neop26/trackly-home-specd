---
agent: speckit.constitution
---

## Goal

View, validate, or update the project constitution (`.specify/memory/constitution.md`). The constitution defines non-negotiable principles and governance rules for Trackly Home.

## User Input

```text
$ARGUMENTS
```

The user input specifies the action:
- **view**: Display current constitution
- **validate**: Check artifacts against constitution
- **update**: Propose amendments (requires explicit approval)

## Execution Steps

### 1. Load Constitution

Read `.specify/memory/constitution.md` and parse:
- Core Principles (I-V)
- Security Requirements
- Development Workflow
- Governance rules

### 2. Handle Action

#### View Action

Display the constitution with a summary:

```
## Trackly Home Constitution v1.0.0

**Core Principles:**
1. Security First - Security implications MUST be considered in all changes
2. Vertical Slices - Deliver working features end-to-end independently
3. Minimal Changes - Make the smallest change that solves the problem
4. Document As You Go - Documentation is part of "done"
5. Test Before Deploy - Validate all changes locally before merging

**Security Requirements:**
- Defense in depth (DB + server + client)
- Least privilege (household isolation)
- Role hierarchy: owner → admin → member

**Development Workflow:**
- Branching: main ← dev ← feat/fix/docs
- Commits: conventional commits required
- Deploy: auto to dev, manual to prod

**Governance:**
- Constitution supersedes all other practices
- Amendments require versioning and documentation
```

#### Validate Action

Check current feature artifacts against constitution:

```bash
cd /Users/neop26/repo/trackly-home-specd && .specify/scripts/bash/check-prerequisites.sh --json --include-tasks
```

For each artifact, verify:

**spec.md**:
- [ ] User stories are independently testable (Vertical Slices)
- [ ] Security requirements considered (Security First)
- [ ] Scope is appropriately limited (Minimal Changes)

**plan.md**:
- [ ] RLS policies defined for new tables (Security First)
- [ ] Local testing approach documented (Test Before Deploy)
- [ ] Constitution Check section completed

**tasks.md**:
- [ ] Documentation tasks included (Document As You Go)
- [ ] Security verification tasks included (Security First)
- [ ] Tasks can be implemented incrementally (Vertical Slices)

Report violations:

```
## Constitution Validation Report

**Spec**: ✅ Compliant
**Plan**: ⚠️ 1 violation
  - Missing: Constitution Check section not filled
**Tasks**: ✅ Compliant

Recommendation: Update plan.md with Constitution Check before proceeding.
```

#### Update Action

**WARNING**: Constitution changes are high-impact. Require explicit approval.

1. Identify proposed change
2. Validate against governance rules:
   - Must document rationale
   - Must increment version appropriately
   - Must update dependent artifacts

3. Present change for approval:

```
## Proposed Constitution Amendment

**Current version**: 1.0.0
**Proposed version**: 1.1.0 (MINOR - adding new principle)

**Change**:
Add principle VI: "Accessibility First"
- All UI components MUST be keyboard navigable
- All images MUST have alt text
- Color contrast MUST meet WCAG AA

**Rationale**: [User provided]

**Impact**:
- Templates: spec-template.md needs accessibility section
- Checklists: Add accessibility checklist items
- Existing features: Audit needed

**Approve this change? (yes/no)**
```

### 3. Output

Based on action, provide:
- **view**: Formatted constitution summary
- **validate**: Compliance report with recommendations
- **update**: Amendment proposal awaiting approval

---

## Trackly Home Constitution Reference

### Principle I: Security First

**MUST**:
- All tables have RLS enabled
- Service role keys never exposed to client
- Edge functions validate authentication
- Invite tokens hashed before storage
- CORS restricted to known origins
- No PII in logs

### Principle II: Vertical Slices

**MUST**:
- User stories prioritized (P1, P2, P3)
- Each story independently deliverable
- Each story independently testable
- Checkpoints after each story

### Principle III: Minimal Changes

**MUST**:
- Start simple, refactor when needed
- Reject "just in case" features
- Complexity explicitly justified

### Principle IV: Document As You Go

**MUST**:
- DB changes → migration README
- API changes → inline docs
- Feature changes → PRD update
- Task completion → tracker update
- One README per top-level folder only

### Principle V: Test Before Deploy

**MUST**:
- Manual smoke test passing
- `npm run build` passing
- `npm run lint` passing
- Supabase functions tested locally
- RLS policies tested with SQL queries

### Governance

- Constitution supersedes all practices
- Amendments require: documentation, version increment, artifact updates
- Version format: MAJOR.MINOR.PATCH
  - MAJOR: Breaking governance changes
  - MINOR: New principles/sections
  - PATCH: Clarifications/typos

