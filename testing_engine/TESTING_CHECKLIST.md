# Trackly Home — Testing Checklist
**Phase:** Task Lifecycle Enhancement (Phase 1-10 Complete)  
**Document Version:** 1.0  
**Date:** 2026-01-31  
**Purpose:** Comprehensive testing checklist for major development phase closure

---

## Overview

This checklist covers all features implemented in the Task Lifecycle Enhancement phase, including:
- Task CRUD operations (Create, Read, Update, Delete)
- Advanced filtering (Status, Assignee, My Tasks)
- Task sorting (4 sort methods)
- Bulk operations (Multi-select, Bulk assign, Bulk delete)
- Task notes and metadata
- Soft delete with restore/permanent delete

**Testing Approach:** Manual functional testing  
**Test Environment:** Dev + Production  
**Tester Role Requirements:** Owner, Admin, Member roles

---

## 1. Authentication & Access Control

### 1.1 Basic Authentication
- [ ] Sign in with magic link works
- [ ] Session persists after page refresh
- [ ] Sign out works from all pages
- [ ] Protected routes redirect to auth when not logged in
- [ ] Authenticated users can access dashboard

### 1.2 Household Setup
- [ ] New user can create a household
- [ ] Household name displays in header
- [ ] User becomes owner of created household
- [ ] Cannot access app without being in a household

---

## 2. Task Management — Core CRUD

### 2.1 Create Tasks
- [ ] Can create task with title only (minimum requirement)
- [ ] Can create task with all fields (title, assignee, due date, notes)
- [ ] Task appears at top of list immediately (optimistic update)
- [ ] Created task persists after page refresh
- [ ] Empty title is rejected with validation error
- [ ] Long titles (100+ characters) are handled properly

### 2.2 View Tasks
- [ ] All active tasks display on load
- [ ] Task list shows title, assignee, due date
- [ ] Unassigned tasks show "Unassigned"
- [ ] Tasks without due dates display appropriately
- [ ] Task notes are visible (truncated if long)
- [ ] List updates in real-time when tasks are added/modified

### 2.3 Edit Tasks
- [ ] Click task edit icon opens edit modal
- [ ] Can modify task title
- [ ] Can change assignee (including unassigning)
- [ ] Can update due date
- [ ] Can add/edit/remove notes
- [ ] Changes save and reflect immediately in list
- [ ] Cancel button discards changes
- [ ] Validation prevents saving empty title

### 2.4 Toggle Task Completion
- [ ] Click checkbox marks task complete
- [ ] Click checkbox again marks task incomplete
- [ ] Status change is immediate (optimistic update)
- [ ] Completed tasks have visual distinction (strikethrough/styling)
- [ ] Status persists after page refresh
- [ ] Status filter updates immediately after toggle

### 2.5 Delete Tasks (Soft Delete)
- [ ] Click delete icon shows confirmation dialog
- [ ] Confirm delete removes task from active list
- [ ] Deleted task does NOT appear in Active view
- [ ] Deleted task does NOT appear in Completed view
- [ ] Task is soft-deleted (not permanently removed from database)
- [ ] Cancel button keeps task in list

---

## 3. Advanced Filtering

### 3.1 Status Filter (Tabs)
- [ ] **Active tab:** Shows only incomplete tasks (default view)
- [ ] **Completed tab:** Shows only completed tasks
- [ ] **All Tasks tab:** Shows both incomplete and completed
- [ ] Tab selection is visually indicated (button styling)
- [ ] Filter persists in localStorage across sessions
- [ ] Switching tabs updates list immediately
- [ ] Task count updates correctly per filter

### 3.2 My Tasks Filter
- [ ] "My Tasks" button filters to tasks assigned to current user
- [ ] Button shows active state when enabled
- [ ] Shows "You're all caught up!" when no tasks assigned to user
- [ ] "Clear Filter" button appears when My Tasks is active
- [ ] Clearing filter returns to "All Members" view
- [ ] Filter persists across page refreshes
- [ ] Works correctly with status filter (combined filters)

