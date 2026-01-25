<!--
Sync Impact Report (2026-01-26):

Version Change: 1.1.0 → 1.2.0
Reason: Added script organization standards to enforce separation of migrations from utility/test scripts. MINOR version as this adds new structural guidance without changing existing principles.

Added Sections:
  - Script Organization - Mandatory structure for organizing scripts by function (azure/, github/, supabase/)
  - Script Placement Rules - Clear rules for where different script types belong

Modified Sections:
  - Development Workflow - Added Script Organization section before Branching Strategy

Templates Status:
  ✅ All existing templates remain compliant
  ✅ New script/supabase/ folder created and populated with test scripts
  ✅ Migration folder cleaned to only contain timestamped migrations

Follow-up Actions:
  - migrations/README.md updated to reference scripts/supabase/ for test scripts
  - scripts/supabase/README.md created to document test script purpose and usage

Previous Sync (2026-01-24):

Version Change: 1.0.0 → 1.1.0
Reason: Added secrets management pattern and clarified documentation guidelines. MINOR version as this adds new guidance without changing existing principles.

Added Sections:
  - Secrets Management - Standardized approach for credential storage and management
  - Enhanced Documentation Guidelines - Smart rules for when to use working_folder vs regular docs

Modified Sections:
  - Documentation - Expanded with intelligent routing rules for different document types

Templates Status:
  ✅ All existing templates remain compliant
  ✅ New secrets management pattern documented for future reference

Follow-up Actions:
  - None: Pattern established for future credential management
  - Recommendation: Consider adding .secrets folder to project template

-->
# Trackly Home Constitution

## Core Principles

### I. Security First
Security implications MUST be considered in all changes. This is non-negotiable.

- All tables MUST have Row Level Security (RLS) enabled
- Service role keys MUST never be exposed to client code
- Edge functions MUST validate authentication (verify_jwt = true) before privileged operations
- Invite tokens MUST be hashed in database (never stored in plaintext)
- CORS MUST be restricted to known origins only (no wildcard origins)
- No Personally Identifiable Information (PII) SHALL be written to application logs
- All changes MUST pass the security checklist before merge

**Rationale**: The application manages private household data. A single data leak could expose sensitive family information across households. Security must be enforced at every layer: database (RLS), function (auth validation), and client (no secrets).

### II. Vertical Slices
Deliver working features end-to-end. Each user story MUST be independently implementable, testable, and deliverable.

- Features MUST be broken down into prioritized user stories (P1, P2, P3...)
- Each user story MUST deliver standalone value (minimal viable product increment)
- User stories MUST be independently testable without requiring other stories
- Implementation MUST follow: Foundation → Story 1 → Story 2 → Story 3 (each deliverable)
- Each story checkpoint MUST validate independent functionality before proceeding

**Rationale**: Vertical slices enable incremental delivery, reduce integration risk, allow early user feedback, and ensure the team can ship value at any point. This aligns with the MVP approach documented in the PRD where Phase 1 delivered RBAC independently.

### III. Minimal Changes
Make the smallest change that solves the problem. Avoid over-engineering.

- Prefer simple, direct solutions over complex abstractions
- Start with simple implementations; refactor when actual need emerges (YAGNI principle)
- Reject adding features or infrastructure "just in case" or "for future use"
- Complexity MUST be justified explicitly (see Governance section)
- Each PR SHOULD focus on a single concern

**Rationale**: Over-engineering slows development, introduces bugs, and makes code harder to maintain. The project follows an MVP approach with clear phase gates—features outside current MVP scope are explicitly deferred.

### IV. Document As You Go
Update documentation with each change. Documentation is part of "done."

- Database changes MUST update migration README
- API/function changes MUST update inline documentation (JSDoc/comments)
- User-facing features MUST update PRD requirements status
- Breaking changes MUST be documented with migration path
- Task completion MUST update PROJECT_TRACKER.md with completion date and notes
- Follow Minimal Documentation Policy: One README per top-level folder; no READMEs in subfolders; no unnecessary summary documents

**Rationale**: Outdated documentation causes confusion and errors. Updating docs as you code ensures accuracy and captures context while fresh. The Minimal Documentation Policy prevents documentation sprawl.

### V. Test Before Deploy
Validate all changes locally before merging. No untested code SHALL reach shared branches.

