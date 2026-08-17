'use client';

import React from 'react';
import { X } from 'lucide-react';
import { type KeyboardShortcut, getShortcutHints } from '@/hooks/useKeyboardShortcuts';

interface KeyboardShortcutsHelpProps {
  shortcuts: KeyboardShortcut[];
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcutsHelp({ shortcuts, open, onClose }: KeyboardShortcutsHelpProps) {
  if (!open) return null;

  const hints = getShortcutHints(shortcuts);

  return (
    <div
      className="fixed inset-0 bg-zinc-950/30 dark:bg-black/50 backdrop-blur-sm z-[300] flex items-start justify-center pt-[12vh] p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 id="shortcuts-title" className="text-lg font-bold text-zinc-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {hints.map(({ category, hints: categoryHints }) => (
              <div key={category}>
                <h3 className="text-xs font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryHints.map((hint, idx) => (
                    <div key={idx} className="flex items-center justify-between gap-4">
                      <span className="text-sm text-zinc-600 dark:text-zinc-400">{hint.description}</span>
                      <kbd className="px-2 py-1 text-xs font-mono font-semibold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded whitespace-nowrap">
                        {hint.keys}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="px-6 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 text-center">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded">?</kbd> to toggle this help
          </p>
        </div>
      </div>
    </div>
  );
}
