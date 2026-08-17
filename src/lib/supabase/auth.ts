import { supabase } from './client';
import type { Role } from '@/types/database.types';

interface UserProfile {
  id: string;
  workspace_id: string | null;
  email: string;
  full_name: string;
  role: Role;
  avatar_url: string | null;
  phone: string | null;
}

export interface CurrentUser {
  id: string;
  email: string;
  profile: UserProfile | null;
}

/**
 * Get the current authenticated user with their profile
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    // Get user from session
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
    }

    return {
      id: user.id,
      email: user.email!,
      profile: profile as UserProfile | null,
    };
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    return null;
  }
}

/**
 * Sign out the current user
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}
