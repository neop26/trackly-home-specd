# Quickstart Guide: Task Lifecycle Enhancement

**Feature**: 006-task-editing  
**Branch**: `006-task-editing`  
**Target Audience**: Developers testing this feature locally

## Prerequisites

- Trackly Home repository cloned and set up (see main README.md)
- Supabase CLI installed (`npx supabase --version`)
- Node.js 18+ and npm installed
- Local Supabase instance running

## 1. Checkout Feature Branch

```bash
git checkout 006-task-editing
```

## 2. Apply Database Migration

### Option A: Reset Database (Clean Slate)

```bash
cd /Users/neop26/repo/trackly-home-specd
npx supabase db reset
```

This applies all migrations in order, including the new `010_task_lifecycle.sql` migration.

### Option B: Apply Single Migration (If Already on Latest)

```bash
npx supabase migration up
```

### Verify Migration Applied

```bash
npx supabase db diff --schema public
```

Should show no differences if migration applied successfully.

**Verify New Columns**:
```sql
-- Run in Supabase Studio SQL Editor or via psql
\d tasks

-- Expected output should include:
-- notes           | text
-- deleted_at      | timestamp with time zone
-- archived_at     | timestamp with time zone
```

## 3. Install Frontend Dependencies

```bash
cd apps/web
npm install
```

**Note**: If `date-fns` is not already installed, add it:
```bash
npm install date-fns
```

## 4. Start Development Server

```bash
npm run dev
```

Open browser to: http://localhost:5173

## 5. Seed Test Data

### Option A: Use Existing Seed Script

If `supabase/seed.sql` has been updated with tasks:
```bash
npx supabase db reset  # This also runs seed.sql
```

### Option B: Manual Test Data Creation

1. **Login** to the app (create account or use existing)
2. **Create household** (if not already in one)
3. **Create multiple tasks** via UI:
   - Task 1: "Buy groceries" (no due date, unassigned)
   - Task 2: "Pick up kids" (due: today, assigned to yourself)
   - Task 3: "Call dentist" (due: tomorrow, unassigned, notes: "Reschedule appointment to next week\nPhone: (555) 123-4567")
   - Task 4: "Weekly review" (due: in 3 days, assigned to partner if available)
   - Task 5: "Fix leaky faucet" (no due date, assigned to yourself)

### Option C: SQL Insert

```sql
-- Get your household_id and user_id from Supabase Studio
-- Replace UUIDs below with actual values

insert into public.tasks (household_id, title, status, assigned_to, due_date, notes) values
  ('<household-uuid>', 'Buy groceries', 'incomplete', null, null, null),
  ('<household-uuid>', 'Pick up kids', 'incomplete', '<your-user-uuid>', current_date, null),
  ('<household-uuid>', 'Call dentist', 'incomplete', null, current_date + 1, 'Reschedule appointment to next week' || chr(10) || 'Phone: (555) 123-4567'),
  ('<household-uuid>', 'Weekly review', 'incomplete', '<partner-user-uuid>', current_date + 3, null),
  ('<household-uuid>', 'Fix leaky faucet', 'complete', '<your-user-uuid>', null, 'Plumber came and fixed it');
```

## 6. Feature Testing Workflow

### US1: Edit Task

1. Navigate to **Tasks** screen
2. Hover over a task → **Edit icon** appears
3. Click **Edit** → Modal opens with pre-filled form
4. Change:
   - **Title**: "Pick up kids" → "Pick up kids from school"
   - **Assignee**: Select different household member (if multi-member household)
   - **Due Date**: Change to tomorrow
   - **Notes**: Add "Remember to bring permission slip"
5. Click **Save**
6. ✅ **Verify**: Task list updates immediately with new values
7. Refresh page → Changes persisted

### US2: Delete and Restore Task

1. Hover over a task → **Delete icon** appears
2. Click **Delete** → Confirmation dialog opens
3. Click **Confirm** → Task disappears from list
4. Navigate to **Deleted Tasks** (Settings → Deleted Tasks, or add to sidebar)
5. ✅ **Verify**: Deleted task appears with "Restore" button
6. Click **Restore** → Task returns to active list
7. ✅ **Verify**: All original data intact (title, assignee, due date, notes)

**Test Permanent Delete (Admin Only)**:
1. Manually set `deleted_at` in database to 31 days ago:
   ```sql
   update tasks set deleted_at = now() - interval '31 days' where id = '<task-uuid>';
   ```
2. As admin, navigate to Deleted Tasks → **Permanently Delete** button visible
3. Click → Confirmation → Task removed from database forever

### US3: My Tasks Filter

1. Tasks screen → Click **"My Tasks"** quick filter
2. ✅ **Verify**: Only tasks assigned to you are visible
3. If no tasks assigned → ✅ **Verify**: Empty state shows "You're all caught up! 🎉"
4. Open second browser tab (or incognito as partner)
5. Partner assigns a task to you
6. ✅ **Verify**: Task appears in your "My Tasks" view within 500ms (Realtime)