### 3.3 Assignee Filter (Dropdown)
- [ ] Dropdown shows "All Members", "Unassigned", and list of household members
- [ ] Selecting member filters to only their tasks
- [ ] "Unassigned" shows only tasks with no assignee
- [ ] "All Members" shows all tasks (no filter)
- [ ] Filter selection updates list immediately
- [ ] Filter persists in localStorage
- [ ] Works correctly with status filter (combined filters)

### 3.4 Combined Filters
- [ ] Can combine Status + My Tasks (e.g., "My Active Tasks")
- [ ] Can combine Status + Assignee dropdown
- [ ] Can combine My Tasks + Assignee dropdown (should show same result)
- [ ] All three filters work together correctly
- [ ] Clearing one filter doesn't affect others
- [ ] Filter state persists correctly across refresh

---

## 4. Task Sorting

### 4.1 Sort by Due Date
- [ ] Tasks with due dates appear first, sorted earliest to latest
- [ ] Tasks without due dates appear at the end
- [ ] Tasks with same due date are sub-sorted by created date
- [ ] Sort dropdown shows "Sort by: Due Date"
- [ ] Sort selection persists across refresh

### 4.2 Sort by Created Date
- [ ] Tasks sorted from oldest to newest
- [ ] Newly created tasks appear at bottom
- [ ] Sort dropdown shows "Sort by: Created Date"
- [ ] Sort selection persists across refresh

### 4.3 Sort by Title (A-Z)
- [ ] Tasks sorted alphabetically by title
- [ ] Case-insensitive sorting (A = a)
- [ ] Special characters handled appropriately
- [ ] Sort dropdown shows "Sort by: Title (A-Z)"
- [ ] Sort selection persists across refresh

### 4.4 Sort by Assignee
- [ ] Unassigned tasks appear first
- [ ] Then tasks sorted alphabetically by assignee display name
- [ ] Sort dropdown shows "Sort by: Assignee"
- [ ] Sort selection persists across refresh

### 4.5 Sorting with Filters
- [ ] Sorting works correctly with Active/Completed/All filters
- [ ] Sorting works correctly with My Tasks filter
- [ ] Sorting works correctly with Assignee filter
- [ ] Sort order maintained when toggling filters

---

## 5. Bulk Actions

### 5.1 Selection Mode
- [ ] "Select Mode" button enters multi-select mode
- [ ] Button changes to "Exit Selection Mode" when active
- [ ] Checkboxes appear on all task items
- [ ] "Select All" button appears when in selection mode
- [ ] Selected count displays (e.g., "3 selected")
- [ ] Can select/deselect individual tasks
- [ ] "Select All" selects all visible tasks (respects filters)

### 5.2 Bulk Assign
- [ ] Assignee dropdown appears in bulk action bar
- [ ] Can select household member to assign
- [ ] "Assign" button applies assignee to all selected tasks
- [ ] Assignment reflects immediately in task list
- [ ] Changes persist after page refresh
- [ ] Success toast notification appears
- [ ] Selection clears after successful assignment

### 5.3 Bulk Delete
- [ ] "Delete" button appears in bulk action bar
- [ ] Confirmation dialog appears before deletion
- [ ] Can cancel bulk delete
- [ ] Confirming removes all selected tasks from active list
- [ ] Tasks are soft-deleted (recoverable)
- [ ] Success toast notification appears
- [ ] Selection mode exits after deletion

### 5.4 Bulk Actions Edge Cases
- [ ] Cannot perform bulk actions with 0 tasks selected
- [ ] Bulk actions work correctly with filtered views
- [ ] Exiting selection mode clears all selections
- [ ] Switching filters while in selection mode works correctly
- [ ] Adding/editing individual task while in selection mode works

---

## 6. Deleted Tasks Management

### 6.1 Access Deleted Tasks View
- [ ] Deleted tasks view accessible from navigation/menu
- [ ] Only owners and admins can access (role check)
- [ ] Members see access denied or no menu option
- [ ] View loads successfully

