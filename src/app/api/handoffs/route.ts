import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEMO_HANDOFFS } from '@/fixtures/demo-data';

export async function GET(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // In demo mode without authentication, return demo data
    if ((userError || !user) && isDemoMode) {
      const searchParams = request.nextUrl.searchParams;
      const role = searchParams.get('role');

      let handoffs = DEMO_HANDOFFS.map((handoff, index) => ({
        id: handoff.id,
        workspace_id: 'demo-workspace',
        from_role: 'owner' as const,
        to_role: handoff.id === 'sales_handoff' ? 'sales' as const : 'production' as const,
        title: handoff.title,
        description: handoff.description,
        instruction: handoff.instruction,
        status: handoff.status,
        reply_text: handoff.replyText || null,
        created_by: 'demo-user',
        created_at: new Date(Date.now() - index * 86400000).toISOString(),
        updated_at: new Date(Date.now() - index * 86400000).toISOString(),
      }));

      // Filter by role
      if (role === 'owner') {
        handoffs = handoffs.filter(h => h.from_role === 'owner');
      } else if (role === 'sales' || role === 'production' || role === 'finance') {
        handoffs = handoffs.filter(h => h.to_role === role);
      }

      return NextResponse.json({ handoffs });
    }

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('workspace_id, role')
      .eq('id', user.id)
      .single();

    if (!userProfile?.workspace_id) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    const role = searchParams.get('role');

    let query = supabase
      .from('handoffs')
      .select('*')
      .eq('workspace_id', userProfile.workspace_id)
      .order('created_at', { ascending: false });

    if (role === 'owner') {
      query = query.eq('from_role', 'owner');
    } else if (role) {
      query = query.eq('to_role', role);
    }

    const { data: handoffs, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ handoffs });
  } catch (error) {
    console.error('Handoffs GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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
    const { from_role, to_role, title, description, instruction } = body;

    if (!from_role || !to_role || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: handoff, error } = await supabase
      .from('handoffs')
      .insert([{
        workspace_id: userProfile.workspace_id,
        from_role,
        to_role,
        title,
        description,
        instruction,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ handoff }, { status: 201 });
  } catch (error) {
    console.error('Handoffs POST error:', error);
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

    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Handoff ID required' }, { status: 400 });
    }

    const { data: handoff, error } = await supabase
      .from('handoffs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ handoff });
  } catch (error) {
    console.error('Handoffs PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
