import { Button, HStack } from "@chakra-ui/react";
import { useTaskFilters } from "../hooks/useTaskFilters";

type Props = {
  onFiltersChange?: () => void;
};

export default function TaskFilters({ onFiltersChange }: Props) {
  const { showMyTasks, clearMyTasks, isMyTasksActive } = useTaskFilters();

  const handleMyTasksToggle = () => {
    if (isMyTasksActive) {
      clearMyTasks();
    } else {
      showMyTasks();
    }
    onFiltersChange?.();
  };

  return (
    <HStack spacing={2}>
      <Button
        size="sm"
        colorScheme={isMyTasksActive ? "blue" : "gray"}
        variant={isMyTasksActive ? "solid" : "outline"}
        onClick={handleMyTasksToggle}
      >
        {isMyTasksActive ? "Showing: My Tasks" : "My Tasks"}
      </Button>
      
      {isMyTasksActive && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            clearMyTasks();
            onFiltersChange?.();
          }}
        >
          Clear Filter
        </Button>
      )}
    </HStack>
  );
}
