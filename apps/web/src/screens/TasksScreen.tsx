import { useEffect, useState } from "react";
import { Box, Heading, Text, VStack, Spinner, useToast } from "@chakra-ui/react";
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
  const toast = useToast();

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
      const errorMessage = e instanceof Error ? e.message : "Failed to load tasks";
      setError(errorMessage);
      toast({
        title: "Error loading tasks",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleAddTask(title: string, assignedTo?: string | null, dueDate?: string | null) {
    try {
      const newTask = await createTask(householdId, title, assignedTo, dueDate);

      // Optimistic update - add new task to top of list
      setTasks((prev) => [newTask, ...prev]);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to create task";
      toast({
        title: "Error creating task",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      throw e; // Re-throw so AddTask component can handle it
    }
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
      const errorMessage = e instanceof Error ? e.message : "Failed to update task";
      setError(errorMessage);
      toast({
        title: "Error updating task",
        description: errorMessage,
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      loadTasks(); // Reload to get correct state
    }
  }

  if (loading) {
    return (
      <Box p={6} display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner size="xl" color="blue.500" thickness="4px" />
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
