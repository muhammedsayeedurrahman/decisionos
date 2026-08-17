import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit, createRateLimitResponse } from '@/lib/rateLimitRedis';
import { Ratelimit } from '@upstash/ratelimit';
import { redis } from '@/lib/redis';

// Initialize OpenAI client (lazy initialization to avoid errors in demo mode)
let openai: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  return openai;
}

// Rate limit: 10 task breakdowns per hour per user
const taskBreakdownRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 h'),
  prefix: 'ratelimit:task-breakdown',
  analytics: true,
});

export interface SubTask {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAssignee?: 'owner' | 'sales' | 'production' | 'finance';
}

export interface TaskBreakdownResponse {
  subtasks: SubTask[];
  duplicates: string[]; // Task IDs of similar existing tasks
  checklist: string[];
  reasoning: string; // AI's explanation of the breakdown
}

/**
 * POST /api/task-breakdown
 *
 * Break down a large task into actionable subtasks using GPT-4
 * Requires authentication
 *
 * Request: { task: string, context?: string, workspaceId: string }
 * Response: TaskBreakdownResponse
 */
export async function POST(request: NextRequest) {
  try {
    // 1. AUTHENTICATION CHECK
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json(
        { error: 'Authentication service not configured' },
        { status: 503 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to use task breakdown.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. RATE LIMITING
    const rateLimitResult = await checkRateLimit(taskBreakdownRateLimit, userId);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset),
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // 3. PARSE REQUEST BODY
    const body = await request.json();
    const { task, context, workspaceId } = body;

    if (!task || typeof task !== 'string') {
      return NextResponse.json(
        { error: 'Task description is required' },
        { status: 400 }
      );
    }

    if (task.length < 10) {
      return NextResponse.json(
        { error: 'Task description too short. Please provide more details.' },
        { status: 400 }
      );
    }

    if (task.length > 1000) {
      return NextResponse.json(
        { error: 'Task description too long. Maximum 1000 characters.' },
        { status: 400 }
      );
    }

    // 4. CHECK API KEY
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI service not configured' },
        { status: 500 }
      );
    }

    // 5. GET EXISTING TASKS FOR DUPLICATE DETECTION
    let existingTasks: any[] = [];
    if (workspaceId) {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, description')
        .eq('workspace_id', workspaceId)
        .eq('done', false)
        .limit(50);

      if (!error && data) {
        existingTasks = data;
      }
    }

    // 6. CALL GPT-4 FOR TASK BREAKDOWN
    const startTime = Date.now();

    const systemPrompt = `You are an AI task breakdown assistant for DecisionOS, a task management system for SME textile manufacturing businesses.

The business has 4 roles:
- Owner: Overall business management and strategy
- Sales: Customer relationships, orders, invoicing
- Production: Manufacturing, suppliers, inventory
- Finance: Payments, expenses, cash flow

Your job is to analyze a task and break it down into 3-7 actionable subtasks.

For each subtask, provide:
1. Title (clear, actionable, starts with a verb)
2. Description (2-3 sentences of context)
3. Estimated hours (realistic estimate: 0.5, 1, 2, 4, 8, 16)
4. Priority (HIGH for urgent/blocking, MEDIUM for important, LOW for nice-to-have)
5. Suggested assignee role (owner, sales, production, finance) if applicable

Also provide:
- A checklist of 3-5 acceptance criteria
- Reasoning for your breakdown approach

Respond ONLY with valid JSON in this format:
{
  "subtasks": [
    {
      "title": "string",
      "description": "string",
      "estimatedHours": number,
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "suggestedAssignee": "owner" | "sales" | "production" | "finance" | null
    }
  ],
  "checklist": ["string"],
  "reasoning": "string"
}`;

    const userPrompt = `Task to break down: "${task}"${context ? `\n\nAdditional context: ${context}` : ''}`;

    const completion = await getOpenAIClient().chat.completions.create({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    });

    const duration = Date.now() - startTime;
    console.log(`Task breakdown completed in ${duration}ms`);

    const aiResponse = completion.choices[0].message.content;
    if (!aiResponse) {
      throw new Error('No response from AI');
    }

    const breakdown = JSON.parse(aiResponse);

    // 7. DETECT DUPLICATES USING SIMPLE TEXT SIMILARITY
    const duplicates: string[] = [];
    const taskLower = task.toLowerCase();

    for (const existingTask of existingTasks) {
      const existingTitle = existingTask.title.toLowerCase();
      const existingDesc = (existingTask.description || '').toLowerCase();

      // Simple similarity check
      if (
        existingTitle.includes(taskLower) ||
        taskLower.includes(existingTitle) ||
        (existingDesc && (existingDesc.includes(taskLower) || taskLower.includes(existingDesc)))
      ) {
        duplicates.push(existingTask.id);
      }
    }

    // 8. RETURN BREAKDOWN
    const response: TaskBreakdownResponse = {
      subtasks: breakdown.subtasks || [],
      duplicates,
      checklist: breakdown.checklist || [],
      reasoning: breakdown.reasoning || '',
    };

    return NextResponse.json(response, {
      headers: rateLimitResult.headers,
    });

  } catch (error) {
    console.error('Task breakdown error:', error);

    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'AI service error', message: error.message },
        { status: error.status || 500 }
      );
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid AI response format' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to break down task' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
