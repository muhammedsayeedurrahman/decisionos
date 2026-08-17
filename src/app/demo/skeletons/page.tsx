'use client';

import React, { useState } from 'react';
import {
  Skeleton,
  TaskCardSkeleton,
  TaskListSkeleton,
  CalendarSkeleton,
  DashboardStatsSkeleton,
  TableSkeleton,
  KanbanBoardSkeleton,
  KanbanColumnSkeleton,
  ProfileSkeleton,
  FormSkeleton,
} from '@/components/ui/Skeleton';

export default function SkeletonShowcasePage() {
  const [animation, setAnimation] = useState<'pulse' | 'wave' | 'none'>('pulse');
  const [showExamples, setShowExamples] = useState(true);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-zinc-900 dark:text-white">
            Skeleton Loading States
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Comprehensive skeleton component library for better perceived performance.
            These skeletons replace spinners and provide visual feedback during async operations.
          </p>

          {/* Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Animation:
              </label>
              <select
                value={animation}
                onChange={(e) => setAnimation(e.target.value as 'pulse' | 'wave' | 'none')}
                className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg text-sm bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white"
              >
                <option value="pulse">Pulse</option>
                <option value="wave">Wave (Shimmer)</option>
                <option value="none">None</option>
              </select>
            </div>

            <button
              onClick={() => setShowExamples(!showExamples)}
              className="px-4 py-1.5 bg-brand-red text-white rounded-lg text-sm font-semibold hover:bg-red-600 transition-colors"
            >
              {showExamples ? 'Hide' : 'Show'} Examples
            </button>
          </div>
        </div>

        {showExamples && (
          <div className="space-y-12">
            {/* Base Skeleton Component */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                1. Base Skeleton Component
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                The foundational component with customizable variants and dimensions.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-500">Text Variant</p>
                  <Skeleton variant="text" width="100%" height={20} animation={animation} />
                  <Skeleton variant="text" width="80%" height={20} animation={animation} />
                  <Skeleton variant="text" width="60%" height={20} animation={animation} />
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-500">Circular Variant</p>
                  <div className="flex gap-3">
                    <Skeleton variant="circular" width={40} height={40} animation={animation} />
                    <Skeleton variant="circular" width={56} height={56} animation={animation} />
                    <Skeleton variant="circular" width={72} height={72} animation={animation} />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-mono text-zinc-500">Rectangular Variant</p>
                  <Skeleton variant="rectangular" width="100%" height={120} animation={animation} />
                </div>
              </div>
            </section>

            {/* Task Card Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                2. Task Card Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading individual task cards.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <TaskCardSkeleton />
                <TaskCardSkeleton />
                <TaskCardSkeleton />
              </div>
            </section>

            {/* Task List Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                3. Task List Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading task lists or feeds.
              </p>
              <TaskListSkeleton count={3} />
            </section>

            {/* Dashboard Stats Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                4. Dashboard Stats Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading dashboard statistics cards.
              </p>
              <DashboardStatsSkeleton />
            </section>

            {/* Calendar Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                5. Calendar Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading calendar views.
              </p>
              <div className="max-w-4xl">
                <CalendarSkeleton />
              </div>
            </section>

            {/* Kanban Board Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                6. Kanban Board Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading kanban boards with multiple columns.
              </p>
              <KanbanBoardSkeleton />
            </section>

            {/* Kanban Column Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                7. Kanban Column Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading a single kanban column.
              </p>
              <div className="max-w-md">
                <KanbanColumnSkeleton />
              </div>
            </section>

            {/* Table Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                8. Table Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading data tables.
              </p>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <TableSkeleton rows={5} columns={4} />
              </div>
            </section>

            {/* Profile Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                9. Profile Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading user profiles.
              </p>
              <div className="max-w-md">
                <ProfileSkeleton />
              </div>
            </section>

            {/* Form Skeleton */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                10. Form Skeleton
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Use while loading forms.
              </p>
              <div className="max-w-md">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6">
                  <FormSkeleton fields={5} />
                </div>
              </div>
            </section>

            {/* Usage Examples */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Usage Examples
              </h2>
              <div className="bg-zinc-900 rounded-xl p-6 overflow-x-auto">
                <pre className="text-xs text-zinc-300 font-mono">
{`// Basic usage
import { Skeleton, TaskListSkeleton } from '@/components/ui/Skeleton';

// Loading state with skeleton
function TaskList() {
  const { tasks, loading } = useTasks();

  if (loading) {
    return <TaskListSkeleton count={5} />;
  }

  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}

// Conditional rendering
function Dashboard() {
  const { stats, loading } = useDashboardStats();

  return (
    <div>
      {loading ? (
        <DashboardStatsSkeleton />
      ) : (
        <StatsGrid stats={stats} />
      )}
    </div>
  );
}

// Custom skeleton
<Skeleton
  variant="rectangular"
  width="100%"
  height={200}
  animation="wave"
  className="rounded-xl"
/>`}
                </pre>
              </div>
            </section>

            {/* Performance Notes */}
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                Performance & Accessibility
              </h2>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-xl p-6 space-y-3">
                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    ✅ Benefits
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Better perceived performance than spinners</li>
                    <li>Gives users a preview of content structure</li>
                    <li>Reduces layout shift when content loads</li>
                    <li>More visually appealing than blank spaces</li>
                    <li>WCAG compliant with aria-hidden="true"</li>
                    <li>Respects prefers-reduced-motion</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    🎯 Best Practices
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>Match skeleton layout to actual content layout</li>
                    <li>Use pulse animation for short waits (&lt;2s)</li>
                    <li>Use wave animation for longer waits (&gt;2s)</li>
                    <li>Keep skeleton count reasonable (3-5 items)</li>
                    <li>Always provide loading text for screen readers</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                    ♿ Accessibility
                  </h3>
                  <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                    <li>All skeletons have aria-hidden="true"</li>
                    <li>Animations disabled with prefers-reduced-motion</li>
                    <li>Always pair with sr-only loading announcements</li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
