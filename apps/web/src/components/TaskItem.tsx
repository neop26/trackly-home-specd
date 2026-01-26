import { Box, Checkbox, Text } from "@chakra-ui/react";
import type { Task } from "../services/tasks";

type Props = {
  task: Task;
  onToggle?: (taskId: string, newStatus: "incomplete" | "complete") => void;
};

export default function TaskItem({ task, onToggle }: Props) {
  const isComplete = task.status === "complete";

  // Check if task is overdue: has due date, not complete, and date is in the past
  const isOverdue = !isComplete && task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

  const handleCheckboxChange = () => {
    if (onToggle) {
      onToggle(task.id, isComplete ? "incomplete" : "complete");
    }
  };

  // Format due date for display
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
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
      borderColor={isOverdue ? "red.300" : "gray.200"}
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
        <Text fontSize="sm" color="gray.500" mt={1}>
          {task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : "Unassigned"}
        </Text>
        <Text 
          fontSize="sm" 
          color={isOverdue ? "red.600" : "gray.500"} 
          mt={1}
          fontWeight={isOverdue ? "semibold" : "normal"}
        >
          {task.due_date ? (
            <>
              {isOverdue && "⚠️ "}
              Due: {formatDueDate(task.due_date)}
              {isOverdue && " (Overdue)"}
            </>
          ) : (
            "No due date"
          )}
        </Text>
      </Box>
    </Box>
  );
}
