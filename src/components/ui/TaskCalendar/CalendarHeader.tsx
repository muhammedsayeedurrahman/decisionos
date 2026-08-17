'use client';

import React from 'react';
import {
  Calendar as CalendarIcon,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';

export type ViewMode = 'calendar' | 'tasks' | 'split';
export type CalendarViewType = 'month' | 'week';

interface WeekData {
  weekNum: number;
  days: Array<{ date: number; dayOfYear: number }>;
}

interface CalendarHeaderProps {
  viewMode: ViewMode;
  calendarViewType: CalendarViewType;
  activeWeek: WeekData;
  onViewModeChange: (mode: ViewMode) => void;
  onCalendarViewTypeChange: (type: CalendarViewType) => void;
  onWeekNav: (direction: 'prev' | 'next') => void;
  onJumpToCurrentWeek: () => void;
}

export function CalendarHeader({
  viewMode,
  calendarViewType,
  activeWeek,
  onViewModeChange,
  onCalendarViewTypeChange,
  onWeekNav,
  onJumpToCurrentWeek,
}: CalendarHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
      {/* Left Side: Calendar Navigation */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          {calendarViewType === 'week' && (
            <button
              onClick={() => onCalendarViewTypeChange('month')}
              className="flex items-center gap-1 px-2 py-1 text-[10px] font-mono font-bold bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 rounded-lg text-zinc-600 dark:text-zinc-300 shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>MONTH</span>
            </button>
          )}
          <div className="flex items-center gap-1">
            <span className="p-1 text-brand-red shrink-0">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-white uppercase font-mono whitespace-nowrap">
              {calendarViewType === 'month'
                ? 'August 2026'
                : `Aug ${activeWeek.days[0].date} - ${activeWeek.days[6].date}, 2026`}
            </h2>
          </div>
        </div>

        {/* Week Navigation Controls */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={() => onWeekNav('prev')}
            disabled={calendarViewType === 'month'}
            className={`p-1 sm:p-2 rounded transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              calendarViewType === 'month'
                ? 'opacity-40 text-zinc-400 dark:text-zinc-700 cursor-not-allowed'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono px-2 text-zinc-500 dark:text-zinc-400 font-bold whitespace-nowrap">
            {calendarViewType === 'month' ? (
              'ALL WEEKS'
            ) : (
              <>
                WEEK {activeWeek.weekNum}
                <span className="hidden sm:inline text-[9px] opacity-60 ml-1.5" title="Use arrow keys to navigate">
                  ← →
                </span>
              </>
            )}
          </span>
          <button
            onClick={() => onWeekNav('next')}
            disabled={calendarViewType === 'month'}
            className={`p-1 sm:p-2 rounded transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center ${
              calendarViewType === 'month'
                ? 'opacity-40 text-zinc-400 dark:text-zinc-700 cursor-not-allowed'
                : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
            }`}
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Jump to Current Week Button */}
        <button
          onClick={onJumpToCurrentWeek}
          className="hidden md:inline-flex px-2.5 py-1 text-[10px] font-mono font-bold bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 rounded-lg hover:border-zinc-400 dark:hover:border-zinc-600 shadow-sm transition-all cursor-pointer"
        >
          CURRENT WEEK
        </button>
      </div>

      {/* Right Side: View Toggle (Calendar / Tasks / Split) */}
      <div className="flex items-center bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl self-start sm:self-center">
        <button
          onClick={() => onViewModeChange('calendar')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
            viewMode === 'calendar'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">CALENDAR</span>
        </button>
        <button
          onClick={() => onViewModeChange('tasks')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
            viewMode === 'tasks'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <ListTodo className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TASKS</span>
        </button>
        <button
          onClick={() => onViewModeChange('split')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer ${
            viewMode === 'split'
              ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
          }`}
        >
          <div className="flex gap-0.5 items-center">
            <span className="w-1.5 h-3 border-r border-current opacity-70"></span>
            <span className="w-1.5 h-3"></span>
          </div>
          <span className="hidden sm:inline">SPLIT VIEW</span>
        </button>
      </div>
    </div>
  );
}
