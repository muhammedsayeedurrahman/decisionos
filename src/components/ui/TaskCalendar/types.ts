import { TaskCard } from '@/utils/sharedState';

export interface NewTaskInput {
  title: string;
  subtext: string;
  type: TaskCard['type'];
  category: TaskCard['category'];
  scheduledDate: string;
  scheduledTime: string;
}

export interface TaskCalendarFeedProps {
  cards: TaskCard[];
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
  handleMarkDone: (id: number) => void;
  handleDismiss: (id: number) => void;
  handleSendToBoard: (title: string) => void;
  onAddTask: (input: NewTaskInput) => void;
}

export interface ScheduledTask extends TaskCard {
  weekNum: number;
  dayOfWeek: number; // 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat, 7 = Sun
  startTime: string; // "09:00"
  durationHours: number;
}

export interface DayInfo {
  name: string;
  date: string;
  fullDateLabel: string;
  dayNum: number;
  month: 'prev' | 'current' | 'next';
  isToday?: boolean;
  dayOfYear: number;
}

export interface WeekInfo {
  weekNum: number;
  label: string;
  days: DayInfo[];
}

export type ViewMode = 'calendar' | 'tasks' | 'split';
export type CalendarViewType = 'month' | 'week';