### 6.2 View Deleted Tasks
- [ ] All soft-deleted tasks display in list
- [ ] Shows task title, original assignee, deletion date
- [ ] Empty state shows when no deleted tasks
- [ ] Deleted tasks don't appear in main task list

### 6.3 Restore Tasks
- [ ] "Restore" button appears for each deleted task
- [ ] Click restore returns task to active list
- [ ] Restored task appears in main Tasks view immediately
- [ ] Restored task retains original assignee and metadata
- [ ] Success toast notification appears

### 6.4 Permanent Delete
- [ ] "Permanently Delete" button appears (admin/owner only)
- [ ] Confirmation dialog appears before permanent deletion
- [ ] Warning message clearly states action is irreversible
- [ ] Can cancel permanent delete
- [ ] Confirming removes task from deleted tasks view
- [ ] Task cannot be recovered after permanent deletion
- [ ] Success toast notification appears

---

## 7. Task Notes & Metadata

### 7.1 Task Notes
- [ ] Notes field available in create task modal
- [ ] Notes field available in edit task modal
- [ ] Can add notes up to reasonable length (1000+ characters)
- [ ] Notes display in task item (truncated if long)
- [ ] Clicking "Show more" expands full note text
- [ ] Notes persist after save
- [ ] Can edit existing notes
- [ ] Can remove notes (clear field)

### 7.2 Task Metadata Display
- [ ] Due date displays in readable format (e.g., "Jan 31, 2026")
- [ ] Overdue tasks have visual indicator (red text/icon)
- [ ] Assignee name displays correctly
- [ ] Created date available in task details
- [ ] Last modified date tracked (if implemented)

---

## 8. Error Handling & Edge Cases

### 8.1 Network & Loading States
- [ ] Loading spinner shows while tasks are loading
- [ ] Error message displays if tasks fail to load
- [ ] Can retry loading after error
- [ ] Offline behavior is graceful (cached data or error message)
- [ ] Slow network shows appropriate loading states

### 8.2 Validation & User Input
- [ ] Cannot save task with empty title
- [ ] Long task titles handled appropriately (truncate or wrap)
- [ ] Invalid due dates rejected (e.g., dates in wrong format)
- [ ] Special characters in task title handled correctly
- [ ] Emoji in task title supported
- [ ] SQL injection attempts sanitized

### 8.3 Concurrent Operations
- [ ] Two users editing same task: last save wins
- [ ] Deleting task while another user is viewing it
- [ ] Creating task while another user is filtering
- [ ] Real-time updates reflected without manual refresh (if implemented)

### 8.4 Empty States
- [ ] No tasks exist: Shows empty state message
- [ ] No tasks match filter: Shows appropriate message
- [ ] "My Tasks" with 0 assigned: Shows "You're all caught up!"
- [ ] Deleted tasks view with 0 items: Shows empty state

---

## 9. UI/UX & Accessibility

### 9.1 Responsive Design
- [ ] Works on desktop (1920x1080, 1366x768)
- [ ] Works on tablet (iPad, 768x1024)
- [ ] Works on mobile (iPhone, 375x667)
- [ ] Touch targets are large enough on mobile
- [ ] Modals/dialogs display correctly on small screens
- [ ] No horizontal scrolling on any screen size

### 9.2 Visual Design
- [ ] Buttons have clear hover/active states
- [ ] Selected items visually distinct
- [ ] Completed tasks visually distinct from active
- [ ] Color contrast meets accessibility standards
- [ ] Icons are clear and intuitive
- [ ] Spacing and alignment are consistent

### 9.3 Keyboard Navigation
- [ ] Can tab through all interactive elements
- [ ] Enter key submits forms
- [ ] Escape key closes modals/dialogs
- [ ] Focus indicators visible on all elements
- [ ] Can complete core tasks without mouse

### 9.4 Screen Reader Support
- [ ] Alt text on icons/images
- [ ] ARIA labels on interactive elements
- [ ] Form fields have associated labels
- [ ] Error messages announced to screen readers
- [ ] Toast notifications announced

---

