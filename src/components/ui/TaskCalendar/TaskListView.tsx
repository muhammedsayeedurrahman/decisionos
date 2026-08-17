'use client';

import React from 'react';
import {
  Star,
  Clock,
  Trash2,
  Check,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';
import type { ScheduledTask } from './TaskDetailsModal';

interface TaskListViewProps {
  // View mode and size
  viewMode: 'calendar' | 'tasks' | 'split';
  isCalendarLarge: boolean;
  onCalendarSizeToggle: () => void;

  // Task data
  filteredTasks: ScheduledTask[];

  // Task selection
  onSelectTask: (task: ScheduledTask) => void;

  // Task actions
  onMarkDone: (taskId: number) => void;
  onDismiss: (taskId: number) => void;
  onToggleStar: (taskId: number, e: React.MouseEvent) => void;

  // Starred tasks state
  starredTasks: Record<number, boolean>;

  // Completed section state
  completedCollapsed: boolean;
  onToggleCompletedCollapse: () => void;

  // Swipe gesture state
  swipeState: {
    taskId: number | null;
    startX: number;
    currentX: number;
    isSwiping: boolean;
  };
  onTouchStart: (e: React.TouchEvent, taskId: number) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (taskId: number) => void;
}

export function TaskListView({
  viewMode,
  isCalendarLarge,
  onCalendarSizeToggle,
  filteredTasks,
  onSelectTask,
  onMarkDone,
  onDismiss,
  onToggleStar,
  starredTasks,
  completedCollapsed,
  onToggleCompletedCollapse,
  swipeState,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: TaskListViewProps) {
  return (
    <div
      onClick={onCalendarSizeToggle}
      className={`flex flex-col bg-white dark:bg-zinc-900 transition-all duration-300 ${
        viewMode === 'tasks'
          ? 'flex-1'
          : isCalendarLarge
            ? 'w-full md:w-80 lg:w-96 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 shrink-0'
            : 'flex-1 border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800'
      }`}
    >
      {/* List label header */}
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-950/20 shrink-0">
        <span className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
          Google Tasks &bull; My Tasks
        </span>
        <span className="text-[9px] font-mono text-zinc-400">
          {filteredTasks.filter((t) => !t.done).length} active
        </span>
      </div>

      {/* Google Tasks simple todo items list */}
      <div className="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-900 p-2 space-y-1 scrollbar-thin">
        {/* Active / Uncompleted Tasks section */}
        <div className="space-y-0.5">
          {filteredTasks.filter((t) => !t.done).length === 0 ? (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-500 flex flex-col items-center">
              <CheckCircle2 className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2 animate-pulse" />
              <p className="text-[11px] font-bold uppercase tracking-wider">
                All tasks completed
              </p>
              <p className="text-[9px] font-mono mt-0.5">Nice work!</p>
            </div>
          ) : (
            filteredTasks
              .filter((t) => !t.done)
              .map((task) => {
                const swipeOffset =
                  swipeState.isSwiping && swipeState.taskId === task.id
                    ? swipeState.currentX - swipeState.startX
                    : 0;

                return (
                  <div
                    key={task.id}
                    onClick={() => onSelectTask(task)}
                    onTouchStart={(e) => onTouchStart(e, task.id)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={() => onTouchEnd(task.id)}
                    style={{
                      transform:
                        swipeOffset !== 0
                          ? `translateX(${swipeOffset}px)`
                          : undefined,
                      transition:
                        swipeState.isSwiping && swipeState.taskId === task.id
                          ? 'none'
                          : 'all 0.2s',
                    }}
                    className="group flex items-start gap-2.5 p-2 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer border border-transparent hover:border-zinc-100 dark:hover:border-zinc-900"
                  >
                    {/* Checkbox button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkDone(task.id);
                      }}
                      className="mt-0.5 w-4.5 h-4.5 rounded-full border border-zinc-300 dark:border-zinc-700 hover:border-brand-red flex items-center justify-center shrink-0 bg-transparent transition-all cursor-pointer"
                    >
                      <Check className="w-3 h-3 text-white group-hover:text-brand-red/60 transition-colors opacity-0 group-hover:opacity-100" />
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[8px] font-mono font-black uppercase px-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded">
                          {task.type}
                        </span>
                        <span className="text-[8px] font-mono text-zinc-500 dark:text-zinc-500">
                          {task.startTime}{' '}
                          {task.weekNum !== 32 ? `(W${task.weekNum})` : ''}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-100 leading-snug truncate">
                        {task.title}
                      </p>
                      {task.subtext && (
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 line-clamp-1 mt-0.5 leading-relaxed font-mono">
                          {task.subtext}
                        </p>
                      )}
                    </div>

                    {/* Right icons (Star & actions) */}
                    <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => onToggleStar(task.id, e)}
                        className="p-2 text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label={
                          starredTasks[task.id] ? 'Unstar task' : 'Star task'
                        }
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            starredTasks[task.id]
                              ? 'fill-amber-400 text-amber-400'
                              : ''
                          }`}
                        />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDismiss(task.id);
                        }}
                        className="p-2 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Dismiss task"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
          )}
        </div>

        {/* Completed Tasks Accordion */}
        {filteredTasks.some((t) => t.done) && (
          <div className="mt-4 pt-2 border-t border-zinc-200 dark:border-zinc-800/80">
            <button
              onClick={onToggleCompletedCollapse}
              className="w-full flex items-center justify-between p-1.5 text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors cursor-pointer"
            >
              <span>
                COMPLETED ({filteredTasks.filter((t) => t.done).length})
              </span>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  completedCollapsed ? '' : 'rotate-90'
                }`}
              />
            </button>

            {!completedCollapsed && (
              <div className="space-y-0.5 mt-1">
                {filteredTasks
                  .filter((t) => t.done)
                  .map((task) => {
                    const swipeOffset =
                      swipeState.isSwiping && swipeState.taskId === task.id
                        ? swipeState.currentX - swipeState.startX
                        : 0;

                    return (
                      <div
                        key={task.id}
                        onClick={() => onSelectTask(task)}
                        onTouchStart={(e) => onTouchStart(e, task.id)}
                        onTouchMove={onTouchMove}
                        onTouchEnd={() => onTouchEnd(task.id)}
                        style={{
                          transform:
                            swipeOffset !== 0
                              ? `translateX(${swipeOffset}px)`
                              : undefined,
                          transition:
                            swipeState.isSwiping &&
                            swipeState.taskId === task.id
                              ? 'none'
                              : 'all 0.2s',
                        }}
                        className="group flex items-start gap-2.5 p-2 rounded-xl bg-zinc-50/20 dark:bg-zinc-950/10 hover:bg-zinc-50 dark:hover:bg-zinc-800/20 opacity-55 hover:opacity-85 cursor-pointer"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onMarkDone(task.id);
                          }}
                          className="mt-0.5 w-4.5 h-4.5 rounded-full border border-emerald-500 bg-emerald-500 dark:bg-emerald-600/30 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-500 line-through truncate">
                            {task.title}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDismiss(task.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
