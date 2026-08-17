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

  // Create handoff with optimistic UI update
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

      // Create optimistic handoff with temporary ID
      const optimisticHandoff: Handoff = {
        id: `temp-${Date.now()}`,
        workspace_id: workspaceId,
        from_user_id: profile.id,
        to_user_id: handoffData.toUserId,
        title: handoffData.title,
        description: handoffData.description || null,
        instruction: handoffData.instruction || null,
        status: 'pending',
        reply_text: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. OPTIMISTIC UPDATE: Add to UI immediately
      setHandoffs((prev) => [optimisticHandoff, ...prev]);

      try {
        // 2. Make API call
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

        // 3. Replace optimistic handoff with real handoff
        setHandoffs((prev) =>
          prev.map((h) => (h.id === optimisticHandoff.id ? newHandoff : h))
        );
        return newHandoff;
      } catch (err) {
        // 4. ROLLBACK: Remove optimistic handoff on error
        setHandoffs((prev) => prev.filter((h) => h.id !== optimisticHandoff.id));
        setError(err instanceof Error ? err.message : 'Failed to create handoff');
        throw err;
      }
    },
    [workspaceId, profile]
  );

  // Submit handoff response with optimistic UI update
  const submitHandoff = useCallback(
    async (handoffId: string, replyText: string) => {
      // 1. Store previous state for rollback
      const previousHandoffs = handoffs;

      // 2. OPTIMISTIC UPDATE: Update status immediately
      setHandoffs((prev) =>
        prev.map((h) =>
          h.id === handoffId
            ? { ...h, status: 'submitted' as const, reply_text: replyText }
            : h
        )
      );

      try {
        // 3. Make API call
        const updatedHandoff = await handoffQueries.submitHandoff(handoffId, replyText);

        // 4. Update with server response
        setHandoffs((prev) =>
          prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
        );
        return updatedHandoff;
      } catch (err) {
        // 5. ROLLBACK: Restore previous state on error
        setHandoffs(previousHandoffs);
        setError(err instanceof Error ? err.message : 'Failed to submit handoff');
        throw err;
      }
    },
    [handoffs]
  );

  // Approve handoff with optimistic UI update
  const approveHandoff = useCallback(async (handoffId: string) => {
    // 1. Store previous state for rollback
    const previousHandoffs = handoffs;

    // 2. OPTIMISTIC UPDATE: Update status immediately
    setHandoffs((prev) =>
      prev.map((h) =>
        h.id === handoffId ? { ...h, status: 'approved' as const } : h
      )
    );

    try {
      // 3. Make API call
      const updatedHandoff = await handoffQueries.approveHandoff(handoffId);

      // 4. Update with server response
      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
      );
      return updatedHandoff;
    } catch (err) {
      // 5. ROLLBACK: Restore previous state on error
      setHandoffs(previousHandoffs);
      setError(err instanceof Error ? err.message : 'Failed to approve handoff');
      throw err;
    }
  }, [handoffs]);

  // Reject handoff with optimistic UI update
  const rejectHandoff = useCallback(async (handoffId: string) => {
    // 1. Store previous state for rollback
    const previousHandoffs = handoffs;

    // 2. OPTIMISTIC UPDATE: Update status immediately
    setHandoffs((prev) =>
      prev.map((h) =>
        h.id === handoffId ? { ...h, status: 'rejected' as const } : h
      )
    );

    try {
      // 3. Make API call
      const updatedHandoff = await handoffQueries.rejectHandoff(handoffId);

      // 4. Update with server response
      setHandoffs((prev) =>
        prev.map((h) => (h.id === handoffId ? updatedHandoff : h))
      );
      return updatedHandoff;
    } catch (err) {
      // 5. ROLLBACK: Restore previous state on error
      setHandoffs(previousHandoffs);
      setError(err instanceof Error ? err.message : 'Failed to reject handoff');
      throw err;
    }
  }, [handoffs]);

  // Delete handoff with optimistic UI update
  const deleteHandoff = useCallback(async (handoffId: string) => {
    // 1. Store deleted handoff for rollback
    const deletedHandoff = handoffs.find((h) => h.id === handoffId);
    if (!deletedHandoff) {
      throw new Error('Handoff not found');
    }

    // 2. OPTIMISTIC UPDATE: Remove from UI immediately
    setHandoffs((prev) => prev.filter((h) => h.id !== handoffId));

    try {
      // 3. Make API call
      await handoffQueries.deleteHandoff(handoffId);

      // Handoff successfully deleted, optimistic update was correct
    } catch (err) {
      // 4. ROLLBACK: Restore deleted handoff on error
      setHandoffs((prev) => [deletedHandoff, ...prev]);
      setError(err instanceof Error ? err.message : 'Failed to delete handoff');
      throw err;
    }
  }, [handoffs]);

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
