import { supabase } from "../lib/supabaseClient";

/**
 * Task entity from tasks table
 */
export interface Task {
  id: string;
  household_id: string;
  title: string;
  status: "incomplete" | "complete";
  assigned_to: string | null;
  due_date: string | null; // ISO date string
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

/**
 * Fetch all tasks for a specific household
 * @param householdId - UUID of the household
 * @returns Array of tasks ordered by created_at descending
 * @throws Error if query fails
 */
export async function getTasks(householdId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }

  return data || [];
}

/**
 * Create a new task for a household
 * @param householdId - UUID of the household
 * @param title - Task description (1-500 characters)
 * @returns Created task object
 * @throws Error if creation fails or validation fails
 */
export async function createTask(
  householdId: string,
  title: string
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
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create task: ${error.message}`);
  }

  return data;
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
    throw new Error(`Failed to update task: ${error.message}`);
  }

  return data;
}
