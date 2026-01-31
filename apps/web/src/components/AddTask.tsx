import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  useToast,
  Textarea,
  Text,
} from "@chakra-ui/react";
import { useHouseholdMembers } from "../services/members";

type Props = {
  householdId: string;
  onAddTask: (title: string, assignedTo?: string | null, dueDate?: string | null, notes?: string | null) => Promise<void>;
};

export default function AddTask({ householdId, onAddTask }: Props) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const { members, loading: membersLoading } = useHouseholdMembers(householdId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Frontend validation
    const trimmed = title.trim();
    if (!trimmed) {
      toast({
        title: "Task title is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (trimmed.length > 500) {
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
      await onAddTask(trimmed, assignedTo || null, dueDate || null, notes || null);

      // Clear form on success
      setTitle("");
      setAssignedTo("");
      setDueDate("");
      setNotes("");

      toast({
        title: "Task created",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={3} align="stretch">
        <FormControl>
          <FormLabel htmlFor="task-title" fontSize="sm" fontWeight="medium">
            New Task
          </FormLabel>
          <Input
            id="task-title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isDisabled={submitting}
            size="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="task-assignee" fontSize="sm" fontWeight="medium">
            Assign To (Optional)
          </FormLabel>
          <Select
            id="task-assignee"
            placeholder="Unassigned"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            isDisabled={submitting || membersLoading}
            size="md"
          >
            {members.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.profile?.display_name || "Unknown"}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="task-due-date" fontSize="sm" fontWeight="medium">
            Due Date (Optional)
          </FormLabel>
          <Input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            isDisabled={submitting}
            size="md"
          />
        </FormControl>

        <FormControl>
          <FormLabel htmlFor="task-notes" fontSize="sm" fontWeight="medium">
            Notes (Optional)
            <Text as="span" fontSize="sm" color="gray.500" ml={2}>
              ({notes.length} / 5000 characters)
            </Text>
          </FormLabel>
          <Textarea
            id="task-notes"
            placeholder="Add additional details, links, or context..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            isDisabled={submitting}
            rows={4}
            resize="vertical"
            size="md"
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={submitting}
          loadingText="Adding..."
          size="md"
          width="full"
        >
          Add Task
        </Button>
      </VStack>
    </Box>
  );
}
