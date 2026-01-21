# Feature Specification: [FEATURE NAME]

**Feature Branch**: `[###-feature-name]`  
**Created**: [DATE]  
**Status**: Draft  
**Input**: User description: "$ARGUMENTS"

## User Scenarios & Testing *(mandatory)*

<!--
  TRACKLY HOME GUIDELINES:
  
  User stories should be PRIORITIZED as user journeys ordered by importance.
  Each story must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable increment that delivers value.
  
  Priorities:
  - P1: MVP-critical, must have for launch
  - P2: Important but not blocking MVP
  - P3: Nice to have, can defer
  
  Consider existing user flows:
  - Authentication (magic link sign-in)
  - Household creation (owner assignment)
  - Invite flow (admin creates, partner joins)
  - Role management (admin-only)
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### Edge Cases

<!--
  TRACKLY HOME COMMON EDGE CASES:
  - What if user is already in a household?
  - What if user is the last admin?
  - What if token is expired/used/invalid?
  - What if cross-household access is attempted?
  - What if user has no household yet?
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

<!--
  TRACKLY HOME GUIDELINES:
  - Security requirements are always implicit (RLS, auth validation)
  - Consider role-based access (owner/admin/member)
  - Consider household data isolation
  - Mark unclear items with [NEEDS CLARIFICATION: reason]
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability]
- **FR-002**: System MUST [specific capability]
- **FR-003**: [Role] MUST be able to [key interaction]
- **FR-004**: System MUST [data requirement]
- **FR-005**: System MUST [behavior]

### Security Requirements *(include if feature touches data/auth)*

- **SR-001**: Feature MUST enforce household isolation via RLS
- **SR-002**: Feature MUST validate user authentication
- **SR-003**: [Admin-only feature] MUST verify admin role before execution

### Key Entities *(include if feature involves data)*

<!--
  EXISTING ENTITIES:
  - profiles (user_id, display_name, timezone)
  - households (id, name, owner_user_id)
  - household_members (user_id, household_id, role)
  - invites (token_hash, expires_at, invited_email)
-->

- **[New Entity]**: [What it represents, key attributes, relationship to households]

## Success Criteria *(mandatory)*

<!--
  TRACKLY HOME METRICS:
  - User completion rates
  - Error rates
  - Security (zero cross-household leaks)
  - Performance (LCP < 2.5s, function response < 500ms)
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete [task] in under X minutes"]
- **SC-002**: [Security metric, e.g., "Zero cross-household data exposure"]
- **SC-003**: [User success metric, e.g., "X% of users complete primary task on first attempt"]
- **SC-004**: [Performance metric, e.g., "Feature loads in under X seconds"]
