import { useState, useCallback } from "react";

/**
 * Custom hook for managing bulk task selection and actions
 */
export function useTaskBulkActions() {
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  /**
   * Toggle selection mode on/off
   */
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    // Clear selections when exiting selection mode
    if (isSelectionMode) {
      setSelectedTaskIds(new Set());
    }
  }, [isSelectionMode]);

  /**
   * Enable selection mode
   */
  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  /**
   * Exit selection mode and clear selections
   */
  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedTaskIds(new Set());
  }, []);

  /**
   * Toggle selection for a single task
   */
  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(taskId)) {
        newSet.delete(taskId);
      } else {
        newSet.add(taskId);
      }
      return newSet;
    });
  }, []);

  /**
   * Select a single task
   */
  const selectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => new Set(prev).add(taskId));
  }, []);

  /**
   * Deselect a single task
   */
  const deselectTask = useCallback((taskId: string) => {
    setSelectedTaskIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(taskId);
      return newSet;
    });
  }, []);

  /**
   * Select all tasks from a list of task IDs
   */
  const selectAll = useCallback((taskIds: string[]) => {
    setSelectedTaskIds(new Set(taskIds));
  }, []);

  /**
   * Clear all selections
   */
  const clearSelection = useCallback(() => {
    setSelectedTaskIds(new Set());
  }, []);

  /**
   * Check if a task is selected
   */
  const isTaskSelected = useCallback(
    (taskId: string) => {
      return selectedTaskIds.has(taskId);
    },
    [selectedTaskIds]
  );

  /**
   * Get count of selected tasks
   */
  const selectedCount = selectedTaskIds.size;

  /**
   * Get array of selected task IDs
   */
  const getSelectedTaskIds = useCallback(() => {
    return Array.from(selectedTaskIds);
  }, [selectedTaskIds]);

  /**
   * Check if any tasks are selected
   */
  const hasSelection = selectedCount > 0;

  return {
    isSelectionMode,
    selectedTaskIds: Array.from(selectedTaskIds),
    selectedCount,
    hasSelection,
    toggleSelectionMode,
    enterSelectionMode,
    exitSelectionMode,
    toggleTaskSelection,
    selectTask,
    deselectTask,
    selectAll,
    clearSelection,
    isTaskSelected,
    getSelectedTaskIds,
  };
}
