# Trackly Home — Project Tracker

**Last Updated:** 2026-01-18  
**Current Phase:** Phase 2 (Security Hardening)  
**MVP Target:** 2026-02-28

> **Note:** Timeline assumes dedicated development effort. Dates should be adjusted based on actual velocity and resource availability. See Risk Register for potential delays.

---

## Quick Status Overview

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| Phase 1 | Role-Based Access Control | 🟢 Complete | 100% |
| Phase 2 | Security Hardening | 🟡 In Progress | 40% |
| Phase 3 | UX Routing & Onboarding | 🟡 In Progress | 60% |
| Phase 4 | Deploy Discipline | 🔴 Not Started | 0% |
| Phase 5 | Planner MVP | 🔴 Not Started | 0% |

**Legend:** 🟢 Complete | 🟡 In Progress | 🔴 Not Started | ⚪ Blocked

---

## Phase 1: Role-Based Access Control 🟢

**Status:** Complete  
**Completed:** 2026-01-15  

| ID | Task | Priority | Status | Completed |
|----|------|----------|--------|-----------|
| 1.1 | Formalize role enum (owner/admin/member) in DB | P0 | 🟢 Done | 2026-01-13 |
| 1.2 | Add `is_household_admin()` helper function | P0 | 🟢 Done | 2026-01-13 |
| 1.3 | Enforce "cannot remove last admin" trigger | P0 | 🟢 Done | 2026-01-13 |
| 1.4 | Update invite creation to require admin role | P0 | 🟢 Done | 2026-01-13 |
| 1.5 | Create `manage-roles` edge function | P1 | 🟢 Done | 2026-01-14 |
| 1.6 | Create ManageRolesCard component | P1 | 🟢 Done | 2026-01-14 |
| 1.7 | Update AppHeader to display role | P1 | 🟢 Done | 2026-01-14 |
| 1.8 | Gate InvitePartnerCard to admins only | P0 | 🟢 Done | 2026-01-14 |
| 1.9 | Create members service (getHouseholdMembers) | P1 | 🟢 Done | 2026-01-14 |
| 1.10 | Update household service with role field | P1 | 🟢 Done | 2026-01-14 |

---

## Phase 2: Security Hardening 🟡

**Status:** In Progress  
**Target Completion:** 2026-01-25  

| ID | Task | Priority | Status | Target | Notes |
|----|------|----------|--------|--------|-------|
| 2.1 | RLS audit: profiles table policies | P0 | 🟢 Done | 2026-01-20 | Self-access only verified |
| 2.2 | RLS audit: households table policies | P0 | 🟡 In Progress | 2026-01-22 | Member-only SELECT |
| 2.3 | RLS audit: household_members policies | P0 | 🟡 In Progress | 2026-01-22 | Admin-only UPDATE |
| 2.4 | RLS audit: invites table policies | P0 | 🟡 In Progress | 2026-01-22 | Admin-only INSERT |
| 2.5 | Verify helper functions don't recurse | P0 | 🔴 Not Started | 2026-01-23 | Test with EXPLAIN |
| 2.6 | Set verify_jwt=true on all user functions | P0 | 🟢 Done | 2026-01-20 | All 4 functions updated |
| 2.7 | Implement strict CORS allowlist | P0 | 🟢 Done | 2026-01-20 | Using CORS_ORIGINS env |
| 2.8 | Standardize error responses (status + message + code) | P1 | 🔴 Not Started | 2026-01-25 | Consistent shape |
| 2.9 | Review PII logging in functions | P1 | 🔴 Not Started | 2026-01-25 | Ensure no emails logged |

---

## Phase 3: UX Routing & Onboarding 🟡

**Status:** In Progress  
**Target Completion:** 2026-01-31  

| ID | Task | Priority | Status | Target | Notes |
|----|------|----------|--------|--------|-------|
| 3.1 | Add onboarding_status to profiles | P0 | 🔴 Not Started | 2026-01-26 | State machine for flow |
| 3.2 | Implement central route gate logic | P0 | 🟡 In Progress | 2026-01-27 | Currently in AppShell |
| 3.3 | Ensure invite link works logged-in | P0 | 🟢 Done | — | Works correctly |
| 3.4 | Ensure invite link works logged-out | P0 | 🟢 Done | — | Works correctly |
| 3.5 | Add sign-out button to all auth pages | P0 | 🔴 Not Started | 2026-01-28 | AppHeader change |
| 3.6 | Show correct banner (created vs joined) | P1 | 🟢 Done | — | Using query params |
| 3.7 | Test all redirect edge cases | P1 | 🔴 Not Started | 2026-01-30 | Manual test suite |
| 3.8 | Add loading skeleton states | P2 | 🔴 Not Started | 2026-01-31 | Better perceived perf |

---

## Phase 4: Deploy Discipline 🔴

**Status:** Not Started  
**Target Completion:** 2026-02-07  

