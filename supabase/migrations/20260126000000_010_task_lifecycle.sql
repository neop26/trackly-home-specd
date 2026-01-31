-- Migration: Task Lifecycle Enhancement
-- Feature: 006-task-editing
-- Adds support for task editing, soft deletion, archiving, and notes

-- Add new columns to tasks table
alter table public.tasks
  add column if not exists notes text check (char_length(notes) <= 5000),
  add column if not exists deleted_at timestamptz,
  add column if not exists archived_at timestamptz;

-- Add indexes for filtering performance
create index if not exists tasks_deleted_at_idx 
  on public.tasks(deleted_at) 
  where deleted_at is not null;

create index if not exists tasks_archived_at_idx 
  on public.tasks(archived_at) 
  where archived_at is not null;

create index if not exists tasks_household_assigned_status_idx 
  on public.tasks(household_id, assigned_to, status) 
  where deleted_at is null and archived_at is null;

-- Add column comments for documentation
comment on column public.tasks.notes is 'Optional task notes/description (max 5000 characters). Plain text with auto-linkified URLs in UI.';
comment on column public.tasks.deleted_at is 'Soft-delete timestamp. NULL = active, NOT NULL = deleted (can be restored). Tasks deleted for 30+ days can be permanently removed by admins.';
comment on column public.tasks.archived_at is 'Archive timestamp. NULL = active/deleted, NOT NULL = archived (hidden from default views). Archived tasks can be restored to completed status.';
