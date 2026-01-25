import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  HStack,
  VStack,
  useToast,
} from "@chakra-ui/react";
import { useHouseholdMembers } from "../services/members";

type Props = {
  householdId: string;
  onAddTask: (title: string, assignedTo?: string | null) => Promise<void>;
};

export default function AddTask({ householdId, onAddTask }: Props) {
  const [title, setTitle] = useState("");
  const [assignedTo, setAssignedTo] = useState<string>("");
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

    try {
      setSubmitting(true);
      await onAddTask(trimmed, assignedTo || null);

      // Clear form on success
      setTitle("");
      setAssignedTo("");

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
          <HStack spacing={2}>
            <Select
              id="task-assignee"
              placeholder="Unassigned"
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              isDisabled={submitting || membersLoading}
              size="md"
              flex={1}
            >
              {members.map((member) => (
                <option key={member.user_id} value={member.user_id}>
                  {member.profile?.display_name || "Unknown"}
                </option>
              ))}
            </Select>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={submitting}
              loadingText="Adding..."
              size="md"
            >
              Add Task
            </Button>
          </HStack>
        </FormControl>
      </VStack>
    </Box>
  );
}
