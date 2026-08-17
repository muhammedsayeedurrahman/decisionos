import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

function getOpenAIClient() {
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || 'sk-demo-key',
  });
}

export const runtime = 'nodejs';
export const maxDuration = 60; // Document processing can take time

const CHUNK_SIZE = 1000; // Characters per chunk (roughly 250 tokens)
const CHUNK_OVERLAP = 200; // Overlap between chunks for context

/**
 * POST /api/documents/upload
 *
 * Uploads a document, extracts text, generates embeddings, and stores in Supabase
 *
 * Request body (multipart/form-data):
 * - file: Document file (txt, md, pdf)
 * - title?: Optional custom title (defaults to filename)
 *
 * Response:
 * - document: Created document with ID
 * - chunks: Number of chunks created
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (5 uploads per minute)
    const rateLimitResult = await checkRateLimit(request, {
      maxRequests: 5,
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
        { error: 'Document processing service not configured' },
        { status: 500 }
      );
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = (formData.get('title') as string) || null;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['text/plain', 'text/markdown', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error: `Unsupported file type: ${file.type}. Supported: txt, md, pdf`,
        },
        { status: 400 }
      );
    }

    console.log(`Processing document: ${file.name} (${file.size} bytes)`);

    // Extract text from file
    const text = await extractText(file);

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Could not extract text from document' },
        { status: 400 }
      );
    }

    console.log(`Extracted ${text.length} characters from ${file.name}`);

    // Generate embedding for full document
    console.log('Generating document embedding...');
    const documentEmbedding = await generateEmbedding(text.slice(0, 8000)); // Limit to ~2000 tokens

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        workspace_id: profile.workspace_id,
        uploaded_by: user.id,
        filename: file.name,
        file_size: file.size,
        file_type: file.type,
        title: title || file.name,
        content: text,
        embedding: documentEmbedding,
      })
      .select()
      .single();

    if (docError || !document) {
      console.error('Failed to create document:', docError);
      return NextResponse.json(
        { error: 'Failed to store document' },
        { status: 500 }
      );
    }

    // Chunk document if it's large (> 1000 characters)
    let chunksCreated = 0;
    if (text.length > CHUNK_SIZE) {
      console.log('Document is large, creating chunks...');
      const chunks = chunkText(text, CHUNK_SIZE, CHUNK_OVERLAP);
      chunksCreated = chunks.length;

      console.log(`Created ${chunksCreated} chunks, generating embeddings...`);

      // Generate embeddings for all chunks (batch request)
      const chunkEmbeddings = await Promise.all(
        chunks.map((chunk) => generateEmbedding(chunk.content))
      );

      // Insert chunks with embeddings
      const chunkRecords = chunks.map((chunk, index) => ({
        document_id: document.id,
        workspace_id: profile.workspace_id,
        chunk_index: chunk.index,
        content: chunk.content,
        token_count: Math.ceil(chunk.content.length / 4), // Rough estimate
        embedding: chunkEmbeddings[index],
      }));

      const { error: chunksError } = await supabase
        .from('document_chunks')
        .insert(chunkRecords);

      if (chunksError) {
        console.error('Failed to create chunks:', chunksError);
        // Don't fail the request - document is still usable
      }
    }

    console.log(`Document ${document.id} processed successfully (${chunksCreated} chunks)`);

    return NextResponse.json(
      {
        document: {
          id: document.id,
          filename: document.filename,
          title: document.title,
          file_size: document.file_size,
          created_at: document.created_at,
        },
        chunks: chunksCreated,
      },
      {
        status: 200,
        headers: rateLimitResult.headers,
      }
    );
  } catch (error: any) {
    console.error('Document upload error:', error);

    return NextResponse.json(
      {
        error: 'Document upload failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * Extract text from file based on type
 */
async function extractText(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const text = new TextDecoder().decode(buffer);

  // For now, only handle plain text and markdown
  // PDF extraction would require pdf-parse or similar library
  if (file.type === 'text/plain' || file.type === 'text/markdown') {
    return text;
  }

  if (file.type === 'application/pdf') {
    // TODO: Add PDF text extraction with pdf-parse
    // For now, return error
    throw new Error('PDF support coming soon. Please convert to TXT or MD.');
  }

  return text;
}

/**
 * Chunk text into smaller pieces with overlap
 */
function chunkText(
  text: string,
  chunkSize: number,
  overlap: number
): Array<{ index: number; content: string }> {
  const chunks: Array<{ index: number; content: string }> = [];
  let start = 0;
  let index = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end);

    chunks.push({ index, content: chunk });

    // Move to next chunk with overlap
    start = start + chunkSize - overlap;
    index++;
  }

  return chunks;
}

/**
 * Generate embedding using OpenAI text-embedding-3-small
 */
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
    encoding_format: 'float',
  });

  return response.data[0].embedding;
}
