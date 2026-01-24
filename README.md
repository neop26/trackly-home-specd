# Trackly Home (MVP)

Trackly Home is a consumer MVP for helping a household (starting with two people/partners) coordinate day-to-day life: shared planning, shared routines, and eventually shared "who does what" clarity - without exposing private household data to anyone else.

## Project Status

| Phase               | Status         | Description                           |
| ------------------- | -------------- | ------------------------------------- |
| Phase 1: RBAC       | ✅ Complete    | Roles, permissions, admin constraints |
| Phase 2: Security   | ✅ Complete    | RLS audit, function security          |
| Phase 3: UX Routing | ✅ Complete    | Onboarding state machine              |
| Phase 4: Deploy     | ✅ Complete    | CI/CD, PR checks, auto-deploy         |
| Phase 5: Planner    | ⬜ Not Started | Basic task management                 |

**MVP Target:** 2026-02-28

> For detailed tracking, see [`docs/PROJECT_TRACKER.md`](docs/PROJECT_TRACKER.md)

---

## Documentation

| Document                                            | Purpose                                |
| --------------------------------------------------- | -------------------------------------- |
| [**TRACKLY_HOME_PRD.md**](docs/TRACKLY_HOME_PRD.md) | Complete Product Requirements Document |
| [**PROJECT_TRACKER.md**](docs/PROJECT_TRACKER.md)   | Task tracking with phases & deadlines  |
| [**SDLC_PROCESS.md**](docs/SDLC_PROCESS.md)         | Development lifecycle & standards      |

### Copilot Agent Skills

| Agent                                                          | Purpose                                 |
| -------------------------------------------------------------- | --------------------------------------- |
| [Development](.github/copilot/development.md)                  | Feature implementation & code standards |
| [Security](.github/copilot/security.md)                        | RLS, auth, token security               |
| [Testing](.github/copilot/testing.md)                          | Manual & automated testing              |
| [Deployment](.github/copilot/deployment.md)                    | CI/CD & release management              |
| [Docs - Folder READMEs](.github/copilot/docs-folder-readme.md) | Keep folder README.md files current     |
| [Docs - Project Docs](.github/copilot/docs-project-update.md)  | Update docs/ and root README.md         |

---

## MVP Goals

### Primary User Journey

1. **Sign in** (email magic link)
2. **Create a household** (first user becomes owner)
3. **Invite a partner** (shareable link)
4. **Partner joins household** via invite link + auth
5. **App shell** with role-based features

### Current Features

- Email magic link authentication
- Household creation with owner assignment
- Role-based access (owner/admin/member)
- Secure invite system (hashed tokens, expiry)
- Role management UI (admin-only)
- Partner invite UI (admin-only)

### Coming Soon

- Task management (Phase 5)
- Google OAuth sign-in
- Production deployment pipeline

---

## Architecture

```
+-------------------------------------------+
|         Azure Static Web Apps             |
|       (Vite + React + Tailwind)           |
+-----------------------+-------------------+
                        | HTTPS
+-----------------------v-------------------+
|               Supabase                    |
|  +----------+ +----------+ +-----------+  |
|  |  Auth    | | Postgres | |   Edge    |  |
|  | (Magic   | |  + RLS   | | Functions |  |
|  |  Link)   | |          | |  (Deno)   |  |
|  +----------+ +----------+ +-----------+  |
+-------------------------------------------+
```

### Technology Stack

- **Frontend:** Vite + React 18 + TypeScript + Tailwind CSS
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **Hosting:** Azure Static Web Apps
- **CI/CD:** GitHub Actions

---

## Repo Layout

```
.
├── apps/
│   └── web/                       # Vite + React front-end
├── supabase/
│   ├── migrations/                # SQL migrations
│   ├── functions/                 # Edge Functions (Deno)
│   └── config.toml                # Local CLI config
├── azure/
│   ├── deploy/                    # Bicep (SWA infra)
│   └── modules/                   # Bicep modules
├── docs/                          # Project documentation
│   ├── TRACKLY_HOME_PRD.md        # Product Requirements
│   ├── PROJECT_TRACKER.md         # Task tracking
│   └── SDLC_PROCESS.md            # Development process
└── .github/
    ├── workflows/                 # CI/CD pipelines
    └── copilot/                   # Agent skill instructions
```

---

## Local Development

### Prerequisites

- Node.js (LTS recommended)
- Docker (for local Supabase)
- Supabase CLI (`npm install -g supabase`)

### Quick Start

```bash
# 1. Install dependencies
cd apps/web && npm install

# 2. Start Supabase locally
supabase start

# 3. Apply migrations
supabase db reset

# 4. Create .env.local (copy from .env.example)
cp apps/web/.env.example apps/web/.env.local
# Edit with values from supabase start output

# 5. Run the web app
cd apps/web && npm run dev
```

