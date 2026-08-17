'use client';

import React from 'react';

interface KeyboardShortcutHintProps {
  keys: string[];
  action: string;
  className?: string;
}

/**
 * Display keyboard shortcut hints in UI
 *
 * @example
 * <KeyboardShortcutHint keys={['Cmd', 'K']} action="Command palette" />
 * <KeyboardShortcutHint keys={['Cmd', 'N']} action="New task" />
 */
export function KeyboardShortcutHint({ keys, action, className = '' }: KeyboardShortcutHintProps) {
  // Detect OS for modifier key display
  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

  // Replace Cmd with Ctrl on Windows/Linux
  const displayKeys = keys.map(key => {
    if (key === 'Cmd' && !isMac) return 'Ctrl';
    if (key === 'Cmd' && isMac) return '⌘';
    if (key === 'Shift') return '⇧';
    if (key === 'Alt') return isMac ? '⌥' : 'Alt';
    if (key === 'Enter') return '↵';
    if (key === 'Escape') return 'Esc';
    return key;
  });

  return (
    <div className={`flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 ${className}`}>
      <span className="hidden sm:inline">{action}</span>
      <div className="flex items-center gap-1">
        {displayKeys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-xs min-w-[28px] text-center">
              {key}
            </kbd>
            {index < displayKeys.length - 1 && (
              <span className="text-zinc-400 dark:text-zinc-600">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

interface ShortcutListProps {
  shortcuts: Array<{ keys: string[]; action: string }>;
  title?: string;
}

/**
 * Display a list of keyboard shortcuts
 *
 * @example
 * <ShortcutList
 *   title="Available Shortcuts"
 *   shortcuts={[
 *     { keys: ['Cmd', 'K'], action: 'Open command palette' },
 *     { keys: ['Cmd', 'N'], action: 'New task' }
 *   ]}
 * />
 */
export function ShortcutList({ shortcuts, title }: ShortcutListProps) {
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex items-center justify-between py-1.5">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {shortcut.action}
            </span>
            <div className="flex items-center gap-1">
              {shortcut.keys.map((key, keyIndex) => (
                <React.Fragment key={keyIndex}>
                  <kbd className="px-2 py-1 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-mono text-xs min-w-[28px] text-center">
                    {key === 'Cmd'
                      ? (typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl')
                      : key}
                  </kbd>
                  {keyIndex < shortcut.keys.length - 1 && (
                    <span className="text-zinc-400 dark:text-zinc-600">+</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Available keyboard shortcuts for DecisionOS
 */
export const KEYBOARD_SHORTCUTS = {
  global: [
    { keys: ['Cmd', 'K'], action: 'Open command palette' },
    { keys: ['Cmd', '/'], action: 'Toggle voice input' },
    { keys: ['Cmd', 'Shift', 'D'], action: 'Toggle dark mode' },
    { keys: ['Escape'], action: 'Close modal/dialog' },
  ],
  navigation: [
    { keys: ['Cmd', 'B'], action: 'Go to Brief tab' },
    { keys: ['Cmd', '1'], action: 'Go to Desk tab' },
    { keys: ['Cmd', '2'], action: 'Go to Board tab' },
    { keys: ['Cmd', '3'], action: 'Go to Calendar tab' },
  ],
  tasks: [
    { keys: ['Cmd', 'N'], action: 'New task' },
    { keys: ['Cmd', 'Enter'], action: 'Quick capture' },
    { keys: ['Enter'], action: 'Submit/Save' },
    { keys: ['Cmd', 'Z'], action: 'Undo' },
    { keys: ['Cmd', 'Shift', 'Z'], action: 'Redo' },
  ],
};
