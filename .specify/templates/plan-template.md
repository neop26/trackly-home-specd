# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command.

## Summary

[Extract from feature spec: primary requirement + technical approach from research]

## Technical Context

<!--
  TRACKLY HOME DEFAULTS:
  Most features will use these values. Adjust only if needed.
-->

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: React 18, Tailwind CSS, @supabase/supabase-js  
**Storage**: PostgreSQL (via Supabase) with RLS  
**Testing**: Manual testing (future: Vitest, Playwright)  
**Target Platform**: Web (Azure Static Web Apps)  
**Project Type**: web (frontend in apps/web, backend in supabase)  
**Performance Goals**: LCP < 2.5s, Edge function response < 500ms  
**Constraints**: Household data isolation, single-use invite tokens, admin-gated features  
**Scale/Scope**: 2-person households (MVP), expandable to 10+ members (future)

## Constitution Check

*GATE: Must pass before implementation. Re-check after design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Security First | ☐ | RLS policies defined? Auth validation planned? |
| II. Vertical Slices | ☐ | User stories independently deliverable? |
| III. Minimal Changes | ☐ | Simplest solution? No over-engineering? |
| IV. Document As You Go | ☐ | Migration README? JSDoc? PRD update? |
| V. Test Before Deploy | ☐ | Local testing approach? Manual smoke test plan? |

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Technical research (if needed)
├── data-model.md        # Database design (if DB changes)
├── quickstart.md        # Setup/testing guide (if complex)
├── contracts/           # API contracts (if new Edge Functions)
└── tasks.md             # Task list (created by /speckit.tasks)
```

### Source Code (Trackly Home structure)

```text
apps/web/src/
├── components/          # React components
│   └── [NewComponent].tsx
├── screens/             # Page-level components
│   └── [NewScreen].tsx
├── services/            # API/Supabase service functions
│   └── [newService].ts
├── lib/                 # Utilities
│   └── supabaseClient.ts (existing)
└── router/              # React Router configuration
    └── AppRouter.tsx (existing)

supabase/
├── migrations/          # SQL migrations
│   └── [timestamp]_[num]_[description].sql
├── functions/           # Edge Functions (Deno)
│   ├── [new-function]/
│   │   ├── index.ts
│   │   └── deno.json
│   └── _shared/         # Shared utilities (existing)
│       ├── cors.ts
│       ├── crypto.ts
│       └── supabase.ts
└── config.toml          # Local CLI config
```

**Structure Decision**: Web application with frontend (apps/web) and backend (supabase)

## Database Design *(if feature involves data changes)*

### New Tables

| Table | Purpose | RLS |
|-------|---------|-----|
| [table_name] | [description] | ☐ Enabled |

### New Columns (existing tables)

| Table | Column | Type | Notes |
|-------|--------|------|-------|
| [table] | [column] | [type] | [purpose] |

### RLS Policies Required

| Table | Operation | Policy |
|-------|-----------|--------|
| [table] | SELECT | Household members only |
| [table] | INSERT | [who can insert] |
| [table] | UPDATE | [who can update] |

## Edge Functions *(if new server-side logic)*

| Function | Auth Required | Admin Only | Purpose |
|----------|---------------|------------|---------|
| [name] | ☐ | ☐ | [description] |

## Frontend Components *(if UI changes)*

| Component | Location | Purpose |
|-----------|----------|---------|
| [Name] | apps/web/src/components/ | [description] |
| [Screen] | apps/web/src/screens/ | [description] |

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [principle violated] | [current need] | [why simpler approach insufficient] |

## Security Considerations

- [ ] New tables have RLS enabled
- [ ] Edge functions validate JWT (verify_jwt = true)
- [ ] Admin-only features check role
- [ ] No service role key exposure
- [ ] Tokens hashed before storage (if applicable)
- [ ] CORS configured correctly
- [ ] No PII in logs

## Testing Plan

### Manual Testing
- [ ] Happy path works
- [ ] Error states handled
- [ ] Loading states display
- [ ] Role-based access verified

### RLS Verification
```sql
-- Test: Cross-household access blocked
SET LOCAL role TO 'authenticated';
SET LOCAL request.jwt.claims.sub TO 'user-uuid-here';
SELECT * FROM [new_table] WHERE household_id = 'other-household-id';
-- Should return 0 rows
```
