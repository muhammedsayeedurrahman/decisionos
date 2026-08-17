'use client';

import { useState, useEffect, useMemo } from 'react';
import type { ScheduledTask } from './TaskDetailsModal';
import type { ViewMode, CalendarViewType } from './CalendarHeader';
import type { TaskCard } from '@/utils/sharedState';
import {
  MOBILE_BREAKPOINT_PX,
  DEMO_CALENDAR_MIN_DATE,
  DEMO_CALENDAR_MAX_DATE,
  weeksData,
} from './constants';
import { getDayOfYear } from './utils';

/**
 * Custom hook to manage all calendar state in one place
 * Consolidates state logic from the main TaskCalendarFeed component
 */
export function useCalendarState(todayDayOfYear: number) {
  // ─── View Mode State ───
  const [viewMode, setViewMode] = useState<ViewMode>('split');
  const [calendarViewType, setCalendarViewType] = useState<CalendarViewType>('month');
  const [isCalendarLarge, setIsCalendarLarge] = useState(false);

  // Split/calendar are grid-heavy desktop layouts; land phone-width visitors
  // on the plain task list instead (they can still switch views manually).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT_PX) {
      setViewMode('tasks');
    }
  }, []);

  // ─── Week Navigation State ───
  const [activeWeekNum, setActiveWeekNum] = useState<number>(() => {
    const weeksDataToday = weeksData.map((week) => ({
      ...week,
      days: week.days.map((day) => ({
        ...day,
        isToday: day.dayOfYear === todayDayOfYear,
      })),
    }));
    const currentWeek = weeksDataToday.find((w) => w.days.some((d) => d.isToday));
    return currentWeek ? currentWeek.weekNum : 32;
  });

  // ─── Task Selection State ───
  const [selectedTask, setSelectedTask] = useState<ScheduledTask | null>(null);
  const [starredTasks, setStarredTasks] = useState<Record<number, boolean>>({});

  // ─── Keyboard Navigation State ───
  const [focusedWeekIdx, setFocusedWeekIdx] = useState<number | null>(null);

  // ─── Task List State ───
  const [completedCollapsed, setCompletedCollapsed] = useState(false);

  // ─── Add Task Modal State ───
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSubtext, setNewSubtext] = useState('');
  const [newType, setNewType] = useState<TaskCard['type']>('TASK');
  const [newCategory, setNewCategory] = useState<TaskCard['category']>('OTHER');
  const [newDate, setNewDate] = useState(() => {
    const todayIso = new Date().toISOString().slice(0, 10);
    return todayIso >= DEMO_CALENDAR_MIN_DATE && todayIso <= DEMO_CALENDAR_MAX_DATE
      ? todayIso
      : DEMO_CALENDAR_MIN_DATE;
  });
  const [newTime, setNewTime] = useState('09:00');

  // ─── Swipe Gesture State ───
  const [swipeState, setSwipeState] = useState<{
    taskId: number | null;
    startX: number;
    currentX: number;
    isSwiping: boolean;
  }>({ taskId: null, startX: 0, currentX: 0, isSwiping: false });

  // Reset add task form
  const resetAddTaskForm = () => {
    setNewTitle('');
    setNewSubtext('');
    setNewType('TASK');
    setNewCategory('OTHER');
    setShowAddTask(false);
  };

  return {
    // View mode state
    viewMode,
    setViewMode,
    calendarViewType,
    setCalendarViewType,
    isCalendarLarge,
    setIsCalendarLarge,

    // Week navigation
    activeWeekNum,
    setActiveWeekNum,

    // Task selection
    selectedTask,
    setSelectedTask,
    starredTasks,
    setStarredTasks,

    // Keyboard navigation
    focusedWeekIdx,
    setFocusedWeekIdx,

    // Task list
    completedCollapsed,
    setCompletedCollapsed,

    // Add task modal
    showAddTask,
    setShowAddTask,
    newTitle,
    setNewTitle,
    newSubtext,
    setNewSubtext,
    newType,
    setNewType,
    newCategory,
    setNewCategory,
    newDate,
    setNewDate,
    newTime,
    setNewTime,
    resetAddTaskForm,

    // Swipe gesture
    swipeState,
    setSwipeState,
  };
}
