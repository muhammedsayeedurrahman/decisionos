'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

export interface MobileNavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  active?: boolean;
  badge?: number;
}

interface MobileBottomNavProps {
  items: MobileNavItem[];
  className?: string;
}

/**
 * Mobile bottom navigation bar
 *
 * Replaces top tabs on mobile for better thumb reach
 *
 * Usage:
 * ```tsx
 * <MobileBottomNav
 *   items={[
 *     { id: 'desk', label: 'Desk', icon: LayoutDashboard, onClick: () => setTab('desk'), active: true },
 *     { id: 'mywork', label: 'Work', icon: CheckSquare, onClick: () => setTab('mywork') },
 *   ]}
 * />
 * ```
 */
export function MobileBottomNav({ items, className = '' }: MobileBottomNavProps) {
  return (
    <div
      className={`
        fixed bottom-0 left-0 right-0
        md:hidden
        bg-white dark:bg-zinc-900
        border-t border-zinc-200 dark:border-zinc-800
        safe-area-padding-bottom
        z-40
        ${className}
      `}
    >
      <div className="flex items-center justify-around px-2 py-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`
                relative
                flex flex-col items-center justify-center
                gap-1
                px-4 py-2
                rounded-lg
                transition-colors
                min-w-[60px]
                ${item.active
                  ? 'text-brand-red'
                  : 'text-zinc-600 dark:text-zinc-400 active:bg-zinc-100 dark:active:bg-zinc-800'
                }
              `}
            >
              {/* Badge */}
              {item.badge && item.badge > 0 && (
                <span className="
                  absolute top-1 right-1
                  w-5 h-5
                  bg-brand-red
                  text-white text-xs font-bold
                  rounded-full
                  flex items-center justify-center
                ">
                  {item.badge > 9 ? '9+' : item.badge}
                </span>
              )}

              {/* Icon */}
              <Icon className="w-6 h-6" />

              {/* Label */}
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                {item.label}
              </span>

              {/* Active Indicator */}
              {item.active && (
                <motion.div
                  layoutId="mobile-nav-indicator"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-brand-red rounded-full"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
