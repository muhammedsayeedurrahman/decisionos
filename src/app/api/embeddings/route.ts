import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';

// Initialize OpenAI client (lazy initialization)
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
 * POST /api/embeddings
 * Generate embeddings for a document and store them
 */
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { upload_id, content } = body;

    if (!upload_id || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Split content into chunks (max 8000 characters per chunk)
    const chunkSize = 8000;
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += chunkSize) {
      chunks.push(content.slice(i, i + chunkSize));
    }

    // Generate embeddings for each chunk
    const embeddingPromises = chunks.map(async (chunk, index) => {
      const response = await getOpenAIClient().embeddings.create({
        model: 'text-embedding-ada-002',
        input: chunk,
      });

      const embedding = response.data[0].embedding;

      // Store embedding in database
      return supabase.from('document_embeddings').insert([{
        workspace_id: userProfile.workspace_id,
        upload_id,
        content: chunk,
        embedding,
        chunk_index: index,
      }]);
    });

    await Promise.all(embeddingPromises);

    return NextResponse.json({
      success: true,
      chunks: chunks.length,
      message: `Generated embeddings for ${chunks.length} chunks`
    });
  } catch (error) {
    console.error('Embeddings POST error:', error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'OpenAI API error', message: error.message },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/embeddings/search
 * Semantic search across documents
 */
export async function GET(request: NextRequest) {
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

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limit = parseInt(searchParams.get('limit') || '5');

    if (!query) {
      return NextResponse.json({ error: 'Query required' }, { status: 400 });
    }

    // Generate embedding for search query
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-ada-002',
      input: query,
    });

    const queryEmbedding = response.data[0].embedding;

    // Perform vector similarity search
    const { data: results, error } = await supabase.rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_threshold: 0.7,
      match_count: limit,
      p_workspace_id: userProfile.workspace_id,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Embeddings search error:', error);
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: 'OpenAI API error', message: error.message },
        { status: error.status || 500 }
      );
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
