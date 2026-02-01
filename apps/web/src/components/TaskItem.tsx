import { useState } from "react";
import { Box, Checkbox, Text, IconButton, HStack, VStack, Collapse, Icon } from "@chakra-ui/react";
import { EditIcon, DeleteIcon } from "@chakra-ui/icons";
import { MdOutlineNotes } from "react-icons/md";
import Linkify from "react-linkify";
import type { Task } from "../services/tasks";

type Props = {
  task: Task;
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelection?: (taskId: string) => void;
  onToggle?: (taskId: string, newStatus: "incomplete" | "complete") => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export default function TaskItem({ task, selectionMode = false, isSelected = false, onToggleSelection, onToggle, onEdit, onDelete }: Props) {
  const [showNotes, setShowNotes] = useState(false);
  const isComplete = task.status === "complete";
  const isOverdue = !isComplete && task.due_date && new Date(task.due_date) < new Date(new Date().setHours(0, 0, 0, 0));
  const hasNotes = task.notes && task.notes.trim().length > 0;

  const handleCheckboxChange = () => {
    if (selectionMode && onToggleSelection) {
      // In selection mode, checkbox controls selection
      onToggleSelection(task.id);
    } else if (onToggle) {
      // In normal mode, checkbox controls task completion
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
      data-testid="task-item"
      data-task-id={task.id}
      data-task-status={task.status}
      borderWidth={1}
      borderRadius="lg"
      p={3}
      bg={isComplete ? "gray.50" : "white"}
      opacity={isComplete ? 0.7 : 1}
      borderColor={isOverdue ? "red.300" : "gray.200"}
    >
      <HStack alignItems="center" gap={3}>
        <Checkbox
          data-testid="task-checkbox"
          isChecked={selectionMode ? isSelected : isComplete}
          onChange={handleCheckboxChange}
          colorScheme="blue"
          size="lg"
        />
        <VStack flex={1} align="stretch" spacing={1}>
          <HStack>
            <Text
              data-testid="task-title"
              textDecoration={isComplete ? "line-through" : "none"}
              color={isComplete ? "gray.600" : "gray.800"}
              fontSize="md"
              flex={1}
            >
              {task.title}
            </Text>
            {hasNotes && (
              <IconButton
                aria-label="Toggle notes"
                icon={<Icon as={MdOutlineNotes} />}
                size="xs"
                variant="ghost"
                colorScheme="gray"
                onClick={() => setShowNotes(!showNotes)}
              />
            )}
          </HStack>
          <Text fontSize="sm" color="gray.500">
            {task.assigned_to_name ? `Assigned to: ${task.assigned_to_name}` : "Unassigned"}
          </Text>
          <Text 
            fontSize="sm" 
            color={isOverdue ? "red.600" : "gray.500"}
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
          
          <Collapse in={showNotes} animateOpacity>
            {hasNotes && (
              <Box
                mt={2}
                p={2}
                bg="gray.50"
                borderRadius="md"
                fontSize="sm"
                whiteSpace="pre-wrap"
              >
                <Linkify
                  componentDecorator={(decoratedHref, decoratedText, key) => (
                    <a
                      href={decoratedHref}
                      key={key}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: "#3182ce", textDecoration: "underline" }}
                    >
                      {decoratedText}
                    </a>
                  )}
                >
                  {task.notes}
                </Linkify>
              </Box>
            )}
          </Collapse>
        </VStack>
        <HStack spacing={1}>
          <IconButton
            data-testid="task-edit-btn"
            aria-label="Edit task"
            icon={<EditIcon />}
            size="sm"
            variant="ghost"
            colorScheme="blue"
            onClick={handleEdit}
          />
          <IconButton
            data-testid="task-delete-btn"
            aria-label="Delete task"
            icon={<DeleteIcon />}
            size="sm"
            variant="ghost"
            colorScheme="red"
            onClick={handleDelete}
          />
        </HStack>
      </HStack>
    </Box>
  );
}

