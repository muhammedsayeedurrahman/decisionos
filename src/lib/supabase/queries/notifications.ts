import { createClient } from '../client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

type NotificationRow = Database['public']['Tables']['notifications']['Row'];

export interface NotificationCounts {
  owner: number;
  sales: number;
  production: number;
  finance: number;
}

/**
 * Fetch notification counts for all roles in a workspace
 */
export async function getNotificationCounts(workspaceId: string): Promise<NotificationCounts> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();

  if (error) {
    // If no notification record exists yet, return zeros
    if (error.code === 'PGRST116') {
      return { owner: 0, sales: 0, production: 0, finance: 0 };
    }
    throw new Error(`Failed to fetch notifications: ${error.message}`);
  }

  return {
    owner: data.owner_count,
    sales: data.sales_count,
    production: data.production_count,
    finance: data.finance_count,
  };
}

/**
 * Increment notification count for a specific role
 */
export async function incrementNotificationCount(
  workspaceId: string,
  role: 'owner' | 'sales' | 'production' | 'finance'
): Promise<void> {
  const columnName = `${role}_count`;

  // Try to increment existing record
  const { error: updateError } = await supabase.rpc('increment_notification_count', {
    p_workspace_id: workspaceId,
    p_role: role,
  });

  if (updateError) {
    // If no record exists, create one with initial count of 1
    if (updateError.code === 'PGRST116') {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert([{
          workspace_id: workspaceId,
          owner_count: role === 'owner' ? 1 : 0,
          sales_count: role === 'sales' ? 1 : 0,
          production_count: role === 'production' ? 1 : 0,
          finance_count: role === 'finance' ? 1 : 0,
        }]);

      if (insertError) {
        throw new Error(`Failed to create notification count: ${insertError.message}`);
      }
    } else {
      throw new Error(`Failed to increment notification count: ${updateError.message}`);
    }
  }
}

/**
 * Reset notification count for a specific role
 */
export async function resetNotificationCount(
  workspaceId: string,
  role: 'owner' | 'sales' | 'production' | 'finance'
): Promise<void> {
  const updates: Record<string, number> = {
    [`${role}_count`]: 0,
  };

  const { error } = await supabase
    .from('notifications')
    .update(updates)
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Failed to reset notification count: ${error.message}`);
  }
}

/**
 * Reset all notification counts for a workspace
 */
export async function resetAllNotificationCounts(workspaceId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({
      owner_count: 0,
      sales_count: 0,
      production_count: 0,
      finance_count: 0,
    })
    .eq('workspace_id', workspaceId);

  if (error) {
    throw new Error(`Failed to reset all notification counts: ${error.message}`);
  }
}
