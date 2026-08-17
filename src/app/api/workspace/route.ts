import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // In demo mode without authentication, return demo workspace data
    if ((userError || !user) && isDemoMode) {
      return NextResponse.json({
        workspace: {
          id: 'demo-workspace',
          name: 'Sharma Textiles Pvt Ltd',
          industry: 'Textile Manufacturing',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        user: {
          id: 'demo-user',
          email: 'demo@sharmatextiles.com',
          role: 'owner',
          full_name: 'Rajesh Sharma',
        }
      });
    }

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('workspace_id, role, full_name')
      .eq('id', user.id)
      .single();

    if (!userProfile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', userProfile.workspace_id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      workspace,
      user: {
        id: user.id,
        email: user.email,
        role: userProfile.role,
        full_name: userProfile.full_name,
      }
    });
  } catch (error) {
    console.error('Workspace GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'Workspace name required' }, { status: 400 });
    }

    const { data: workspace, error } = await supabase
      .from('workspaces')
      .update({ name })
      .eq('id', userProfile.workspace_id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ workspace });
  } catch (error) {
    console.error('Workspace PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