| ID | Task | Priority | Status | Target | Notes |
|----|------|----------|--------|--------|-------|
| 4.1 | Create PR check workflow (lint/typecheck/build) | P0 | 🔴 Not Started | 2026-02-01 | Block merge on failure |
| 4.2 | Add summary output to dev deploy workflow | P0 | 🟢 Done | — | Already implemented |
| 4.3 | Create prod deploy workflow (gated) | P1 | 🔴 Not Started | 2026-02-03 | Manual trigger + approval |
| 4.4 | Set up production GitHub environment | P1 | 🔴 Not Started | 2026-02-04 | With approval rules |
| 4.5 | Document secrets naming conventions | P0 | 🔴 Not Started | 2026-02-05 | SB_* vs SUPABASE_* |
| 4.6 | Add Supabase prod deploy workflow | P1 | 🔴 Not Started | 2026-02-06 | Separate from dev |
| 4.7 | Test full deploy pipeline end-to-end | P0 | 🔴 Not Started | 2026-02-07 | Smoke test |

---

## Phase 5: Planner MVP 🔴

**Status:** Not Started  
**Target Completion:** 2026-02-21  

| ID | Task | Priority | Status | Target | Notes |
|----|------|----------|--------|--------|-------|
| 5.1 | Create `tasks` migration (household_id, title, status) | P0 | 🔴 Not Started | 2026-02-10 | Basic schema |
| 5.2 | Add tasks RLS policies (member read/write) | P0 | 🔴 Not Started | 2026-02-10 | Household isolation |
| 5.3 | Create tasks service (list/create/complete) | P0 | 🔴 Not Started | 2026-02-12 | Frontend service |
| 5.4 | Build tasks list UI component | P0 | 🔴 Not Started | 2026-02-14 | TaskList component |
| 5.5 | Build add task UI component | P0 | 🔴 Not Started | 2026-02-16 | AddTask component |
| 5.6 | Build mark complete functionality | P0 | 🔴 Not Started | 2026-02-18 | Status toggle |
| 5.7 | Add assigned_to field to tasks | P1 | 🔴 Not Started | 2026-02-19 | Optional assignment |
| 5.8 | Add due_date field to tasks | P1 | 🔴 Not Started | 2026-02-19 | Optional due date |
| 5.9 | Integrate tasks into AppShell | P0 | 🔴 Not Started | 2026-02-20 | Replace placeholder |
| 5.10 | Add basic error telemetry | P1 | 🔴 Not Started | 2026-02-21 | App Insights |

---

## Completed Work Summary

### Infrastructure ✅
- [x] Vite + React + TypeScript + Tailwind setup
- [x] Supabase project configuration
- [x] Azure Static Web Apps infrastructure
- [x] GitHub Actions CI/CD (dev)
- [x] Local development environment

### Database ✅
- [x] profiles table with RLS
- [x] households table with owner tracking
- [x] household_members with role enum
- [x] invites table with token hashing
- [x] Helper functions (is_household_admin)
- [x] Last admin protection trigger

### Edge Functions ✅
- [x] create-household
- [x] create-invite (admin-only)
- [x] accept-invite
- [x] manage-roles

### Frontend ✅
- [x] Login page (magic link)
- [x] Auth callback handling
- [x] Setup page (household creation)
- [x] Join page (accept invite)
- [x] App shell with header
- [x] Invite partner card (admin-gated)
- [x] Manage roles card (admin-gated)

---

## Upcoming Milestones

| Milestone | Target Date | Description |
|-----------|-------------|-------------|
| Security Audit Complete | 2026-01-25 | All RLS policies reviewed and tested |
| Routing Finalized | 2026-01-31 | All user flows work correctly |
| Prod Pipeline Ready | 2026-02-07 | Can deploy to production safely |
| Planner MVP Complete | 2026-02-21 | Basic task management working |
| **MVP Launch** | **2026-02-28** | **Public release of MVP** |

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| RLS policy gaps | Medium | High | Comprehensive audit in Phase 2 |
| Invite token leaks | Low | Critical | Token hashing already implemented |
| Prod deploy mistakes | Medium | High | Gated workflow with approvals |
| Scope creep | Medium | Medium | Strict MVP scope in PRD |
| Resource availability | Low | Medium | Single developer workflow |

---

## Notes & Decisions

### 2026-01-18
- Consolidated all documentation into single PRD
- Created this project tracker
- Current focus: completing Phase 2 security audit

### 2026-01-15
- Phase 1 (RBAC) marked complete
- All role-based functionality working

### 2026-01-13
- Initial role migration deployed
- Admin helper functions created

---

## How to Update This Document

1. Update task status as work progresses
2. Add completion dates when tasks are done
3. Update milestone dates if timeline shifts
4. Add new notes under "Notes & Decisions"
5. Keep risk register current

**Traffic Light Legend:**
- 🟢 Complete / On Track
- 🟡 In Progress / At Risk
- 🔴 Not Started / Blocked
- ⚪ Blocked / Dependency Issue
