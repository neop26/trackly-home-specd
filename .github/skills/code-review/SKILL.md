---
name: code-review
description: Review code changes for Trackly Home PRs. Use when reviewing pull requests, checking code quality, or validating changes against the constitution. Focuses on security, correctness, and maintainability.
metadata:
  author: trackly-home
  version: "1.0"
allowed-tools: Bash(git:*) Bash(gh:*) Read
---

# Code Review Skill

Review code changes against Trackly Home's standards and constitution principles.

## When to Use

- Reviewing pull requests
- Self-reviewing before creating PR
- Validating changes against constitution
- Checking security implications

## Review Priorities

1. **Security** - Data leaks, auth bypasses, secrets exposure
2. **Correctness** - Does it work? Edge cases handled?
3. **Constitution** - Follows core principles?
4. **Maintainability** - Clean, readable, documented?

## Constitution Compliance Check

### I. Security First

- [ ] RLS enabled on new tables
- [ ] Policies enforce household isolation
- [ ] Edge functions validate JWT
- [ ] Admin operations check role
- [ ] No PII in logs
- [ ] No secrets in client code
- [ ] CORS restricted

### II. Vertical Slices

- [ ] Feature delivers standalone value
- [ ] Can be tested independently
- [ ] No half-implemented features

### III. Minimal Changes

- [ ] Smallest change to solve problem
- [ ] No over-engineering
- [ ] No "just in case" features
- [ ] Complexity justified if present

### IV. Document As You Go

- [ ] Code comments for complex logic
- [ ] README updated if needed
- [ ] Migration documented
- [ ] tasks.md updated

### V. Test Before Deploy

- [ ] Build passes
- [ ] Lint passes
- [ ] Manual testing done
- [ ] RLS policies tested (if applicable)

## Security Review Checklist

### Database Changes

```markdown
- [ ] RLS enabled: `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
- [ ] SELECT policy: Household members only
- [ ] INSERT policy: Validates target household
- [ ] UPDATE policy: Appropriate restrictions
- [ ] DELETE policy: Appropriate restrictions
- [ ] No recursive helper functions
- [ ] Indexes on foreign keys
```

### Edge Function Changes

```markdown
- [ ] verify_jwt = true in config.toml
- [ ] Authorization header validated
- [ ] User authenticated via getUser()
- [ ] Role checked for admin operations
- [ ] Service key not in response
- [ ] No PII in console.log
- [ ] Errors sanitized
- [ ] CORS configured
```

### Frontend Changes

```markdown
- [ ] No secrets in source
- [ ] Auth state checked before API calls
- [ ] Error messages don't leak internals
- [ ] User input validated
- [ ] No sensitive data in localStorage
```

## Code Quality Checklist

### TypeScript

```markdown
- [ ] No `any` types (use `unknown` if needed)
- [ ] Explicit return types on exports
- [ ] Interfaces for object shapes
- [ ] No unused variables/imports
- [ ] Consistent naming conventions
```

### React

```markdown
- [ ] Functional components with hooks
- [ ] Props interface defined
- [ ] Error boundaries for critical sections
- [ ] Loading states handled
- [ ] Error states handled
- [ ] Keys for list items
```

### General

```markdown
- [ ] No hardcoded values (use constants/env)
- [ ] No console.log in production code
- [ ] Error handling present
- [ ] No duplicate code
- [ ] Comments explain "why" not "what"
```

## Review Commands

### View PR Changes

```bash
# List open PRs
gh pr list

# View specific PR
gh pr view <number>

# View PR diff
gh pr diff <number>

# Checkout PR locally
gh pr checkout <number>
```

### Check Build/Lint

```bash
# After checking out PR
cd apps/web
npm install
npm run lint
npm run build
```

### View Changed Files

```bash
# Files changed in PR
gh pr view <number> --json files --jq '.files[].path'

# Detailed diff
git diff main...<branch-name>
```

## Review Comments

### Comment Types

1. **Must Fix** - Blocking issues
   ```
   🚨 **Must Fix**: RLS not enabled on new table. This exposes data.
   ```

2. **Should Fix** - Important but not blocking
   ```
   ⚠️ **Should Fix**: Missing error handling for edge case.
   ```

3. **Consider** - Suggestions
   ```
   💡 **Consider**: This could be simplified using X pattern.
   ```

4. **Question** - Need clarification
   ```
   ❓ **Question**: What happens when the user is not a member?
   ```

5. **Nitpick** - Minor/style
   ```
   📝 **Nitpick**: Typo in variable name.
   ```

### Good Review Comments

✅ Specific and actionable:
```
The RLS policy on line 45 allows any authenticated user to SELECT.
It should check household membership:
`USING (household_id IN (SELECT ...))`
```

❌ Vague:
```
This doesn't look right.
```

## Review Process

### Step 1: Understand the Change

1. Read PR description
2. Check linked issue/spec
3. Review files changed list
4. Understand the scope

### Step 2: Constitution Check

Run through constitution compliance:
- Security implications?
- Minimal change?
- Documentation updated?
- Tested?

### Step 3: Code Review

Review each file:
- Database migrations: RLS, constraints, indexes
- Edge functions: Auth, errors, logging
- Frontend: Types, error handling, UX
- Tests: Coverage, edge cases

### Step 4: Test Locally

```bash
# Checkout and test
gh pr checkout <number>
cd apps/web && npm install
npm run lint && npm run build
npm run dev

# Test feature manually
```

### Step 5: Provide Feedback

- Approve if ready
- Request changes if blocking issues
- Comment if questions/suggestions

## Review Checklist Template

```markdown
## PR Review: #[number] - [title]

### Constitution Compliance
- [ ] I. Security First
- [ ] II. Vertical Slices
- [ ] III. Minimal Changes
- [ ] IV. Document As You Go
- [ ] V. Test Before Deploy

### Security Review
- [ ] RLS policies correct
- [ ] Auth validation present
- [ ] No secrets exposed
- [ ] No PII logged

### Code Quality
- [ ] TypeScript strict
- [ ] Error handling present
- [ ] No unused code
- [ ] Comments where needed

### Testing
- [ ] Build passes
- [ ] Lint passes
- [ ] Manual test passed
- [ ] RLS tested (if DB changes)

### Documentation
- [ ] Code documented
- [ ] README updated
- [ ] Tracker updated

### Decision

- [ ] ✅ Approve
- [ ] 🔄 Request Changes
- [ ] 💬 Comment Only
```

## Common Issues to Catch

### Security

1. Missing RLS policies
2. Cross-household data access possible
3. Admin check missing
4. Service key in response
5. PII in logs

### Correctness

1. Unhandled error cases
2. Missing null checks
3. Race conditions
4. Infinite loops possible
5. Wrong comparison operators

### Maintainability

1. Magic numbers/strings
2. Duplicate code
3. Overly complex functions
4. Missing types
5. Unclear variable names

### Performance

1. N+1 query patterns
2. Missing database indexes
3. Unnecessary re-renders
4. Large bundle imports
5. Unoptimized queries
