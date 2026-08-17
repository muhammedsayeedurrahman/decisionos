import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEMO_CARDS } from '@/fixtures/demo-data';

export async function GET(request: NextRequest) {
  try {
    const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
    const supabase = await createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    // In demo mode without authentication, return demo data
    if ((userError || !user) && isDemoMode) {
      const searchParams = request.nextUrl.searchParams;
      const role = searchParams.get('role');
      const done = searchParams.get('done');

      let filteredTasks = DEMO_CARDS.map((card, index) => ({
        id: card.id,
        workspace_id: 'demo-workspace',
        title: card.title,
        subtext: card.subtext || null,
        type: card.type,
        source: card.source,
        category: card.category,
        assigned_to: card.assignedTo,
        done: card.done || false,
        scheduled_date: null,
        reminder_time: null,
        created_by: 'demo-user',
        created_at: new Date(Date.now() - index * 86400000).toISOString(),
        updated_at: new Date(Date.now() - index * 86400000).toISOString(),
      }));

      if (role && role !== 'owner') {
        filteredTasks = filteredTasks.filter(t => t.assigned_to === role);
      }

      if (done !== null) {
        filteredTasks = filteredTasks.filter(t => t.done === (done === 'true'));
      }

      return NextResponse.json({ tasks: filteredTasks });
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
    const done = searchParams.get('done');

    let query = supabase
      .from('tasks')
      .select('*')
      .eq('workspace_id', userProfile.workspace_id)
      .order('created_at', { ascending: false });

    if (role && role !== 'owner') {
      query = query.eq('assigned_to', role);
    }

    if (done !== null) {
      query = query.eq('done', done === 'true');
    }

    const { data: tasks, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error('Tasks GET error:', error);
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
    const { title, subtext, type, source, category, assigned_to, scheduled_date, scheduled_time } = body;

    if (!title || !type || !source || !category || !assigned_to) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .insert([{
        workspace_id: userProfile.workspace_id,
        title,
        subtext,
        type,
        source,
        category,
        assigned_to,
        scheduled_date,
        scheduled_time,
        created_by: user.id,
      }])
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    console.error('Tasks POST error:', error);
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
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ task });
  } catch (error) {
    console.error('Tasks PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Task ID required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tasks DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
