import {
  Flex,
  Text,
  Button,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  HStack,
  useToast,
} from "@chakra-ui/react";
import { CloseIcon, ChevronDownIcon } from "@chakra-ui/icons";
import { bulkUpdateTasks, softDeleteTask } from "../services/tasks";
import type { Task } from "../types/task";

type Props = {
  selectedCount: number;
  selectedTaskIds: string[];
  tasks: Task[];
  householdMembers: { user_id: string; profile?: { display_name: string | null } | null }[];
  onActionComplete: () => void;
  onClearSelection: () => void;
  onExitSelectionMode: () => void;
};

export default function BulkActionsBar({
  selectedCount,
  selectedTaskIds,
  tasks,
  householdMembers,
  onActionComplete,
  onClearSelection,
  onExitSelectionMode,
}: Props) {
  const toast = useToast();

  async function handleCompleteSelected() {
    try {
      // Filter out already-completed tasks
      const selectedTasks = tasks.filter((t) => selectedTaskIds.includes(t.id));
      const incompleteTasks = selectedTasks.filter((t) => t.status === "incomplete");

      if (incompleteTasks.length === 0) {
        toast({
          title: "All selected tasks are already complete",
          status: "info",
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      const taskIds = incompleteTasks.map((t) => t.id);
      await bulkUpdateTasks(taskIds, { status: "complete" });

      toast({
        title: `${taskIds.length} task${taskIds.length > 1 ? "s" : ""} marked complete`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onActionComplete();
      onExitSelectionMode();
    } catch (error) {
      toast({
        title: "Failed to complete tasks",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  async function handleDeleteSelected() {
    if (!confirm(`Are you sure you want to delete ${selectedCount} task${selectedCount > 1 ? "s" : ""}?`)) {
      return;
    }

    try {
      // Delete each task individually (soft delete)
      await Promise.all(selectedTaskIds.map((id) => softDeleteTask(id)));

      toast({
        title: `${selectedCount} task${selectedCount > 1 ? "s" : ""} deleted`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onActionComplete();
      onExitSelectionMode();
    } catch (error) {
      toast({
        title: "Failed to delete tasks",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  async function handleAssignTo(userId: string | null) {
    try {
      await bulkUpdateTasks(selectedTaskIds, { assigned_to: userId });

      const memberName = userId
        ? householdMembers.find((m) => m.user_id === userId)?.profile?.display_name || "member"
        : "Unassigned";

      toast({
        title: `${selectedCount} task${selectedCount > 1 ? "s" : ""} assigned to ${memberName}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });

      onActionComplete();
      onExitSelectionMode();
    } catch (error) {
      toast({
        title: "Failed to assign tasks",
        description: error instanceof Error ? error.message : "Unknown error",
        status: "error",
        duration: 4000,
        isClosable: true,
      });
    }
  }

  if (selectedCount === 0) {
    return null;
  }

  return (
    <Flex
      position="sticky"
      top={0}
      zIndex={10}
      bg="blue.50"
      p={3}
      borderRadius="md"
      mb={4}
      alignItems="center"
      justifyContent="space-between"
      boxShadow="sm"
    >
      <HStack spacing={3}>
        <Text fontWeight="semibold" color="blue.800">
          {selectedCount} task{selectedCount > 1 ? "s" : ""} selected
        </Text>
        <Button size="sm" variant="ghost" onClick={onClearSelection}>
          Clear Selection
        </Button>
      </HStack>

      <HStack spacing={2}>
        <Button size="sm" colorScheme="green" onClick={handleCompleteSelected}>
          Complete Selected
        </Button>

        <Button size="sm" colorScheme="red" onClick={handleDeleteSelected}>
          Delete Selected
        </Button>

        <Menu>
          <MenuButton as={Button} size="sm" rightIcon={<ChevronDownIcon />}>
            Assign To
          </MenuButton>
          <MenuList>
            <MenuItem onClick={() => handleAssignTo(null)}>Unassigned</MenuItem>
            {householdMembers.map((member) => (
              <MenuItem key={member.user_id} onClick={() => handleAssignTo(member.user_id)}>
                {member.profile?.display_name || "Unknown"}
              </MenuItem>
            ))}
          </MenuList>
        </Menu>

        <IconButton
          aria-label="Exit selection mode"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          onClick={onExitSelectionMode}
        />
      </HStack>
    </Flex>
  );
}
