/**
 * Seed script to populate Supabase with demo data
 * Run this after setting up your Supabase project
 *
 * Usage:
 *   npm run seed-demo
 */

import { createClient } from '@supabase/supabase-js';
import { DEMO_CARDS, DEMO_HANDOFFS } from '../src/fixtures/demo-data';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedDemoData() {
  console.log('🌱 Seeding demo data to Supabase...\n');

  const DEMO_WORKSPACE_ID = '00000000-0000-0000-0000-000000000001';

  try {
    // 1. Verify workspace exists
    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .select('id')
      .eq('id', DEMO_WORKSPACE_ID)
      .single();

    if (workspaceError || !workspace) {
      console.log('📦 Creating demo workspace...');
      const { error: createError } = await supabase
        .from('workspaces')
        .insert({
          id: DEMO_WORKSPACE_ID,
          name: 'Sharma Textiles Pvt Ltd',
          industry: 'Textile Manufacturing',
        });

      if (createError) throw createError;
      console.log('✅ Demo workspace created\n');
    } else {
      console.log('✅ Demo workspace already exists\n');
    }

    // 2. Clear existing demo tasks
    console.log('🗑️  Clearing existing demo tasks...');
    const { error: deleteTasksError } = await supabase
      .from('tasks')
      .delete()
      .eq('workspace_id', DEMO_WORKSPACE_ID);

    if (deleteTasksError) throw deleteTasksError;
    console.log('✅ Existing tasks cleared\n');

    // 3. Seed demo tasks
    console.log(`📝 Inserting ${DEMO_CARDS.length} demo tasks...`);
    const tasksToInsert = DEMO_CARDS.map((card) => ({
      workspace_id: DEMO_WORKSPACE_ID,
      title: card.title,
      subtext: card.subtext,
      type: card.type,
      source: card.source,
      category: card.category,
      assigned_to: card.assignedTo,
      done: card.done || false,
      details_count: card.detailsCount || 0,
      scheduled_date: card.scheduledDate || null,
      reminder_time: card.scheduledTime || null,
    }));

    const { error: tasksError } = await supabase
      .from('tasks')
      .insert(tasksToInsert);

    if (tasksError) throw tasksError;
    console.log('✅ Demo tasks inserted\n');

    // 4. Clear existing demo handoffs
    console.log('🗑️  Clearing existing demo handoffs...');
    const { error: deleteHandoffsError } = await supabase
      .from('handoffs')
      .delete()
      .eq('workspace_id', DEMO_WORKSPACE_ID);

    if (deleteHandoffsError) throw deleteHandoffsError;
    console.log('✅ Existing handoffs cleared\n');

    // 5. Seed demo handoffs
    console.log(`🤝 Inserting ${DEMO_HANDOFFS.length} demo handoffs...`);
    const handoffsToInsert = DEMO_HANDOFFS.map((handoff) => ({
      workspace_id: DEMO_WORKSPACE_ID,
      from_role: 'owner' as const,
      to_role: handoff.id === 'sales_handoff' ? ('sales' as const) : ('production' as const),
      title: handoff.title,
      description: handoff.description,
      instruction: handoff.instruction,
      message: handoff.description,
      status: handoff.status,
      reply_text: handoff.replyText || null,
    }));

    const { error: handoffsError } = await supabase
      .from('handoffs')
      .insert(handoffsToInsert);

    if (handoffsError) throw handoffsError;
    console.log('✅ Demo handoffs inserted\n');

    console.log('🎉 Demo data seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Workspace: Sharma Textiles Pvt Ltd`);
    console.log(`   - Tasks: ${DEMO_CARDS.length}`);
    console.log(`   - Handoffs: ${DEMO_HANDOFFS.length}`);
    console.log('\n💡 Next steps:');
    console.log('   1. Sign up at http://localhost:3000/signup');
    console.log('   2. Choose a role (owner, sales, production, finance)');
    console.log('   3. View your demo tasks in the dashboard');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

seedDemoData();
