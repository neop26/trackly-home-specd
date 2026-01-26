import { Box, Checkbox, Text, IconButton, HStack } from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import type { Task } from "../services/tasks";

type Props = {
  task: Task;
  onToggle?: (taskId: string, newStatus: "incomplete" | "complete") => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskItem({ task, onToggle, onEdit, onDelete }: Props) {
  const isComplete = task.status === "complete";
  const isOverdue = !isComplete && task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));

  const handleCheckboxChange = () => {
    if (onToggle) {
      onToggle(task.id, isComplete ? "incomplete" : "complete");
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task);
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
      <HStack spacing={1}>
        <IconButton
          aria-label="Edit task"
          icon={<EditIcon />}
          size="sm"
          variant="ghost"
          colorScheme="blue"
          onClick={handleEdit}
        />
        <IconButton
          aria-label="Delete task"
          icon={<DeleteIcon />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={handleDelete}
        />
      </HStack>
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
