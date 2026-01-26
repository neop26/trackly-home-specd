import { useState, useCallback, useEffect } from "react";
import type { TaskFilters } from "../types/task";

const STORAGE_KEY = "trackly_task_filters";

/**
 * Custom hook for managing task filter and sort state
 * Persists filter preferences to localStorage
 */
export function useTaskFilters() {
  // Load initial state from localStorage or use defaults
  const [filters, setFilters] = useState<TaskFilters>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as TaskFilters;
      }
    } catch (error) {
      console.warn("Failed to load task filters from localStorage:", error);
    }

    // Default filters
    return {
      status: "active",
      assignee: "all",
      sortBy: "due_date",
    };
  });

  // Persist to localStorage whenever filters change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filters));
    } catch (error) {
      console.warn("Failed to save task filters to localStorage:", error);
    }
  }, [filters]);

  /**
   * Update status filter (active, completed, all)
   */
  const setStatusFilter = useCallback((status: TaskFilters["status"]) => {
    setFilters((prev) => ({ ...prev, status }));
  }, []);

  /**
   * Update assignee filter (user ID, 'all', 'unassigned', 'me')
   */
  const setAssigneeFilter = useCallback((assignee: TaskFilters["assignee"]) => {
    setFilters((prev) => ({ ...prev, assignee }));
  }, []);

  /**
   * Update sort method
   */
  const setSortBy = useCallback((sortBy: TaskFilters["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy }));
  }, []);

  /**
   * Reset all filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters({
      status: "active",
      assignee: "all",
      sortBy: "due_date",
    });
  }, []);

  /**
   * Enable "My Tasks" quick filter (assignee = 'me')
   */
  const showMyTasks = useCallback(() => {
    setFilters((prev) => ({ ...prev, assignee: "me" }));
  }, []);

  /**
   * Clear "My Tasks" filter (assignee = 'all')
   */
  const clearMyTasks = useCallback(() => {
    setFilters((prev) => ({ ...prev, assignee: "all" }));
  }, []);

  return {
    filters,
    setStatusFilter,
    setAssigneeFilter,
    setSortBy,
    resetFilters,
    showMyTasks,
    clearMyTasks,
    isMyTasksActive: filters.assignee === "me",
  };
}
