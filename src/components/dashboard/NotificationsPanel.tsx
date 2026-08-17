'use client';

import React, { useEffect, useRef, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Inbox } from 'lucide-react';
import { usePillHoverAnimation } from '@/hooks/usePillHoverAnimation';
import { RoleConfig, TabId } from '@/config/roles';
import { TaskCard, WorkspaceState } from '@/utils/sharedState';

const CATEGORY_DOT: Record<TaskCard['category'], string> = {
  CUSTOMER: 'bg-blue-500',
  SUPPLIER: 'bg-purple-500',
  INVOICE: 'bg-amber-500',
  PAYMENT: 'bg-emerald-500',
  COMPLAINT: 'bg-red-500',
  OTHER: 'bg-indigo-500',
};

interface NotificationsPanelProps {
  config: RoleConfig;
  workspaceState: WorkspaceState;
  notificationCount: number;
  onClearAll: () => void;
  setActiveTab: (tab: TabId) => void;
}

// Styled and animated to match LanguageSwitcher's pill trigger (same GSAP
// hover mechanic as PillNav — circle reveal + label slide-swap), but needs
// its own dropdown panel — like LanguageSwitcher, that rules out living
// inside the PillNav items array.
export default function NotificationsPanel({
  config,
  workspaceState,
  notificationCount,
  onClearAll,
  setActiveTab,
}: NotificationsPanelProps) {
  const [open, setOpen] = useState(false);
  const [pulsing, setPulsing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { btnRef, circleRef, labelRef, labelHoverRef, onMouseEnter, onMouseLeave } = usePillHoverAnimation();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const items: TaskCard[] = useMemo(() => {
    const filtered = config.id === 'owner'
      ? workspaceState.cards
      : workspaceState.cards.filter(c => c.assignedTo === config.id);
    return filtered.slice().sort((a, b) => b.id - a.id).slice(0, 8);
  }, [workspaceState.cards, config.id]);

  const handleItemClick = () => {
    setActiveTab('desk');
    setOpen(false);
  };

  const handleClearAll = () => {
    setPulsing(true);
    onClearAll();
    setTimeout(() => setPulsing(false), 600);
  };

  return (
    <div ref={containerRef} className="relative flex-shrink-0">
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifications"
        className={[
          'relative flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[11px] font-mono font-bold uppercase tracking-wider overflow-hidden',
          'transition-colors duration-150 cursor-pointer select-none',
          open
            ? 'bg-zinc-950 dark:bg-zinc-700 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100',
        ].join(' ')}
      >
        <span
          ref={circleRef}
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 rounded-full bg-zinc-200/70 dark:bg-zinc-700/60 z-0"
          style={{ bottom: 0 }}
        />

        {/* Label stack: resting label slides up+out, red hover label slides up+in — same mechanic as PillNav */}
        <span className="relative inline-block leading-none">
          <span ref={labelRef} className="relative z-[2] inline-flex items-center gap-1.5 will-change-transform">
            <span className={`inline-flex rounded-full ${pulsing ? 'pulse-once' : ''}`}>
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="hidden sm:inline">ALERTS</span>
          </span>
          <span ref={labelHoverRef} className="absolute left-0 top-0 z-[3] inline-flex items-center gap-1.5 text-brand-red will-change-transform">
            <span className={`inline-flex rounded-full ${pulsing ? 'pulse-once' : ''}`}>
              <Bell className="w-3.5 h-3.5" />
            </span>
            <span className="hidden sm:inline">ALERTS</span>
          </span>
        </span>

        <AnimatePresence>
          {notificationCount > 0 && (
            <motion.span
              key="alert-badge"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="relative z-10 w-4 h-4 bg-brand-red text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-sm"
            >
              {notificationCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Notifications"
          className="absolute right-0 top-[calc(100%+8px)] w-80 max-w-[calc(100vw-1.5rem)] z-[200] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-xl overflow-hidden"
          style={{ animation: 'langDrop 0.15s ease-out forwards' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
            <span className="text-xs font-bold uppercase tracking-wide text-zinc-800 dark:text-white">Notifications</span>
            <button
              onClick={handleClearAll}
              disabled={notificationCount === 0}
              className="text-[10px] font-mono font-bold text-brand-red hover:underline cursor-pointer disabled:opacity-40 disabled:no-underline disabled:cursor-default"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800">
            {items.length === 0 ? (
              <div className="py-10 flex flex-col items-center gap-2 text-zinc-400 dark:text-zinc-500">
                <Inbox className="w-6 h-6" />
                <p className="text-[11px] font-mono">You&apos;re all caught up.</p>
              </div>
            ) : (
              items.map(card => (
                <button
                  key={card.id}
                  role="menuitem"
                  onClick={handleItemClick}
                  className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
                >
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${notificationCount > 0 ? CATEGORY_DOT[card.category] : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-100 truncate">{card.title}</span>
                    {card.subtext && (
                      <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 font-mono truncate mt-0.5">{card.subtext}</span>
                    )}
                  </span>
                </button>
              ))
            )}
          </div>

          {items.length > 0 && (
            <button
              onClick={handleItemClick}
              className="w-full text-center py-2.5 text-[10px] font-mono font-bold uppercase text-zinc-500 dark:text-zinc-400 hover:text-brand-red dark:hover:text-brand-red border-t border-zinc-100 dark:border-zinc-800 cursor-pointer transition-colors"
            >
              View all in Decision Desk
            </button>
          )}
        </div>
      )}
    </div>
  );
}
