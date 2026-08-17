'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Database, Role, TaskType, TaskSource, TaskCategory } from '@/types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export interface CreateTaskData {
  title: string;
  description?: string;
  subtext?: string;
  type?: TaskType;
  source?: TaskSource;
  category?: TaskCategory;
  assigned_to?: Role;
  done?: boolean;
  scheduled_date?: string;
  reminder_time?: string;
}

/**
 * Hook for managing tasks with Supabase
 * Replaces localStorage-based task management
 */
export function useTasks(role: Role) {
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch tasks on mount
  useEffect(() => {
    if (!profile?.workspace_id) {
      setLoading(false);
      return;
    }

    fetchTasks();
  }, [profile?.workspace_id]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.workspace_id) return;

    const channel = supabase
      .channel('tasks_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `workspace_id=eq.${profile.workspace_id}`,
        },
        (payload) => {
          console.log('Task change received:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.workspace_id]);

  const fetchTasks = async () => {
    if (!profile?.workspace_id) return;

    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      showError('Failed to load tasks', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        setTasks((prev) => [payload.new as Task, ...prev]);
        break;
      case 'UPDATE':
        setTasks((prev) =>
          prev.map((task) => (task.id === payload.new.id ? (payload.new as Task) : task))
        );
        break;
      case 'DELETE':
        setTasks((prev) => prev.filter((task) => task.id !== payload.old.id));
        break;
    }
  };

  const createTask = useCallback(
    async (taskData: CreateTaskData): Promise<Task | null> => {
      if (!profile?.workspace_id || !profile?.id) {
        showError('Authentication required', 'Please sign in to create tasks');
        return null;
      }

      try {
        const newTask: TaskInsert = {
          workspace_id: profile.workspace_id,
          title: taskData.title,
          description: taskData.description || null,
          subtext: taskData.subtext || null,
          type: taskData.type || 'TASK',
          source: taskData.source || 'TEXT',
          category: taskData.category || 'OTHER',
          assigned_to: taskData.assigned_to,
          created_by: profile.id,
          done: taskData.done || false,
          scheduled_date: taskData.scheduled_date || null,
          reminder_time: taskData.reminder_time || null,
        };

        const { data, error } = await supabase
          .from('tasks')
          .insert(newTask)
          .select()
          .single();

        if (error) throw error;

        showSuccess('Task created', taskData.title);
        return data;
      } catch (error: any) {
        console.error('Error creating task:', error);
        showError('Failed to create task', error.message);
        return null;
      }
    },
    [profile, showSuccess, showError]
  );

  const updateTask = useCallback(
    async (id: number, updates: TaskUpdate): Promise<Task | null> => {
      try {
        const { data, error } = await supabase
          .from('tasks')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return data;
      } catch (error: any) {
        console.error('Error updating task:', error);
        showError('Failed to update task', error.message);
        return null;
      }
    },
    [showError]
  );

  const deleteTask = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const { error } = await supabase.from('tasks').delete().eq('id', id);

        if (error) throw error;

        showSuccess('Task deleted');
        return true;
      } catch (error: any) {
        console.error('Error deleting task:', error);
        showError('Failed to delete task', error.message);
        return false;
      }
    },
    [showSuccess, showError]
  );

  const toggleDone = useCallback(
    async (id: number): Promise<boolean> => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return false;

      try {
        const { error } = await supabase
          .from('tasks')
          .update({ done: !task.done })
          .eq('id', id);

        if (error) throw error;

        showSuccess(task.done ? 'Task reopened' : 'Task completed');
        return true;
      } catch (error: any) {
        console.error('Error toggling task:', error);
        showError('Failed to update task', error.message);
        return false;
      }
    },
    [tasks, showSuccess, showError]
  );

  return {
    tasks,
    loading,
    createTask,
    updateTask,
    deleteTask,
    toggleDone,
    refetch: fetchTasks,
  };
}
