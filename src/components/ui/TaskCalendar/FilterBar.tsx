'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { FILTER_TABS } from './constants';

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onAddTask: () => void;
}

export function FilterBar({ activeFilter, onFilterChange, onAddTask }: FilterBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b border-zinc-200 dark:border-zinc-800/80 bg-zinc-50/20 dark:bg-zinc-900/20">
      {/* Filter Tabs - scrollable on mobile */}
      <div className="flex items-center gap-1 flex-1 min-w-0 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onFilterChange(tab.key)}
            className={`px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full border transition-all shrink-0 cursor-pointer ${
              activeFilter === tab.key
                ? 'bg-zinc-900 dark:bg-white text-white dark:text-zinc-950 border-zinc-900 dark:border-white shadow-sm'
                : 'text-zinc-500 dark:text-zinc-400 border-transparent hover:border-zinc-200 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add Task Button - always visible */}
      <button
        onClick={onAddTask}
        className="shrink-0 flex items-center gap-1 px-3 py-1 text-[10px] font-mono font-bold uppercase rounded-full bg-brand-red text-white hover:bg-red-700 transition-colors cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span className="hidden min-[380px]:inline">Add Task</span>
      </button>
    </div>
  );
}
