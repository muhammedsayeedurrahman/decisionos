'use client';

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Moon, BellOff, LogOut, ListTodo } from 'lucide-react';
import { TAB_ICONS } from './DashboardShell';
import { RoleConfig, TabId } from '@/config/roles';
import { WorkspaceState } from '@/utils/sharedState';
import { TEAM } from '@/config/team';
import { useFocusTrap } from '@/hooks/useFocusTrap';

interface CommandItem {
  id: string;
  section: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  onSelect: () => void;
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: RoleConfig;
  workspaceState: WorkspaceState;
  setActiveTab: (tab: TabId) => void;
  setActiveFilter: (filter: string) => void;
  toggleTheme: () => void;
  handleClearNotifications: () => void;
}

// Rendered once per role dashboard (from DashboardPage) and stays mounted
// even while closed, so the Ctrl/Cmd+K listener below works from anywhere.
export default function CommandPalette({
  open,
  onOpenChange,
  config,
  workspaceState,
  setActiveTab,
  setActiveFilter,
  toggleTheme,
  handleClearNotifications,
}: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);
  const trapRef = useFocusTrap(open, close);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setHighlighted(0);
    const t = setTimeout(() => inputRef.current?.focus(), 10);
    return () => clearTimeout(t);
  }, [open]);

  // Approximates each role's Decision Desk visibility (owner sees everything,
  // others see what's assigned to them) — good enough for a quick-jump list.
  const visibleCards = useMemo(
    () => config.id === 'owner'
      ? workspaceState.cards
      : workspaceState.cards.filter(c => c.assignedTo === config.id),
    [workspaceState.cards, config.id]
  );

  const items: CommandItem[] = useMemo(() => {
    const navItems: CommandItem[] = config.navTabs.map(tabId => ({
      id: `nav-${tabId}`,
      section: 'Navigate',
      label: config.tabTitles[tabId] ?? tabId,
      icon: TAB_ICONS[tabId],
      onSelect: () => { setActiveTab(tabId); close(); },
    }));

    const taskItems: CommandItem[] = visibleCards.slice(0, 25).map(card => ({
      id: `task-${card.id}`,
      section: 'Tasks',
      label: card.title,
      sublabel: `${card.type} · ${card.category}`,
      icon: <ListTodo className="w-4 h-4" />,
      onSelect: () => {
        setActiveTab('desk');
        setActiveFilter(card.category);
        close();
      },
    }));

    const peopleItems: CommandItem[] = TEAM.map(member => ({
      id: `person-${member.email}`,
      section: 'People',
      label: member.name,
      sublabel: member.role,
      icon: <span className={`block w-2.5 h-2.5 rounded-full ${member.color}`} />,
      onSelect: () => { setActiveTab('people'); close(); },
    }));

    const actionItems: CommandItem[] = [
      {
        id: 'action-theme',
        section: 'Quick Actions',
        label: 'Toggle theme',
        icon: <Moon className="w-4 h-4" />,
        onSelect: () => { toggleTheme(); close(); },
      },
      {
        id: 'action-clear-alerts',
        section: 'Quick Actions',
        label: 'Clear notifications',
        icon: <BellOff className="w-4 h-4" />,
        onSelect: () => { handleClearNotifications(); close(); },
      },
      {
        id: 'action-sign-out',
        section: 'Quick Actions',
        label: 'Sign out',
        icon: <LogOut className="w-4 h-4" />,
        onSelect: () => { close(); router.push('/'); },
      },
    ];

    return [...navItems, ...taskItems, ...peopleItems, ...actionItems];
  }, [config, visibleCards, setActiveTab, setActiveFilter, toggleTheme, handleClearNotifications, router, close]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(item =>
      item.label.toLowerCase().includes(q) ||
      item.sublabel?.toLowerCase().includes(q) ||
      item.section.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => setHighlighted(0), [query]);

  const sections = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    filtered.forEach(item => {
      const list = map.get(item.section) ?? [];
      list.push(item);
      map.set(item.section, list);
    });
    return Array.from(map.entries());
  }, [filtered]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(h => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(h => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      filtered[highlighted]?.onSelect();
    }
  };

  if (!open) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 bg-zinc-950/30 dark:bg-black/50 backdrop-blur-sm z-[300] flex items-start justify-center pt-[12vh] p-4"
      onClick={close}
    >
      <div
        ref={trapRef}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="flex items-center gap-2.5 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Jump to a tab, task, or person…"
            className="flex-1 bg-transparent text-sm font-mono outline-none placeholder:text-zinc-400 dark:text-white"
          />
          <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {sections.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-2xl mb-3">🔍</div>
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">No matches found</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                Try searching for a tab, task, or person
              </p>
              <div className="text-left max-w-xs mx-auto">
                <p className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-2 px-2">
                  Popular Commands
                </p>
                <div className="space-y-1">
                  {items.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      onClick={item.onSelect}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
                    >
                      <span className="text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center justify-center w-4">{item.icon}</span>
                      <span className="text-xs font-semibold truncate">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            sections.map(([section, sectionItems]) => (
              <div key={section} className="mb-2 last:mb-0">
                <p className="px-2 py-1 text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  {section}
                </p>
                {sectionItems.map((item) => {
                  runningIndex += 1;
                  const isHighlighted = runningIndex === highlighted;
                  return (
                    <button
                      key={item.id}
                      onMouseEnter={() => setHighlighted(runningIndex)}
                      onClick={item.onSelect}
                      className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        isHighlighted
                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <span className="text-zinc-400 dark:text-zinc-500 shrink-0 flex items-center justify-center w-4">{item.icon}</span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-xs font-semibold truncate">{item.label}</span>
                        {item.sublabel && (
                          <span className="block text-[10px] font-mono text-zinc-400 dark:text-zinc-500 truncate">{item.sublabel}</span>
                        )}
                      </span>
                      {isHighlighted && <ArrowRight className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="flex items-center gap-3 px-4 py-2 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
          <div className="flex items-center gap-1">
            <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">↑↓</kbd>
            <span className="text-[9px] font-mono text-zinc-400">navigate</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="text-[9px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 px-1 py-0.5 rounded border border-zinc-200 dark:border-zinc-700">Enter</kbd>
            <span className="text-[9px] font-mono text-zinc-400">select</span>
          </div>
        </div>
      </div>
    </div>
  );
}
