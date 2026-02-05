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

This folder is currently empty. Add only temporary, in-progress documents here.

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
