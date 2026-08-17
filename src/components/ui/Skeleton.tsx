'use client';

import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
  width?: string | number;
  height?: string | number;
}

/**
 * Base Skeleton component for loading states
 *
 * @example
 * <Skeleton variant="text" width="80%" />
 * <Skeleton variant="circular" width={40} height={40} />
 * <Skeleton variant="rectangular" height={200} />
 */
export function Skeleton({
  className = '',
  variant = 'rectangular',
  animation = 'pulse',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'bg-zinc-200 dark:bg-zinc-800';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const animationClasses = {
    pulse: 'animate-pulse',
    wave: 'animate-shimmer',
    none: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  // Default heights for text variant
  if (variant === 'text' && !height) {
    style.height = '1em';
  }

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${animationClasses[animation]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Task card skeleton for loading task lists
 */
export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="80%" height={20} />
          <Skeleton variant="text" width="60%" height={16} />
        </div>
        <Skeleton variant="circular" width={24} height={24} />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton variant="rectangular" width={60} height={20} className="rounded-full" />
        <Skeleton variant="rectangular" width={80} height={20} className="rounded-full" />
      </div>
    </div>
  );
}

/**
 * Task list skeleton (multiple cards)
 */
export function TaskListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TaskCardSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Calendar grid skeleton
 */
export function CalendarSkeleton() {
  return (
    <div className="space-y-4">
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="rectangular" width={120} height={32} />
        <div className="flex gap-2">
          <Skeleton variant="rectangular" width={80} height={32} />
          <Skeleton variant="rectangular" width={80} height={32} />
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} variant="text" height={20} />
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} variant="rectangular" height={80} />
        ))}
      </div>
    </div>
  );
}

/**
 * Dashboard stats skeleton
 */
export function DashboardStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <Skeleton variant="text" width={80} height={16} />
            <Skeleton variant="circular" width={32} height={32} />
          </div>
          <Skeleton variant="text" width={100} height={32} />
          <Skeleton variant="text" width="60%" height={14} />
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton
 */
export function TableSkeleton({
  rows = 5,
  columns = 4,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="w-full space-y-2">
      {/* Table header */}
      <div className="flex gap-4 p-3 border-b border-zinc-200 dark:border-zinc-800">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="flex-1">
            <Skeleton variant="text" width="60%" height={16} />
          </div>
        ))}
      </div>

      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 p-3 border-b border-zinc-200 dark:border-zinc-800">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={colIndex} className="flex-1">
              <Skeleton variant="text" width="80%" height={16} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Kanban column skeleton
 */
export function KanbanColumnSkeleton() {
  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between mb-4">
        <Skeleton variant="text" width={100} height={20} />
        <Skeleton variant="rectangular" width={24} height={24} className="rounded-full" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <TaskCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * Full Kanban board skeleton
 */
export function KanbanBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <KanbanColumnSkeleton key={i} />
      ))}
    </div>
  );
}

/**
 * Profile skeleton
 */
export function ProfileSkeleton() {
  return (
    <div className="flex items-start gap-4">
      <Skeleton variant="circular" width={64} height={64} />
      <div className="flex-1 space-y-2">
        <Skeleton variant="text" width="40%" height={24} />
        <Skeleton variant="text" width="60%" height={16} />
        <Skeleton variant="text" width="50%" height={16} />
      </div>
    </div>
  );
}

/**
 * Form skeleton
 */
export function FormSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton variant="text" width={100} height={16} />
          <Skeleton variant="rectangular" height={40} />
        </div>
      ))}
      <Skeleton variant="rectangular" width={120} height={40} className="mt-6" />
    </div>
  );
}
