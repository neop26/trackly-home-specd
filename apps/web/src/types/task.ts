/**
 * Task entity from tasks table
 */
export interface Task {
  id: string;
  household_id: string;
  title: string;
  status: "incomplete" | "complete";
  assigned_to: string | null;
  assigned_to_name?: string | null; // Display name of assignee (joined from profiles)
  due_date: string | null; // ISO date string (YYYY-MM-DD)
  notes: string | null; // Multi-line task notes/description (max 5000 chars)
  deleted_at: string | null; // ISO timestamp - soft delete
  archived_at: string | null; // ISO timestamp - archived state
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Partial update payload for editing tasks
 */
export type TaskUpdate = Partial<Pick<Task, "title" | "assigned_to" | "due_date" | "notes">>;

/**
 * Filter and sort options for task list views
 */
export interface TaskFilters {
  status: "active" | "completed" | "all";
  assignee: string | "all" | "unassigned" | "me";
  sortBy: "due_date" | "created_at" | "title" | "assignee";
}
