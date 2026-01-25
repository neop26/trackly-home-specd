import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack } from "@chakra-ui/react";
import { getTasks, createTask, updateTaskStatus, type Task } from "../services/tasks";
import TaskList from "../components/TaskList";
import AddTask from "../components/AddTask";

type Props = {
  householdId: string;
};

export default function TasksScreen({ householdId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, [householdId]);

  async function loadTasks() {
    try {
      setLoading(true);
      setError(null);
      const data = await getTasks(householdId);
      setTasks(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(title: string, assignedTo?: string | null, dueDate?: string | null) {
    const newTask = await createTask(householdId, title, assignedTo, dueDate);

    // Optimistic update - add new task to top of list
    setTasks((prev) => [newTask, ...prev]);
  }

  async function handleToggleTask(
    taskId: string,
    newStatus: "incomplete" | "complete"
  ) {
    try {
      // Optimistic update
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      );

      await updateTaskStatus(taskId, newStatus);
    } catch (e) {
      // Revert on error
      setError(e instanceof Error ? e.message : "Failed to update task");
      loadTasks(); // Reload to get correct state
    }
  }

  if (loading) {
    return (
      <Box p={6}>
        <Text>Loading tasks…</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.600">{error}</Text>
      </Box>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="lg">Tasks</Heading>
        <Text fontSize="sm" color="gray.600">
          Household task list
        </Text>
      </Box>

      <AddTask householdId={householdId} onAddTask={handleAddTask} />

      <TaskList tasks={tasks} onToggleTask={handleToggleTask} />
    </VStack>
  );
}
