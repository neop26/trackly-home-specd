# Trackly Home — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** 2026-01-18  
**Status:** MVP Development (Phase 1 Complete)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Users & Personas](#3-target-users--personas)
4. [MVP Scope](#4-mvp-scope)
5. [Non-Goals (MVP)](#5-non-goals-mvp)
6. [Current Implementation Status](#6-current-implementation-status)
7. [Architecture Overview](#7-architecture-overview)
8. [Data Model](#8-data-model)
9. [Security Model](#9-security-model)
10. [User Journeys & Screens](#10-user-journeys--screens)
11. [Functional Requirements](#11-functional-requirements)
12. [Technical Requirements](#12-technical-requirements)
13. [Deployment Architecture](#13-deployment-architecture)
14. [MVP Phases & Roadmap](#14-mvp-phases--roadmap)
15. [Post-MVP Vision](#15-post-mvp-vision)
16. [Known Issues & Remediation](#16-known-issues--remediation)
17. [Success Criteria](#17-success-criteria)
18. [Open Questions](#18-open-questions)
19. [Glossary](#19-glossary)

---

## 1. Executive Summary

**Trackly Home** is a consumer-focused household coordination app designed to help partners/families manage their day-to-day life together. The MVP focuses on secure household onboarding (create household → invite partner → partner joins) with proper data isolation.

**Key Differentiators:**
- Privacy-first: Household data is never visible to other households
- Simple: Two-person households first, expandable later
- Secure: Row Level Security (RLS) enforced at database level

**Current State:** Phase 1 (Role-Based Access Control) is complete. The application successfully handles user authentication, household creation, partner invitations, and role management.

---

## 2. Product Vision

### Problem Statement
Couples and families lack a simple, private tool to coordinate schedules, tasks, and household responsibilities without exposing their data to external parties or dealing with enterprise-level complexity.

### Solution
A lightweight web application that provides:
- Private household workspace for 2+ members
- Secure invite-only membership
- Role-based access (owner/admin/member)
- Future: shared planner, task management, routines

### Long-term Vision
Become the go-to household coordination tool for modern families, supporting:
- Multi-member households (parents, children, extended family)
- Shared calendars and task management
- Financial coordination (optional)
- Customizable roles and permissions

---

## 3. Target Users & Personas

### Primary Persona: The Coordinating Partner
- **Demographics:** Adults living together (couples, roommates)
- **Pain Points:** 
  - Miscommunication about household tasks
  - No single source of truth for shared plans
  - Privacy concerns with existing tools
- **Goals:**
  - Single place to see "who does what"
  - Quick visibility into shared schedule
  - Keep household data private

### Secondary Persona: Family Admin
- **Demographics:** Parent managing family schedules
- **Pain Points:**
  - Coordinating multiple family members
  - Delegating responsibilities
- **Goals:**
  - Assign tasks to family members
  - Track completion and routines
  - Age-appropriate visibility for children (future)

---

## 4. MVP Scope

### In Scope
1. **Authentication**
   - Email magic link sign-in
   - Session persistence
   - Profile creation on first login

2. **Household Management**
   - Create household (first user becomes owner)
   - Household name storage

3. **Invite & Join Flow**
   - Owner/admin creates invite with secure token
   - Invite via shareable link (email optional)
   - Partner accepts invite and joins household
   - Single-use, expiring tokens

4. **Role-Based Access Control**
   - Roles: owner, admin, member
   - Only admins can invite new members
   - Only admins can manage roles
   - Protection against removing last admin

5. **Basic App Shell**
   - Authenticated user routing
   - Household context display
   - Role display in header

### Out of Scope (MVP)
- Planner/calendar functionality
- Task management (coming in Phase 5)
- Mobile native apps
- Push notifications
- Multiple households per user
- Financial features
- Data export/import

---

## 5. Non-Goals (MVP)

The following are explicitly excluded from the MVP:

| Feature | Reason |
|---------|--------|
| Enterprise SSO/SAML/SCIM | Consumer focus, not B2B |
| Admin approval workflows | Adds complexity; invite-based is sufficient |
| Domain workspaces | Enterprise feature |
| Marketing/landing pages | Focus on core functionality |
| Google OAuth | Deferred to post-MVP (magic link sufficient) |
| Native mobile apps | Web-first approach |
| Calendar integrations | Phase 5+ |
| Push notifications | Email is sufficient for MVP |

---

## 6. Current Implementation Status

### ✅ Completed Components

#### Infrastructure
- [x] Vite + React + TypeScript + Tailwind frontend
- [x] Supabase backend (Auth, Postgres, Edge Functions)
- [x] Azure Static Web Apps deployment
- [x] CI/CD pipelines (web + Supabase)

#### Database
- [x] `profiles` table with RLS
- [x] `households` table with owner tracking
- [x] `household_members` join table with roles
- [x] `invites` table with token hashing
- [x] Role enum (owner/admin/member)
- [x] Admin helper functions
- [x] Last admin protection trigger

#### Edge Functions
- [x] `create-household` - Creates household + owner membership
- [x] `create-invite` - Generates secure invite tokens
- [x] `accept-invite` - Validates and accepts invites
- [x] `manage-roles` - Admin role management

#### Frontend Screens
- [x] `/login` - Email sign-in
- [x] `/auth/callback` - Session completion
- [x] `/setup` - Household creation
- [x] `/join` - Accept invite flow
- [x] `/app` - Authenticated app shell

#### Frontend Components
- [x] `AppHeader` - Shows household + role
- [x] `InvitePartnerCard` - Admin-gated invite UI
- [x] `ManageRolesCard` - Role management UI
- [x] `ProtectedRoute` - Auth guard

---

## 7. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            Vite + React + TypeScript + Tailwind             ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           ││
│  │  │ Login   │ │ Setup   │ │  Join   │ │  App    │           ││
│  │  │ Page    │ │ Page    │ │  Page   │ │  Shell  │           ││
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘           ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Azure Static Web Apps                          │
│                     (Frontend Hosting)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ API Calls
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Auth      │  │  Postgres    │  │   Edge Functions     │  │
│  │  (Magic Link)│  │  (+ RLS)     │  │  (Deno Runtime)      │  │
│  │              │  │              │  │                      │  │
│  │  • Sessions  │  │  • profiles  │  │  • create-household  │  │
│  │  • Tokens    │  │  • households│  │  • create-invite     │  │
│  │              │  │  • members   │  │  • accept-invite     │  │
│  │              │  │  • invites   │  │  • manage-roles      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vite + React 18 | SPA framework |
| Styling | Tailwind CSS | Utility-first CSS |
| Language | TypeScript | Type safety |
| Routing | React Router v6 | Client-side routing |
| Backend | Supabase | BaaS (Auth, DB, Functions) |
| Database | PostgreSQL | Relational data + RLS |
| Functions | Deno (Edge) | Serverless compute |
| Hosting | Azure Static Web Apps | CDN + hosting |
| CI/CD | GitHub Actions | Automated deployments |

---

## 8. Data Model

### Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │     │   households    │     │    invites      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ user_id (PK)    │     │ id (PK)         │     │ id (PK)         │
│ display_name    │     │ name            │     │ household_id(FK)│
│ timezone        │     │ owner_user_id   │     │ token_hash      │
│ last_login_at   │     │ created_at      │     │ invited_email   │
│ created_at      │     └────────┬────────┘     │ expires_at      │
│ updated_at      │              │              │ accepted_at     │
└─────────────────┘              │              │ created_at      │
                                 │              └─────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │   household_members     │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ user_id (FK→profiles)   │
                    │ household_id (FK)       │
                    │ role (enum)             │
                    │ joined_at               │
                    └─────────────────────────┘
```

### Table Definitions

#### profiles
| Column | Type | Description |
|--------|------|-------------|
| user_id | uuid (PK) | References auth.users |
| display_name | text | User's display name |
| timezone | text | User's timezone |
| last_login_at | timestamptz | Last login timestamp |
| created_at | timestamptz | Row creation time |
| updated_at | timestamptz | Last update time |

#### households
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Household identifier |
| name | text | Household name |
| owner_user_id | uuid | Original creator |
| created_at | timestamptz | Creation time |

#### household_members
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Membership identifier |
| user_id | uuid (FK) | Member's user ID |
| household_id | uuid (FK) | Household ID |
| role | role_enum | owner/admin/member |
| joined_at | timestamptz | Join timestamp |

#### invites
| Column | Type | Description |
|--------|------|-------------|
| id | uuid (PK) | Invite identifier |
| household_id | uuid (FK) | Target household |
| token_hash | text | SHA-256 hash of token |
| invited_email | text | Optional target email |
| expires_at | timestamptz | Expiry time (7 days) |
| accepted_at | timestamptz | Acceptance time (null if pending) |
| created_at | timestamptz | Creation time |

### Role Enum
```sql
CREATE TYPE role_enum AS ENUM ('owner', 'admin', 'member');
```

---

## 9. Security Model

### Core Principles

1. **Defense in Depth**: Security enforced at DB (RLS), Function, and UI layers
2. **Least Privilege**: Users only access their own household data
3. **No Secrets in Client**: Service role key never exposed to browser
4. **Token Security**: Invite tokens hashed before storage

### Row Level Security (RLS)

All tables have RLS enabled with policies enforcing:

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own row only | Own row only | Own row only | — |
| households | Member only | Via function | Owner only | — |
| household_members | Household members | Via function | Admins only | — |
| invites | Household members | Admins only | — | — |

### Role Hierarchy

```
┌───────────┐
│   Owner   │  Can: everything + transfer ownership (future)
└─────┬─────┘
      │
┌─────▼─────┐
│   Admin   │  Can: invite, manage roles (except owner)
└─────┬─────┘
      │
┌─────▼─────┐
│  Member   │  Can: read household data, use features
└───────────┘
```

### Security Constraints

1. **Cannot remove last admin**: Database trigger prevents this
2. **Owner role is special**: Only owner can transfer ownership (future)
3. **Tokens are single-use**: Invites invalidated after acceptance
4. **Tokens expire**: 7-day expiry on all invites
5. **CORS restricted**: Only known origins allowed

### Edge Function Security

| Function | Auth Required | Admin Required | Service Role Used |
|----------|---------------|----------------|-------------------|
| create-household | ✅ | — | ✅ (for writes) |
| create-invite | ✅ | ✅ | ✅ (for writes) |
| accept-invite | ✅ | — | ✅ (for writes) |
| manage-roles | ✅ | ✅ | ✅ (for writes) |

---

## 10. User Journeys & Screens

### Primary Journey: Owner Onboarding

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│ /login  │───▶│/callback │───▶│ /setup  │───▶│  /app   │
│         │    │          │    │         │    │         │
│ Enter   │    │ Session  │    │ Create  │    │ App     │
│ email   │    │ created  │    │household│    │ shell   │
└─────────┘    └──────────┘    └─────────┘    └─────────┘
```

### Secondary Journey: Partner Join

```
┌─────────┐    ┌──────────┐    ┌─────────┐    ┌─────────┐
│ /join?  │───▶│ /login   │───▶│/callback│───▶│  /app   │
│ token=  │    │ (if not  │    │         │    │ ?joined │
│         │    │  authed) │    │         │    │ =1      │
└─────────┘    └──────────┘    └──────────┘   └─────────┘
```

### Route Logic

| Current State | Destination |
|---------------|-------------|
| Not authenticated | /login |
| Authenticated, no household | /setup |
| Authenticated, has household | /app |
| Has invite token | /join (then flow) |

### Screen Specifications

#### /login
- Email input field
- "Send Magic Link" button
- Success message after sending
- Error handling for invalid email

#### /auth/callback
- Loading state while processing
- Profile upsert on first login
- Redirect based on household state

#### /setup
- Household name input
- "Create Household" button
- Redirects to /app?setup=1 on success

#### /join?token=...
- Validates token
- Shows household being joined
- "Join Household" button
- Error states: expired, invalid, used

#### /app
- Header with household name and role
- Welcome banners (joined/setup)
- InvitePartnerCard (admin-gated)
- ManageRolesCard (admin-gated)
- Placeholder for planner

---

## 11. Functional Requirements

### FR-1: Authentication

| ID | Requirement | Status |
|----|-------------|--------|
| FR-1.1 | Users can sign in via email magic link | ✅ |
| FR-1.2 | Session persists across page refreshes | ✅ |
| FR-1.3 | Profile row created on first login | ✅ |
| FR-1.4 | Sign out available on all authenticated pages | ⚠️ Needs verification |
| FR-1.5 | Google OAuth sign-in | ❌ Deferred |

### FR-2: Household Management

| ID | Requirement | Status |
|----|-------------|--------|
| FR-2.1 | First-time user can create household | ✅ |
| FR-2.2 | Creating user becomes owner | ✅ |
| FR-2.3 | Household has a name | ✅ |
| FR-2.4 | One user cannot create multiple households | ⚠️ Needs RLS check |

### FR-3: Invite Flow

| ID | Requirement | Status |
|----|-------------|--------|
| FR-3.1 | Admins can create invites | ✅ |
| FR-3.2 | Invites generate shareable URL | ✅ |
| FR-3.3 | Tokens are hashed in database | ✅ |
| FR-3.4 | Invites expire after 7 days | ✅ |
| FR-3.5 | Invites are single-use | ✅ |
| FR-3.6 | Non-admins cannot invite | ✅ |

### FR-4: Join Flow

| ID | Requirement | Status |
|----|-------------|--------|
| FR-4.1 | User can join via valid invite link | ✅ |
| FR-4.2 | Expired tokens show error | ✅ |
| FR-4.3 | Used tokens show error | ✅ |
| FR-4.4 | Invalid tokens show error | ✅ |
| FR-4.5 | Joining user gets "member" role | ✅ |

### FR-5: Role Management

| ID | Requirement | Status |
|----|-------------|--------|
| FR-5.1 | Admins can promote members to admin | ✅ |
| FR-5.2 | Admins can demote admins to member | ✅ |
| FR-5.3 | Cannot remove last admin | ✅ |
| FR-5.4 | Only owner can change owner role | ✅ |
| FR-5.5 | Role changes reflected in UI | ✅ |

### FR-6: Routing & UX

| ID | Requirement | Status |
|----|-------------|--------|
| FR-6.1 | Unauthenticated → /login | ✅ |
| FR-6.2 | No household → /setup | ✅ |
| FR-6.3 | Has household → /app | ✅ |
| FR-6.4 | Invite link works logged-in | ✅ |
| FR-6.5 | Invite link works logged-out | ✅ |
| FR-6.6 | Correct welcome banners shown | ✅ |

---

## 12. Technical Requirements

### TR-1: Performance

| ID | Requirement | Target |
|----|-------------|--------|
| TR-1.1 | Initial page load (LCP) | < 2.5s |
| TR-1.2 | Time to interactive | < 3.5s |
| TR-1.3 | Edge function response | < 500ms |

### TR-2: Security

| ID | Requirement | Status |
|----|-------------|--------|
| TR-2.1 | RLS enabled on all tables | ✅ |
| TR-2.2 | No service keys in client | ✅ |
| TR-2.3 | CORS restricted to known origins | ✅ |
| TR-2.4 | verify_jwt=true on user functions | ✅ |
| TR-2.5 | No PII in logs | ⚠️ Verify |

### TR-3: Reliability

| ID | Requirement | Target |
|----|-------------|--------|
| TR-3.1 | Invite flow success rate | ≥ 95% |
| TR-3.2 | Zero cross-household data leaks | ✅ |
| TR-3.3 | Graceful error handling | ✅ |

### TR-4: Deployment

| ID | Requirement | Status |
|----|-------------|--------|
| TR-4.1 | Automated dev deployments | ✅ |
| TR-4.2 | Supabase migrations in CI | ✅ |
| TR-4.3 | Edge functions in CI | ✅ |
| TR-4.4 | Production pipeline (gated) | ❌ Pending |

---

## 13. Deployment Architecture

### Environments

| Environment | Purpose | Branch | Approval |
|-------------|---------|--------|----------|
| Local | Development | any | — |
| Dev | Integration testing | dev | Automatic |
| Prod | Production | main | Manual |

### CI/CD Workflows

```
┌───────────────────────────────────────────────────────────────┐
│                    GitHub Actions                              │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────────────┐    ┌─────────────────────┐          │
│  │ swa-app-deploy.yml  │    │ supabase-deploy-    │          │
│  │                     │    │ dev.yml             │          │
│  │ Trigger: push dev   │    │                     │          │
│  │ + apps/web changes  │    │ Trigger: push dev   │          │
│  │                     │    │ + supabase changes  │          │
│  │ 1. npm ci           │    │                     │          │
│  │ 2. npm run build    │    │ 1. Link project     │          │
│  │ 3. Deploy to SWA    │    │ 2. db push          │          │
│  └─────────────────────┘    │ 3. Set secrets      │          │
│                             │ 4. Deploy functions │          │
│                             └─────────────────────┘          │
│                                                               │
│  ┌─────────────────────┐                                      │
│  │ azure-infra-        │                                      │
│  │ deploy.yml          │                                      │
│  │                     │                                      │
│  │ Trigger: manual     │                                      │
│  │                     │                                      │
│  │ 1. Bicep validate   │                                      │
│  │ 2. Plan + Deploy    │                                      │
│  └─────────────────────┘                                      │
└───────────────────────────────────────────────────────────────┘
```

### Required Secrets

#### GitHub Environment: dev

| Secret | Purpose |
|--------|---------|
| SUPABASE_ACCESS_TOKEN | CLI authentication |
| SUPABASE_PROJECT_REF | Project identifier |
| SUPABASE_DB_PASSWORD | DB password for migrations |
| SB_URL | Supabase API URL |
| SB_ANON_KEY | Anon/public key |
| SB_SERVICE_ROLE_KEY | Service role key (functions only) |
| SITE_URL | Deployed SWA URL |
| INVITE_TOKEN_SECRET | Token signing secret |
| CORS_ORIGINS | Allowed CORS origins (CSV) |
| RESEND_API_KEY | Email sending (optional) |
| RESEND_FROM | From email address (optional) |
| AZURE_SWA_DEPLOYMENT_TOKEN | SWA deployment |
| VITE_SUPABASE_URL | Build-time Supabase URL |
| VITE_SUPABASE_ANON_KEY | Build-time anon key |

---

## 14. MVP Phases & Roadmap

### Phase Overview

| Phase | Name | Status | Description |
|-------|------|--------|-------------|
| 1 | Role-Based Access Control | ✅ Complete | Roles, permissions, constraints |
| 2 | Security Hardening | 🟡 In Progress | RLS audit, function security |
| 3 | UX Routing | 🟡 In Progress | Onboarding state machine |
| 4 | Deploy Discipline | ⬜ Not Started | Prod pipeline, PR checks |
| 5 | Planner MVP | ⬜ Not Started | Basic task management |

### Phase 1: Role-Based Access Control ✅

**Completed Items:**
- Role enum (owner/admin/member) in database
- `is_household_admin()` helper function
- Last admin protection trigger
- Admin-only invite creation
- `manage-roles` edge function
- ManageRolesCard UI component
- Role display in AppHeader

### Phase 2: Security Hardening 🟡

**Tasks:**
- [ ] Audit RLS policies on all tables
- [ ] Verify helper functions don't recurse
- [ ] Ensure verify_jwt=true on all functions
- [ ] Implement strict CORS allowlist
- [ ] Standardize error responses

### Phase 3: UX Routing 🟡

**Tasks:**
- [ ] Add onboarding state to profiles
- [ ] Implement central route gate logic
- [ ] Ensure invite link works in all states
- [ ] Add sign-out to all authenticated pages
- [ ] Show correct banners (created vs joined)

### Phase 4: Deploy Discipline ⬜

**Tasks:**
- [ ] PR checks workflow (lint/typecheck/build)
- [ ] Dev deploy pipeline with summaries
- [ ] Prod deploy with manual approval
- [ ] Document secrets naming conventions

### Phase 5: Planner MVP ⬜

**Tasks:**
- [ ] Create `tasks` table with RLS
- [ ] Backend service methods (list/create/complete)
- [ ] Tasks list UI
- [ ] Add task UI
- [ ] Mark task complete UI
- [ ] Basic error telemetry

---

## 15. Post-MVP Vision

### Near-Term (v1.x)

1. **Google OAuth**: Add as alternative sign-in method
2. **Task Assignments**: Assign tasks to household members
3. **Due Dates**: Add due dates to tasks with reminders
4. **Recurring Tasks**: Support for recurring task patterns
5. **Mobile PWA**: Progressive web app optimization

### Medium-Term (v2.x)

1. **Shared Calendar**: Weekly/monthly view with events
2. **Calendar Sync**: Google/Outlook integration
3. **Lists & Notes**: Shared shopping lists, notes
4. **Notifications**: Email and push notifications
5. **Family Roles**: Child/view-only roles

### Long-Term (v3.x)

1. **Financial Tracking**: Shared expenses, budgets
2. **Multiple Households**: Support for multi-household users
3. **Data Export**: GDPR-compliant data export
4. **API Access**: Third-party integrations
5. **Native Apps**: iOS/Android native applications

---

## 16. Known Issues & Remediation

### High Priority

| Issue | Impact | Remediation | Target |
|-------|--------|-------------|--------|
| No sign-out button on all pages | Users can't easily sign out | Add sign-out to AppHeader | Phase 3 |
| Missing PR check workflow | No automated quality gates | Create PR check workflow | Phase 4 |
| No prod deployment pipeline | Can't safely deploy to prod | Create gated prod workflow | Phase 4 |

### Medium Priority

| Issue | Impact | Remediation | Target |
|-------|--------|-------------|--------|
| RLS policies need audit | Potential security gaps | Comprehensive RLS review | Phase 2 |
| Error messages not standardized | Inconsistent UX | Standardize error shapes | Phase 2 |
| No error telemetry | Can't track issues | Add App Insights | Phase 5 |

### Low Priority

| Issue | Impact | Remediation | Target |
|-------|--------|-------------|--------|
| No loading skeletons | Perceived slow loads | Add skeleton components | Post-MVP |
| No offline support | App unusable offline | Add service worker | Post-MVP |
| Limited accessibility | Excludes some users | A11y audit and fixes | Post-MVP |

---

## 17. Success Criteria

### MVP Release Criteria

| Criteria | Metric | Target |
|----------|--------|--------|
| Onboarding completion | % of signups completing household + invite | ≥ 80% |
| Invite acceptance rate | % of invites accepted | ≥ 70% |
| Cross-household data leaks | Security incidents | 0 |
| Deploy reliability | Successful deployments | ≥ 95% |
| Manual test coverage | Test scenarios passing | 100% |

### Quality Gates

- [ ] All RLS policies reviewed and tested
- [ ] All edge functions have auth verification
- [ ] CORS restricted to known origins only
- [ ] No secrets in client-side code
- [ ] No PII in application logs
- [ ] Prod deployment pipeline with approval gate

---

## 18. Open Questions

| # | Question | Options | Decision |
|---|----------|---------|----------|
| 1 | Owner transfer policy | Disable permanently / Allow with confirmation | TBD |
| 2 | Invite binding | Email-required / Anyone with link | Current: anyone with link |
| 3 | Household member limit | Unlimited / Fixed cap (e.g., 10) | TBD |
| 4 | Re-invite same email | Allow / Prevent if already member | TBD |
| 5 | Audit logging | Essential / Nice-to-have | Future phase |

---

## 19. Glossary

| Term | Definition |
|------|------------|
| **Household** | A private workspace for a group of users (family, couple, etc.) |
| **Owner** | The original creator of a household; highest privilege role |
| **Admin** | Can invite members and manage roles; cannot change owner |
| **Member** | Can access household features; cannot invite or manage roles |
| **RLS** | Row Level Security - PostgreSQL feature enforcing data access rules |
| **Edge Function** | Serverless function running on Supabase's Deno runtime |
| **Magic Link** | Passwordless authentication via email link |
| **SWA** | Azure Static Web Apps - hosting platform for the frontend |
| **Anon Key** | Public Supabase key safe to use in browsers |
| **Service Role Key** | Privileged key that bypasses RLS; server-only |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-01-18 | Copilot | Initial consolidated PRD |

---

*This document consolidates all previous PRD fragments and serves as the single source of truth for Trackly Home MVP development.*