### US4: Sort Tasks

1. Tasks screen → Default sort = **Due Date** (earliest first)
2. ✅ **Verify**: Tasks with no due date appear at bottom
3. Click **"Sort by"** dropdown → Select **"Created Date"**
4. ✅ **Verify**: List re-sorts (oldest task first)
5. Select **"Title (A-Z)"** → ✅ **Verify**: Alphabetical ordering
6. Refresh page → ✅ **Verify**: Sort preference persisted (localStorage)

### US5: Filter by Status

1. Default view: **Active Only** (incomplete tasks)
2. Toggle **"Show Completed"** → ✅ **Verify**: Completed tasks appear with strikethrough
3. Mark a task complete → ✅ **Verify**: Task updates to strikethrough style
4. Select **"Completed Only"** filter → ✅ **Verify**: Only completed tasks shown
5. Mark task incomplete → ✅ **Verify**: Disappears from "Completed Only" view

### US6: Filter by Assignee (P2)

1. Click **"Filter by Assignee"** → Dropdown shows household members + "Unassigned"
2. Select your partner's name → ✅ **Verify**: Only their tasks visible
3. Select **"Unassigned"** → ✅ **Verify**: Only unassigned tasks visible
4. Combine with "My Tasks" → ✅ **Verify**: Filters work together (intersection)

### US7: Task Notes (P2)

1. Create new task → Expand **"Add Notes"** field
2. Enter multi-line text:
   ```
   Remember to bring:
   - Snacks
   - Water bottles
   - Permission slip
   ```
3. Paste a URL: `https://www.example.com/event-details`
4. Save task → ✅ **Verify**: Note icon appears on task
5. Click task → ✅ **Verify**: Notes displayed with line breaks preserved
6. ✅ **Verify**: URL is clickable link (opens in new tab with `rel="noopener"`)

### US8: Bulk Complete (P2)

1. Click **"Select Mode"** → Checkboxes appear
2. Check 3 incomplete tasks
3. ✅ **Verify**: Selection count shown: "3 tasks selected"
4. Click **"Complete Selected"** → ✅ **Verify**: All 3 marked complete in < 2 seconds
5. Click **"Select All"** → ✅ **Verify**: All visible tasks selected
6. Click **"Delete Selected"** → Confirmation → ✅ **Verify**: All soft-deleted

### US9: Archive Tasks (P3)

1. Complete 2-3 tasks
2. Click **"Archive All Completed"** button
3. ✅ **Verify**: Completed tasks disappear from view
4. Navigate to **Archived Tasks** (Settings → Archived Tasks)
5. ✅ **Verify**: Archived tasks listed
6. Click **"Restore to Active"** → ✅ **Verify**: Returns to completed task list

## 7. RLS Security Testing

**Critical**: Verify household isolation with two test accounts.

### Setup Two Households

1. **Browser 1 (Alice)**: Login as user A, create Household A, create task "Alice's task"
2. **Browser 2 (Bob)**: Login as user B (different email), create Household B, create task "Bob's task"

### Test Cross-Household Access Blocked

1. **Alice** tries to edit/delete Bob's task (via direct API call in console):
   ```javascript
   // In browser console (Alice logged in)
   const { data, error } = await supabase
     .from('tasks')
     .update({ title: 'Hacked!' })
     .eq('id', '<bobs-task-uuid>');
   
   console.log(data, error);
   // Expected: data = null, error = "new row violates row-level security policy"
   ```

2. **Alice** tries to read Bob's tasks:
   ```javascript
   const { data } = await supabase
     .from('tasks')
     .select('*')
     .eq('household_id', '<bobs-household-uuid>');
   
   console.log(data);
   // Expected: data = [] (empty array, RLS blocks)
   ```

3. **Alice** tries to soft-delete Bob's task:
   ```javascript
   const { data, error } = await supabase
     .from('tasks')
     .update({ deleted_at: new Date().toISOString() })
     .eq('id', '<bobs-task-uuid>');
   
   // Expected: data = null, 0 rows updated (RLS blocks)
   ```

✅ **Pass Criteria**: All cross-household operations return empty results or RLS errors.

## 8. Performance Testing

### Task List Rendering (100 Tasks)

1. Create 100 tasks via SQL:
   ```sql
   insert into public.tasks (household_id, title, status)
   select '<household-uuid>', 'Task ' || generate_series, 'incomplete'
   from generate_series(1, 100);
   ```

2. Open browser DevTools → **Network** tab → Hard refresh
3. ✅ **Verify**: Task list renders in < 1.5 seconds (measure LCP in Lighthouse)

### Filter/Sort Performance

