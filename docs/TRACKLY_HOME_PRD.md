# Trackly Home — Product Requirements Document (PRD)

**Version:** 2.0  
**Last Updated:** 2026-01-31  
**Status:** MVP Complete | V1 Planning

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Product Vision](#2-product-vision)
3. [Target Users & Personas](#3-target-users--personas)
4. [MVP Status](#4-mvp-status)
5. [Architecture Overview](#5-architecture-overview)
6. [Data Model](#6-data-model)
7. [Security Model](#7-security-model)
8. [User Journeys & Screens](#8-user-journeys--screens)
9. [Functional Requirements](#9-functional-requirements)
10. [Technical Requirements](#10-technical-requirements)
11. [V1 Release Roadmap](#11-v1-release-roadmap)
12. [V2 Vision](#12-v2-vision)
13. [V3 Vision](#13-v3-vision)
14. [Success Metrics](#14-success-metrics)
15. [Glossary](#15-glossary)

---

## 1. Executive Summary

**Trackly Home** is a privacy-first household coordination app designed to help families manage their daily lives together. The platform enables secure household workspaces where family members can collaborate on tasks, schedules, and activities while maintaining strict data isolation from other households.

**Current State:** MVP Complete (Phases 1-6)  
**Next Milestone:** V1 Beta Release  
**Target:** Become the essential household management tool for modern families

### Key Differentiators
- **Privacy-First:** Household data never visible to other households (RLS enforced)
- **Family-Centric:** Designed for parents, partners, and children (with age-appropriate features)
- **Quick Capture:** Optimized for fast entry while juggling family life
- **School Integration:** Designed to help parents track activities from newsletters, permission slips, events
- **Notification-Driven:** Never miss an important family task or event

---

## 2. Product Vision

### Problem Statement

Parents and partners struggle with household coordination:

1. **Scattered Information:** Tasks in one app, calendar in another, notes in a third
2. **Communication Gaps:** "Did you pick up milk?" "I thought you were getting the kids?"
3. **Invisible Mental Load:** One partner carries the "household manager" burden
4. **Activity Chaos:** Kids' weekly activities (soccer, piano, scouts) tracked in heads not systems
5. **Newsletter Overwhelm:** School events buried in emails requiring manual transfer
6. **No Accountability:** Tasks assigned verbally are easily forgotten
7. **Privacy Concerns:** Enterprise tools expose family data; consumer tools lack features

### Solution

A lightweight, privacy-first household coordination platform that:

- **Centralizes** all household tasks, events, and activities in one place
- **Distributes** mental load through clear task assignment and accountability
- **Automates** recurring household chores and activities
- **Captures** events quickly from phone while standing anywhere
- **Notifies** the right person at the right time
- **Protects** family data with military-grade row-level security

### Long-Term Vision (2027 and Beyond)

Become the **operating system for household management**, supporting:
- Multi-generational families (grandparents, parents, children)
- Household helpers (nannies, cleaners, tutors) with limited access
- External calendar sync (Google, Outlook, Apple)
- Financial coordination (shared expenses, allowances)
- AI-powered meal planning and grocery lists
- Voice assistant integration (Alexa, Google Home)

---

## 3. Target Users & Personas

### Primary Persona: The Household Manager Parent
**Demographics:** Parents aged 30-50, dual-income households, 1-3 children  
**Technology:** Comfortable with apps, uses phone for everything  
**Daily Life:** Juggles work, kids' activities, household chores, partner coordination

**Pain Points:**
- "I'm the one who remembers everything"
- "I have to tell my partner 3 times before things get done"
- "We missed the school photo day because I forgot the newsletter"
- "Who was supposed to pick up Sarah today?"
- "Our chore wheel fell apart after 2 weeks"

**Goals:**
- Share the mental load with partner
- Quick capture tasks while juggling kids
- Reliable reminders that actually work
- See weekly family schedule at a glance
- Assign tasks that stick

### Secondary Persona: The Partner (Non-Manager)
**Demographics:** Partner/co-parent who wants to help but needs direction  
**Technology:** Uses apps daily but isn't the "planner type"

**Pain Points:**
- "Just tell me what you need me to do"
- "I didn't know it was due today"
- "Where did you put the grocery list?"
- "I forgot it was my turn"

**Goals:**
- Clear task assignments with due dates
- Reminders that work
- Quick way to mark things done
- See what partner needs from me

### Tertiary Persona: The Teenager
**Demographics:** Children aged 13-17 with their own responsibilities  
**Technology:** Native smartphone users, prefer modern UX

**Pain Points:**
- "I didn't know I had to do that today"
- "Mom already asked me 3 times"
- "Where's my practice schedule?"

**Goals:**
- See assigned chores and homework
- Get fair credit for completed tasks
- Know the family schedule affecting me
- Quick check, minimal friction

### Future Persona: The Household Helper
**Demographics:** Nannies, babysitters, house cleaners  
**Technology:** Variable, need simple UX

**Goals:**
- See tasks assigned to them
- Check off work completed
- Limited view (only relevant info)

---

## 4. MVP Status

### Completed (Phases 1-5)

| Phase | Feature | Status |
|-------|---------|--------|
| 1 | Role-Based Access Control | ✅ Complete |
| 2 | Security Hardening | ✅ Complete |
| 3 | UX Routing & Onboarding | ✅ Complete |
| 4 | Deploy Discipline (CI/CD) | ✅ Complete |
| 5 | Planner MVP (Task Management) | ✅ Complete |

### What MVP Delivers

1. **Authentication:** Email magic link sign-in, session persistence
2. **Households:** Create, name, single household per user
3. **Invitations:** Secure token-based invite/join flow
4. **Roles:** Owner/Admin/Member with proper permissions
5. **Tasks:** Create, view, complete, assign, due dates
6. **Security:** RLS isolation, zero cross-household leaks
7. **Infrastructure:** CI/CD pipelines, dev/prod environments

### MVP Limitations (Being Addressed in V1)

- No task editing or deletion
- No recurring tasks
- No notifications
- No calendar view
- No mobile optimization
- No search/filter
- No categories/tags
- No events (only tasks)

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser/PWA)                      │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │            Vite + React + TypeScript + Chakra UI            ││
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────────────────┐│
│  │  │ Login   │ │ Setup   │ │  Join   │ │  App Shell          ││
│  │  │         │ │         │ │         │ │                     ││
│  │  └─────────┘ └─────────┘ └─────────┘ │ ┌───────┬─────────┐ ││
│  │                                      │ │Tasks  │Calendar │ ││
│  │                                      │ │Screen │Screen   │ ││
│  │                                      │ └───────┴─────────┘ ││
│  │                                      └─────────────────────┘││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS + Supabase Realtime
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Azure Static Web Apps                          │
│                     (Frontend Hosting + CDN)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Supabase                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │    Auth      │  │  Postgres    │  │   Edge Functions     │  │
│  │  (Magic Link)│  │  (+ RLS)     │  │  (Deno Runtime)      │  │
│  │  + OAuth     │  │              │  │                      │  │
│  │              │  │  • profiles  │  │  • create-household  │  │
│  │  • Sessions  │  │  • households│  │  • create-invite     │  │
│  │  • Tokens    │  │  • members   │  │  • accept-invite     │  │
│  │              │  │  • invites   │  │  • manage-roles      │  │
│  │              │  │  • tasks     │  │  • send-notification │  │
│  │              │  │  • events    │  │  • sync-calendar     │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐                             │
│  │   Realtime   │  │   Storage    │                             │
│  │  (Live sync) │  │  (Attachments│                             │
│  │              │  │   Receipts)  │                             │
│  └──────────────┘  └──────────────┘                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                  External Services (V2+)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Resend      │  │  Push (FCM)  │  │  Calendar APIs       │  │
│  │  (Email)     │  │  Web Push    │  │  (Google/Outlook)    │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | Vite + React 18 | SPA framework |
| UI | Chakra UI | Component library |
| Language | TypeScript | Type safety |
| Routing | React Router v7 | Client-side routing |
| State | React Query + Zustand | Server state + client state |
| Backend | Supabase | BaaS (Auth, DB, Functions) |
| Database | PostgreSQL | Relational data + RLS |
| Functions | Deno (Edge) | Serverless compute |
| Hosting | Azure Static Web Apps | CDN + hosting |
| Email | Resend | Transactional email |
| CI/CD | GitHub Actions | Automated deployments |

---

## 6. Data Model

### Current Schema (MVP)

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    profiles     │     │   households    │     │    invites      │
├─────────────────┤     ├─────────────────┤     ├─────────────────┤
│ user_id (PK)    │     │ id (PK)         │     │ id (PK)         │
│ display_name    │     │ name            │     │ household_id    │
│ timezone        │     │ owner_user_id   │     │ token_hash      │
│ onboarding_stat │     │ created_at      │     │ invited_email   │
│ last_login_at   │     └────────┬────────┘     │ expires_at      │
│ created_at      │              │              │ accepted_at     │
│ updated_at      │              │              └─────────────────┘
└─────────────────┘              │
                                 │
                    ┌────────────┴────────────┐
                    │   household_members     │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ user_id                 │
                    │ household_id            │
                    │ role (owner/admin/member│
                    │ joined_at               │
                    └────────────┬────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │        tasks            │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ household_id            │
                    │ title                   │
                    │ status (incomplete/comp)│
                    │ assigned_to             │
                    │ due_date                │
                    │ created_at              │
                    │ updated_at              │
                    └─────────────────────────┘
```

### V1 Schema Additions

```
                    ┌─────────────────────────┐
                    │     task_categories     │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ household_id            │
                    │ name                    │
                    │ color                   │
                    │ icon                    │
                    └─────────────────────────┘

                    ┌─────────────────────────┐
                    │    recurring_rules      │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ task_id                 │
                    │ frequency (daily/weekly │
                    │ /monthly/custom)        │
                    │ interval               │
                    │ days_of_week           │
                    │ next_occurrence        │
                    └─────────────────────────┘

                    ┌─────────────────────────┐
                    │       events            │
                    ├─────────────────────────┤
                    │ id (PK)                 │
                    │ household_id            │
                    │ title                   │
                    │ description             │
                    │ start_datetime          │
                    │ end_datetime            │
                    │ location                │
                    │ all_day                 │
                    │ repeat_rule_id          │
                    │ associated_with_user    │
                    │ source (manual/calendar)│
                    └─────────────────────────┘

                    ┌─────────────────────────┐
                    │   notification_prefs    │
                    ├─────────────────────────┤
                    │ user_id (PK)            │
                    │ email_task_assigned     │
                    │ email_task_due          │
                    │ push_task_assigned      │
                    │ push_task_due           │
                    │ push_event_reminder     │
                    │ reminder_time_minutes   │
                    └─────────────────────────┘
```

---

## 7. Security Model

### Core Principles
1. **Defense in Depth**: Security at DB (RLS), Function, and UI layers
2. **Zero Trust Household Isolation**: No cross-household data access ever
3. **Least Privilege**: Users only see their household data
4. **Token Security**: All tokens hashed, single-use, time-limited

### RLS Policies (All Tables)

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own row | Own row | Own row | — |
| households | Member only | Via function | Owner only | — |
| household_members | Members | Via function | Admins | — |
| invites | Members | Admins | — | — |
| tasks | Members | Members | Members | Members |
| events | Members | Members | Members | Members |
| categories | Members | Admins | Admins | Admins |

### Role Hierarchy

```
Owner   → Full control, can transfer ownership, can delete household
Admin   → Can invite, manage roles (except owner), manage categories
Member  → Can CRUD own tasks/events, view household data
Child   → Limited view, assigned tasks only (V2)
Helper  → Temporary access, limited scope (V3)
```

---

## 8. User Journeys & Screens

### Journey 1: New User Onboarding
```
Email → Magic Link → Create Profile → Create Household → Dashboard
```

### Journey 2: Partner Joining
```
Receive Invite Link → Click → Login/Signup → Accept Invite → Dashboard
```

### Journey 3: Daily Task Flow (V1)
```
Open App → See Today's Tasks → Quick Add → Assign to Partner → Mark Complete
```

### Journey 4: Weekly Planning (V1)
```
Open App → Calendar View → See Week → Add Event → Assign to Child → Set Reminder
```

### Screen Map (V1)

| Route | Screen | Access |
|-------|--------|--------|
| /login | Login | Public |
| /setup | Household Setup | Authenticated, no household |
| /join | Accept Invite | Authenticated |
| /app | Dashboard | Member |
| /app/tasks | Task List | Member |
| /app/calendar | Week View | Member |
| /app/quick-add | Fast Entry | Member |
| /app/settings | Preferences | Member |
| /app/admin | Household Management | Admin |

---

## 9. Functional Requirements

### FR-1: Task Management (V1 Complete)

| ID | Requirement | Status | Priority |
|----|-------------|--------|----------|
| FR-1.1 | Create tasks with title | ✅ MVP | P0 |
| FR-1.2 | Mark tasks complete/incomplete | ✅ MVP | P0 |
| FR-1.3 | Assign tasks to members | ✅ MVP | P0 |
| FR-1.4 | Set due dates | ✅ MVP | P0 |
| FR-1.5 | Edit task details | ⏳ V1 | P0 |
| FR-1.6 | Delete tasks | ⏳ V1 | P0 |
| FR-1.7 | Task categories/tags | ⏳ V1 | P1 |
| FR-1.8 | Task notes/description | ⏳ V1 | P1 |
| FR-1.9 | Task search | ⏳ V1 | P1 |
| FR-1.10 | Task filtering by status/date/assignee | ⏳ V1 | P1 |

### FR-2: Recurring Tasks (V1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Daily recurring tasks | P0 |
| FR-2.2 | Weekly recurring (specific days) | P0 |
| FR-2.3 | Monthly recurring (specific date) | P1 |
| FR-2.4 | Custom recurrence patterns | P2 |
| FR-2.5 | Skip occurrence | P1 |
| FR-2.6 | End recurrence | P1 |

### FR-3: Calendar & Events (V1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Create events with title/time | P0 |
| FR-3.2 | All-day events | P0 |
| FR-3.3 | Event location | P1 |
| FR-3.4 | Associate event with family member | P0 |
| FR-3.5 | Weekly calendar view | P0 |
| FR-3.6 | Monthly calendar view | P1 |
| FR-3.7 | Day view with tasks + events | P0 |

### FR-4: Notifications (V1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Email when task assigned to me | P0 |
| FR-4.2 | Email for tasks due today | P0 |
| FR-4.3 | Email for tasks overdue | P1 |
| FR-4.4 | Notification preferences | P0 |
| FR-4.5 | Push notification support | P1 |
| FR-4.6 | Event reminders (configurable time) | P1 |

### FR-5: Quick Capture (V1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Floating quick-add button | P0 |
| FR-5.2 | Minimal form (title only required) | P0 |
| FR-5.3 | Smart defaults (today, unassigned) | P1 |
| FR-5.4 | Quick add from any screen | P0 |
| FR-5.5 | Voice input (mobile) | P2 |

### FR-6: Mobile Experience (V1)

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Responsive design (all screens) | P0 |
| FR-6.2 | Touch-friendly tap targets | P0 |
| FR-6.3 | Swipe actions (complete, delete) | P1 |
| FR-6.4 | Pull to refresh | P1 |
| FR-6.5 | PWA installable | P1 |

---

## 10. Technical Requirements

### TR-1: Performance

| Metric | Target |
|--------|--------|
| Initial load (LCP) | < 2.0s |
| Task list render (100 items) | < 1.5s |
| Task creation round-trip | < 800ms |
| Calendar render | < 1.0s |
| Bundle size (gzip) | < 200KB |

### TR-2: Security

| Requirement | Status |
|-------------|--------|
| RLS on all tables | ✅ |
| No service keys in client | ✅ |
| CORS restricted | ✅ |
| verify_jwt on functions | ✅ |
| No PII in logs | ✅ |
| Token hashing | ✅ |
| Session management | ✅ |

### TR-3: Reliability

| Metric | Target |
|--------|--------|
| Uptime | 99.5% |
| Error rate | < 1% |
| Data isolation | 100% |

### TR-4: Testing (V1)

| Type | Coverage Target |
|------|-----------------|
| Unit tests | 60% |
| Integration tests | 40% |
| E2E tests | Critical paths |

---

## 11. V1 Release Roadmap

**Target:** 2026-02-28 (4 weeks from MVP)  
**Theme:** "Make It Usable Daily"

### Phase 6: Task Lifecycle Enhancement (Week 1)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 6.1 | Edit task (title, assignee, due date) | P0 | Medium |
| 6.2 | Delete task (soft delete) | P0 | Low |
| 6.3 | Task notes/description field | P1 | Low |
| 6.4 | Task sort by due date | P0 | Low |
| 6.5 | Task filter by status | P0 | Low |
| 6.6 | Task filter by assignee | P1 | Low |
| 6.7 | "My Tasks" quick filter | P0 | Low |
| 6.8 | Bulk complete tasks | P1 | Medium |
| 6.9 | Archive completed tasks | P2 | Medium |

### Phase 7: Categories & Organization (Week 1)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 7.1 | Create task categories | P1 | Medium |
| 7.2 | Assign category to task | P1 | Low |
| 7.3 | Category color coding | P1 | Low |
| 7.4 | Filter by category | P1 | Low |
| 7.5 | Default categories (Chores, Shopping, Kids, Bills) | P1 | Low |

### Phase 8: Recurring Tasks (Week 2)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 8.1 | Daily recurrence | P0 | Medium |
| 8.2 | Weekly recurrence (select days) | P0 | Medium |
| 8.3 | Bi-weekly recurrence | P1 | Low |
| 8.4 | Monthly recurrence | P1 | Low |
| 8.5 | Recurrence UI in task form | P0 | Medium |
| 8.6 | Generate next occurrence on complete | P0 | Medium |
| 8.7 | Skip occurrence | P1 | Low |
| 8.8 | End recurrence after X times | P2 | Low |

### Phase 9: Notifications (Week 2)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 9.1 | Notification preferences table | P0 | Low |
| 9.2 | Email: task assigned to me | P0 | Medium |
| 9.3 | Email: daily digest (due today) | P0 | Medium |
| 9.4 | Email: overdue tasks | P1 | Low |
| 9.5 | Notification settings UI | P0 | Medium |
| 9.6 | Unsubscribe links | P0 | Low |
| 9.7 | Email templates (branded) | P1 | Medium |

### Phase 10: Calendar & Events (Week 3)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 10.1 | Events table + RLS | P0 | Medium |
| 10.2 | Create event (title, date, time) | P0 | Medium |
| 10.3 | All-day events | P0 | Low |
| 10.4 | Event for specific family member | P0 | Low |
| 10.5 | Week view calendar | P0 | High |
| 10.6 | Day view (tasks + events) | P0 | Medium |
| 10.7 | Edit event | P0 | Medium |
| 10.8 | Delete event | P0 | Low |
| 10.9 | Recurring events | P1 | Medium |
| 10.10 | Event reminders (30min before) | P1 | Medium |

### Phase 11: Quick Capture & Mobile (Week 3-4)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 11.1 | Floating action button (FAB) | P0 | Low |
| 11.2 | Quick add modal (title only) | P0 | Medium |
| 11.3 | Quick add from any screen | P0 | Low |
| 11.4 | Mobile-responsive layouts | P0 | Medium |
| 11.5 | Touch-friendly controls | P0 | Medium |
| 11.6 | Swipe to complete | P1 | Medium |
| 11.7 | Pull to refresh | P1 | Low |
| 11.8 | Dark mode | P1 | Medium |
| 11.9 | PWA manifest | P1 | Low |
| 11.10 | Offline indicator | P2 | Low |

### Phase 12: Polish & Launch (Week 4)
| ID | Feature | Priority | Effort |
|----|---------|----------|--------|
| 12.1 | Add automated tests (Vitest) | P0 | High |
| 12.2 | Error monitoring (App Insights) | P0 | Medium |
| 12.3 | Loading skeletons | P1 | Medium |
| 12.4 | Empty state improvements | P1 | Low |
| 12.5 | Onboarding tour | P2 | Medium |
| 12.6 | Beta feedback widget | P1 | Low |
| 12.7 | Performance optimization | P1 | Medium |
| 12.8 | Bundle size optimization | P2 | Medium |
| 12.9 | Documentation for beta users | P0 | Medium |

---

## 12. V2 Vision

**Target:** 2026-Q2  
**Theme:** "Family Hub"

### V2 Major Features

#### 1. Family Member Management
- Child profiles with age-appropriate views
- Restricted permissions for children
- Activity assignment per child
- Reward/points system for completed chores
- Allowance tracking (optional)

#### 2. Weekly Activity Tracking
- Create recurring weekly activities (Soccer on Tuesdays)
- Associate with specific family member
- View by child (Sarah's activities)
- Activity conflicts detection
- Per-activity notes (coach name, location, what to bring)

#### 3. School Events & Newsletters
- Quick-capture "School Event" type
- Permission slip tracking (needs signature by X)
- School holiday import
- Screenshot/photo attachment for newsletter items
- Due date extraction hints

#### 4. Calendar Integrations
- Google Calendar 2-way sync
- Outlook Calendar sync
- Apple Calendar sync
- Choose what syncs (all events vs. tagged events)
- Color coding by source

#### 5. Shared Lists
- Shopping lists (persistent, not one-time tasks)
- Packing lists
- Grocery list with aisle hints
- Quick add from task to list
- List sharing to non-member (e.g., share grocery list to grandma)

#### 6. Push Notifications
- Web push notifications
- Mobile push via PWA
- Configurable per notification type
- Do-not-disturb schedule

#### 7. Search & History
- Global search (tasks, events, lists)
- Activity history per household
- Audit log for admin actions
- Statistics dashboard (tasks completed per week/person)

---

## 13. V3 Vision

**Target:** 2026-Q4  
**Theme:** "Household Operating System"

### V3 Major Features

#### 1. Multiple Households
- Users can belong to multiple households
- Quick switch between households
- Per-household notification preferences

#### 2. Household Helpers (Limited Access)
- Invite babysitter with limited, time-bound access
- Share specific lists with cleaners
- Revocable access
- Activity logging for helpers

#### 3. Financial Coordination
- Shared expense tracking
- Bill reminders with amounts
- Allowance distribution
- Expense splitting between partners
- (No bank integration—manual entry)

#### 4. Meal Planning
- Weekly meal plan board
- Recipe links
- Auto-generate grocery list from meals
- Family favorites library
- Dietary preferences/restrictions

#### 5. AI Assistant (Optional)
- Natural language task creation ("Remind me to call the doctor Monday")
- Smart scheduling suggestions
- Newsletter scanning (beta)
- Voice assistant integration prep

#### 6. Native Mobile Apps
- iOS app
- Android app
- Offline support with sync
- Widget support (today's tasks)
- Live activities for iOS

#### 7. Data & Privacy
- Full data export (GDPR)
- Account deletion
- Data retention policies
- Privacy dashboard

#### 8. Household Analytics
- Weekly summary emails
- Task distribution charts
- Streaks and accomplishments
- Year in review

---

## 14. Success Metrics

### V1 Beta Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users (DAU) | 10+ (beta) | Analytics |
| Task Creation Rate | 5+/week/user | DB query |
| Task Completion Rate | 70%+ | DB query |
| Invite Acceptance Rate | 80%+ | DB query |
| Session Duration | 2+ min avg | Analytics |
| Return Rate (7-day) | 60%+ | Analytics |
| Critical Bugs | 0 | Issue tracker |
| App Crashes | 0 | Monitoring |

### V1 Launch Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registered Users | 100+ | Auth records |
| Active Households | 50+ | DB query |
| Net Promoter Score (NPS) | 40+ | Survey |
| Feature Requests Addressed | 80%+ | Issues |

### Long-Term Success Indicators

| Indicator | Description |
|-----------|-------------|
| Weekly Engagement | Most users engage 5+/week |
| Partner Adoption | 80%+ of invited partners actively use |
| Task Recurrence | 30%+ of tasks are recurring |
| Calendar Usage | 50%+ of households use calendar features |
| Notification Engagement | 60%+ open rate on emails |

---

## 15. Glossary

| Term | Definition |
|------|------------|
| **Household** | Private workspace for a family/group (data isolated) |
| **Owner** | Original creator; highest privilege; can delete household |
| **Admin** | Can invite, manage roles, manage categories |
| **Member** | Full task/event access; cannot manage household |
| **Child** | Restricted view; assigned content only (V2) |
| **Helper** | Temporary, limited access for external help (V3) |
| **RLS** | Row Level Security; PostgreSQL data isolation |
| **Edge Function** | Serverless function (Supabase Deno runtime) |
| **PWA** | Progressive Web App; installable, offline-capable |
| **Quick Add** | Minimal-friction task creation |
| **FAB** | Floating Action Button for quick capture |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-18 | Initial PRD |
| 2.0 | 2026-01-26 | MVP complete, V1/V2/V3 roadmap added |
| 2.1 | 2026-01-31 | Phase 6 (Task Lifecycle Enhancement) complete |

---

*This document is the single source of truth for Trackly Home product development.*
