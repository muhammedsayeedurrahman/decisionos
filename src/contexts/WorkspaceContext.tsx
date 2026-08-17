'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import { useTasks, useHandoffs, useNotifications } from '@/lib/supabase/hooks';
import { useAuth } from './AuthContext';
import type { Task } from '@/lib/supabase/queries/tasks';
import type { Handoff } from '@/lib/supabase/queries/handoffs';
import type { NotificationCounts } from '@/lib/supabase/queries/notifications';

interface WorkspaceContextType {
  // Tasks
  tasks: Task[];
  tasksLoading: boolean;
  tasksError: string | null;
  createTask: (data: {
    title: string;
    subtext?: string;
    type: Task['type'];
    source: Task['source'];
    category: Task['category'];
    assignedTo?: string;
    scheduledDate?: string;
    scheduledTime?: string;
  }) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  toggleTaskDone: (id: string, done: boolean) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  refetchTasks: () => Promise<void>;

  // Handoffs
  handoffs: Handoff[];
  handoffsLoading: boolean;
  handoffsError: string | null;
  createHandoff: (data: {
    toUserId: string;
    title: string;
    description?: string;
    instruction?: string;
  }) => Promise<Handoff>;
  submitHandoff: (id: string, replyText: string) => Promise<Handoff>;
  approveHandoff: (id: string) => Promise<Handoff>;
  rejectHandoff: (id: string) => Promise<Handoff>;
  deleteHandoff: (id: string) => Promise<void>;
  refetchHandoffs: () => Promise<void>;

  // Notifications
  notificationCounts: NotificationCounts;
  notificationsLoading: boolean;
  notificationsError: string | null;
  incrementNotificationCount: (role: 'owner' | 'sales' | 'production' | 'finance') => Promise<void>;
  resetNotificationCount: (role: 'owner' | 'sales' | 'production' | 'finance') => Promise<void>;
  resetAllNotificationCounts: () => Promise<void>;
  refetchNotifications: () => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth();

  // Use Supabase hooks
  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    createTask,
    updateTask,
    toggleTaskDone,
    deleteTask,
    refetch: refetchTasks,
  } = useTasks();

  const {
    handoffs,
    loading: handoffsLoading,
    error: handoffsError,
    createHandoff,
    submitHandoff,
    approveHandoff,
    rejectHandoff,
    deleteHandoff,
    refetch: refetchHandoffs,
  } = useHandoffs();

  const {
    counts: notificationCounts,
    loading: notificationsLoading,
    error: notificationsError,
    incrementCount: incrementNotificationCount,
    resetCount: resetNotificationCount,
    resetAllCounts: resetAllNotificationCounts,
    refetch: refetchNotifications,
  } = useNotifications();

  const value: WorkspaceContextType = {
    tasks,
    tasksLoading,
    tasksError,
    createTask,
    updateTask,
    toggleTaskDone,
    deleteTask,
    refetchTasks,

    handoffs,
    handoffsLoading,
    handoffsError,
    createHandoff,
    submitHandoff,
    approveHandoff,
    rejectHandoff,
    deleteHandoff,
    refetchHandoffs,

    notificationCounts,
    notificationsLoading,
    notificationsError,
    incrementNotificationCount,
    resetNotificationCount,
    resetAllNotificationCounts,
    refetchNotifications,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
}
