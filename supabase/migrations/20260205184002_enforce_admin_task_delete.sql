-- ================================================================
-- Migration: 011 - Enforce Admin-Only Permanent Task Delete
-- Feature: Task Editing (Task Lifecycle Enhancement)
-- Created: 2026-02-05
-- ================================================================

begin;

-- Restrict permanent delete to admins and only for tasks deleted > 30 days
drop policy if exists tasks_delete_members on public.tasks;

create policy tasks_delete_admins_30_days
	on public.tasks
	for delete
	to authenticated
	using (
		public.is_household_admin(household_id)
		and deleted_at is not null
		and deleted_at <= (now() - interval '30 days')
	);

commit;
