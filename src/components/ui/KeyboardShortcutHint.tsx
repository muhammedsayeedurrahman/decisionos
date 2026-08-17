'use client';

import React from 'react';
import { formatShortcut } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutHintProps {
  shortcut: {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  className?: string;
}

/**
 * Displays a keyboard shortcut hint with platform-specific formatting
 *
 * Usage:
 * ```tsx
 * <KeyboardShortcutHint shortcut={{ key: 'k', meta: true }} />
 * ```
 */
export function KeyboardShortcutHint({ shortcut, className = '' }: KeyboardShortcutHintProps) {
  return (
    <kbd
      className={`
        inline-flex items-center gap-0.5 px-1.5 py-0.5
        font-mono text-[10px] font-semibold
        bg-zinc-100 dark:bg-zinc-800
        text-zinc-600 dark:text-zinc-400
        border border-zinc-300 dark:border-zinc-700
        rounded shadow-sm
        ${className}
      `}
    >
      {formatShortcut(shortcut)}
    </kbd>
  );
}
