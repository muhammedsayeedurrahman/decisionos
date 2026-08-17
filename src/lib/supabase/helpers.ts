import { createClient } from './client';

/**
 * Get the current user's role and workspace
 */
export async function getUserRoleAndWorkspace() {
  const supabase = createClient();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('role, workspace_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    userId: user.id,
    email: user.email,
    role: profile.role as 'owner' | 'sales' | 'production' | 'finance',
    workspaceId: profile.workspace_id,
  };
}

/**
 * Get the dashboard path for a given role
 */
export function getDashboardPath(role: string): string {
  switch (role) {
    case 'owner':
      return '/demo/owner';
    case 'sales':
      return '/demo/sales';
    case 'production':
      return '/demo/production';
    case 'finance':
      return '/demo/finance';
    default:
      return '/demo/owner';
  }
}
