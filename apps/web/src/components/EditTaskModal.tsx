import { useState, useEffect } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Textarea,
  VStack,
  useToast,
  Text,
} from "@chakra-ui/react";
import { updateTask } from "../services/tasks";
import { useHouseholdMembers } from "../services/members";
import type { Task, TaskUpdate } from "../types/task";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  householdId: string;
  onTaskUpdated?: (updatedTask: Task) => void;
};

export default function EditTaskModal({ isOpen, onClose, task, householdId, onTaskUpdated }: Props) {
  const [title, setTitle] = useState(task.title);
  const [assignedTo, setAssignedTo] = useState<string>(task.assigned_to || "");
  const [dueDate, setDueDate] = useState<string>(task.due_date || "");
  const [notes, setNotes] = useState<string>(task.notes || "");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const { members, loading: membersLoading } = useHouseholdMembers(householdId);

  // Reset form when task changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setTitle(task.title);
      setAssignedTo(task.assigned_to || "");
      setDueDate(task.due_date || "");
      setNotes(task.notes || "");
    }
  }, [isOpen, task]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Frontend validation
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      toast({
        title: "Task title is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (trimmedTitle.length > 500) {
      toast({
        title: "Task title must be 500 characters or less",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (notes.length > 5000) {
      toast({
        title: "Notes must be 5000 characters or less",
        description: `Current length: ${notes.length} characters`,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setSubmitting(true);

      // Build update payload only with changed fields
      const updates: TaskUpdate = {};
      if (trimmedTitle !== task.title) updates.title = trimmedTitle;
      if (assignedTo !== (task.assigned_to || "")) {
        updates.assigned_to = assignedTo || null;
      }
      if (dueDate !== (task.due_date || "")) {
        updates.due_date = dueDate || null;
      }
      if (notes !== (task.notes || "")) {
        updates.notes = notes || null;
      }

      // Only update if there are changes
      if (Object.keys(updates).length === 0) {
        toast({
          title: "No changes detected",
          status: "info",
          duration: 2000,
          isClosable: true,
        });
        onClose();
        return;
      }

      // Optimistic UI: Call onTaskUpdated immediately with updated task
      const optimisticTask = { ...task, ...updates };
      if (onTaskUpdated) {
        onTaskUpdated(optimisticTask);
      }

      // Perform update
      const updatedTask = await updateTask(task.id, updates);

      // Update with actual server response (in case of discrepancies)
      if (onTaskUpdated) {
        onTaskUpdated(updatedTask);
      }

      toast({
        title: "Task updated successfully",
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      // Rollback optimistic update by re-fetching or reverting
      if (onTaskUpdated) {
        onTaskUpdated(task); // Rollback to original
      }

      toast({
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    // Reset form to original values
    setTitle(task.title);
    setAssignedTo(task.assigned_to || "");
    setDueDate(task.due_date || "");
    setNotes(task.notes || "");
    onClose();
  }

  const notesCharCount = notes.length;
  const notesMaxLength = 5000;

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Edit Task</ModalHeader>
        <ModalCloseButton />
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel htmlFor="edit-task-title">Task Title</FormLabel>
                <Input
                  id="edit-task-title"
                  placeholder="What needs to be done?"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  isDisabled={submitting}
                  autoFocus
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="edit-task-assignee">Assign To</FormLabel>
                <Select
                  id="edit-task-assignee"
                  placeholder="Unassigned"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  isDisabled={submitting || membersLoading}
                >
                  {members.map((member) => (
                    <option key={member.user_id} value={member.user_id}>
                      {member.profile?.display_name || "Unknown"}
                    </option>
                  ))}
                </Select>
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="edit-task-due-date">Due Date</FormLabel>
                <Input
                  id="edit-task-due-date"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  isDisabled={submitting}
                />
              </FormControl>

              <FormControl>
                <FormLabel htmlFor="edit-task-notes">
                  Notes
                  <Text as="span" fontSize="sm" color="gray.500" ml={2}>
                    ({notesCharCount} / {notesMaxLength} characters)
                  </Text>
                </FormLabel>
                <Textarea
                  id="edit-task-notes"
                  placeholder="Add additional details, links, or context..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  isDisabled={submitting}
                  rows={6}
                  resize="vertical"
                />
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleCancel} isDisabled={submitting}>
              Cancel
            </Button>
            <Button colorScheme="blue" type="submit" isLoading={submitting} loadingText="Saving...">
              Save Changes
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
