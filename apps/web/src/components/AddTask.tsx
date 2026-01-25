import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  HStack,
  useToast,
} from "@chakra-ui/react";

type Props = {
  onAddTask: (title: string) => Promise<void>;
};

export default function AddTask({ onAddTask }: Props) {
  const [title, setTitle] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

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
      await onAddTask(trimmed);

      // Clear form on success
      setTitle("");

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
      <FormControl>
        <FormLabel htmlFor="task-title" fontSize="sm" fontWeight="medium">
          New Task
        </FormLabel>
        <HStack spacing={2}>
          <Input
            id="task-title"
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            isDisabled={submitting}
            size="md"
          />
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
    </Box>
  );
}