- Manual smoke test MUST pass for affected features
- `npm run build` MUST pass without errors (frontend)
- `npm run lint` MUST pass (frontend)
- Supabase functions MUST be tested locally (if changed)
- RLS policies MUST be tested with SQL queries (if changed)
- For new features: tests written first, verify tests fail, then implement (Red-Green-Refactor when tests required)

**Rationale**: Catching errors locally is faster and cheaper than debugging in deployed environments. The project currently relies on manual testing (Phase 1 complete); automated testing is planned for later phases.

## Security Requirements

### Defense in Depth
Security MUST be enforced at multiple layers: database (RLS), server (Edge Functions), and client (UI validation).

### Least Privilege
Users MUST only access their own household data. Cross-household data leaks are zero-tolerance violations.

### Role Hierarchy
```
Owner  → Full control, can transfer ownership (future)
  ↓
Admin  → Can invite members, manage roles (except owner)
  ↓
Member → Read household data, use features
```

### Security Constraints
1. **Cannot remove last admin**: Database trigger prevents this
2. **Tokens are single-use**: Invites invalidated after acceptance
3. **Tokens expire**: 7-day expiry on all invites
4. **No secrets in client**: Service role key never exposed to browser
5. **Standardized errors**: Error responses MUST NOT leak internal implementation details

### Audit Requirements
- All RLS policies MUST be reviewed before production deployment
- Helper functions MUST be tested for recursion/infinite loops
- CORS allowlist MUST be verified for each environment

## Secrets Management

### Standardized Secrets Pattern
All project secrets MUST be stored in a `.secrets/` folder at the repository root.

**Structure**:
```
.secrets/
├── .env.dev          # Development environment secrets
├── .env.prod         # Production environment secrets
└── README.md         # Documentation for secrets setup
```

**Requirements**:
- `.secrets/` folder MUST be added to `.gitignore` (entire folder ignored)
- Environment files MUST use standard `.env` format (KEY=VALUE)
- All required secrets MUST be documented in `.secrets/README.md`
- Secrets MUST be environment-specific (no shared secrets between dev/prod)
- No secrets SHALL be committed to version control

**Setup Process**:
1. Create `.secrets/` folder with required `.env` files
2. Document all required secrets in README.md
3. Add `.secrets/` to `.gitignore`
4. Fill secrets manually or via automated setup scripts
5. Validate secrets are loaded correctly in each environment

**Rationale**: Centralized secret management prevents credential sprawl, ensures environment isolation, and provides clear documentation for team members. The `.secrets/` pattern establishes a consistent approach for all future credential management.

## Development Workflow

### Script Organization
All utility scripts MUST be organized by function under the `scripts/` directory. Database migration scripts are the ONLY exception and belong in the migrations folder.

**Required Structure**:
```
scripts/
├── azure/        # Azure deployment and infrastructure scripts
├── github/       # GitHub Actions, secrets, OIDC setup scripts
└── supabase/     # Supabase testing, data generation, utility scripts
```

**Script Placement Rules**:
- **Migration scripts ONLY**: `supabase/migrations/` - Timestamped migration files only (format: `YYYYMMDDHHMMSS_00X_description.sql`, e.g., `20260125021436_009_tasks_table.sql`)
- **Test scripts**: `scripts/supabase/` - RLS tests, performance tests, data validation
- **Data generation**: `scripts/supabase/` - Seed data, dummy data, test fixtures
- **One-off utilities**: `scripts/supabase/` - Manual queries, cleanup scripts, investigation tools
- **Azure operations**: `scripts/azure/` - Deployment, configuration, infrastructure
- **GitHub automation**: `scripts/github/` - Repository setup, secrets management, OIDC

**Migration Naming Convention**:
- Format: `YYYYMMDDHHMMSS_00X_description.sql`
- `YYYYMMDDHHMMSS`: Timestamp when migration was created
- `00X`: Sequential 3-digit migration number with leading zeros (001, 002, 003, etc.)
- `description`: Snake_case description of the migration purpose
- Examples: `20260106203424_001_profiles.sql`, `20260125021436_009_tasks_table.sql`

**Rationale**: Separating migrations from utility scripts ensures migration directories remain clean and only contain schema changes. This prevents confusion during deployment and makes it clear which files are automatically applied by migration tools versus which require manual execution.