1. With 100 tasks loaded:
2. Apply filter (status: completed only) → ✅ **Verify**: Updates in < 1 second
3. Change sort (due date → title) → ✅ **Verify**: Re-renders in < 500ms

### Bulk Operations (50 Tasks)

1. Create 50 tasks
2. Enter **Select Mode** → Select all 50
3. Click **"Complete Selected"** → ✅ **Verify**: Completes in < 2 seconds

## 9. Multi-User Real-Time Testing

**Requires two browser sessions (or two devices).**

1. **Browser 1 (Alice)** and **Browser 2 (Bob)** both in same household
2. Both viewing task list
3. **Alice** edits a task title → ✅ **Verify**: Bob sees update within 500ms
4. **Alice** deletes a task → ✅ **Verify**: Bob sees task disappear immediately
5. **Alice** reassigns task to Bob → ✅ **Verify**: Appears in Bob's "My Tasks" filter instantly

## 10. Error Scenario Testing

### Network Failure

1. Edit a task → Open DevTools → **Network** tab → **Go offline**
2. Click **Save** → ✅ **Verify**: Error toast shown: "Network error. Please check connection."
3. Go back online → Click **Save** again → ✅ **Verify**: Succeeds

### Concurrent Edit Conflict

1. **Alice** and **Bob** both open edit modal for same task
2. **Alice** saves first (changes title to "Alice's version")
3. **Bob** saves second (changes title to "Bob's version")
4. ✅ **Verify**: Warning shown to Bob: "This task was recently updated. Please review changes and try again."
5. ✅ **Verify**: Bob's changes applied (last-write-wins) but with notification

### Validation Errors

1. Edit task → Clear title → Click **Save**
2. ✅ **Verify**: Validation error: "Title is required"
3. Add 6000 characters to notes field → Click **Save**
4. ✅ **Verify**: Validation error: "Notes must be 5000 characters or less"

## 11. Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

✅ **Pass Criteria**: All features work without console errors in all browsers.

## 12. Debugging Tips

### Check Supabase Logs

```bash
npx supabase functions logs --tail
```

### Check Database State

```sql
-- View all tasks with new columns
select id, title, status, notes, deleted_at, archived_at, updated_at
from tasks
where household_id = '<your-household-uuid>'
order by updated_at desc;

-- View soft-deleted tasks
select id, title, deleted_at
from tasks
where household_id = '<your-household-uuid>'
  and deleted_at is not null;

-- View archived tasks
select id, title, archived_at
from tasks
where household_id = '<your-household-uuid>'
  and archived_at is not null;
```

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| Tasks not updating in UI | Supabase Realtime not connected | Check browser console for WebSocket errors; verify Supabase config |
| "Permission denied" on edit | RLS blocking update | Verify user is member of household; check RLS policies |
| Notes not saving | Character limit exceeded | Check notes length (max 5000 chars) |
| Deleted tasks not appearing | Wrong household_id | Verify you're querying correct household in "Deleted Tasks" view |
| Edit modal not opening | Component not mounted | Check React DevTools; verify modal component imported |

### Reset Local Database

If data gets into a bad state:
```bash
npx supabase db reset
# Re-seed with test data via UI or SQL
```

## 13. Ready to Merge Checklist

- [ ] All 9 user stories tested and passing
- [ ] RLS security verified (cross-household access blocked)
- [ ] Performance benchmarks met (render < 1.5s, operations < 2s)
- [ ] Real-time updates working (< 500ms)
- [ ] Error scenarios handled gracefully
- [ ] Browser compatibility confirmed
- [ ] No console errors in browser
- [ ] `npm run build` succeeds
- [ ] `npm run lint` passes
- [ ] Migration applied successfully
- [ ] Documentation updated (migration README, PRD status)

## 14. Next Steps

After local testing passes:
1. Push branch to remote: `git push origin 006-task-editing`
2. Open Pull Request to `main`
3. Request review from team
4. Deploy to staging (Azure Dev) for integration testing
5. After staging validation, deploy to production (Azure Prod)

## Helpful Commands Quick Reference

```bash
# Database
npx supabase db reset                    # Reset and re-seed
npx supabase migration list              # List all migrations
npx supabase db diff --schema public     # Check for unapplied changes

# Frontend
npm run dev                              # Start dev server
npm run build                            # Build for production
npm run lint                             # Run ESLint

# Git
git checkout 006-task-editing            # Switch to feature branch
git status                               # Check changed files
git add .                                # Stage all changes
git commit -m "feat(tasks): ..."         # Commit with conventional format
git push origin 006-task-editing         # Push to remote
```

## Support

Questions? Issues?
- Check [spec.md](./spec.md) for feature requirements
- Check [data-model.md](./data-model.md) for database schema
- Check [plan.md](./plan.md) for implementation details
- Ping team in Slack #trackly-dev channel
