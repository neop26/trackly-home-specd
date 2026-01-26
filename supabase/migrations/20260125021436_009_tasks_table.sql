-- ================================================================
-- Migration: 009 - Tasks Table
-- Feature: Planner MVP (Task Management)
-- Created: 2026-01-25
-- ================================================================

-- ----------------------------------------------------------------
-- 1. CREATE TABLE
-- ----------------------------------------------------------------

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households(id) on delete cascade,
  title text not null check (char_length(title) > 0 and char_length(title) <= 500),
  status text not null default 'incomplete' check (status in ('incomplete', 'complete')),
  assigned_to uuid references public.profiles(user_id) on delete set null,
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------
-- 2. CREATE INDEXES
-- ----------------------------------------------------------------

create index tasks_household_id_idx on public.tasks (household_id);
create index tasks_assigned_to_idx on public.tasks (assigned_to);

-- ----------------------------------------------------------------
-- 3. ADD UPDATED_AT TRIGGER
-- ----------------------------------------------------------------

create trigger set_tasks_updated_at
  before update on public.tasks
  for each row
  execute function public.set_updated_at();

-- ----------------------------------------------------------------
-- 4. ENABLE ROW LEVEL SECURITY
-- ----------------------------------------------------------------

alter table public.tasks enable row level security;

-- ----------------------------------------------------------------
-- 5. CREATE RLS POLICIES
-- ----------------------------------------------------------------

-- SELECT: Members can read their household's tasks
create policy tasks_select_members
  on public.tasks
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

-- INSERT: Members can create tasks for their household
create policy tasks_insert_members
  on public.tasks
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

-- UPDATE: Members can update their household's tasks
create policy tasks_update_members
  on public.tasks
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

-- DELETE: Members can delete their household's tasks
create policy tasks_delete_members
  on public.tasks
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.household_members hm
      where hm.household_id = tasks.household_id
        and hm.user_id = auth.uid()
    )
  );

-- ================================================================
-- END MIGRATION 009
-- ================================================================
