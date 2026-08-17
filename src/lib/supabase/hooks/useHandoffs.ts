'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '../client';

const supabase = createClient();
import * as handoffQueries from '../queries/handoffs';
import type { Handoff } from '../queries/handoffs';

export function useHandoffs() {
  const { profile } = useAuth();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = profile?.workspace_id;

  // Fetch handoffs
  const fetchHandoffs = useCallback(async () => {
    if (!workspaceId) {
      setHandoffs([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await handoffQueries.getHandoffs(workspaceId);
      setHandoffs(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch handoffs');
    } finally {
      setLoading(false);
    }
  }, [workspaceId]);

  // Initial fetch
  useEffect(() => {
    fetchHandoffs();
  }, [fetchHandoffs]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!workspaceId) return;

    const channel = supabase
      .channel(`handoffs:${workspaceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handoffs',
          filter: `workspace_id=eq.${workspaceId}`,
        },
        () => {
          fetchHandoffs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, fetchHandoffs]);

  // Create handoff
  const createHandoff = useCallback(
    async (handoffData: {
      toUserId: string;
      title: string;
      description?: string;
      instruction?: string;
    }) => {
      if (!workspaceId || !profile) {
        throw new Error('Not authenticated');
      }

      try {
        const newHandoff = await handoffQueries.createHandoff({
          workspace_id: workspaceId,
          from_user_id: profile.id,
          to_user_id: handoffData.toUserId,
          title: handoffData.title,
          description: handoffData.description || null,
          instruction: handoffData.instruction || null,
          status: 'pending',
          reply_text: null,
        });

        setHandoffs((prev) => [newHandoff, ...prev]);
        return newHandoff;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to create handoff');
        throw err;
      }
    },
    [workspaceId, profile]
  );

  // Submit handoff response
  const submitHandoff = useCallback(
    async (handoffId: string, replyText: string) => {
      try {
        const updatedHandoff = await handoffQueries.submitHandoff(handoffId, replyText);

        setHandoffs((prev) =>
          prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
        );
        return updatedHandoff;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit handoff');
        throw err;
      }
    },
    []
  );

  // Approve handoff
  const approveHandoff = useCallback(async (handoffId: string) => {
    try {
      const updatedHandoff = await handoffQueries.approveHandoff(handoffId);

      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
      );
      return updatedHandoff;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve handoff');
      throw err;
    }
  }, []);

  // Reject handoff
  const rejectHandoff = useCallback(async (handoffId: string) => {
    try {
      const updatedHandoff = await handoffQueries.rejectHandoff(handoffId);

      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
      );
      return updatedHandoff;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject handoff');
      throw err;
    }
  }, []);

  // Delete handoff
  const deleteHandoff = useCallback(async (handoffId: string) => {
    try {
      await handoffQueries.deleteHandoff(handoffId);

      setHandoffs((prev) => prev.filter((h) => h.id !== handoffId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete handoff');
      throw err;
    }
  }, []);

  return {
    handoffs,
    loading,
    error,
    refetch: fetchHandoffs,
    createHandoff,
    submitHandoff,
    approveHandoff,
    rejectHandoff,
    deleteHandoff,
  };
}

/**
 * Hook to fetch handoffs assigned to the current user
 */
export function useMyHandoffs() {
  const { profile } = useAuth();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const workspaceId = profile?.workspace_id;
  const userId = profile?.id;

  useEffect(() => {
    if (!workspaceId || !userId) {
      setHandoffs([]);
      setLoading(false);
      return;
    }

    const fetchMyHandoffs = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await handoffQueries.getHandoffsAssignedTo(workspaceId, userId);
        setHandoffs(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch handoffs');
      } finally {
        setLoading(false);
      }
    };

    fetchMyHandoffs();

    // Subscribe to real-time updates
    const channel = supabase
      .channel(`my-handoffs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handoffs',
          filter: `to_user_id=eq.${userId}`,
        },
        () => {
          fetchMyHandoffs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, userId]);

  return { handoffs, loading, error };
}
