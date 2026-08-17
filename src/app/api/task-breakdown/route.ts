import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/security/rateLimit';
import type { Role } from '@/types/database.types';

// Lazy initialization to avoid build-time errors
let openaiClient: OpenAI | null = null;
function getOpenAI() {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'sk-demo',
    });
  }
  return openaiClient;
}

export const runtime = 'nodejs';
export const maxDuration = 30;

export interface SubtaskSuggestion {
  title: string;
  description: string;
  estimatedHours: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestedAssignee?: Role;
  category?: string;
}

export interface TaskBreakdownResponse {
  subtasks: SubtaskSuggestion[];
  checklist: string[];
  totalEstimatedHours: number;
}

/**
 * POST /api/task-breakdown
 *
 * Uses GPT-4 to break down a large task into actionable subtasks
 */
export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await checkRateLimit(request, {
      maxRequests: 5,
      windowMs: 60000,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429, headers: rateLimitResult.headers }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'AI service not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { task } = body;

    if (!task || task.length < 10 || task.length > 500) {
      return NextResponse.json({ error: 'Invalid task description' }, { status: 400 });
    }

    const systemPrompt = 'Break down tasks for Sharma Textiles with roles: Owner, Sales, Production, Finance. Return JSON.';

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: task },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    
    return NextResponse.json({
      subtasks: parsed.subtasks || [],
      checklist: parsed.checklist || [],
      totalEstimatedHours: 0,
    }, { headers: rateLimitResult.headers });
  } catch (error: any) {
    return NextResponse.json({ error: 'Task breakdown failed' }, { status: 500 });
  }
}
