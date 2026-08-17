import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { uploadFile } from '@/lib/supabase/storage';
import { uploadRateLimit, checkRateLimit, createRateLimitResponse } from '@/lib/rateLimitRedis';

/**
 * POST /api/upload
 *
 * Upload file to Supabase Storage
 * Requires authentication
 *
 * Request: multipart/form-data with file and metadata
 * Response: { path: string, url: string, size: number, type: string }
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. RATE LIMITING (10 uploads per minute per user)
    const rateLimitResult = await checkRateLimit(uploadRateLimit, userId);

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

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bucket = (formData.get('bucket') as string) || 'documents';
    let folder = (formData.get('folder') as string) || '';

    // 4. SANITIZE FOLDER PATH (prevent path traversal)
    folder = folder
      .replace(/\.\./g, '')           // Remove parent directory references
      .replace(/^\/+/, '')            // Remove leading slashes
      .replace(/\/+/g, '/')           // Normalize multiple slashes
      .replace(/[^a-zA-Z0-9/_-]/g, '-') // Remove special characters
      .substring(0, 100);             // Limit length

    // Enforce workspace-scoped folders for RLS (structure: workspace_id/user_id/...)
    // This matches the storage bucket RLS policies for workspace isolation
    const finalFolder = folder
      ? `${workspaceId}/${userId}/${folder}`
      : `${workspaceId}/${userId}`;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate bucket
    const validBuckets = ['documents', 'avatars', 'voice-recordings'];
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json(
        { error: `Invalid bucket: ${bucket}. Must be one of: ${validBuckets.join(', ')}` },
        { status: 400 }
      );
    }

    console.log(`Uploading file: ${file.name} (${file.type}, ${(file.size / 1024).toFixed(2)}KB) to ${bucket}/${finalFolder}`);

    // Upload file
    const result = await uploadFile(file, {
      bucket: bucket as 'documents' | 'avatars' | 'voice-recordings',
      folder: finalFolder,
    });

    // 5. RECORD UPLOAD IN DATABASE (with correct column names)
    const { error: insertError } = await supabase.from('uploads').insert([
      {
        user_id: userId,
        workspace_id: workspaceId,  // ✅ CRITICAL: Added workspace_id
        file_path: result.path,
        file_name: file.name,       // ✅ Fixed: file_name not filename
        file_size: result.size,
        mime_type: result.type,     // ✅ Fixed: mime_type not file_type
        bucket,
      },
    ]);

    if (insertError) {
      console.error('Failed to record upload in database:', insertError);
      // Don't fail the request if database recording fails (file is already uploaded)
    }

    console.log(`Upload successful: ${result.path}`);

    return NextResponse.json(result, {
      headers: rateLimitResult.headers,
    });
  } catch (error) {
    // Log detailed error server-side only
    if (process.env.NODE_ENV === 'development') {
      console.error('Upload error:', error);
    } else {
      console.error('Upload failed');
    }

    // Sanitized error message for production
    const userMessage = process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'File upload failed';

    return NextResponse.json(
      { error: 'Upload failed', message: userMessage },
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
