import { useEffect, useState, useRef } from "react";
import {
  Box,
  Text,
  VStack,
  Spinner,
  Button,
  HStack,
  IconButton,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure,
} from "@chakra-ui/react";
import { RepeatIcon, DeleteIcon } from "@chakra-ui/icons";
import { getDeletedTasks, restoreTask, permanentDeleteTask, type Task } from "../services/tasks";

type Props = {
  householdId: string;
  userRole: string;
};

export default function DeletedTasksView({ householdId, userRole }: Props) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  const isAdmin = ["owner", "admin"].includes(userRole);

  useEffect(() => {
    loadDeletedTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId]);

  async function loadDeletedTasks() {
    try {
      setLoading(true);
      setError(null);
      const data = await getDeletedTasks(householdId);
      setTasks(data);
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to load deleted tasks";
      setError(errorMessage);
      toast({
        title: "Error loading deleted tasks",
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleRestore(task: Task) {
    try {
      await restoreTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast({
        title: "Task restored",
        description: `"${task.title}" has been restored to your task list`,
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to restore task";
      toast({
        title: "Error restoring task",
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  function handlePermanentDeleteClick(task: Task) {
    setTaskToDelete(task);
    onOpen();
  }

  async function confirmPermanentDelete() {
    if (!taskToDelete) return;

    try {
      await permanentDeleteTask(taskToDelete.id);
      setTasks((prev) => prev.filter((t) => t.id !== taskToDelete.id));
      toast({
        title: "Task permanently deleted",
        description: `"${taskToDelete.title}" has been permanently removed`,
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      onClose();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : "Failed to delete task";
      toast({
        title: "Error deleting task",
        description: errorMessage,
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setTaskToDelete(null);
    }
  }

  // Check if task was deleted more than 30 days ago
  function canPermanentlyDelete(task: Task): boolean {
    if (!isAdmin || !task.deleted_at) return false;
    const deletedDate = new Date(task.deleted_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return deletedDate < thirtyDaysAgo;
  }

  // Format deleted date for display
  const formatDeletedDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <Box p={6} textAlign="center">
        <Spinner size="lg" />
        <Text mt={4}>Loading deleted tasks…</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Text color="red.500">{error}</Text>
      </Box>
    );
  }

  if (tasks.length === 0) {
    return (
      <Box p={6} textAlign="center">
        <Text fontSize="lg" color="gray.500">
          No deleted tasks
        </Text>
        <Text fontSize="sm" color="gray.400" mt={2}>
          Deleted tasks will appear here for 30 days
        </Text>
      </Box>
    );
  }

  return (
    <>
      <VStack spacing={4} align="stretch">
        <Text fontSize="sm" color="gray.500">
          {tasks.length} deleted {tasks.length === 1 ? "task" : "tasks"} (kept for 30 days)
        </Text>

        {tasks.map((task) => (
          <Box key={task.id} borderWidth={1} borderRadius="md" p={4} bg="gray.50">
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between" align="start">
                <Box flex={1}>
                  <Text fontWeight="medium" textDecoration="line-through" color="gray.600">
                    {task.title}
                  </Text>
                  <Text fontSize="sm" color="gray.500" mt={1}>
                    Deleted: {task.deleted_at ? formatDeletedDate(task.deleted_at) : "Unknown"}
                  </Text>
                  {task.due_date && (
                    <Text fontSize="sm" color="gray.500">
                      Was due: {formatDeletedDate(task.due_date)}
                    </Text>
                  )}
                </Box>

                <HStack spacing={2}>
                  <Button
                    size="sm"
                    leftIcon={<RepeatIcon />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => handleRestore(task)}
                  >
                    Restore
                  </Button>

                  {canPermanentlyDelete(task) && (
                    <IconButton
                      size="sm"
                      icon={<DeleteIcon />}
                      aria-label="Permanently delete task"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => handlePermanentDeleteClick(task)}
                    />
                  )}
                </HStack>
              </HStack>
            </VStack>
          </Box>
        ))}
      </VStack>

      {/* Confirm Permanent Delete Dialog */}
      <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Permanently Delete Task
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to permanently delete "{taskToDelete?.title}"? This action cannot be
              undone.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={confirmPermanentDelete} ml={3}>
                Delete Forever
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
}