### Branching Strategy
| Branch | Purpose | Base | Merges To |
|--------|---------|------|-----------|
| `main` | Production code | — | — |
| `dev` | Integration branch | main | main |
| `feat/*` | New features | dev | dev |
| `fix/*` | Bug fixes | dev | dev |
| `docs/*` | Documentation | dev | dev |
| `hotfix/*` | Production fixes | main | main + dev |

**Branch Naming**: `type/short-description` (e.g., `feat/task-list-ui`, `fix/invite-token-expiry`)

### Commit Guidelines
MUST use conventional commits: `type(scope): description`

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
- `feat(invite): add email validation to invite flow`
- `fix(auth): handle expired session gracefully`
- `docs(readme): update local development instructions`

### Pre-Merge Checklist
Every PR MUST satisfy:
- [ ] Code compiles without errors
- [ ] No console warnings
- [ ] Changes tested locally (per Principle V)
- [ ] Commit messages follow convention
- [ ] Documentation updated (per Principle IV)
- [ ] Security checklist completed (per Principle I)

### Deployment Process
- **Dev environment**: Automatic on push to `dev` branch
- **Production**: Manual workflow dispatch (future) with approval gate
- Pre-deployment: All tests passing, manual smoke test complete, security review, documentation updated, tracker updated
- Post-deployment: Site loads without errors, login flow works, console clean, Supabase logs clean

## Governance

### Supremacy
This constitution supersedes all other practices and informal agreements. When conflicts arise, this document governs.

### Amendment Process
1. Proposed changes MUST be documented with rationale
2. Version MUST be incremented per semantic versioning:
   - **MAJOR**: Backward incompatible governance/principle removals or redefinitions
   - **MINOR**: New principle/section added or materially expanded guidance
   - **PATCH**: Clarifications, wording, typo fixes, non-semantic refinements
3. Amendment date MUST be updated to ISO format (YYYY-MM-DD)
4. Sync Impact Report MUST be prepended documenting:
   - Version change and rationale
   - Modified/added/removed principles or sections
   - Templates requiring updates
   - Follow-up actions
5. Dependent artifacts (templates, agent files, documentation) MUST be validated and updated

### Complexity Justification
When a change violates a core principle (e.g., Minimal Changes), it MUST be justified in the implementation plan under "Complexity Tracking":

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [specific violation] | [current need] | [why simpler approach insufficient] |

### Compliance Verification
- All PRs MUST be reviewed against this constitution
- Reviewers MUST verify: security requirements, documentation updates, test coverage, minimal change principle
- Feature plans MUST include "Constitution Check" section (see plan-template.md)
- Unjustified complexity or principle violations SHALL be rejected

### Technology Constraints
The project's technology stack is defined in README.md and PRD:
- **Frontend**: Vite + React 18 + TypeScript + Tailwind CSS
- **Backend**: Supabase (Auth, PostgreSQL, Edge Functions - Deno)
- **Hosting**: Azure Static Web Apps
- **CI/CD**: GitHub Actions

### Documentation

#### Intelligent Document Routing
Documents MUST be routed based on their purpose and longevity:

<!--
**Permanent Documentation** (goes in regular docs/):
- Specification documents (specs, PRDs, requirements)
- API documentation and contracts
- Architecture decisions and design docs
- User guides and setup instructions
- Migration guides and breaking change docs
- README files for top-level folders
-->

**Working Documents** (goes in docs/working_folder/):
- Temporary summaries and status reports
- Meeting notes and discussion transcripts
- Exploratory research and investigation docs
- Draft specifications before finalization
- One-off analysis or debugging documents
- Agent-generated summaries without long-term value

#### Routing Rules
- **Spec Documents**: Always follow the current rules
- **Summary Documents**: If created by agents and don't add long-term value → docs/working_folder/
- **Research Documents**: If exploratory/investigative → docs/working_folder/
- **Status Reports**: Temporary updates → docs/working_folder/
- **API Contracts**: Permanent reference → docs/
- **User Documentation**: Permanent value → docs/

#### Guidelines
- If you build any documentation that is like a working document, always create it within working_folder under docs.
- Always ask if you are about to create some sort of project summary document.
- Follow Minimal Documentation Policy: One README per top-level folder; no READMEs in subfolders; no unnecessary summary documents

**Rationale**: Different document types have different lifecycles. Permanent docs need version control and maintenance, while working docs are temporary and shouldn't clutter the main documentation structure.

**Version**: 1.2.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-26
