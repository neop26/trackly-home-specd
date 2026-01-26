import { supabase } from "../lib/supabaseClient";
import type { Task, TaskUpdate } from "../types/task";

export type { Task };

/**
 * Fetch all tasks for a specific household with assignee display names
 * @param householdId - UUID of the household
 * @returns Array of tasks ordered by created_at descending
 * @throws Error if query fails
 */
export async function getTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select(`
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(display_name)
    `)
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .is("archived_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load tasks. Please check your connection and try again.`);
  }

  // Map the joined profile data to assigned_to_name
  return (data || []).map((task) => ({
    ...task,
    assigned_to_name: task.assigned_to_profile?.display_name || null,
    assigned_to_profile: undefined,
  }));
}

/**
 * Create a new task for a household
 * @param householdId - UUID of the household
 * @param title - Task description (1-500 characters)
 * @param assignedTo - Optional UUID of household member to assign task to
 * @param dueDate - Optional due date in YYYY-MM-DD format
 * @returns Created task object
 * @throws Error if creation fails or validation fails
 */
export async function createTask(
  householdId: string,
  title: string,
  assignedTo?: string | null,
  dueDate?: string | null
): Promise<Task> {
  // Frontend validation (database also enforces)
  if (!title || title.trim().length === 0) {
    throw new Error("Task title is required");
  }

  if (title.length > 500) {
    throw new Error("Task title must be 500 characters or less");
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      household_id: householdId,
      title: title.trim(),
      status: "incomplete",
      assigned_to: assignedTo || null,
      due_date: dueDate || null,
    })
    .select(`
      *,
      assigned_to_profile:profiles!tasks_assigned_to_fkey(display_name)
    `)
    .single();

  if (error) {
    throw new Error(`Unable to create task. Please try again.`);
  }

  // Map the joined profile data to assigned_to_name
  return {
    ...data,
    assigned_to_name: data.assigned_to_profile?.display_name || null,
    assigned_to_profile: undefined,
  };
}

/**
 * Toggle task completion status
 * @param taskId - UUID of the task
 * @param newStatus - New status ('incomplete' | 'complete')
 * @returns Updated task object
 * @throws Error if update fails
 */
export async function updateTaskStatus(
  taskId: string,
  newStatus: "incomplete" | "complete"
): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({ status: newStatus })
    .eq("id", taskId)
    .select()
    .single();

  if (error) {
    throw new Error(`Unable to update task status. Please try again.`);
  }

  return data;
}

/**
 * Update task fields (title, assignee, due date, notes)
 */
export async function updateTask(taskId: string, updates: TaskUpdate): Promise<Task> {
  if (updates.title !== undefined) {
    if (!updates.title || updates.title.trim().length === 0) {
      throw new Error("Task title is required");
    }
    if (updates.title.length > 500) {
      throw new Error("Task title must be 500 characters or less");
    }
  }
  if (updates.notes !== undefined && updates.notes !== null && updates.notes.length > 5000) {
    throw new Error("Notes must be 5000 characters or less");
  }
  const { data, error } = await supabase.from("tasks").update(updates).eq("id", taskId).select().single();
  if (error) throw new Error(`Unable to update task. Please try again.`);
  return data;
}

export async function softDeleteTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update({ deleted_at: new Date().toISOString() }).eq("id", taskId).select().single();
  if (error) throw new Error(`Unable to delete task. Please try again.`);
  return data;
}

export async function restoreTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update({ deleted_at: null }).eq("id", taskId).select().single();
  if (error) throw new Error(`Unable to restore task. Please try again.`);
  return data;
}

export async function archiveTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase.from("tasks").update({ archived_at: new Date().toISOString() }).eq("id", taskId).select().single();
  if (error) throw new Error(`Unable to archive task. Please try again.`);
  return data;
}

export async function bulkUpdateTasks(taskIds: string[], updates: Partial<Omit<Task, "id" | "household_id" | "created_at" | "updated_at">>): Promise<Task[]> {
  if (taskIds.length === 0) return [];
  const { data, error } = await supabase.from("tasks").update(updates).in("id", taskIds).select();
  if (error) throw new Error(`Unable to update ${taskIds.length} tasks. Please try again.`);
  return data || [];
}

export async function getDeletedTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").eq("household_id", householdId).not("deleted_at", "is", null).order("deleted_at", { ascending: false });
  if (error) throw new Error(`Unable to load deleted tasks. Please check your connection and try again.`);
  return data || [];
}

export async function getArchivedTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase.from("tasks").select("*").eq("household_id", householdId).not("archived_at", "is", null).order("archived_at", { ascending: false });
  if (error) throw new Error(`Unable to load archived tasks. Please check your connection and try again.`);
  return data || [];
}

/**
 * Permanently delete a task (admin only, for tasks deleted > 30 days)
 * @param taskId - UUID of the task
 * @throws Error if delete fails
 */
export async function permanentDeleteTask(taskId: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", taskId);
  if (error) throw new Error(`Unable to permanently delete task. Please try again.`);
}
