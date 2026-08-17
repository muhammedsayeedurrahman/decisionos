'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Clock, AlertCircle, CheckCircle2, Copy, Loader2 } from 'lucide-react';
import { useTaskBreakdown } from '@/hooks/useTaskBreakdown';
import type { SubTask } from '@/app/api/task-breakdown/route';

interface TaskBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskDescription: string;
  workspaceId?: string;
  onCreateSubtasks?: (subtasks: SubTask[]) => void;
}

const PRIORITY_COLORS = {
  HIGH: 'text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400',
  MEDIUM: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-950 dark:text-yellow-400',
  LOW: 'text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400',
};

/**
 * Modal for AI-powered task breakdown
 *
 * Usage:
 * ```tsx
 * <TaskBreakdownModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   taskDescription="Implement user authentication system"
 *   workspaceId={workspace.id}
 *   onCreateSubtasks={(subtasks) => createMultipleTasks(subtasks)}
 * />
 * ```
 */
export function TaskBreakdownModal({
  isOpen,
  onClose,
  taskDescription,
  workspaceId,
  onCreateSubtasks,
}: TaskBreakdownModalProps) {
  const [selectedSubtasks, setSelectedSubtasks] = useState<Set<number>>(new Set());
  const [context, setContext] = useState('');

  const { loading, breakdown, error, breakdownTask, reset } = useTaskBreakdown({
    workspaceId,
  });

  const handleBreakdown = async () => {
    await breakdownTask(taskDescription, context || undefined);
    // Select all subtasks by default
    if (breakdown) {
      setSelectedSubtasks(new Set(breakdown.subtasks.map((_, i) => i)));
    }
  };

  const handleClose = () => {
    reset();
    setSelectedSubtasks(new Set());
    setContext('');
    onClose();
  };

  const toggleSubtask = (index: number) => {
    const newSelected = new Set(selectedSubtasks);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSubtasks(newSelected);
  };

  const handleCreateSelected = () => {
    if (!breakdown || !onCreateSubtasks) return;

    const selected = breakdown.subtasks.filter((_, i) => selectedSubtasks.has(i));
    onCreateSubtasks(selected);
    handleClose();
  };

  const totalEstimatedHours = breakdown
    ? breakdown.subtasks
        .filter((_, i) => selectedSubtasks.has(i))
        .reduce((sum, task) => sum + task.estimatedHours, 0)
    : 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
            className="
              relative
              w-full max-w-3xl max-h-[90vh]
              bg-white dark:bg-zinc-900
              rounded-2xl
              shadow-2xl
              border border-zinc-200 dark:border-zinc-800
              overflow-hidden
              flex flex-col
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-brand-red/10 dark:bg-brand-red/20 rounded-lg">
                  <Sparkles className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                    AI Task Breakdown
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Break complex tasks into actionable subtasks
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Task Description */}
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                  Task Description
                </label>
                <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <p className="text-sm text-zinc-900 dark:text-zinc-100">{taskDescription}</p>
                </div>
              </div>

              {/* Optional Context */}
              {!breakdown && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
                    Additional Context (Optional)
                  </label>
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    placeholder="Add any additional context that might help with the breakdown..."
                    className="
                      w-full px-4 py-3
                      bg-white dark:bg-zinc-800
                      border border-zinc-300 dark:border-zinc-700
                      rounded-lg
                      text-sm text-zinc-900 dark:text-zinc-100
                      placeholder:text-zinc-400
                      focus:outline-none focus:ring-2 focus:ring-brand-red/50
                      resize-none
                    "
                    rows={3}
                  />
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-12 h-12 text-brand-red animate-spin mb-4" />
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Analyzing task with AI...
                  </p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-900 dark:text-red-100">
                        Failed to break down task
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Breakdown Results */}
              {breakdown && (
                <div className="space-y-6">
                  {/* AI Reasoning */}
                  {breakdown.reasoning && (
                    <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
                        AI Analysis
                      </p>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        {breakdown.reasoning}
                      </p>
                    </div>
                  )}

                  {/* Duplicate Warning */}
                  {breakdown.duplicates.length > 0 && (
                    <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <div className="flex items-start gap-3">
                        <Copy className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                            Possible Duplicates Detected
                          </p>
                          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                            Found {breakdown.duplicates.length} similar task(s) in your workspace
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subtasks */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                        Subtasks ({breakdown.subtasks.length})
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        <Clock className="w-4 h-4" />
                        <span>{totalEstimatedHours}h total</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {breakdown.subtasks.map((subtask, index) => (
                        <label
                          key={index}
                          className={`
                            block p-4 rounded-lg border cursor-pointer transition-all
                            ${
                              selectedSubtasks.has(index)
                                ? 'bg-brand-red/5 border-brand-red dark:bg-brand-red/10'
                                : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <input
                              type="checkbox"
                              checked={selectedSubtasks.has(index)}
                              onChange={() => toggleSubtask(index)}
                              className="mt-1 w-4 h-4 text-brand-red rounded border-zinc-300 focus:ring-brand-red"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                  {subtask.title}
                                </h4>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  <span
                                    className={`
                                      px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider
                                      ${PRIORITY_COLORS[subtask.priority]}
                                    `}
                                  >
                                    {subtask.priority}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-2">
                                {subtask.description}
                              </p>
                              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {subtask.estimatedHours}h
                                </span>
                                {subtask.suggestedAssignee && (
                                  <span className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 rounded font-medium">
                                    {subtask.suggestedAssignee}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Checklist */}
                  {breakdown.checklist.length > 0 && (
                    <div>
                      <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-3">
                        Acceptance Criteria
                      </h3>
                      <div className="space-y-2">
                        {breakdown.checklist.map((item, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-zinc-700 dark:text-zinc-300">{item}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-zinc-200 dark:border-zinc-800">
              <button
                onClick={handleClose}
                className="
                  px-4 py-2
                  text-sm font-medium
                  text-zinc-700 dark:text-zinc-300
                  hover:bg-zinc-100 dark:hover:bg-zinc-800
                  rounded-lg
                  transition-colors
                "
              >
                Cancel
              </button>

              {!breakdown && (
                <button
                  onClick={handleBreakdown}
                  disabled={loading}
                  className="
                    px-6 py-2
                    bg-brand-red
                    text-white font-bold
                    uppercase tracking-wider text-sm
                    rounded-lg
                    hover:shadow-lg
                    transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center gap-2
                  "
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Break Down Task
                    </>
                  )}
                </button>
              )}

              {breakdown && (
                <button
                  onClick={handleCreateSelected}
                  disabled={selectedSubtasks.size === 0}
                  className="
                    px-6 py-2
                    bg-brand-red
                    text-white font-bold
                    uppercase tracking-wider text-sm
                    rounded-lg
                    hover:shadow-lg
                    transition-all
                    disabled:opacity-50 disabled:cursor-not-allowed
                  "
                >
                  Create {selectedSubtasks.size} Subtask{selectedSubtasks.size !== 1 ? 's' : ''}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
