'use client';

import React from 'react';
import {
  Star,
  Clock,
  User,
  ExternalLink,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { explainRouting } from '@/utils/sharedState';

export interface ScheduledTask {
  id: number;
  title: string;
  subtext?: string;
  type: 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
  source: 'TEXT' | 'VOICE' | 'UPLOAD';
  category: 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
  assignedTo: string;
  done: boolean;
  dayOfWeek: number;
  weekNum: number;
  startTime: string;
}

interface TaskDetailsModalProps {
  task: ScheduledTask | null;
  isStarred: boolean;
  onClose: () => void;
  onToggleStar: (e: React.MouseEvent) => void;
  onDismiss: () => void;
  onSendToBoard: () => void;
  onMarkDone: () => void;
}

export function TaskDetailsModal({
  task,
  isStarred,
  onClose,
  onToggleStar,
  onDismiss,
  onSendToBoard,
  onMarkDone,
}: TaskDetailsModalProps) {
  const taskDetailsTrapRef = useFocusTrap(!!task, onClose);

  if (!task) return null;

  return (
    <div
      className="fixed inset-0 bg-zinc-950/20 dark:bg-black/40 backdrop-blur-sm z-[250] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        ref={taskDetailsTrapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 relative overflow-hidden animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-details-title"
      >
        {/* Header background accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red"></div>

        {/* Actions Bar */}
        <div className="flex items-center justify-end gap-1 mb-2">
          <button
            onClick={onToggleStar}
            className="p-2.5 text-zinc-400 hover:text-amber-400 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isStarred ? 'Unstar task' : 'Star task'}
          >
            <Star className={`w-4 h-4 ${isStarred ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
          <button
            onClick={onDismiss}
            className="p-2.5 text-zinc-400 hover:text-red-500 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Dismiss task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
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
                {task.type}
              </span>
              <span className="text-[8px] font-mono text-zinc-400 uppercase">
                {task.source} INBOX
              </span>
            </div>
            <h3
              id="task-details-title"
              className="text-sm font-bold text-zinc-900 dark:text-white leading-snug"
            >
              {task.title}
            </h3>
          </div>

          {/* Scheduled Time info */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
            <Clock className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="font-mono">
              Day {task.dayOfWeek} of Week {task.weekNum} &bull; {task.startTime}
            </span>
          </div>

          {/* Assignee info */}
          <div className="flex items-center gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
            <User className="w-4 h-4 text-zinc-400 shrink-0" />
            <span className="font-mono">Assigned: {task.assignedTo.toUpperCase()}</span>
          </div>

          {/* Routing rationale chip — why the AI routed this here */}
          <div className="flex items-start gap-2.5 text-xs text-zinc-700 dark:text-zinc-400">
            <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span className="badge badge-gray normal-case tracking-normal font-mono leading-snug whitespace-normal">
              {explainRouting(task)}
            </span>
          </div>

          {/* Subtext description */}
          {task.subtext && (
            <div className="bg-zinc-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800/60 text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed font-mono">
              {task.subtext}
            </div>
          )}
        </div>

        {/* Call to action footer buttons */}
        <div className="flex items-center justify-between gap-3 mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {task.type !== 'REMINDER' && (
            <button
              onClick={onSendToBoard}
              className="flex items-center gap-1 px-3 py-1.5 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-500 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-mono font-bold uppercase rounded-xl transition-all cursor-pointer shadow-sm"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Send to Board</span>
            </button>
          )}

          <button
            onClick={onMarkDone}
            className={`ml-auto px-4 py-1.5 text-[10px] font-mono font-bold uppercase rounded-xl transition-all shadow-sm cursor-pointer border ${
              task.done
                ? 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-700'
                : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 border-zinc-950 dark:border-white hover:bg-zinc-800 dark:hover:bg-zinc-100'
            }`}
          >
            {task.done ? 'Mark Active' : 'Mark Done'}
          </button>
        </div>
      </div>
    </div>
  );
}
