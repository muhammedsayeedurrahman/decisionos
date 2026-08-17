import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';
import { transcribeRateLimit, checkRateLimit, createRateLimitResponse } from '@/lib/rateLimitRedis';

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

/**
 * POST /api/transcribe
 *
 * Transcribe audio file using OpenAI Whisper API
 * Requires authentication
 *
 * Request: multipart/form-data with audio file
 * Response: { text: string, language?: string, duration?: number }
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
        { error: 'Unauthorized. Please sign in to use voice transcription.' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. RATE LIMITING (5 transcriptions per minute per user)
    const rateLimitResult = await checkRateLimit(transcribeRateLimit, userId);

    if (!rateLimitResult.success) {
      return NextResponse.json(
        createRateLimitResponse(rateLimitResult.remaining, rateLimitResult.reset),
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // 3. GET USER'S WORKSPACE
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('workspace_id')
      .eq('id', userId)
      .single();

    if (userError || !userData?.workspace_id) {
      return NextResponse.json(
        { error: 'User workspace not found' },
        { status: 403 }
      );
    }

    const workspaceId = userData.workspace_id;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const language = formData.get('language') as string | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validTypes = [
      'audio/wav',
      'audio/mpeg',
      'audio/mp4',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
    ];

    if (!validTypes.includes(audioFile.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${audioFile.type}. Supported: WAV, MP3, MP4, WebM, OGG, FLAC` },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper API)
    const maxSize = 25 * 1024 * 1024; // 25MB
    if (audioFile.size > maxSize) {
      return NextResponse.json(
        { error: `File too large: ${(audioFile.size / 1024 / 1024).toFixed(2)}MB. Max: 25MB` },
        { status: 400 }
      );
    }

    console.log(`Transcribing audio file: ${audioFile.name} (${audioFile.type}, ${(audioFile.size / 1024).toFixed(2)}KB)`);

    // Convert File to format expected by OpenAI API
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI
    const file = new File([buffer], audioFile.name, { type: audioFile.type });

    // Call Whisper API
    const startTime = Date.now();
    const transcription = await getOpenAIClient().audio.transcriptions.create({
      file: file,
      model: 'whisper-1',
      // Use provided language or auto-detect
      ...(language && language !== 'auto' && { language }),
      response_format: 'verbose_json', // Get additional metadata
    });

    const duration = Date.now() - startTime;

    console.log(`Transcription completed in ${duration}ms`);

    // 4. RECORD TRANSCRIPTION IN DATABASE
    try {
      await supabase.from('voice_recordings').insert({
        user_id: userId,
        workspace_id: workspaceId,
        transcript: transcription.text,
        duration_seconds: transcription.duration || 0,
        language: transcription.language,
      });
    } catch (dbError) {
      console.error('Failed to record transcription in database:', dbError);
      // Don't fail the request if database recording fails
    }

    // Return transcription result with rate limit headers
    return NextResponse.json(
      {
        text: transcription.text,
        language: transcription.language,
        duration: transcription.duration,
        processingTime: duration,
      },
      {
        headers: rateLimitResult.headers,
      }
    );

  } catch (error) {
    // Log detailed error server-side only
    if (process.env.NODE_ENV === 'development') {
      console.error('Transcription error:', error);
    } else {
      console.error('Transcription failed');
    }

    if (error instanceof OpenAI.APIError) {
      // Sanitize error message for production
      const userMessage = process.env.NODE_ENV === 'development'
        ? error.message
        : 'Transcription service temporarily unavailable';

      return NextResponse.json(
        { error: 'Transcription failed', message: userMessage },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
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
