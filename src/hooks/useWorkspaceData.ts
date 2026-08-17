'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/database.types';

type Workspace = Database['public']['Tables']['workspaces']['Row'];

/**
 * Hook for fetching workspace and user data
 * Provides workspace metadata and user profile info
 */
export function useWorkspaceData() {
  const { user, profile } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.workspace_id) {
      setLoading(false);
      return;
    }

    fetchWorkspace();
  }, [profile?.workspace_id]);

  const fetchWorkspace = async () => {
    if (!profile?.workspace_id) return;

    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('id', profile.workspace_id)
        .single();

      if (error) throw error;

      setWorkspace(data);
    } catch (error: any) {
      console.error('Error fetching workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    workspace,
    user: profile,
    loading,
    refetch: fetchWorkspace,
  };
}
