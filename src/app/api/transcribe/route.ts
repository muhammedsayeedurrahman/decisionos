import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { checkRateLimit } from '@/lib/security/rateLimit';

// Lazy initialization to avoid build-time errors when API key not set
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
export const maxDuration = 30; // Whisper can take time for long audio

/**
 * POST /api/transcribe
 *
 * Transcribes audio using OpenAI Whisper API
 *
 * Request body (multipart/form-data):
 * - file: Audio file (mp3, mp4, mpeg, mpga, m4a, wav, webm)
 * - language?: Language code (en, es, fr, de, hi, etc.) or 'auto' for auto-detect
 *
 * Response:
 * - text: Transcribed text
 * - language: Detected/specified language
 * - duration: Audio duration in seconds
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (10 transcriptions per minute)
    const rateLimitResult = await checkRateLimit(request, {
      maxRequests: 10,
      windowMs: 60000,
    });

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: rateLimitResult.headers,
        }
      );
    }

    // Validate environment
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return NextResponse.json(
        { error: 'Transcription service not configured' },
        { status: 500 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const language = (formData.get('language') as string) || 'auto';

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 25MB for Whisper API)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'Audio file too large. Maximum size is 25MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/mp4',
      'audio/wav',
      'audio/webm',
      'audio/m4a',
      'audio/mpga',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported audio format: ${file.type}. Supported formats: mp3, mp4, wav, webm, m4a`,
        },
        { status: 400 }
      );
    }

    // Convert File to format Whisper expects
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create a File-like object for OpenAI
    const audioFile = new File([buffer], file.name, { type: file.type });

    console.log(`Transcribing audio: ${file.name} (${file.size} bytes, language: ${language})`);

    // Call Whisper API
    const openai = getOpenAI();
    const startTime = Date.now();
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      language: language === 'auto' ? undefined : language, // Auto-detect if 'auto'
      response_format: 'verbose_json', // Get detailed response with language detection
    });

    const duration = (Date.now() - startTime) / 1000;

    console.log(`Transcription completed in ${duration}s: "${transcription.text.substring(0, 50)}..."`);

    // Return transcription result
    return NextResponse.json(
      {
        text: transcription.text,
        language: transcription.language || language,
        duration: transcription.duration,
        processingTime: duration,
      },
      {
        status: 200,
        headers: rateLimitResult.headers,
      }
    );
  } catch (error: any) {
    console.error('Transcription error:', error);

    // Handle OpenAI API errors
    if (error.status === 401) {
      return NextResponse.json(
        { error: 'Invalid API key configuration' },
        { status: 500 }
      );
    }

    if (error.status === 429) {
      return NextResponse.json(
        { error: 'OpenAI API rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      {
        error: 'Transcription failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
