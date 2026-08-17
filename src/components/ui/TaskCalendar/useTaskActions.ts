'use client';

import { useCallback } from 'react';
import type { NewTaskInput } from './AddTaskModal';
import type { ViewMode, CalendarViewType } from './CalendarHeader';
import { weeksData } from './constants';

interface UseTaskActionsProps {
  // State setters from useCalendarState
  setStarredTasks: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
  setSwipeState: React.Dispatch<
    React.SetStateAction<{
      taskId: number | null;
      startX: number;
      currentX: number;
      isSwiping: boolean;
    }>
  >;
  setActiveWeekNum: React.Dispatch<React.SetStateAction<number>>;
  setCalendarViewType: React.Dispatch<React.SetStateAction<CalendarViewType>>;
  setFocusedWeekIdx: React.Dispatch<React.SetStateAction<number | null>>;
  resetAddTaskForm: () => void;

  // Current state values
  swipeState: {
    taskId: number | null;
    startX: number;
    currentX: number;
    isSwiping: boolean;
  };
  activeWeekNum: number;
  calendarViewType: CalendarViewType;
  showAddTask: boolean;
  selectedTask: any;
  newTitle: string;

  // Parent component handlers
  handleMarkDone: (taskId: number) => void;
  handleDismiss: (taskId: number) => void;
  handleSendToBoard: (title: string) => void;
  onAddTask: (task: NewTaskInput) => void;

  // Task form data
  newSubtext: string;
  newType: any;
  newCategory: any;
  newDate: string;
  newTime: string;
}

/**
 * Custom hook to manage all task actions and handlers
 * Consolidates handler logic from the main TaskCalendarFeed component
 */
export function useTaskActions({
  setStarredTasks,
  setSwipeState,
  setActiveWeekNum,
  setCalendarViewType,
  setFocusedWeekIdx,
  resetAddTaskForm,
  swipeState,
  activeWeekNum,
  calendarViewType,
  showAddTask,
  selectedTask,
  newTitle,
  handleMarkDone,
  handleDismiss,
  handleSendToBoard,
  onAddTask,
  newSubtext,
  newType,
  newCategory,
  newDate,
  newTime,
}: UseTaskActionsProps) {
  // ─── Star/Unstar Task ───
  const toggleStar = useCallback(
    (id: number, e: React.MouseEvent) => {
      e.stopPropagation();
      setStarredTasks((prev) => ({ ...prev, [id]: !prev[id] }));
    },
    [setStarredTasks]
  );

  // ─── Swipe Gesture Handlers ───
  const handleTouchStart = useCallback(
    (e: React.TouchEvent, taskId: number) => {
      const touch = e.touches[0];
      setSwipeState({
        taskId,
        startX: touch.clientX,
        currentX: touch.clientX,
        isSwiping: true,
      });
    },
    [setSwipeState]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!swipeState.isSwiping) return;
      const touch = e.touches[0];
      setSwipeState((prev) => ({ ...prev, currentX: touch.clientX }));
    },
    [swipeState.isSwiping, setSwipeState]
  );

  const handleTouchEnd = useCallback(
    (taskId: number) => {
      if (!swipeState.isSwiping) return;

      const swipeDistance = swipeState.currentX - swipeState.startX;
      const threshold = 100; // Minimum swipe distance in pixels

      if (Math.abs(swipeDistance) > threshold) {
        if (swipeDistance > 0) {
          // Swipe right: Star/unstar task
          setStarredTasks((prev) => ({ ...prev, [taskId]: !prev[taskId] }));
        } else {
          // Swipe left: Dismiss task
          handleDismiss(taskId);
        }
      }

      // Reset swipe state
      setSwipeState({ taskId: null, startX: 0, currentX: 0, isSwiping: false });
    },
    [swipeState, setStarredTasks, handleDismiss, setSwipeState]
  );

  // ─── Week Navigation ───
  const handleWeekNav = useCallback(
    (direction: 'prev' | 'next') => {
      const currentIdx = weeksData.findIndex((w) => w.weekNum === activeWeekNum);
      if (direction === 'prev' && currentIdx > 0) {
        setActiveWeekNum(weeksData[currentIdx - 1].weekNum);
      } else if (direction === 'next' && currentIdx < weeksData.length - 1) {
        setActiveWeekNum(weeksData[currentIdx + 1].weekNum);
      }
    },
    [activeWeekNum, setActiveWeekNum]
  );

  const selectWeekFromDay = useCallback(
    (weekNum: number) => {
      setActiveWeekNum(weekNum);
      setCalendarViewType('week');
      setFocusedWeekIdx(null);
    },
    [setActiveWeekNum, setCalendarViewType, setFocusedWeekIdx]
  );

  // ─── Keyboard Navigation for Month Grid ───
  const handleMonthGridKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (calendarViewType !== 'month') return;
      const total = weeksData.length;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedWeekIdx((prev) => (prev === null ? 0 : Math.min(prev + 1, total - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedWeekIdx((prev) => (prev === null ? 0 : Math.max(prev - 1, 0)));
      } else if (e.key === 'Enter' && e.currentTarget.dataset.focusedWeekIdx !== null) {
        e.preventDefault();
        const focusedIdx = parseInt(e.currentTarget.dataset.focusedWeekIdx || '0');
        selectWeekFromDay(weeksData[focusedIdx].weekNum);
      } else if (e.key === 'Escape') {
        setFocusedWeekIdx(null);
      }
    },
    [calendarViewType, setFocusedWeekIdx, selectWeekFromDay]
  );

  // ─── Add Task Form Submission ───
  const handleAddTaskSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!newTitle.trim()) return;
      onAddTask({
        title: newTitle.trim(),
        subtext: newSubtext.trim(),
        type: newType,
        category: newCategory,
        scheduledDate: newDate,
        scheduledTime: newTime,
      });
      resetAddTaskForm();
    },
    [newTitle, newSubtext, newType, newCategory, newDate, newTime, onAddTask, resetAddTaskForm]
  );

  return {
    toggleStar,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWeekNav,
    selectWeekFromDay,
    handleMonthGridKeyDown,
    handleAddTaskSubmit,
  };
}
