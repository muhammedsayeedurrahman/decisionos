'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '../client';

const supabase = createClient();
import * as taskQueries from '../queries/tasks';
import type { Task } from '../queries/tasks';

export function useTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = profile?.workspace_id;

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await taskQueries.getTasks(workspaceId);
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`tasks:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          // Refetch tasks when any change occurs
          fetchTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, fetchTasks]);

  // Create task with optimistic UI update
  const createTask = useCallback(
    async (taskData: {
      title: string;
      subtext?: string;
      type: Task['type'];
      source: Task['source'];
      category: Task['category'];
      assignedTo?: string;
      scheduledDate?: string;
      scheduledTime?: string;
    }) => {
      if (!workspaceId || !profile) {
        throw new Error('Not authenticated');
      }

      // Create optimistic task with temporary ID
      const optimisticTask: Task = {
        id: `temp-${Date.now()}`,
        workspace_id: workspaceId,
        created_by: profile.id,
        title: taskData.title,
        subtext: taskData.subtext || null,
        type: taskData.type,
        source: taskData.source,
        category: taskData.category,
        assignedTo: taskData.assignedTo || null,
        assigned_to: taskData.assignedTo || null,
        done: false,
        scheduledDate: taskData.scheduledDate || null,
        scheduled_date: taskData.scheduledDate || null,
        scheduledTime: taskData.scheduledTime || null,
        scheduled_time: taskData.scheduledTime || null,
        detailsCount: 0,
        details_count: 0,
        created_at: new Date().toISOString(),
      };

      // 1. OPTIMISTIC UPDATE: Add task to UI immediately
      setTasks((prev) => [optimisticTask, ...prev]);

      try {
        // 2. Make API call
        const newTask = await taskQueries.createTask({
          workspace_id: workspaceId,
          created_by: profile.id,
          title: taskData.title,
          subtext: taskData.subtext || null,
          type: taskData.type,
          source: taskData.source,
          category: taskData.category,
          assigned_to: taskData.assignedTo || null,
          scheduled_date: taskData.scheduledDate || null,
          scheduled_time: taskData.scheduledTime || null,
          done: false,
          details_count: 0,
        });

        // 3. Replace optimistic task with real task
        setTasks((prev) =>
          prev.map((task) => (task.id === optimisticTask.id ? newTask : task))
        );
        return newTask;
      } catch (err) {
        // 4. ROLLBACK: Remove optimistic task on error
        setTasks((prev) => prev.filter((task) => task.id !== optimisticTask.id));
        setError(err instanceof Error ? err.message : 'Failed to create task');
        throw err;
      }
    },
    [workspaceId, profile]
  );

  // Update task with optimistic UI update
  const updateTask = useCallback(
    async (taskId: string, updates: Partial<Task>) => {
      // 1. Store previous state for rollback
      const previousTasks = tasks;

      // 2. OPTIMISTIC UPDATE: Update immediately in UI
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, ...updates } : task
        )
      );

      try {
        // 3. Make API call
        const updatedTask = await taskQueries.updateTask(taskId, {
          title: updates.title,
          subtext: updates.subtext,
          type: updates.type,
          source: updates.source,
          category: updates.category,
          assigned_to: updates.assignedTo,
          done: updates.done,
          scheduled_date: updates.scheduledDate,
          scheduled_time: updates.scheduledTime,
          details_count: updates.detailsCount,
        });

        // 4. Update with server response
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
        return updatedTask;
      } catch (err) {
        // 5. ROLLBACK: Restore previous state on error
        setTasks(previousTasks);
        setError(err instanceof Error ? err.message : 'Failed to update task');
        throw err;
      }
    },
    [tasks]
  );

  // Toggle task done with optimistic UI update
  const toggleTaskDone = useCallback(
    async (taskId: string, done: boolean) => {
      // 1. Store previous state for rollback
      const previousTasks = tasks;

      // 2. OPTIMISTIC UPDATE: Toggle immediately in UI
      setTasks((prev) =>
        prev.map((task) =>
          task.id === taskId ? { ...task, done } : task
        )
      );

      try {
        // 3. Make API call
        const updatedTask = await taskQueries.toggleTaskDone(taskId, done);

        // 4. Update with server response (already updated optimistically)
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
        return updatedTask;
      } catch (err) {
        // 5. ROLLBACK: Restore previous state on error
        setTasks(previousTasks);
        setError(err instanceof Error ? err.message : 'Failed to toggle task');
        throw err;
      }
    },
    [tasks]
  );

  // Delete task with optimistic UI update
  const deleteTask = useCallback(async (taskId: string) => {
    // 1. Store deleted task for rollback
    const deletedTask = tasks.find((task) => task.id === taskId);
    if (!deletedTask) {
      throw new Error('Task not found');
    }

    // 2. OPTIMISTIC UPDATE: Remove from UI immediately
    setTasks((prev) => prev.filter((task) => task.id !== taskId));

    try {
      // 3. Make API call
      await taskQueries.deleteTask(taskId);

      // Task successfully deleted, optimistic update was correct
    } catch (err) {
      // 4. ROLLBACK: Restore deleted task on error
      setTasks((prev) => [deletedTask, ...prev]);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
      throw err;
    }
  }, [tasks]);

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    toggleTaskDone,
    deleteTask,
  };
}

/**
 * Hook to fetch tasks assigned to the current user
 */
export function useMyTasks() {
  const { profile } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = profile?.workspace_id;
  const userId = profile?.id;

  useEffect(() => {
    if (!workspaceId || !userId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchMyTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await taskQueries.getTasksByAssignee(workspaceId, userId);
        setTasks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tasks');
      } finally {
        setLoading(false);
      }
    };

    fetchMyTasks();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`my-tasks:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `assigned_to=eq.${userId}`,
        },
        () => {
          fetchMyTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, userId]);

  return { tasks, loading, error };
}
