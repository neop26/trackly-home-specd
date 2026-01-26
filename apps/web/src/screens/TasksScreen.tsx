import { useEffect, useState, useMemo } from "react";
import { Box, Heading, Text, VStack, Spinner, useToast, useDisclosure, Button, HStack } from "@chakra-ui/react";
import { getTasks, createTask, updateTaskStatus, type Task } from "../services/tasks";
import { supabase } from "../lib/supabaseClient";
import { useHouseholdMembers } from "../services/members";
import TaskList from "../components/TaskList";
import AddTask from "../components/AddTask";
import EditTaskModal from "../components/EditTaskModal";
import DeleteTaskDialog from "../components/DeleteTaskDialog";
import TaskFilters from "../components/TaskFilters";
import BulkActionsBar from "../components/BulkActionsBar";
import { useTaskFilters } from "../hooks/useTaskFilters";
import { useTaskBulkActions } from "../hooks/useTaskBulkActions";

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
  const {
    isSelectionMode,
    selectedTaskIds,
    selectedCount,
    toggleSelectionMode,
    toggleTaskSelection,
    selectAll,
    clearSelection,
    exitSelectionMode,
    isTaskSelected,
  } = useTaskBulkActions();
  const { members } = useHouseholdMembers(householdId);

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

  async function handleAddTask(title: string, assignedTo?: string | null, dueDate?: string | null, notes?: string | null) {
    try {
      const newTask = await createTask(householdId, title, assignedTo, dueDate, notes);

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

  function handleSelectAll() {
    const visibleTaskIds = sortedTasks.map((t) => t.id);
    selectAll(visibleTaskIds);
  }

  function handleBulkActionComplete() {
    // Reload tasks after bulk action completes
    loadTasks();
  }

  // Apply filters to task list
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Apply status filter
    if (filters.status === "active") {
      result = result.filter(task => task.status === "incomplete");
    } else if (filters.status === "completed") {
      result = result.filter(task => task.status === "complete");
    }
    // If status === "all", show all tasks (no filter)

    // Apply assignee filter
    if (filters.assignee === "me" && currentUserId) {
      // "My Tasks" - assigned to current user
      result = result.filter(task => task.assigned_to === currentUserId);
    } else if (filters.assignee === "unassigned") {
      // Unassigned tasks
      result = result.filter(task => !task.assigned_to);
    } else if (filters.assignee !== "all" && filters.assignee !== "me") {
      // Specific user (UUID)
      result = result.filter(task => task.assigned_to === filters.assignee);
    }
    // If assignee === "all", show all tasks (no filter)

    return result;
  }, [tasks, filters.status, filters.assignee, currentUserId]);

  // Apply sorting to filtered tasks
  const sortedTasks = useMemo(() => {
    const result = [...filteredTasks];

    switch (filters.sortBy) {
      case "due_date":
        // Sort by due_date ASC (nulls last), then by created_at ASC
        result.sort((a, b) => {
          // Handle null due dates (put them at the end)
          if (!a.due_date && !b.due_date) return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          
          // Compare due dates
          const dateA = new Date(a.due_date).getTime();
          const dateB = new Date(b.due_date).getTime();
          if (dateA !== dateB) return dateA - dateB;
          
          // Same due date, sort by created_at
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        });
        break;

      case "created_at":
        // Sort by created_at ASC (oldest first)
        result.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        break;

      case "title":
        // Sort alphabetically by title (case-insensitive)
        result.sort((a, b) => a.title.toLowerCase().localeCompare(b.title.toLowerCase()));
        break;

      case "assignee":
        // Sort by assignee name (unassigned first, then alphabetical)
        result.sort((a, b) => {
          const nameA = a.assigned_to_name || "";
          const nameB = b.assigned_to_name || "";
          
          // Put unassigned tasks first
          if (!nameA && !nameB) return 0;
          if (!nameA) return -1;
          if (!nameB) return 1;
          
          return nameA.toLowerCase().localeCompare(nameB.toLowerCase());
        });
        break;
    }

    return result;
  }, [filteredTasks, filters.sortBy]);

  // Check if we should show empty state for My Tasks
  const showMyTasksEmptyState = isMyTasksActive && sortedTasks.length === 0 && tasks.length > 0;

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

      <HStack spacing={3}>
        <Button
          size="sm"
          variant={isSelectionMode ? "solid" : "outline"}
          colorScheme={isSelectionMode ? "blue" : "gray"}
          onClick={toggleSelectionMode}
        >
          {isSelectionMode ? "Exit Selection Mode" : "Select Mode"}
        </Button>
        {isSelectionMode && sortedTasks.length > 0 && (
          <Button size="sm" variant="outline" onClick={handleSelectAll}>
            Select All ({sortedTasks.length})
          </Button>
        )}
      </HStack>

      {isSelectionMode && (
        <BulkActionsBar
          selectedCount={selectedCount}
          selectedTaskIds={selectedTaskIds}
          tasks={tasks}
          householdMembers={members}
          onActionComplete={handleBulkActionComplete}
          onClearSelection={clearSelection}
          onExitSelectionMode={exitSelectionMode}
        />
      )}

      <TaskFilters householdId={householdId} onFiltersChange={loadTasks} />

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
          tasks={sortedTasks}
          selectionMode={isSelectionMode}
          selectedTaskIds={selectedTaskIds}
          onToggleSelection={toggleTaskSelection}
          isTaskSelected={isTaskSelected}
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
