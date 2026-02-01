# Trackly Home Agent Skills

This directory contains [Agent Skills](https://agentskills.io/specification) for AI assistants working with the Trackly Home codebase.

## Available Skills

| Skill | Description | Use When |
|-------|-------------|----------|
| [feature-development](feature-development/SKILL.md) | Full SpecKit workflow | Starting new features, implementing specs |
| [database-migration](database-migration/SKILL.md) | PostgreSQL migrations | Adding tables, columns, indexes |
| [edge-function](edge-function/SKILL.md) | Supabase Edge Functions | Server-side logic, privileged ops |
| [security-audit](security-audit/SKILL.md) | Security review | Before deployment, after changes |
| [deployment](deployment/SKILL.md) | CI/CD deployment | Deploying to dev/prod |
| [testing](testing/SKILL.md) | Manual & automated tests | Creating test plans, running tests |
| [documentation](documentation/SKILL.md) | Docs maintenance | Updating READMEs, PRD, tracker |
| [code-review](code-review/SKILL.md) | PR review | Reviewing pull requests |
| [rls-policy](rls-policy/SKILL.md) | Row Level Security | Adding/modifying RLS policies |
| [task-management](task-management/SKILL.md) | Task system | Working with task features |

## Skill Format

Each skill follows the [Agent Skills specification](https://agentskills.io/specification):

```
skill-name/
└── SKILL.md          # Required - contains frontmatter + instructions
```

### SKILL.md Structure

```yaml
---
name: skill-name
description: What this skill does and when to use it.
metadata:
  author: trackly-home
  version: "1.0"
compatibility: Environment requirements
allowed-tools: Bash(git:*) Read Edit
---

# Skill Title

Instructions for the AI agent...
```

## How Skills Are Used

1. **Agent loads metadata** - `name` and `description` are loaded at startup
2. **Agent activates skill** - Full `SKILL.md` loaded when relevant to task
3. **Agent follows instructions** - Step-by-step guidance for the task

## Adding New Skills

1. Create directory: `.github/skills/new-skill/`
2. Create `SKILL.md` with required frontmatter
3. Follow naming conventions:
   - Lowercase letters, numbers, hyphens only
   - No consecutive hyphens
   - 1-64 characters

## Skill Dependencies

Some skills reference others:

- `feature-development` → `database-migration`, `edge-function`
- `deployment` → `testing`, `security-audit`
- `code-review` → `security-audit`

## Related Resources

- [SpecKit Slash Commands](/.github/prompts/) - `/speckit.*` commands
- [Constitution](/.specify/memory/constitution.md) - Core principles
- [SDLC Process](/docs/SDLC_PROCESS.md) - Development lifecycle
- [Copilot Instructions](/.github/copilot-instructions.md) - Main instructions
