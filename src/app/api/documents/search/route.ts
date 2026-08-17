import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { createClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/security/rateLimit';

function getOpenAIClient() {
  return new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-demo-key",
  });
}

export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/documents/search
 *
 * Semantic search over documents using RAG (Retrieval-Augmented Generation)
 *
 * Request body (JSON):
 * - query: Search query or question
 * - mode: 'search' (semantic search) or 'qa' (Q&A with RAG)
 * - limit?: Number of results to return (default: 5)
 *
 * Response (mode=search):
 * - results: Array of matching documents/chunks with similarity scores
 *
 * Response (mode=qa):
 * - answer: AI-generated answer based on retrieved documents
 * - sources: Documents used to generate answer
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting (20 searches per minute)
    const rateLimitResult = await checkRateLimit(request, {
      maxRequests: 20,
      windowMs: 60000,
      });
}

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
        { error: 'Search service not configured' },
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401   });
}
    }

    // Get user's workspace
    const { data: profile } = await supabase
      .from('profiles')
      .select('workspace_id')
      .eq('id', user.id)
      .single();

    if (!profile?.workspace_id) {
      return NextResponse.json({ error: 'No workspace found' }, { status: 400   });
}
    }

    // Parse request body
    const body = await request.json();
    const query = body.query as string;
    const mode = (body.mode as 'search' | 'qa') || 'search';
    const limit = (body.limit as number) || 5;

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400   });
}
    }

    console.log(`Document ${mode}: "${query}" (workspace: ${profile.workspace_id})`);

    // Generate embedding for query
    const queryEmbedding = await generateEmbedding(query);

    // Search document chunks for better granularity
    const { data: chunks, error: searchError } = await supabase.rpc(
      'search_document_chunks',
      {
        query_embedding: queryEmbedding,
        workspace_id_param: profile.workspace_id,
        match_threshold: 0.7,
        match_count: limit * 2, // Get more chunks, dedupe by document later
      }
    );

    if (searchError) {
      console.error('Search error:', searchError);
      return NextResponse.json(
        { error: 'Search failed', details: searchError.message },
        { status: 500 }
      );
    }

    if (!chunks || chunks.length === 0) {
      return NextResponse.json(
        {
          results: [],
          message: 'No matching documents found. Try uploading relevant documents first.',
        },
        { status: 200, headers: rateLimitResult.headers }
      );
    }

    console.log(`Found ${chunks.length} matching chunks`);

    // Deduplicate by document and take top chunks
    const topChunks = deduplicateChunks(chunks, limit);

    if (mode === 'search') {
      // Return search results
      return NextResponse.json(
        {
          results: topChunks.map((chunk: any) => ({
            document_id: chunk.document_id,
            filename: chunk.filename,
            content: chunk.content,
            similarity: chunk.similarity,
            chunk_index: chunk.chunk_index,
          })),
        },
        {
          status: 200,
          headers: rateLimitResult.headers,
        }
      );
    }

    if (mode === 'qa') {
      // Generate answer using RAG
      const context = topChunks
        .map(
          (chunk: any) =>
            `[From ${chunk.filename}, chunk ${chunk.chunk_index}]:\n${chunk.content}`
        )
        .join('\n\n---\n\n');

      console.log('Generating answer with GPT-4...');

      const completion = await getOpenAIClient().chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are a helpful assistant that answers questions based on the provided document excerpts.
- Always cite which document your information comes from.
- If the answer is not in the documents, say so clearly.
- Be concise and factual.
- Use bullet points when appropriate.`,
          },
          {
            role: 'user',
            content: `Context from documents:\n\n${context}\n\n---\n\nQuestion: ${query}`,
          },
        ],
        temperature: 0.3, // Lower temperature for more factual responses
        max_tokens: 500,
        });
}

      const answer = completion.choices[0].message.content || 'No answer generated.';

      console.log('Answer generated successfully');

      return NextResponse.json(
        {
          answer,
          sources: topChunks.map((chunk: any) => ({
            filename: chunk.filename,
            similarity: chunk.similarity,
            excerpt: chunk.content.slice(0, 200) + '...',
          })),
        },
        {
          status: 200,
          headers: rateLimitResult.headers,
        }
      );
    }

    return NextResponse.json({ error: 'Invalid mode' }, { status: 400   });
}
  } catch (error: any) {
    console.error('Document search error:', error);

    return NextResponse.json(
      {
        error: 'Search failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
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
}

  return response.data[0].embedding;
}

/**
 * Deduplicate chunks by document, keeping highest similarity per document
 */
function deduplicateChunks(chunks: any[], limit: number): any[] {
  const documentMap = new Map<string, any>();

  for (const chunk of chunks) {
    const existing = documentMap.get(chunk.document_id);
    if (!existing || chunk.similarity > existing.similarity) {
      documentMap.set(chunk.document_id, chunk);
    }
  }

  return Array.from(documentMap.values())
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, limit);
}
