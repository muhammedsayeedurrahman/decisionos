'use client';

import React, { useState } from 'react';
import { useFocusTrap } from '@/hooks/useFocusTrap';
import { type TaskCard } from '@/utils/sharedState';
import {
  DEMO_CALENDAR_MIN_DATE,
  DEMO_CALENDAR_MAX_DATE,
} from '../TaskCalendar';

export interface NewTaskInput {
  title: string;
  subtext: string;
  type: TaskCard['type'];
  category: TaskCard['category'];
  scheduledDate: string;
  scheduledTime: string;
}

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (task: NewTaskInput) => void;
}

export function AddTaskModal({ isOpen, onClose, onSubmit }: AddTaskModalProps) {
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

  const addTaskTrapRef = useFocusTrap(isOpen, onClose);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onSubmit({
      title: newTitle.trim(),
      subtext: newSubtext.trim(),
      type: newType,
      category: newCategory,
      scheduledDate: newDate,
      scheduledTime: newTime,
    });

    // Reset form
    setNewTitle('');
    setNewSubtext('');
    setNewType('TASK');
    setNewCategory('OTHER');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-zinc-950/20 dark:bg-black/40 backdrop-blur-sm z-[260] flex items-center justify-center p-4"
      onClick={onClose}
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
          <h3 id="add-task-title" className="text-sm font-bold text-zinc-900 dark:text-white">
            Add Task
          </h3>
          <button
            onClick={onClose}
            className="px-2 py-1 text-[10px] font-mono font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
          >
            ESC
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
              Title
            </label>
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
            <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
              Notes (optional)
            </label>
            <textarea
              value={newSubtext}
              onChange={(e) => setNewSubtext(e.target.value)}
              rows={2}
              className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-2.5 py-2 text-xs font-mono rounded resize-none focus:outline-none focus:ring-1 focus:ring-brand-red"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Date
              </label>
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
              <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Time
              </label>
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
              <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Type
              </label>
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
              <label className="text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase block mb-1">
                Category
              </label>
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
            Calendar demo covers Jul 27 – Sep 6, 2026.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
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
  );
}