## 10. Performance & Data Integrity

### 10.1 Performance
- [ ] Initial page load < 3 seconds
- [ ] Task list renders smoothly with 100+ tasks
- [ ] Filtering/sorting is instantaneous
- [ ] No visible lag when toggling task completion
- [ ] Optimistic updates feel immediate
- [ ] No memory leaks during extended use

### 10.2 Data Persistence
- [ ] All task changes persist to database
- [ ] Filter preferences persist across sessions (localStorage)
- [ ] Sort preferences persist across sessions (localStorage)
- [ ] No data loss on page refresh
- [ ] No data loss on browser close/reopen
- [ ] Concurrent user edits don't corrupt data

### 10.3 Browser Compatibility
- [ ] Works on Chrome (latest)
- [ ] Works on Firefox (latest)
- [ ] Works on Safari (latest)
- [ ] Works on Edge (latest)
- [ ] Console has no errors/warnings
- [ ] LocalStorage functions correctly in all browsers

---

## 11. Member & Role Management

### 11.1 Member Roles
- [ ] Owner can access all features
- [ ] Admin can access all features except changing ownership
- [ ] Member can create/edit/delete their own tasks
- [ ] Member cannot access deleted tasks view
- [ ] Member cannot permanently delete tasks
- [ ] Role is displayed in members list

### 11.2 Invite System
- [ ] Owner/Admin can create invite links
- [ ] Invite link copied to clipboard successfully
- [ ] Invite expires after 7 days
- [ ] Expired invite shows error message
- [ ] Single-use invite cannot be used twice
- [ ] New member joins with "member" role by default

---

## 12. Integration & Cross-Feature Testing

### 12.1 Task Assignment Flow
- [ ] Create task → Assign to self → Appears in My Tasks
- [ ] Create task → Assign to other → Appears in their My Tasks
- [ ] Edit task → Change assignee → Filters update correctly
- [ ] Bulk assign → All selected tasks update assignee

### 12.2 Task Completion Flow
- [ ] Create task → Complete → Appears in Completed tab
- [ ] Complete task → Uncomplete → Appears in Active tab
- [ ] Bulk delete completed tasks → Only affects completed tasks
- [ ] Filter to Completed → Only completed tasks shown

### 12.3 Task Deletion & Recovery Flow
- [ ] Delete task → Restore from deleted view → Appears in active list
- [ ] Delete task → Permanent delete → Cannot recover
- [ ] Bulk delete → All deleted tasks in deleted view
- [ ] Delete completed task → Can still restore it

---

## Test Execution Summary

### Testing Metrics
- **Total Test Cases:** ~150+
- **Critical Path Tests:** ~40
- **Regression Tests:** ~50
- **Edge Case Tests:** ~30
- **UI/UX Tests:** ~20

### Sign-off Template

**Test Environment:** [ ] Dev | [ ] Production  
**Tested By:** _______________  
**Date:** _______________  
**Browser:** _______________  
**Device:** _______________  

**Results:**
- Tests Passed: _____ / _____
- Tests Failed: _____ 
- Blockers Identified: _____
- Minor Issues: _____

**Overall Status:** [ ] PASS | [ ] FAIL | [ ] CONDITIONAL PASS

**Notes:**
_____________________________________________
_____________________________________________
_____________________________________________

---

## Critical Bugs / Known Issues

Document any critical issues discovered during testing:

| ID | Priority | Description | Repro Steps | Status |
|----|----------|-------------|-------------|--------|
| 1  |          |             |             |        |
| 2  |          |             |             |        |
| 3  |          |             |             |        |

---

## Next Steps After Testing

- [ ] Document all bugs in GitHub Issues
- [ ] Prioritize bug fixes (P0, P1, P2)
- [ ] Update MVP_STATUS_REPORT.md with completion status
- [ ] Create release notes for this phase
- [ ] Plan next development phase
- [ ] Schedule production deployment (if all tests pass)

---

**Document Owner:** Development Team  
**Last Updated:** 2026-01-31  
**Status:** Ready for Testing
