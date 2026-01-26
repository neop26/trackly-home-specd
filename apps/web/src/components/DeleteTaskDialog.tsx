import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Button,
  useToast,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import { softDeleteTask } from "../services/tasks";
import type { Task } from "../types/task";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onTaskDeleted?: (taskId: string) => void;
};

export default function DeleteTaskDialog({ isOpen, onClose, task, onTaskDeleted }: Props) {
  const [deleting, setDeleting] = useState(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();

  async function handleConfirmDelete() {
    try {
      setDeleting(true);

      // Optimistic: notify parent immediately
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }

      await softDeleteTask(task.id);

      toast({
        title: "Task deleted",
        description: "You can restore this task from the Deleted Tasks view",
        status: "success",
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      toast({
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            Delete Task
          </AlertDialogHeader>

          <AlertDialogBody>
            Are you sure you want to delete "<strong>{task.title}</strong>"? This task will be moved
            to the Deleted Tasks view and can be restored later.
          </AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={deleting}>
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={handleConfirmDelete}
              ml={3}
              isLoading={deleting}
              loadingText="Deleting..."
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}
