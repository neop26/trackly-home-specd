import { useEffect, useState, useMemo } from "react";
import { Box, Heading, Text, VStack, Spinner, useToast, useDisclosure } from "@chakra-ui/react";
import { getTasks, createTask, updateTaskStatus, type Task } from "../services/tasks";
import { supabase } from "../lib/supabaseClient";
import TaskList from "../components/TaskList";
import AddTask from "../components/AddTask";
import EditTaskModal from "../components/EditTaskModal";
import DeleteTaskDialog from "../components/DeleteTaskDialog";
import TaskFilters from "../components/TaskFilters";
import { useTaskFilters } from "../hooks/useTaskFilters";

type Props = {
  householdId: string;
};

export default function TasksScreen({ householdId }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { filters, isMyTasksActive } = useTaskFilters();

  useEffect(() => {
    // Get current user ID
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user.id;
      if (userId) {
        setCurrentUserId(userId);
      }
    })();
  }, []);

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

  function handleEditTask(task: Task) {
    setSelectedTask(task);
    onEditOpen();
  }

  function handleTaskUpdated(updatedTask: Task) {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  }

  function handleDeleteTask(task: Task) {
    setTaskToDelete(task);
    onDeleteOpen();
  }

  function handleTaskDeleted(taskId: string) {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  }

  // Apply filters to task list
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply "My Tasks" filter
    if (filters.assignee === "me" && currentUserId) {
      result = result.filter(task => task.assigned_to === currentUserId);
    }

    return result;
  }, [tasks, filters.assignee, currentUserId]);

  // Check if we should show empty state for My Tasks
  const showMyTasksEmptyState = isMyTasksActive && filteredTasks.length === 0 && tasks.length > 0;

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

      <TaskFilters onFiltersChange={loadTasks} />

      <AddTask householdId={householdId} onAddTask={handleAddTask} />

      {showMyTasksEmptyState ? (
        <Box textAlign="center" py={12}>
          <Text fontSize="3xl" mb={2}>🎉</Text>
          <Text fontSize="lg" fontWeight="semibold" color="gray.700" mb={1}>
            You're all caught up!
          </Text>
          <Text fontSize="sm" color="gray.500">
            No tasks assigned to you right now.
          </Text>
        </Box>
      ) : (
        <TaskList 
          tasks={filteredTasks} 
          onToggleTask={handleToggleTask} 
          onEditTask={handleEditTask} 
          onDeleteTask={handleDeleteTask} 
        />
      )}

      {selectedTask && (
        <EditTaskModal
          isOpen={isEditOpen}
          onClose={() => { setSelectedTask(null); onEditClose(); }}
          task={selectedTask}
          householdId={householdId}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {taskToDelete && (
        <DeleteTaskDialog
          isOpen={isDeleteOpen}
          onClose={() => { setTaskToDelete(null); onDeleteClose(); }}
          task={taskToDelete}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </VStack>
  );
}
