#!/usr/bin/env bash
set -euo pipefail

# Trackly Home repo bootstrap
# Usage:
#   bash scripts/bootstrap-repo.sh
# or:
#   chmod +x scripts/bootstrap-repo.sh && ./scripts/bootstrap-repo.sh

ROOT="${1:-.}"

echo "Bootstrapping Trackly Home repo structure in: ${ROOT}"
cd "${ROOT}"

# ---------- FOLDERS ----------
mkdir -p \
  apps/web \
  docs \
  supabase/migrations \
  supabase/functions \
  .github/workflows \
  .github/ISSUE_TEMPLATE \
  .github/PULL_REQUEST_TEMPLATE \
  .github/prompts \
  .vscode \
  scripts

# ---------- BASE FILES ----------
# .env example (safe placeholders)
cat > .env.example <<'EOF'
# Frontend
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SITE_URL=http://localhost:5173

# Server / Edge Functions (never commit real values)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SITE_URL=http://localhost:5173
EOF

# .gitignore (minimal + sane)
cat > .gitignore <<'EOF'
# dependencies
node_modules/

# env
.env
.env.*.local

# build outputs
dist/
build/
out/

# logs
*.log

# OS/editor
.DS_Store
.vscode/settings.json
.vscode/*.local.json

# Supabase local
.supabase/
EOF

# README starter
cat > README.md <<'EOF'
# trackly-home

Consumer MVP for Trackly Home.

## Repo layout
- `apps/web` — Frontend (Vite/React)
- `supabase` — DB migrations + edge functions
- `docs` — PRD + build plan
- `.github` — workflows + templates + Copilot prompts
- `.vscode` — editor settings + recommended extensions

## Local dev (placeholder)
1) Copy `.env.example` to `.env` and fill values
2) Install deps (once frontend is scaffolded)
3) Run the dev server
EOF

# Docs placeholders
cat > docs/PRD.md <<'EOF'
# PRD
Paste the PRD markdown here.
EOF

cat > docs/BUILD_PLAN.md <<'EOF'
# Build Plan
Vertical slices and acceptance criteria live here.
EOF

# ---------- GITHUB: TEMPLATES ----------
cat > .github/pull_request_template.md <<'EOF'
## What
- 

## Why
- 

## How
- 

## Checklist
- [ ] I tested locally
- [ ] I added/updated env var docs if needed
- [ ] I did not modify unrelated folders
EOF

cat > .github/ISSUE_TEMPLATE/feature_request.md <<'EOF'
---
name: Feature request
about: Propose a feature for Trackly Home
title: "feat: "
labels: enhancement
---

## Problem
Describe the user problem.

## Proposed solution
What should we build?

## Acceptance criteria
- [ ]
EOF

cat > .github/ISSUE_TEMPLATE/bug_report.md <<'EOF'
---
name: Bug report
about: Report a bug
title: "bug: "
labels: bug
---

## What happened
-

## Expected
-

## Steps to reproduce
1)
2)

## Environment
- OS:
- Browser:
- Commit SHA:
EOF

# ---------- GITHUB: COPILOT INSTRUCTIONS ----------
# GitHub Copilot supports repository instructions via .github/copilot-instructions.md
cat > .github/copilot-instructions.md <<'EOF'
# Copilot Instructions (Trackly Home)

You are assisting with a greenfield consumer MVP.

## Hard rules
- Do NOT add enterprise features (SSO/SAML/SCIM, admin approval workflows, domain workspaces).
- Do NOT create marketing/landing pages unless explicitly requested.
- Prefer vertical slices that end in a working demo.
- Keep changes scoped to the requested folder(s); do not refactor unrelated code.

## Stack assumptions
- Frontend: Vite + React + TypeScript + Tailwind (unless told otherwise)
- Backend: Supabase (Auth, Postgres, RLS, Edge Functions)

## Security requirements
- Never expose service role keys in client code.
- Use RLS for household isolation.
- Avoid logging PII (event titles, emails) in plaintext.

## Build approach
When asked to implement a feature:
1) List files to be created/modified
2) Implement minimal working version
3) Provide a manual test checklist
EOF

# ---------- GITHUB: PROMPTS (OPTIONAL) ----------
cat > .github/prompts/slice-a-auth.md <<'EOF'
# Slice A Prompt — Auth + Profile Bootstrap (MVP)

Implement in `apps/web` only.

Requirements:
- Supabase Auth with Google OAuth + Magic Link
- Routes: `/login`, `/auth/callback`, `/app`
- ProtectedRoute redirects unauthenticated users
- On first login, upsert `profiles` (user_id, display_name, timezone, last_login_at)

DB:
- Add migration under `supabase/migrations` for profiles + RLS (user can only access own row)

Definition of Done:
- Login works locally
- Refresh persists session
- profiles row exists after login
EOF

# ---------- VSCODE SETTINGS ----------
cat > .vscode/extensions.json <<'EOF'
{
  "recommendations": [
    "GitHub.copilot",
    "GitHub.copilot-chat",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss"
  ]
}
EOF

cat > .vscode/settings.json <<'EOF'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "files.eol": "\n",
  "typescript.tsdk": "node_modules/typescript/lib",
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"],
  "files.exclude": {
    "**/.DS_Store": true,
    "**/node_modules": true,
    "**/dist": true
  }
}
EOF

# ---------- COMMIT MESSAGE HELP (OPTIONAL) ----------
cat > .github/commit-conventions.md <<'EOF'
# Commit conventions

Use conventional-ish commits:
- feat: add a new feature
- fix: bug fix
- chore: tooling, config
- docs: documentation
- refactor: code restructuring (avoid early)
- test: add/update tests

Examples:
- feat(auth): add google oauth login
- feat(household): implement partner invites
- fix(calendar): prevent duplicate events on sync
EOF

# ---------- WORKFLOW PLACEHOLDERS ----------
cat > .github/workflows/README.md <<'EOF'
Workflows will be added after the app is scaffolded.
Suggested:
- deploy-dev.yml (on push to dev)
- deploy-prod.yml (on push to main)
EOF

echo "✅ Repo scaffolding complete."
echo ""
echo "Next steps:"
echo "1) Paste PRD into docs/PRD.md"
echo "2) Scaffold frontend in apps/web (e.g., Vite React TS)"
echo "3) Create Supabase project + env vars"
echo "4) Run Slice A using .github/prompts/slice-a-auth.md"
