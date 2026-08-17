import { createClient } from '../client';
import type { Database, Role } from '@/types/database.types';

const supabase = createClient();

type ProfileRow = Database['public']['Tables']['profiles']['Row'];

export interface Profile {
  id: string;
  workspaceId: string;
  role: Role;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Fetch all profiles (users) in a workspace
 */
export async function getWorkspaceProfiles(workspaceId: string): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch workspace profiles: ${error.message}`);
  }

  return data.map(mapProfileFromDb);
}

/**
 * Fetch a single profile by user ID
 */
export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }

  return mapProfileFromDb(data);
}

/**
 * Fetch profile by role within a workspace
 */
export async function getProfileByRole(workspaceId: string, role: Role): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('role', role)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch profile by role: ${error.message}`);
  }

  return data ? mapProfileFromDb(data) : null;
}

/**
 * Map database row to Profile interface
 */
function mapProfileFromDb(row: ProfileRow): Profile {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    role: row.role,
    fullName: row.full_name,
    email: row.email,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
