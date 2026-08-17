'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Calendar as CalendarIcon,
  ListTodo,
  ChevronLeft,
  ChevronRight,
  Plus,
  Star,
  Clock,
  User,
  ExternalLink,
  Trash2,
  Check,
  AlertCircle,
  HelpCircle,
  MoreVertical,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { explainRouting, type TaskCard } from '@/utils/sharedState';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import {
  type NewTaskInput,
  type TaskCalendarFeedProps,
  type ScheduledTask,
  type ViewMode,
  type CalendarViewType,
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
  getDayOfYear,
  getCurrentTimeTopPercent,
  getTaskSchedule,
  getCategoryColor,
  getCalendarChipStyle,
} from './TaskCalendar';
import {
  TaskListView,
  CalendarHeader,
  FilterBar,
  CalendarGrid,
  AddTaskModal,
  TaskDetailsModal,
  useCalendarState,
  useTaskActions,
} from './TaskCalendar';

// Re-export NewTaskInput for external use
export type { NewTaskInput };

export default function TaskCalendarFeed({
  cards,
  activeFilter,
  setActiveFilter,
  handleMarkDone,
  handleDismiss,
  handleSendToBoard,
  onAddTask
}: TaskCalendarFeedProps) {
  const todayDayOfYear = useMemo(() => getDayOfYear(new Date()), []);
  const weeksDataToday = useMemo(
    () => weeksData.map(week => ({
      ...week,
      days: week.days.map(day => ({ ...day, isToday: day.dayOfYear === todayDayOfYear })),
    })),
    [todayDayOfYear]
  );
  const currentTimeTopPercent = useMemo(() => getCurrentTimeTopPercent(), []);

  // ─── Calendar State Hook ───
  const calendarState = useCalendarState(todayDayOfYear);
  const {
    viewMode,
    setViewMode,
    calendarViewType,
    setCalendarViewType,
    isCalendarLarge,
    setIsCalendarLarge,
    activeWeekNum,
    setActiveWeekNum,
    selectedTask,
    setSelectedTask,
    starredTasks,
    setStarredTasks,
    focusedWeekIdx,
    setFocusedWeekIdx,
    completedCollapsed,
    setCompletedCollapsed,
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
    swipeState,
    setSwipeState,
  } = calendarState;

  const monthGridRef = useRef<HTMLDivElement>(null);

  // ─── Pull to refresh ───
  const { isPulling, isRefreshing, pullDistance } = usePullToRefresh({
    onRefresh: async () => {
      // In a real implementation, this would refetch data from the API
      // For now, we'll just simulate a refresh delay
      await new Promise(resolve => setTimeout(resolve, PULL_REFRESH_DELAY_MS));
    },
    threshold: PULL_REFRESH_THRESHOLD_PX,
    disabled: typeof window !== 'undefined' && window.innerWidth >= MOBILE_BREAKPOINT_PX, // Only on mobile
  });

  // ─── Focus trap for Add Task modal ───
  const addTaskTrapRef = useFocusTrap(showAddTask, () => setShowAddTask(false));

  // ─── Focus trap for Task Details modal ───
  const taskDetailsTrapRef = useFocusTrap(!!selectedTask, () => setSelectedTask(null));

  // ─── Task Actions Hook ───
  const taskActions = useTaskActions({
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
  });
  const {
    toggleStar,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleWeekNav,
    selectWeekFromDay,
    handleMonthGridKeyDown,
    handleAddTaskSubmit,
  } = taskActions;

  // ─── Keyboard navigation for week picker ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't interfere when modals are open or user is typing
      if (showAddTask || selectedTask) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const currentIdx = weeksData.findIndex(w => w.weekNum === activeWeekNum);
        if (currentIdx > 0) {
          setActiveWeekNum(weeksData[currentIdx - 1].weekNum);
        }
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        const currentIdx = weeksData.findIndex(w => w.weekNum === activeWeekNum);
        if (currentIdx < weeksData.length - 1) {
          setActiveWeekNum(weeksData[currentIdx + 1].weekNum);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAddTask, selectedTask, weeksData, activeWeekNum, setActiveWeekNum]);

  const activeWeek = weeksDataToday.find(w => w.weekNum === activeWeekNum) || weeksDataToday[1];
  const hours = Array.from({ length: WORKING_HOURS_COUNT }, (_, i) => i + WORKING_HOURS_START); // 8 AM to 6 PM
  const isSmall = viewMode === 'split' && !isCalendarLarge;

  const scheduledTasks: ScheduledTask[] = useMemo(
    () => cards.map(c => ({ ...c, ...getTaskSchedule(c) })),
    [cards]
  );

  const filteredScheduledTasks = useMemo(() => scheduledTasks.filter(card => {
    if (activeFilter === 'ALL') return true;
    if (activeFilter === 'TASK' || activeFilter === 'REMINDER' || activeFilter === 'APPROVAL' || activeFilter === 'INVOICE') {
      return card.type === activeFilter;
    }
    return card.category === activeFilter;
  }), [scheduledTasks, activeFilter]);

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden select-none relative z-10">

      {/* ─── Pull to Refresh Indicator ─── */}
      {(isPulling || isRefreshing) && (
        <div
          className="pull-to-refresh-indicator flex items-center justify-center gap-2 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800"
          style={{
            transform: `translateY(${Math.min(pullDistance - 80, 0)}px)`,
            transition: isPulling ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          <RefreshCw className={`w-4 h-4 text-blue-600 dark:text-blue-400 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {isRefreshing ? 'Refreshing...' : 'Release to refresh'}
          </span>
        </div>
      )}

      {/* ─── Calendar Header ─── */}
      <CalendarHeader
        viewMode={viewMode}
        calendarViewType={calendarViewType}
        activeWeek={activeWeek}
        onViewModeChange={setViewMode}
        onCalendarViewTypeChange={setCalendarViewType}
        onWeekNav={handleWeekNav}
        onJumpToCurrentWeek={() => selectWeekFromDay(32)}
      />

      {/* ─── Filter Bar ─── */}
      <FilterBar
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        onAddTask={() => setShowAddTask(true)}
      />

      {/* ─── Main Content Workspace ─── */}
      {/* Stacks vertically below md — a side-by-side split makes each pane
          unreadably narrow on phone widths. */}
      <div className="flex flex-col md:flex-row flex-1 min-h-[520px] relative overflow-hidden">
        {/* ==================== CALENDAR PANEL ==================== */}
        {(viewMode === 'calendar' || viewMode === 'split') && (
          <div 
            onClick={() => {
              if (viewMode === 'split' && !isCalendarLarge) {
                setIsCalendarLarge(true);
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
                  <div className={`text-center font-mono font-bold border-r border-zinc-200 dark:border-zinc-800 ${
                    isSmall ? 'py-1.5 text-[9px]' : 'py-3 text-[11px]'
                  } text-zinc-500 dark:text-zinc-500`}>
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

                {/* Calendar Grid Weeks Rows — keyboard navigable */}
                <div
                  ref={monthGridRef}
                  tabIndex={0}
                  onKeyDown={handleMonthGridKeyDown}
                  onFocus={() => { if (focusedWeekIdx === null) setFocusedWeekIdx(0); }}
                  onBlur={() => setFocusedWeekIdx(null)}
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
                        onClick={() => { setFocusedWeekIdx(wIdx); selectWeekFromDay(week.weekNum); }}
                        onFocus={() => setFocusedWeekIdx(wIdx)}
                        tabIndex={-1}
                        className={`border-r border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center transition-colors cursor-pointer relative
                          ${ isFocused
                              ? 'bg-brand-red/10 dark:bg-brand-red/15 text-brand-red font-black'
                              : 'bg-zinc-50/10 dark:bg-zinc-900/10 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-brand-red group-hover/week:bg-zinc-100/30 dark:group-hover/week:bg-zinc-800/30'
                          }`}
                        title="Click or press Enter to view weekly details"
                      >
                        <span className={`font-mono font-bold ${isSmall ? 'text-[11px]' : 'text-[13px]'}`}>{week.label}</span>
                        {!isSmall && (
                          <ChevronRight className={`w-4 h-4 mt-0.5 transition-all ${ isFocused ? 'opacity-100 translate-x-0.5 text-brand-red' : 'opacity-0 group-hover/week:opacity-100' }`} />
                        )}
                      </button>

                      {/* Week Days */}
                      {week.days.map((day) => {
                        const dayTasks = filteredScheduledTasks.filter(t => t.weekNum === week.weekNum && t.dayOfWeek === day.dayNum);
                        
                        return (
                          <div
                            key={day.date + day.month}
                            onClick={() => { setFocusedWeekIdx(wIdx); selectWeekFromDay(week.weekNum); }}
                            role="gridcell"
                            className={`${isSmall ? 'p-1' : 'p-2'} border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 flex flex-col justify-between transition-colors cursor-pointer relative group/day ${
                              day.month !== 'current' ? 'bg-zinc-50/30 dark:bg-zinc-950/5' : ''
                            } ${day.isToday ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''}
                              ${ isFocused && day.month === 'current' ? 'hover:bg-red-50/20 dark:hover:bg-red-950/10' : 'hover:bg-zinc-50/80 dark:hover:bg-zinc-800/20' }`}
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
                              <span className={`font-mono font-bold flex items-center justify-center rounded-full ${
                                isSmall 
                                  ? 'text-[10px] w-5 h-5' 
                                  : 'text-xs w-6 h-6'
                              } ${
                                day.isToday 
                                  ? 'bg-brand-red text-white font-black' 
                                  : day.month !== 'current'
                                    ? 'text-zinc-400 dark:text-zinc-700'
                                    : 'text-zinc-700 dark:text-zinc-300'
                              }`}>
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
                                    setSelectedTask(task);
                                  }}
                                  className={`truncate text-left cursor-pointer transition-all hover:scale-[1.01] ${getCategoryColor(task.category)} ${
                                    task.done ? 'line-through opacity-45' : ''
                                  } ${
                                    isSmall 
                                      ? 'px-1 py-0 text-[8px] leading-tight font-medium rounded' 
                                      : 'px-1.5 py-0.5 text-[9px] font-semibold rounded'
                                  }`}
                                >
                                  {task.title}
                                </div>
                              ))}
                              {dayTasks.length > (isSmall ? 1 : 2) && (
                                <div className={`font-mono text-zinc-400 dark:text-zinc-500 font-bold pl-0.5 mt-0.5 ${
                                  isSmall ? 'text-[7px]' : 'text-[9px]'
                                }`}>
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
                  <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">↑↓</kbd>
                  <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">{isSmall ? 'nav' : 'navigate weeks'}</span>
                  <span className="text-zinc-300 dark:text-zinc-700 text-[9px]">·</span>
                  <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Enter</kbd>
                  <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500">{isSmall ? 'open' : 'open week view'}</span>
                </div>
              </div>
            )}

            {/* ─── WEEKLY CALENDAR VIEW ─── */}
            {calendarViewType === 'week' && (
              <div className="flex flex-col flex-1">
                 {/* Days header row */}
                 <div className="grid grid-cols-8 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-900/30 shrink-0">
                   <div className={`text-center font-mono font-bold border-r border-zinc-200 dark:border-zinc-800 flex items-center justify-center ${
                     isSmall ? 'py-1.5 text-[9px]' : 'py-3 text-[11px]'
                   } text-zinc-500 dark:text-zinc-500`}>
                     TIME
                   </div>
                   {activeWeek.days.map((day) => (
                     <div 
                       key={day.name} 
                       className={`flex flex-col items-center justify-center border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 ${
                         isSmall ? 'py-1.5' : 'py-3'
                       } ${
                         day.isToday ? 'bg-blue-50/30 dark:bg-blue-950/10' : ''
                       }`}
                     >
                       <span className={`${
                         isSmall ? 'text-[9px]' : 'text-[11px]'
                       } font-bold text-zinc-500 dark:text-zinc-500 font-mono tracking-wider`}>{day.name}</span>
                       <span className={`font-mono font-black flex items-center justify-center rounded-full mt-0.5 ${
                         isSmall ? 'w-5.5 h-5.5 text-xs' : 'w-7 h-7 text-sm'
                       } ${
                         day.isToday 
                           ? 'bg-brand-red text-white' 
                           : 'text-zinc-800 dark:text-zinc-200'
                       }`}>
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
                          height: `${100 / WORKING_HOURS_COUNT}%`
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
                      // Filter cards for this active week & specific day
                      const dayTasks = filteredScheduledTasks.filter(
                        task => task.weekNum === activeWeek.weekNum && task.dayOfWeek === day.dayNum
                      );
                      
                      return (
                        <div 
                          key={day.dayNum} 
                          className={`relative border-r border-zinc-200 dark:border-zinc-800/80 last:border-r-0 h-full ${
                            day.isToday ? 'bg-blue-50/10 dark:bg-blue-950/5' : ''
                          }`}
                        >
                          {/* Red line indicator for current time (Only on active day today) */}
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
                            
                            const swipeOffset = swipeState.isSwiping && swipeState.taskId === task.id
                              ? swipeState.currentX - swipeState.startX
                              : 0;

                            return (
                              <button
                                key={task.id}
                                onClick={() => setSelectedTask(task)}
                                onTouchStart={(e) => handleTouchStart(e, task.id)}
                                onTouchMove={handleTouchMove}
                                onTouchEnd={() => handleTouchEnd(task.id)}
                                style={{
                                  ...style,
                                  transform: swipeOffset !== 0 ? `translateX(${swipeOffset}px)` : undefined,
                                  transition: swipeState.isSwiping && swipeState.taskId === task.id ? 'none' : undefined,
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
        )}

        {(viewMode === 'tasks' || viewMode === 'split') && (
          <TaskListView
            viewMode={viewMode}
            isCalendarLarge={isCalendarLarge}
            onCalendarSizeToggle={() => {
              if (viewMode === 'split' && isCalendarLarge) {
                setIsCalendarLarge(false);
              }
            }}
            filteredTasks={filteredScheduledTasks}
            onSelectTask={setSelectedTask}
            onMarkDone={handleMarkDone}
            onDismiss={handleDismiss}
            onToggleStar={toggleStar}
            starredTasks={starredTasks}
            completedCollapsed={completedCollapsed}
            onToggleCompletedCollapse={() => setCompletedCollapsed(!completedCollapsed)}
            swipeState={swipeState}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          />
        )}

      </div>

      {/* ─── Task Details Popover (Google Calendar Modal style) ─── */}
      {selectedTask && (
        <div
          className="fixed inset-0 bg-zinc-950/20 dark:bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
          onClick={() => setSelectedTask(null)}
        >
          <div
            ref={taskDetailsTrapRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 relative overflow-hidden animate-fade-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-details-title"
          >
            {/* Header background accents */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red"></div>

            {/* Actions Bar */}
            <div className="flex items-center justify-end gap-1 mb-2">
              <button
                onClick={(e) => toggleStar(selectedTask.id, e)}
                className="p-2.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label={starredTasks[selectedTask.id] ? "Unstar task" : "Star task"}
              >
                <Star className={`w-4 h-4 ${starredTasks[selectedTask.id] ? 'fill-amber-400 text-amber-400' : ''}`} />
              </button>
              <button
                onClick={() => {
                  handleDismiss(selectedTask.id);
                  setSelectedTask(null);
                }}
                className="p-2.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Dismiss task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelectedTask(null)}
                aria-label="Close task details"
                className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ESC
              </button>
            </div>

            {/* Task Info */}
            <div className="space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-[8px] font-mono font-black rounded text-zinc-600 dark:text-zinc-300">
                    {selectedTask.type}
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 uppercase">
                    {selectedTask.source} INBOX
                  </span>
                </div>
                <h3 id="task-details-title" className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                  {selectedTask.title}
                </h3>
              </div>

              {/* Scheduled Time info */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
                <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-mono">
                  Day {selectedTask.dayOfWeek} of Week {selectedTask.weekNum} &bull; {selectedTask.startTime}
                </span>
              </div>

              {/* Assignee info */}
              <div className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
                <User className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="font-mono">
                  Assigned: {selectedTask.assignedTo.toUpperCase()}
                </span>
              </div>

              {/* Routing rationale chip — why the AI routed this here */}
              <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                <span className="badge badge-gray normal-case tracking-normal font-mono leading-snug whitespace-normal">
                  {explainRouting(selectedTask)}
                </span>
              </div>

              {/* Subtext description */}
              {selectedTask.subtext && (
                <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
                  {selectedTask.subtext}
                </div>
              )}
            </div>

            {/* Call to action footer buttons */}
            <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
              
              {selectedTask.type !== 'REMINDER' && (
                <button
                  onClick={() => {
                    handleSendToBoard(selectedTask.title);
                    setSelectedTask(null);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Send to Board</span>
                </button>
              )}

              <button
                onClick={() => {
                  handleMarkDone(selectedTask.id);
                  setSelectedTask(null);
                }}
                className={`ml-auto px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer border ${
                  selectedTask.done
                    ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                    : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white hover:bg-zinc-800 dark:hover:bg-zinc-100'
                }`}
              >
                {selectedTask.done ? 'Mark Active' : 'Mark Done'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ─── Add Task Modal ─── */}
      {showAddTask && (
        <div
          className="fixed inset-0 bg-zinc-950/20 dark:bg-black/40 backdrop-blur-sm z-[260] flex items-center justify-center p-4"
          onClick={() => setShowAddTask(false)}
        >
          <div
            ref={addTaskTrapRef}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 relative overflow-hidden animate-fade-up"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-task-title"
          >
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red"></div>

            <div className="flex items-center justify-between mb-4">
              <h3 id="add-task-title" className="text-sm font-bold text-zinc-900 dark:text-white">Add Task</h3>
              <button
                onClick={() => setShowAddTask(false)}
                className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                ESC
              </button>
            </div>

            <form onSubmit={handleAddTaskSubmit} className="space-y-3">
              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Title</label>
                <input
                  required
                  autoFocus
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Follow up with Gujarat Cottons"
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div>
                <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Notes (optional)</label>
                <textarea
                  value={newSubtext}
                  onChange={(e) => setNewSubtext(e.target.value)}
                  rows={2}
                  className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded resize-none focus:outline-none focus:ring-1 focus:ring-brand-red"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Date</label>
                  <input
                    required
                    type="date"
                    min={DEMO_CALENDAR_MIN_DATE}
                    max={DEMO_CALENDAR_MAX_DATE}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Time</label>
                  <input
                    required
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded focus:outline-none focus:ring-1 focus:ring-brand-red"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Type</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as TaskCard['type'])}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded focus:outline-none"
                  >
                    <option value="TASK">Task</option>
                    <option value="REMINDER">Reminder</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="APPROVAL">Approval</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as TaskCard['category'])}
                    className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded focus:outline-none"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="SUPPLIER">Supplier</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="PAYMENT">Payment</option>
                    <option value="COMPLAINT">Complaint</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <p className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                Calendar demo covers Jul 27 &ndash; Sep 6, 2026.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTask(false)}
                  className="px-3 py-1.5 text-[10px] font-mono font-bold uppercase text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-xl bg-brand-red text-white hover:bg-red-700 cursor-pointer"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Footer Details Info ─── */}
      <div className="px-4 py-2.5 border-t border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-mono text-zinc-500 dark:text-zinc-500">
            {cards.filter(c => !c.done).length} items pending &bull; {cards.filter(c => c.done).length} completed
          </span>
          <span className="hidden sm:inline text-zinc-300 dark:text-zinc-700">|</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[9px] font-mono text-zinc-400 dark:text-zinc-500 font-bold uppercase">
            <AlertCircle className="w-3 h-3 text-brand-red animate-pulse" />
            <span>Interactive Month View</span>
          </span>
        </div>
        <span className="text-[9px] font-mono text-zinc-500 dark:text-zinc-500 font-semibold uppercase tracking-wider">
          Click any day or W row to transition into Weekly list
        </span>
      </div>

    </div>
  );
}
