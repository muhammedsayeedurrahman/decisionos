'use client';

import React, { useState } from 'react';

export interface WorkTask {
  id: number;
  text: string;
  done: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface MyWorkChecklistProps {
  initialTasks: WorkTask[];
  placeholder: string;
  onAdd?: () => void;
}

export default function MyWorkChecklist({ initialTasks, placeholder, onAdd }: MyWorkChecklistProps) {
  const [tasks, setTasks] = useState<WorkTask[]>(initialTasks);
  const [newTaskInput, setNewTaskInput] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;
    setTasks(prev => [...prev, { id: Date.now(), text: newTaskInput, done: false, priority: 'MEDIUM' }]);
    setNewTaskInput('');
    onAdd?.();
  };

  const toggleTask = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const removeTask = (id: number) => setTasks(prev => prev.filter(t => t.id !== id));

  return (
    <div className="w-full space-y-6 animate-fade-up">
      <form onSubmit={handleAddTask} className="flex gap-2">
        <input
          type="text"
          required
          value={newTaskInput}
          onChange={(e) => setNewTaskInput(e.target.value)}
          placeholder={placeholder}
          className="flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 dark:text-white px-3 py-2 text-xs font-mono focus:outline-none rounded"
        />
        <button type="submit" className="border border-zinc-950 dark:border-zinc-700 bg-brand-ink dark:bg-zinc-800 text-white px-4 py-2 text-xs font-semibold uppercase hover:bg-zinc-800 rounded cursor-pointer">
          Add
        </button>
      </form>
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {tasks.map(t => (
            <div key={t.id} className="p-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} className="w-4.5 h-4.5 cursor-pointer" />
                <span className={`text-xs font-bold ${t.done ? 'line-through text-zinc-400 dark:text-zinc-600' : 'text-zinc-900 dark:text-white'}`}>{t.text}</span>
              </div>
              <button onClick={() => removeTask(t.id)} className="text-xs text-zinc-400 hover:text-red-600 px-1.5 cursor-pointer">Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
