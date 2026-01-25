import { Box, Checkbox, Text } from "@chakra-ui/react";
import type { Task } from "../services/tasks";

type Props = {
  task: Task;
  onToggle?: (taskId: string, newStatus: "incomplete" | "complete") => void;
};

export default function TaskItem({ task, onToggle }: Props) {
  const isComplete = task.status === "complete";

  const handleCheckboxChange = () => {
    if (onToggle) {
      onToggle(task.id, isComplete ? "incomplete" : "complete");
    }
  };

  return (
    <Box
      borderWidth={1}
      borderRadius="lg"
      p={3}
      display="flex"
      alignItems="center"
      gap={3}
      bg={isComplete ? "gray.50" : "white"}
      opacity={isComplete ? 0.7 : 1}
    >
      <Checkbox
        isChecked={isComplete}
        onChange={handleCheckboxChange}
        colorScheme="blue"
        size="lg"
      />
      <Box flex={1}>
        <Text
          textDecoration={isComplete ? "line-through" : "none"}
          color={isComplete ? "gray.600" : "gray.800"}
          fontSize="md"
        >
          {task.title}
        </Text>
        {task.assigned_to_name && (
          <Text fontSize="sm" color="gray.500" mt={1}>
            Assigned to: {task.assigned_to_name}
          </Text>
        )}
      </Box>
    </Box>
  );
}
