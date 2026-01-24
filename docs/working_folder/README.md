# Working Documents Folder

**Purpose**: Temporary working documents per Constitution documentation routing guidelines  
**Version**: 1.0  
**Last Updated**: 2026-01-25

---

## What Goes Here

Per the [Constitution (v1.1.0)](../../.specify/memory/constitution.md#intelligent-document-routing), this folder contains **working documents** - temporary files that don't have long-term value:

### Working Documents (belongs in this folder):
- ✅ Temporary summaries and status reports
- ✅ Meeting notes and discussion transcripts
- ✅ Exploratory research and investigation docs
- ✅ Draft specifications before finalization
- ✅ One-off analysis or debugging documents
- ✅ Agent-generated summaries without long-term value

### Permanent Documentation (goes in `docs/` root or other locations):
- ❌ Specification documents (specs, PRDs, requirements) → `specs/`
- ❌ API documentation and contracts → `docs/` or `.github/`
- ❌ Architecture decisions and design docs → `docs/`
- ❌ User guides and setup instructions → `docs/`
- ❌ Migration guides and breaking change docs → `docs/`
- ❌ README files for top-level folders → respective folder roots

---

## Current Contents

### `/testing-guides/` - Deploy Discipline Testing Procedures
**Created**: 2026-01-24  
**Purpose**: One-time validation procedures for Deploy Discipline feature (004)  
**Lifecycle**: Temporary - delete after feature testing complete and merged

Contains step-by-step test validation guides for CI/CD workflows:
- [README.md](testing-guides/README.md) - Testing orchestration
- [PR_QUALITY_GATES_TEST.md](testing-guides/PR_QUALITY_GATES_TEST.md) - Phase 1 validation
- [SWA_PRODUCTION_DEPLOY_TEST.md](testing-guides/SWA_PRODUCTION_DEPLOY_TEST.md) - Phase 3 validation
- [SUPABASE_PRODUCTION_DEPLOY_TEST.md](testing-guides/SUPABASE_PRODUCTION_DEPLOY_TEST.md) - Phase 4 validation

**Action After Use**: Once all tests pass and feature merges, delete this folder.

---

### `SESSION_SUMMARY_2026-01-24.md` - Agent Analysis Report
**Created**: 2026-01-24  
**Type**: Agent-generated summary  
**Lifecycle**: Temporary - informational snapshot

Contains comprehensive feature analysis and progress summary from GitHub Copilot agent session. Useful for context during active development, but has no long-term value after feature completion.

**Action After Feature Close**: Delete or archive.

---

## Maintenance Guidelines

### When to Clean Up
- **After feature completion**: Delete feature-specific working docs (e.g., testing guides)
- **After PR merge**: Delete draft specifications and exploratory research
- **Monthly review**: Archive or delete old session summaries and meeting notes

### What to Keep Temporarily
- Documents actively referenced in current work
- Testing procedures for in-flight features
- Research docs supporting active development decisions

### What to Delete Immediately
- Completed test procedures (after tests pass)
- Outdated session summaries (>1 month old)
- Draft specs that have been finalized and moved to proper location

---

## Why This Folder Exists

From Constitution v1.1.0:

> **Rationale**: Different document types have different lifecycles. Permanent docs need version control and maintenance, while working docs are temporary and shouldn't clutter the main documentation structure.

This separation:
- ✅ Prevents documentation sprawl in main `docs/` folder
- ✅ Makes it clear which docs have long-term value
- ✅ Simplifies cleanup after feature completion
- ✅ Maintains clean documentation structure

---

## Questions?

See [Constitution - Documentation Section](../../.specify/memory/constitution.md#documentation) for complete routing rules.
