import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const origin = requestUrl.origin;

  if (code) {
    const supabase = await createClient();
    const { data: sessionData } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionData?.user) {
      // Get user profile to determine their role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', sessionData.user.id)
        .single();

      // Redirect to role-specific dashboard
      const role = profile?.role || 'owner';
      return NextResponse.redirect(`${origin}/demo/${role}`);
    }
  }

  // If no code or authentication failed, redirect to login
  return NextResponse.redirect(`${origin}/login`);
}
