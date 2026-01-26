import { VStack, Text } from "@chakra-ui/react";
import TaskItem from "./TaskItem";
import type { Task } from "../services/tasks";

type Props = {
  tasks: Task[];
  onToggleTask?: (taskId: string, newStatus: "incomplete" | "complete") => void;
  onEditTask?: (task: Task) => void;
  onDeleteTask?: (task: Task) => void;
};

export default function TaskList({ tasks, onToggleTask, onEditTask, onDeleteTask }: Props) {
  if (tasks.length === 0) {
    return (
      <Text fontSize="md" color="gray.600" textAlign="center" py={8}>
        No tasks yet. Create your first task to get started!
      </Text>
    );
  }

  return (
    <VStack spacing={2} align="stretch">onEdit={onEditTask} onDelete={onDeleteTask} 
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={onToggleTask} />
      ))}
    </VStack>
  );
}
