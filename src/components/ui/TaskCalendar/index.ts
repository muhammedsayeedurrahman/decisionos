/**
 * TaskCalendar Components - Refactored from TaskCalendarFeed.tsx
 *
 * This directory contains the modular components extracted from the original
 * 1,200+ line TaskCalendarFeed component for better maintainability.
 */

// Extracted Components
export { AddTaskModal, type NewTaskInput } from './AddTaskModal';
export { TaskDetailsModal, type ScheduledTask } from './TaskDetailsModal';
export { FilterBar } from './FilterBar';
export { CalendarHeader, type ViewMode, type CalendarViewType } from './CalendarHeader';
export { CalendarGrid } from './CalendarGrid';
export { TaskListView } from './TaskListView';

// Custom Hooks
export { useCalendarState } from './useCalendarState';
export { useTaskActions } from './useTaskActions';

// Constants
export {
  WORKING_HOURS_START,
  WORKING_HOURS_COUNT,
  CALENDAR_HEIGHT_PX,
  MOBILE_BREAKPOINT_PX,
  PULL_REFRESH_DELAY_MS,
  PULL_REFRESH_THRESHOLD_PX,
  DEMO_CALENDAR_MIN_DATE,
  DEMO_CALENDAR_MAX_DATE,
  FILTER_TABS,
  weeksData,
} from './constants';

// Types
export type {
  WeekInfo,
  DayInfo,
  TaskCalendarFeedProps,
} from './types';

// Utility Functions
export {
  getDayOfYear,
  getCurrentTimeTopPercent,
  getTaskSchedule,
  getCategoryColor,
  getCalendarChipStyle,
} from './utils';