Open:

- Web: `http://localhost:5173`
- Supabase Studio: (shown in `supabase start` output)

---

## Environment Variables

### Frontend (Vite)

**File:** `apps/web/.env.local` (not committed)

```env
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=eyJ...
```

### Edge Functions (Supabase hosted)

> **Important:** Secrets must NOT start with `SUPABASE_` (reserved prefix)

| Secret                | Description                       |
| --------------------- | --------------------------------- |
| `SB_URL`              | Supabase API URL                  |
| `SB_ANON_KEY`         | Supabase anon key                 |
| `SB_SERVICE_ROLE_KEY` | Service role key (functions only) |
| `SITE_URL`            | Deployed SWA URL                  |
| `INVITE_TOKEN_SECRET` | Token signing secret              |
| `CORS_ORIGINS`        | Allowed CORS origins (CSV)        |
| `RESEND_API_KEY`      | Email API key (optional)          |
| `RESEND_FROM`         | From email address (optional)     |

---

## Data Model

### Tables (public schema)

| Table               | Description                                         |
| ------------------- | --------------------------------------------------- |
| `profiles`          | One row per user (display_name, timezone)           |
| `households`        | Household entity with owner_user_id                 |
| `household_members` | Membership join table (user_id, household_id, role) |
| `invites`           | Invitations (token_hash, expiry, invited_email)     |

### Roles

- **owner** - Household creator, full control
- **admin** - Can invite members, manage roles
- **member** - Read-only household access

---

## Security Model

- **Row Level Security (RLS)** enforces household isolation
- **Edge Functions** validate auth before privileged operations
- **Invite tokens** are hashed in database (never stored in plaintext)
- **Service role key** is never exposed to the browser

For security guidelines, see [`.github/copilot/security.md`](.github/copilot/security.md)

---

## Deployment

### Branching Strategy

```
feature/* → dev → main
```

- **feature branches**: Feature development and fixes
- **dev**: Integration branch, auto-deploys to dev environment
- **main**: Production branch, auto-deploys to prod with approval

See [.github/BRANCHING_STRATEGY.md](.github/BRANCHING_STRATEGY.md) for detailed workflow.

### Environments

| Environment | Branch | Deployment                  | Approval Required |
| ----------- | ------ | --------------------------- | ----------------- |
| Local       | any    | Manual (`npm run dev`)      | No                |
| Dev         | `dev`  | Automatic on push           | No                |
| Prod        | `main` | Automatic on merge          | **Yes**           |

### CI/CD Workflows

| Workflow                   | Trigger                           | Description                   |
| -------------------------- | --------------------------------- | ----------------------------- |
| `pr-check.yml`             | PR to main                        | Lint + build quality gates    |
| `swa-app-deploy.yml`       | Push to dev/main (apps/web/**)    | Deploy frontend to Azure SWA  |
| `supabase-deploy-dev.yml`  | Push to dev (supabase/**)         | Deploy DB + functions (dev)   |
| `supabase-deploy-prod.yml` | Push to main (supabase/**)        | Deploy DB + functions (prod)  |
| `azure-infra-deploy.yml`   | Manual workflow_dispatch          | Deploy Azure infrastructure   |

### Deployment Process

**For Dev:**
```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
# make changes
git push origin feature/my-feature
# Create PR to dev, merge after checks
# Dev auto-deploys (no approval needed)
```

**For Production:**
```bash
# After testing in dev
# Create PR from dev → main
# Get approval and merge
# Approve prod deployments in GitHub Actions
```

See [workflow documentation](.github/BRANCHING_STRATEGY.md) for complete details.

---

## Troubleshooting

### Blank page on SWA

```
Ensure:
- vite build produces dist/
- staticwebapp.config.json is in dist/
- SPA fallback is configured
```

### Edge Function CORS errors

```
Fix in Edge Function:
- Return correct CORS headers
- Handle OPTIONS preflight
- Use CORS_ORIGINS allowlist (not *)
```

### 401 from Edge Function

```
Check:
- Authorization header is present
- Function secrets are set (SB_URL, SB_SERVICE_ROLE_KEY, etc.)
- SITE_URL matches deployed SWA origin
```

---

## Contributing

1. Follow the [SDLC Process](docs/SDLC_PROCESS.md)
2. Use conventional commits: `feat(scope): description`
3. Never commit `.env*` files with real secrets
4. Keep invite tokens hashed in DB
5. Prefer RLS + server-side functions for sensitive operations

---

## License

TBD (private MVP repo)
