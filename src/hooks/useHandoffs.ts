'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { Database, Role, HandoffStatus } from '@/types/database.types';

type Handoff = Database['public']['Tables']['handoffs']['Row'];
type HandoffInsert = Database['public']['Tables']['handoffs']['Insert'];
type HandoffUpdate = Database['public']['Tables']['handoffs']['Update'];

export interface CreateHandoffData {
  from_role: Role;
  to_role: Role;
  title: string;
  description?: string;
  instruction?: string;
  message: string;
}

/**
 * Hook for managing handoffs with Supabase
 * Replaces localStorage-based handoff management
 */
export function useHandoffs(role: Role) {
  const { profile } = useAuth();
  const { showSuccess, showError } = useNotifications();
  const [handoffs, setHandoffs] = useState<Handoff[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch handoffs on mount
  useEffect(() => {
    if (!profile?.workspace_id) {
      setLoading(false);
      return;
    }

    fetchHandoffs();
  }, [profile?.workspace_id, role]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.workspace_id) return;

    const channel = supabase
      .channel('handoffs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'handoffs',
          filter: `workspace_id=eq.${profile.workspace_id}`,
        },
        (payload) => {
          console.log('Handoff change received:', payload);
          handleRealtimeUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.workspace_id]);

  const fetchHandoffs = async () => {
    if (!profile?.workspace_id) return;

    try {
      // Fetch handoffs relevant to this role (from or to)
      const { data, error } = await supabase
        .from('handoffs')
        .select('*')
        .eq('workspace_id', profile.workspace_id)
        .or(`from_role.eq.${role},to_role.eq.${role}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setHandoffs(data || []);
    } catch (error: any) {
      console.error('Error fetching handoffs:', error);
      showError('Failed to load handoffs', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRealtimeUpdate = (payload: any) => {
    switch (payload.eventType) {
      case 'INSERT':
        // Only add if relevant to this role
        if (
          payload.new.from_role === role ||
          payload.new.to_role === role
        ) {
          setHandoffs((prev) => [payload.new as Handoff, ...prev]);
        }
        break;
      case 'UPDATE':
        setHandoffs((prev) =>
          prev.map((handoff) =>
            handoff.id === payload.new.id ? (payload.new as Handoff) : handoff
          )
        );
        break;
      case 'DELETE':
        setHandoffs((prev) => prev.filter((handoff) => handoff.id !== payload.old.id));
        break;
    }
  };

  const createHandoff = useCallback(
    async (handoffData: CreateHandoffData): Promise<Handoff | null> => {
      if (!profile?.workspace_id || !profile?.id) {
        showError('Authentication required', 'Please sign in to create handoffs');
        return null;
      }

      try {
        const newHandoff: HandoffInsert = {
          workspace_id: profile.workspace_id,
          from_role: handoffData.from_role,
          to_role: handoffData.to_role,
          title: handoffData.title,
          description: handoffData.description || null,
          instruction: handoffData.instruction || null,
          message: handoffData.message,
          created_by: profile.id,
          status: 'pending',
        };

        const { data, error } = await supabase
          .from('handoffs')
          .insert(newHandoff)
          .select()
          .single();

        if (error) throw error;

        showSuccess('Handoff created', handoffData.title);
        return data;
      } catch (error: any) {
        console.error('Error creating handoff:', error);
        showError('Failed to create handoff', error.message);
        return null;
      }
    },
    [profile, showSuccess, showError]
  );

  const approveHandoff = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('handoffs')
          .update({ status: 'approved' as HandoffStatus })
          .eq('id', id);

        if (error) throw error;

        showSuccess('Handoff approved');
        return true;
      } catch (error: any) {
        console.error('Error approving handoff:', error);
        showError('Failed to approve handoff', error.message);
        return false;
      }
    },
    [showSuccess, showError]
  );

  const rejectHandoff = useCallback(
    async (id: number): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('handoffs')
          .update({ 
            status: 'rejected' as HandoffStatus,
            reply_text: null 
          })
          .eq('id', id);

        if (error) throw error;

        showSuccess('Handoff rejected');
        return true;
      } catch (error: any) {
        console.error('Error rejecting handoff:', error);
        showError('Failed to reject handoff', error.message);
        return false;
      }
    },
    [showSuccess, showError]
  );

  const submitReply = useCallback(
    async (id: number, replyText: string): Promise<boolean> => {
      try {
        const { error } = await supabase
          .from('handoffs')
          .update({ 
            status: 'submitted' as HandoffStatus,
            reply_text: replyText 
          })
          .eq('id', id);

        if (error) throw error;

        showSuccess('Reply submitted');
        return true;
      } catch (error: any) {
        console.error('Error submitting reply:', error);
        showError('Failed to submit reply', error.message);
        return false;
      }
    },
    [showSuccess, showError]
  );

  return {
    handoffs,
    loading,
    createHandoff,
    approveHandoff,
    rejectHandoff,
    submitReply,
    refetch: fetchHandoffs,
  };
}
