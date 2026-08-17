import { TaskCard } from '@/utils/sharedState';
import { ScheduledTask } from './types';
import { weeksData, WORKING_HOURS_START, WORKING_HOURS_COUNT } from './constants';

/**
 * Calculate day of year for a given date
 */
export function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

/**
 * Get current time as percentage (0-100) within working hours
 * Returns null if current time is outside working hours
 */
export function getCurrentTimeTopPercent(): number | null {
  const now = new Date();
  const timeVal = now.getHours() + now.getMinutes() / 60;
  if (timeVal < WORKING_HOURS_START || timeVal > WORKING_HOURS_START + WORKING_HOURS_COUNT) {
    return null;
  }
  return ((timeVal - WORKING_HOURS_START) / WORKING_HOURS_COUNT) * 100;
}

/**
 * Locate a user-chosen scheduledDate within the fixed weeksData window
 */
export function getExplicitSchedule(card: TaskCard): { weekNum: number; dayOfWeek: number } | null {
  if (!card.scheduledDate) return null;
  const parsed = new Date(`${card.scheduledDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return null;
  const doy = getDayOfYear(parsed);
  for (const week of weeksData) {
    const day = week.days.find(d => d.dayOfYear === doy);
    if (day) return { weekNum: week.weekNum, dayOfWeek: day.dayNum };
  }
  return null;
}

/**
 * Map tasks to realistic weeks & days of August 2026
 */
export function getTaskSchedule(card: TaskCard): {
  weekNum: number;
  dayOfWeek: number;
  startTime: string;
  durationHours: number
} {
  // Tasks added via "Add Task" carry an explicit date/time — honor that
  // before falling back to the keyword-matched/pseudo-random demo schedule.
  const explicit = getExplicitSchedule(card);
  if (explicit) {
    return { ...explicit, startTime: card.scheduledTime || '09:00', durationHours: 1 };
  }

  const title = card.title.toLowerCase();

  // Keyword-based scheduling for demo tasks
  if (title.includes("mumbai retailer") && title.includes("prepare")) {
    return { weekNum: 32, dayOfWeek: 3, startTime: "10:00", durationHours: 1.5 }; // Wed Aug 5
  }
  if (title.includes("100 pieces of cotton-nylon")) {
    return { weekNum: 32, dayOfWeek: 4, startTime: "11:30", durationHours: 1.5 }; // Thu Aug 6
  }
  if (title.includes("develop new cotton-nylon")) {
    return { weekNum: 32, dayOfWeek: 5, startTime: "14:00", durationHours: 1.5 }; // Fri Aug 7
  }
  if (title.includes("delhi cotton mills")) {
    return { weekNum: 32, dayOfWeek: 4, startTime: "09:00", durationHours: 1.5 }; // Thu Aug 6
  }
  if (title.includes("revised prices") && title.includes("tomorrow")) {
    return { weekNum: 32, dayOfWeek: 6, startTime: "13:00", durationHours: 1.0 }; // Sat Aug 8
  }
  if (title.includes("revised quote to deli")) {
    return { weekNum: 32, dayOfWeek: 5, startTime: "16:30", durationHours: 1.0 }; // Fri Aug 7
  }
  if (title.includes("production review meeting")) {
    return { weekNum: 32, dayOfWeek: 5, startTime: "15:00", durationHours: 1.0 }; // Fri Aug 7
  }
  if (title.includes("increase all sales prices")) {
    return { weekNum: 32, dayOfWeek: 1, startTime: "09:00", durationHours: 1.5 }; // Mon Aug 3
  }
  if (title.includes("approve inr 15,000")) {
    return { weekNum: 32, dayOfWeek: 2, startTime: "13:30", durationHours: 1.0 }; // Tue Aug 4
  }
  if (title.includes("ravi kumar")) {
    return { weekNum: 32, dayOfWeek: 2, startTime: "11:00", durationHours: 1.0 }; // Tue Aug 4
  }
  if (title.includes("po-8812")) {
    return { weekNum: 32, dayOfWeek: 5, startTime: "10:30", durationHours: 1.5 }; // Fri Aug 7
  }

  // Default fallback scheduler: spread across all weeks
  const weekNum = 31 + (card.id % 6); // Weeks 31 to 36
  const day = (card.id % 5) + 1; // Mon to Fri
  const startHour = 9 + ((card.id % 4) * 2); // 9:00, 11:00, 13:00, 15:00
  const hourStr = startHour.toString().padStart(2, '0') + ":00";
  return { weekNum, dayOfWeek: day, startTime: hourStr, durationHours: 1.0 };
}

/**
 * Get color classes for a category
 */
export function getCategoryColor(category: string): string {
  switch (category) {
    case 'CUSTOMER':
      return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/50 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-900/50 dark:hover:bg-blue-950/50';
    case 'SUPPLIER':
      return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100/50 dark:bg-purple-950/30 dark:text-purple-300 dark:border-purple-900/50 dark:hover:bg-purple-950/50';
    case 'INVOICE':
      return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/50 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50 dark:hover:bg-amber-950/50';
    case 'PAYMENT':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/50 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50 dark:hover:bg-emerald-950/50';
    case 'COMPLAINT':
      return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/50 dark:bg-red-950/30 dark:text-red-300 dark:border-red-900/50 dark:hover:bg-red-950/50';
    default:
      return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/50 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-900/50 dark:hover:bg-indigo-950/50';
  }
}

/**
 * Calculate position and height for a calendar chip
 */
export function getCalendarChipStyle(task: ScheduledTask): { top: string; height: string } {
  const [hStr, mStr] = task.startTime.split(':');
  const h = parseInt(hStr);
  const m = parseInt(mStr);
  const timeVal = h + m / 60;

  const top = ((timeVal - WORKING_HOURS_START) / WORKING_HOURS_COUNT) * 100;
  const height = (task.durationHours / WORKING_HOURS_COUNT) * 100;

  return {
    top: `${top}%`,
    height: `${height}%`,
  };
}
