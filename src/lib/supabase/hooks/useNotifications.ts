'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '../client';

const supabase = createClient();
import * as notificationQueries from '../queries/notifications';
import type { NotificationCounts } from '../queries/notifications';

export function useNotifications() {
  const { profile } = useAuth();
  const [counts, setCounts] = useState<NotificationCounts>({
    owner: 0,
    sales: 0,
    production: 0,
    finance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = profile?.workspace_id;

  // Fetch notification counts
  const fetchCounts = useCallback(async () => {
    if (!workspaceId) {
      setCounts({ owner: 0, sales: 0, production: 0, finance: 0 });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await notificationQueries.getNotificationCounts(workspaceId);
      setCounts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Initial fetch
  useEffect(() => {
    fetchCounts();
  }, [fetchCounts]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`notifications:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchCounts();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, fetchCounts]);

  // Increment count for a role
  const incrementCount = useCallback(
    async (role: 'owner' | 'sales' | 'production' | 'finance') => {
      if (!workspaceId) {
        throw new Error('Not authenticated');
      }

      try {
        await notificationQueries.incrementNotificationCount(workspaceId, role);

        // Optimistically update local state
        setCounts((prev) => ({
          ...prev,
          [role]: prev[role] + 1,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to increment count');
        throw err;
      }
    },
    [workspaceId]
  );

  // Reset count for a role
  const resetCount = useCallback(
    async (role: 'owner' | 'sales' | 'production' | 'finance') => {
      if (!workspaceId) {
        throw new Error('Not authenticated');
      }

      try {
        await notificationQueries.resetNotificationCount(workspaceId, role);

        // Optimistically update local state
        setCounts((prev) => ({
          ...prev,
          [role]: 0,
        }));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reset count');
        throw err;
      }
    },
    [workspaceId]
  );

  // Reset all counts
  const resetAllCounts = useCallback(async () => {
    if (!workspaceId) {
      throw new Error('Not authenticated');
    }

    try {
      await notificationQueries.resetAllNotificationCounts(workspaceId);

      // Optimistically update local state
      setCounts({ owner: 0, sales: 0, production: 0, finance: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset all counts');
      throw err;
    }
  }, [workspaceId]);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts,
    incrementCount,
    resetCount,
    resetAllCounts,
  };
}
