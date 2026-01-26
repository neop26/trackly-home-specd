import { Button, HStack, Select } from "@chakra-ui/react";
import { useTaskFilters } from "../hooks/useTaskFilters";

type Props = {
  onFiltersChange?: () => void;
};

const SORT_OPTIONS = [
  { value: "due_date", label: "Due Date" },
  { value: "created_at", label: "Created Date" },
  { value: "title", label: "Title (A-Z)" },
  { value: "assignee", label: "Assignee" },
] as const;

export default function TaskFilters({ onFiltersChange }: Props) {
  const { filters, showMyTasks, clearMyTasks, isMyTasksActive, setSortBy } = useTaskFilters();

  const handleMyTasksToggle = () => {
    if (isMyTasksActive) {
      clearMyTasks();
    } else {
      showMyTasks();
    }
    onFiltersChange?.();
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortBy(e.target.value as typeof filters.sortBy);
    onFiltersChange?.();
  };

  return (
    <HStack spacing={3} flexWrap="wrap">
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

      <Select
        size="sm"
        width="auto"
        minW="150px"
        value={filters.sortBy}
        onChange={handleSortChange}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            Sort by: {option.label}
          </option>
        ))}
      </Select>
    </HStack>
  );
}
