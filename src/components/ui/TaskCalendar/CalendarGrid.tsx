'use client';

import React, { useRef } from 'react';
import { ChevronRight, Star, Clock } from 'lucide-react';
import type { ScheduledTask } from './TaskDetailsModal';
import {
  weeksData,
  WORKING_HOURS_START,
  WORKING_HOURS_COUNT,
  CALENDAR_HEIGHT_PX,
} from './constants';
import {
  getCategoryColor,
  getCalendarChipStyle,
  getTaskSchedule,
} from './utils';

export type CalendarViewType = 'month' | 'week';

interface WeekData {
  weekNum: number;
  label: string;
  days: Array<{
    dayNum: number;
    name: string;
    date: number;
    month: string;
    dayOfYear: number;
    isToday: boolean;
  }>;
}

interface CalendarGridProps {
  viewMode: 'calendar' | 'tasks' | 'split';
  calendarViewType: CalendarViewType;
  activeWeek: WeekData;
  weeksDataToday: WeekData[];
  filteredScheduledTasks: ScheduledTask[];
  isSmall: boolean;
  isCalendarLarge: boolean;
  focusedWeekIdx: number | null;
  starredTasks: Record<number, boolean>;
  swipeState: {
    taskId: number | null;
    startX: number;
    currentX: number;
    isSwiping: boolean;
  };
  currentTimeTopPercent: number | null;
  onSetIsCalendarLarge: (isLarge: boolean) => void;
  onSetFocusedWeekIdx: (idx: number | null) => void;
  onSelectWeekFromDay: (weekNum: number) => void;
  onSetSelectedTask: (task: ScheduledTask) => void;
  onHandleMonthGridKeyDown: (e: React.KeyboardEvent<HTMLDivElement>) => void;
  onHandleTouchStart: (e: React.TouchEvent, taskId: number) => void;
  onHandleTouchMove: (e: React.TouchEvent) => void;
  onHandleTouchEnd: (taskId: number) => void;
}

