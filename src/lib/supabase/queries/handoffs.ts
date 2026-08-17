import { createClient } from '../client';
import type { Database } from '@/types/database.types';

const supabase = createClient();

type HandoffRow = Database['public']['Tables']['handoffs']['Row'];
type HandoffInsert = Database['public']['Tables']['handoffs']['Insert'];
type HandoffUpdate = Database['public']['Tables']['handoffs']['Update'];

export interface Handoff {
  id: string;
  workspaceId: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  description: string | null;
  instruction: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  replyText: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all handoffs for a workspace
 */
export async function getHandoffs(workspaceId: string): Promise<Handoff[]> {
  const { data, error } = await supabase
    .from('handoffs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch handoffs: ${error.message}`);
  }

  return data.map(mapHandoffFromDb);
}

/**
 * Fetch handoffs sent by a user
 */
export async function getHandoffsSentBy(workspaceId: string, userId: string): Promise<Handoff[]> {
  const { data, error } = await supabase
    .from('handoffs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('from_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch handoffs: ${error.message}`);
  }

  return data.map(mapHandoffFromDb);
}

/**
 * Fetch handoffs assigned to a user
 */
export async function getHandoffsAssignedTo(workspaceId: string, userId: string): Promise<Handoff[]> {
  const { data, error } = await supabase
    .from('handoffs')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('to_user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch handoffs: ${error.message}`);
  }

  return data.map(mapHandoffFromDb);
}

/**
 * Fetch a single handoff by ID
 */
export async function getHandoff(handoffId: string): Promise<Handoff | null> {
  const { data, error } = await supabase
    .from('handoffs')
    .select('*')
    .eq('id', handoffId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch handoff: ${error.message}`);
  }

  return mapHandoffFromDb(data);
}

/**
 * Create a new handoff
 */
export async function createHandoff(handoff: Omit<HandoffInsert, 'id' | 'created_at' | 'updated_at'>): Promise<Handoff> {
  const { data, error } = await supabase
    .from('handoffs')
    .insert([handoff])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create handoff: ${error.message}`);
  }

  return mapHandoffFromDb(data);
}

/**
 * Update a handoff (typically to change status or add reply)
 */
export async function updateHandoff(handoffId: string, updates: HandoffUpdate): Promise<Handoff> {
  const { data, error } = await supabase
    .from('handoffs')
    .update(updates)
    .eq('id', handoffId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update handoff: ${error.message}`);
  }

  return mapHandoffFromDb(data);
}

/**
 * Submit a handoff response
 */
export async function submitHandoff(handoffId: string, replyText: string): Promise<Handoff> {
  return updateHandoff(handoffId, {
    status: 'submitted',
    reply_text: replyText,
  });
}

/**
 * Approve a handoff
 */
export async function approveHandoff(handoffId: string): Promise<Handoff> {
  return updateHandoff(handoffId, {
    status: 'approved',
  });
}

/**
 * Reject a handoff
 */
export async function rejectHandoff(handoffId: string): Promise<Handoff> {
  return updateHandoff(handoffId, {
    status: 'rejected',
  });
}

/**
 * Delete a handoff
 */
export async function deleteHandoff(handoffId: string): Promise<void> {
  const { error } = await supabase
    .from('handoffs')
    .delete()
    .eq('id', handoffId);

  if (error) {
    throw new Error(`Failed to delete handoff: ${error.message}`);
  }
}

/**
 * Map database row to Handoff interface
 */
function mapHandoffFromDb(row: HandoffRow): Handoff {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    title: row.title,
    description: row.description,
    instruction: row.instruction,
    status: row.status,
    replyText: row.reply_text,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
