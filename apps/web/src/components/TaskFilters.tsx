import { Button, HStack, Select, ButtonGroup } from "@chakra-ui/react";
import { useTaskFilters } from "../hooks/useTaskFilters";
import { useHouseholdMembers } from "../services/members";

type Props = {
  householdId: string;
  onFiltersChange?: () => void;
};

const SORT_OPTIONS = [
  { value: "due_date", label: "Due Date" },
  { value: "created_at", label: "Created Date" },
  { value: "title", label: "Title (A-Z)" },
  { value: "assignee", label: "Assignee" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "all", label: "All Tasks" },
] as const;

export default function TaskFilters({ householdId, onFiltersChange }: Props) {
  const { filters, showMyTasks, clearMyTasks, isMyTasksActive, setSortBy, setStatusFilter, setAssigneeFilter } = useTaskFilters();
  const { members } = useHouseholdMembers(householdId);

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

  const handleStatusChange = (status: typeof filters.status) => {
    setStatusFilter(status);
    onFiltersChange?.();
  };

  const handleAssigneeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssigneeFilter(e.target.value as typeof filters.assignee);
    onFiltersChange?.();
  };

  return (
    <HStack spacing={3} flexWrap="wrap">
      <ButtonGroup size="sm" isAttached variant="outline">
        {STATUS_OPTIONS.map((option) => (
          <Button
            key={option.value}
            colorScheme={filters.status === option.value ? "blue" : "gray"}
            variant={filters.status === option.value ? "solid" : "outline"}
            onClick={() => handleStatusChange(option.value)}
          >
            {option.label}
          </Button>
        ))}
      </ButtonGroup>

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

      <Select
        size="sm"
        width="auto"
        minW="180px"
        value={filters.assignee}
        onChange={handleAssigneeChange}
      >
        <option value="all">All Members</option>
        <option value="unassigned">Unassigned</option>
        {members.map((member) => (
          <option key={member.user_id} value={member.user_id}>
            {member.profile?.display_name || "Unknown"}
          </option>
        ))}
      </Select>
    </HStack>
  );
}

