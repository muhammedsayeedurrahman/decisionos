'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Mic, FileUp, X, CheckSquare } from 'lucide-react';

export interface QuickCaptureAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  color?: 'red' | 'blue' | 'green' | 'yellow';
}

interface QuickCaptureFABProps {
  actions?: QuickCaptureAction[];
  onVoiceCapture?: () => void;
  onNewTask?: () => void;
  onFileUpload?: () => void;
  position?: 'bottom-right' | 'bottom-center';
  hidden?: boolean;
}

const defaultActions: QuickCaptureAction[] = [
  {
    id: 'voice',
    label: 'Voice Recording',
    icon: <Mic className="w-5 h-5" />,
    onClick: () => {},
    color: 'red',
  },
  {
    id: 'task',
    label: 'New Task',
    icon: <CheckSquare className="w-5 h-5" />,
    onClick: () => {},
    color: 'blue',
  },
  {
    id: 'upload',
    label: 'Upload File',
    icon: <FileUp className="w-5 h-5" />,
    onClick: () => {},
    color: 'green',
  },
];

/**
 * Floating Action Button for quick capture
 *
 * Provides quick access to voice recording, task creation, and file uploads
 *
 * Usage:
 * ```tsx
 * <QuickCaptureFAB
 *   onVoiceCapture={() => setShowVoiceRecorder(true)}
 *   onNewTask={() => setShowAddTask(true)}
 *   onFileUpload={() => fileInputRef.current?.click()}
 * />
 * ```
 */
export function QuickCaptureFAB({
  actions,
  onVoiceCapture,
  onNewTask,
  onFileUpload,
  position = 'bottom-right',
  hidden = false,
}: QuickCaptureFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Build actions list with handlers
  const finalActions: QuickCaptureAction[] = actions || [
    {
      ...defaultActions[0],
      onClick: onVoiceCapture || defaultActions[0].onClick,
    },
    {
      ...defaultActions[1],
      onClick: onNewTask || defaultActions[1].onClick,
    },
    {
      ...defaultActions[2],
      onClick: onFileUpload || defaultActions[2].onClick,
    },
  ];

  const handleActionClick = (action: QuickCaptureAction) => {
    action.onClick();
    setIsOpen(false);
  };

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6 items-end',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2 items-center',
  };

  const colorClasses = {
    red: 'bg-brand-red hover:bg-red-600',
    blue: 'bg-brand-blue hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    yellow: 'bg-brand-yellow hover:bg-yellow-500',
  };

  if (hidden) return null;

  return (
    <div className={`fixed z-50 flex flex-col gap-3 ${positionClasses[position]}`}>
      {/* Action Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-2"
          >
            {finalActions.map((action, index) => (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleActionClick(action)}
                className={`
                  flex items-center gap-3 px-4 py-3
                  ${colorClasses[action.color || 'red']}
                  text-white font-bold
                  rounded-lg
                  shadow-lg hover:shadow-xl
                  transition-all
                  border border-zinc-950 dark:border-zinc-800
                  group
                `}
                title={action.label}
              >
                {action.icon}
                <span className="text-sm whitespace-nowrap">{action.label}</span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          w-14 h-14
          bg-brand-red
          text-white
          rounded-full
          shadow-lg hover:shadow-xl
          transition-all
          border-2 border-zinc-950 dark:border-zinc-800
          flex items-center justify-center
          group
        `}
        aria-label="Quick capture menu"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="plus"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Plus className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Keyboard Hint */}
      {!isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="
            absolute -top-10 left-1/2 -translate-x-1/2
            px-2 py-1
            bg-zinc-900 dark:bg-zinc-800
            text-white text-xs font-mono
            rounded
            opacity-0 group-hover:opacity-100
            transition-opacity
            pointer-events-none
            whitespace-nowrap
          "
        >
          Press <kbd className="font-bold">⌘/</kbd> or <kbd className="font-bold">Ctrl+/</kbd>
        </motion.div>
      )}
    </div>
  );
}
