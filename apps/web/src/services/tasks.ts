import { supabase } from "../lib/supabaseClient";

/**
 * Task entity from tasks table with assignee display name
 */
export interface Task {
  id: string;
  household_id: string;
  title: string;
  status: "incomplete" | "complete";
  assigned_to: string | null;
  assigned_to_name?: string | null; // Display name of assignee (joined from profiles)
  due_date: string | null; // ISO date string
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

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
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load tasks. Please check your connection and try again.`);
  }

  // Map the joined profile data to assigned_to_name
  return (data || []).map((task) => ({
    ...task,
    assigned_to_name: task.assigned_to_profile?.display_name || null,
    assigned_to_profile: undefined, // Remove nested object
  })) as Task[];
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
