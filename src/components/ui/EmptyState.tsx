'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  illustration?: 'tasks' | 'files' | 'team' | 'handoffs' | 'search';
  className?: string;
}

/**
 * Empty state component with illustration and call-to-action
 *
 * Usage:
 * ```tsx
 * <EmptyState
 *   icon={CheckSquare}
 *   title="No tasks yet"
 *   description="Create your first task to get started"
 *   action={{
 *     label: "Create Task",
 *     onClick: () => setShowAddTask(true)
 *   }}
 * />
 * ```
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  illustration,
  className = '',
}: EmptyStateProps) {
  const illustrations = {
    tasks: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
        <circle cx="100" cy="60" r="30" fill="currentColor" className="text-brand-red" />
        <rect x="70" y="110" width="60" height="8" rx="4" fill="currentColor" className="text-zinc-400" />
        <rect x="70" y="130" width="40" height="8" rx="4" fill="currentColor" className="text-zinc-400" />
        <rect x="70" y="150" width="50" height="8" rx="4" fill="currentColor" className="text-zinc-400" />
      </svg>
    ),
    files: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
        <rect x="60" y="40" width="80" height="100" rx="8" fill="currentColor" className="text-brand-blue" />
        <rect x="70" y="60" width="60" height="6" rx="3" fill="currentColor" className="text-zinc-100 dark:text-zinc-800" />
        <rect x="70" y="75" width="50" height="6" rx="3" fill="currentColor" className="text-zinc-100 dark:text-zinc-800" />
        <rect x="70" y="90" width="55" height="6" rx="3" fill="currentColor" className="text-zinc-100 dark:text-zinc-800" />
      </svg>
    ),
    team: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
        <circle cx="100" cy="80" r="25" fill="currentColor" className="text-brand-yellow" />
        <circle cx="70" cy="80" r="20" fill="currentColor" className="text-zinc-400" />
        <circle cx="130" cy="80" r="20" fill="currentColor" className="text-zinc-400" />
        <path d="M 100 110 Q 100 130, 80 140 L 120 140 Q 100 130, 100 110" fill="currentColor" className="text-brand-yellow" />
      </svg>
    ),
    handoffs: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
        <circle cx="70" cy="70" r="20" fill="currentColor" className="text-brand-red" />
        <circle cx="130" cy="130" r="20" fill="currentColor" className="text-brand-blue" />
        <path
          d="M 80 80 Q 100 100, 120 120"
          stroke="currentColor"
          strokeWidth="3"
          fill="none"
          className="text-zinc-400"
          strokeDasharray="5,5"
        />
        <polygon points="120,120 115,110 125,115" fill="currentColor" className="text-zinc-400" />
      </svg>
    ),
    search: (
      <svg viewBox="0 0 200 200" className="w-full h-full opacity-20">
        <circle cx="90" cy="90" r="35" stroke="currentColor" strokeWidth="6" fill="none" className="text-zinc-400" />
        <line x1="115" y1="115" x2="145" y2="145" stroke="currentColor" strokeWidth="6" className="text-zinc-400" strokeLinecap="round" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`
        flex flex-col items-center justify-center
        py-16 px-6
        text-center
        ${className}
      `}
    >
      {/* Illustration */}
      {illustration && (
        <div className="w-48 h-48 mb-6">
          {illustrations[illustration]}
        </div>
      )}

      {/* Icon */}
      {!illustration && (
        <div className="
          w-16 h-16
          flex items-center justify-center
          bg-zinc-100 dark:bg-zinc-900
          rounded-full
          mb-6
        ">
          <Icon className="w-8 h-8 text-zinc-400 dark:text-zinc-600" />
        </div>
      )}

      {/* Title */}
      <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={action.onClick}
          className="
            px-6 py-3
            bg-brand-red
            text-white font-bold
            uppercase tracking-wider text-sm
            rounded-md
            hover:shadow-[var(--shadow-brutal-sm)]
            dark:hover:shadow-[var(--shadow-brutal-red)]
            transition-all
            border border-zinc-950 dark:border-zinc-800
          "
        >
          {action.label}
        </motion.button>
      )}
    </motion.div>
  );
}