export function CalendarGrid({
  viewMode,
  calendarViewType,
  activeWeek,
  weeksDataToday,
  filteredScheduledTasks,
  isSmall,
  isCalendarLarge,
  focusedWeekIdx,
  starredTasks,
  swipeState,
  currentTimeTopPercent,
  onSetIsCalendarLarge,
  onSetFocusedWeekIdx,
  onSelectWeekFromDay,
  onSetSelectedTask,
  onHandleMonthGridKeyDown,
  onHandleTouchStart,
  onHandleTouchMove,
  onHandleTouchEnd,
}: CalendarGridProps) {
  const monthGridRef = useRef<HTMLDivElement>(null);
  const hours = Array.from({ length: WORKING_HOURS_COUNT }, (_, i) => i + WORKING_HOURS_START);

  if (viewMode === 'tasks') return null;

  return (
    <div
      onClick={() => {
        if (viewMode === 'split' && !isCalendarLarge) {
          onSetIsCalendarLarge(true);
        }
      }}
      className={`flex flex-col transition-all duration-300 ${
        viewMode === 'calendar'
          ? 'flex-1 overflow-x-auto min-w-[500px] scrollbar-thin'
          : isCalendarLarge
          ? 'flex-1 overflow-x-auto min-w-[500px] scrollbar-thin'
          : 'w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10'
      }`}
    >
      {/* ─── MONTHLY CALENDAR VIEW ─── */}
      {calendarViewType === 'month' && (
        <div className="flex-1 flex flex-col">
          {/* Days Label Header */}
          <div className="grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 shrink-0">
            <div
              className={`text-center font-mono font-bold border-r border-zinc-200 dark:border-zinc-800 ${
                isSmall ? 'py-1.5 text-[9px]' : 'py-3 text-[11px]'
              } text-zinc-500 dark:text-zinc-500`}
            >
              WEEK
            </div>
            {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((day) => (
              <div
                key={day}
                className={`text-center font-mono font-bold border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 ${
                  isSmall ? 'py-1.5 text-[9px]' : 'py-3 text-[11px]'
                } text-zinc-500 dark:text-zinc-500`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid Weeks Rows */}
          <div
            ref={monthGridRef}
            tabIndex={0}
            onKeyDown={onHandleMonthGridKeyDown}
            onFocus={() => {
              if (focusedWeekIdx === null) onSetFocusedWeekIdx(0);
            }}
            onBlur={() => onSetFocusedWeekIdx(null)}
            className="flex-1 flex flex-col min-h-[480px] outline-none"
            role="grid"
            aria-label="Monthly calendar. Use arrow keys to navigate weeks, Enter to open."
          >
            {weeksDataToday.map((week, wIdx) => {
              const isFocused = focusedWeekIdx === wIdx;
              return (
                <div
                  key={week.weekNum}
                  className={`flex-1 grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800/80 last:border-b-0 group/week transition-colors ${
                    isFocused ? 'ring-2 ring-inset ring-brand-red/60 bg-red-50/10 dark:bg-red-950/10' : ''
                  }`}
                  role="row"
                >
                  {/* Week Row Action Column */}
                  <button
                    onClick={() => {
                      onSetFocusedWeekIdx(wIdx);
                      onSelectWeekFromDay(week.weekNum);
                    }}
                    onFocus={() => onSetFocusedWeekIdx(wIdx)}
                    tabIndex={-1}
                    className={`border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center transition-colors cursor-pointer relative
                          ${
                            isFocused
                              ? 'bg-brand-red/10 dark:bg-brand-red/15 text-brand-red font-black'
                              : 'bg-zinc-50/10 dark:bg-zinc-900/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-brand-red group-hover/week:bg-zinc-100/30 dark:group-hover/week:bg-zinc-800/30'
                          }`}
                    title="Click or press Enter to view weekly details"
                  >
                    <span className={`font-mono font-bold ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>
                      {week.label}
                    </span>
                    {!isSmall && (
                      <ChevronRight
                        className={`w-4 h-4 mt-0.5 transition-all ${
                          isFocused
                            ? 'opacity-100 translate-x-0.5 text-brand-red'
                            : 'opacity-0 group-hover/week:opacity-100'
                        }`}
                      />
                    )}
                  </button>

                  {/* Week Days */}
                  {week.days.map((day) => {
                    const dayTasks = filteredScheduledTasks.filter(
                      (t) => t.weekNum === week.weekNum && t.dayOfWeek === day.dayNum
                    );

                    return (
                      <div
                        key={day.date + day.month}
                        onClick={() => {
                          onSetFocusedWeekIdx(wIdx);
                          onSelectWeekFromDay(week.weekNum);
                        }}
                        role="gridcell"
                        className={`${isSmall ? 'p-1' : 'p-2'} border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 flex flex-col justify-between transition-colors cursor-pointer relative group/day ${
                          day.month !== 'current' ? 'bg-zinc-50/30 dark:bg-zinc-950/5' : ''
                        } ${day.isToday ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}
                              ${
                                isFocused && day.month === 'current'
                                  ? 'hover:bg-red-50/20 dark:hover:bg-red-950/10'
                                  : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20'
                              }`}
                      >
                        {/* Date Label */}
                        <div className="flex items-center justify-between">
                          {day.isToday && !isSmall ? (
                            <span className="text-[8px] font-mono font-bold bg-blue-500 text-white px-1 py-0.5 rounded leading-none">
                              TODAY
                            </span>
                          ) : (
                            <span></span>
                          )}
                          <span
                            className={`font-mono font-bold flex items-center justify-center rounded-full ${
                              isSmall ? 'text-[10px] w-5 h-5' : 'text-xs w-6 h-6'
                            } ${
                              day.isToday
                                ? 'bg-brand-red text-white font-black'
                                : day.month !== 'current'
                                ? 'text-zinc-400 dark:text-zinc-700'
                                : 'text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {day.date}
                          </span>
                        </div>

                        {/* Task chips list (max 2 pills) */}
                        <div className="flex flex-col gap-0.5 mt-1 overflow-hidden">
                          {dayTasks.slice(0, isSmall ? 1 : 2).map((task) => (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSetSelectedTask(task);
                              }}
                              className={`truncate text-left cursor-pointer transition-all hover:scale-[1.01] ${getCategoryColor(
                                task.category
                              )} ${task.done ? 'line-through opacity-45' : ''} ${
                                isSmall
                                  ? 'px-1 py-0 text-[8px] leading-tight font-medium rounded'
                                  : 'px-1.5 py-0.5 text-[9px] font-semibold rounded'
                              }`}
                            >
                              {task.title}
                            </div>
                          ))}
                          {dayTasks.length > (isSmall ? 1 : 2) && (
                            <div
                              className={`font-mono text-zinc-400 dark:text-zinc-500 font-bold pl-0.5 mt-0.5 ${
                                isSmall ? 'text-[7px]' : 'text-[9px]'
                              }`}
                            >
                              +{dayTasks.length - (isSmall ? 1 : 2)} more
                            </div>
                          )}
                        </div>

                        {/* Hover border prompt */}
                        <div className="absolute inset-0 bg-transparent group-hover/day:border group-hover/day:border-zinc-300 dark:group-hover/day:border-zinc-700 pointer-events-none rounded" />
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* Keyboard hint */}
          <div className="px-4 py-1.5 border-t border-zinc-100 dark:border-zinc-800/60 bg-zinc-50/40 dark:bg-zinc-900/40 shrink-0 flex items-center gap-2">
            <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              ↑↓
            </kbd>
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
              {isSmall ? 'nav' : 'navigate weeks'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">·</span>
            <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">
              Enter
            </kbd>
            <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500">
              {isSmall ? 'open' : 'open week view'}
            </span>
          </div>
        </div>
      )}

      {/* ─── WEEKLY CALENDAR VIEW ─── */}
      {calendarViewType === 'week' && (
        <div className="flex flex-col flex-1">
          {/* Days header row */}
          <div className="grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 shrink-0">
            <div
              className={`text-center font-mono font-bold border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center ${
                isSmall ? 'py-1.5 text-[9px]' : 'py-3 text-[11px]'
              } text-zinc-500 dark:text-zinc-500`}
            >
              TIME
            </div>
            {activeWeek.days.map((day) => (
              <div
                key={day.name}
                className={`flex flex-col items-center justify-center border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 ${
                  isSmall ? 'py-1.5' : 'py-3'
                } ${day.isToday ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''}`}
              >
                <span
                  className={`${
                    isSmall ? 'text-[9px]' : 'text-[11px]'
                  } font-bold text-zinc-500 dark:text-zinc-500 font-mono tracking-wider`}
                >
                  {day.name}
                </span>
                <span
                  className={`font-mono font-black flex items-center justify-center rounded-full mt-0.5 ${
                    isSmall ? 'w-5.5 h-5.5 text-xs' : 'w-7 h-7 text-sm'
                  } ${day.isToday ? 'bg-brand-red text-white' : 'text-zinc-800 dark:text-zinc-200'}`}
                >
                  {day.date}
                </span>
              </div>
            ))}
          </div>

          {/* Time Grid Scrollable */}
          <div className="flex-1 relative flex overflow-y-auto" style={{ height: `${CALENDAR_HEIGHT_PX}px` }}>
            {/* Left Time slots column */}
            <div className="w-[12.5%] shrink-0 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/10 relative">
              {hours.map((hour, idx) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-b border-zinc-100 dark:border-zinc-800/40 flex justify-center items-start pt-1 font-mono text-[11px] font-bold text-zinc-500 dark:text-zinc-500"
                  style={{
                    top: `${(idx / WORKING_HOURS_COUNT) * 100}%`,
                    height: `${100 / WORKING_HOURS_COUNT}%`,
                  }}
                >
                  {hour > 12 ? `${hour - 12} PM` : hour === 12 ? '12 PM' : `${hour} AM`}
                </div>
              ))}
            </div>

            {/* Days Columns for Events */}
            <div className="flex-1 grid grid-cols-7 relative">
              {/* Horizontal hour lines background helper */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-full border-b border-zinc-100 dark:border-zinc-800/30"
                    style={{ height: '0px' }}
                  />
                ))}
              </div>

              {/* Day Columns */}
              {activeWeek.days.map((day) => {
                const dayTasks = filteredScheduledTasks.filter(
                  (task) => task.weekNum === activeWeek.weekNum && task.dayOfWeek === day.dayNum
                );

                return (
                  <div
                    key={day.dayNum}
                    className={`relative border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 h-full ${
                      day.isToday ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''
                    }`}
                  >
                    {/* Red line indicator for current time */}
                    {day.isToday && currentTimeTopPercent !== null && (
                      <div
                        className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                        style={{ top: `${currentTimeTopPercent}%` }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 -ml-1"></span>
                        <span className="flex-1 border-t border-red-500"></span>
                      </div>
                    )}

                    {/* Event Cards inside column */}
                    {dayTasks.map((task) => {
                      const style = getCalendarChipStyle(task);
                      const catColor = getCategoryColor(task.category);

                      const swipeOffset =
                        swipeState.isSwiping && swipeState.taskId === task.id
                          ? swipeState.currentX - swipeState.startX
                          : 0;

                      return (
                        <button
                          key={task.id}
                          onClick={() => onSetSelectedTask(task)}
                          onTouchStart={(e) => onHandleTouchStart(e, task.id)}
                          onTouchMove={onHandleTouchMove}
                          onTouchEnd={() => onHandleTouchEnd(task.id)}
                          style={{
                            ...style,
                            transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
                            transition:
                              swipeState.isSwiping && swipeState.taskId === task.id ? 'none' : undefined,
                          }}
                          className={`absolute left-1 right-1 p-1.5 rounded-lg border text-left flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md cursor-pointer ${catColor} ${
                            task.done ? 'opacity-40 line-through' : ''
                          }`}
                        >
                          <div className="min-w-0 w-full">
                            <div className="flex items-center justify-between">
                              <span className="text-[7px] font-black tracking-wider uppercase opacity-85 font-mono truncate">
                                {task.type}
                              </span>
                              {starredTasks[task.id] && (
                                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] font-bold leading-tight mt-0.5 text-zinc-800 dark:text-zinc-100 truncate w-full">
                              {task.title}
                            </p>
                          </div>
                          <span className="text-[8px] font-mono opacity-80 flex items-center gap-0.5 mt-1 shrink-0">
                            <Clock className="w-2 h-2" />
                            {task.startTime}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
