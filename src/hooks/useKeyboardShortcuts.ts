import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  cmd?: boolean;
  meta?: boolean; // Backward compatibility: same as cmd
  shift?: boolean;
  alt?: boolean;
  description: string;
  action?: () => void; // New API
  handler?: () => void; // Backward compatibility
  category?: string;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'k', cmd: true, description: 'Open command palette', action: () => setOpen(true) },
 *     { key: 'n', cmd: true, description: 'New task', action: () => createTask() },
 *   ]
 * });
 * ```
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        // Support both meta (backward compat) and cmd
        const needsMeta = shortcut.cmd || shortcut.meta;
        const modifierKey = needsMeta ? event.metaKey : shortcut.ctrl ? event.ctrlKey : false;
        const shiftKey = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altKey = shortcut.alt ? event.altKey : !event.altKey;

        if (
          event.key.toLowerCase() === shortcut.key.toLowerCase() &&
          (needsMeta || shortcut.ctrl ? modifierKey : !event.metaKey && !event.ctrlKey) &&
          (shortcut.shift ? event.shiftKey : !shortcut.shift ? !event.shiftKey : shiftKey) &&
          (shortcut.alt ? event.altKey : !shortcut.alt ? !event.altKey : altKey)
        ) {
          event.preventDefault();
          // Support both action (new) and handler (backward compat)
          const callback = shortcut.action || shortcut.handler;
          if (callback) callback();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Format keyboard shortcut for display
 *
 * @example
 * formatShortcut({ key: 'k', cmd: true }) // "⌘K" on Mac, "Ctrl+K" on Windows
 */
export function formatShortcut(shortcut: Omit<KeyboardShortcut, 'description' | 'action' | 'handler'>): string {
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const parts: string[] = [];

  // Support both meta (backward compat) and cmd
  if (shortcut.ctrl || shortcut.cmd || shortcut.meta) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.shift) {
    parts.push(isMac ? '⇧' : 'Shift');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  parts.push(shortcut.key.toUpperCase());

  return isMac ? parts.join('') : parts.join('+');
}

/**
 * Get category-specific keyboard shortcuts hint component props
 */
export function getShortcutHints(shortcuts: KeyboardShortcut[]): Array<{
  category: string;
  hints: Array<{ keys: string; description: string }>;
}> {
  const grouped = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({
      keys: formatShortcut(shortcut),
      description: shortcut.description,
    });
    return acc;
  }, {} as Record<string, Array<{ keys: string; description: string }>>);

  return Object.entries(grouped).map(([category, hints]) => ({ category, hints }));
}
