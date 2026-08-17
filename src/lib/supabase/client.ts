import { createBrowserClient } from '@supabase/ssr';

/**
 * Check if we're running in demo mode (missing or placeholder credentials)
 */
export function isDemoMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return !url ||
         url.includes('placeholder') ||
         url === 'https://placeholder.supabase.co';
}

/**
 * Create a Supabase client for client-side operations
 * This client includes authentication state management
 *
 * In demo mode, uses placeholder credentials that won't make actual API calls
 */
export function createClient() {
  // Use placeholder values in demo mode to prevent fetch errors
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(url, anonKey);
}

/**
 * Singleton Supabase client for browser
 * Use this for client-side data fetching and mutations
 */
export const supabase = createClient();
