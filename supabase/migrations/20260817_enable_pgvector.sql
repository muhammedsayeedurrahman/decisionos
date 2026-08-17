-- Enable pgvector extension for vector similarity search
CREATE EXTENSION IF NOT EXISTS vector;

-- Documents table with vector embeddings
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Document metadata
  filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  title TEXT,

  -- Document content (full text)
  content TEXT NOT NULL,

  -- Embedding (OpenAI text-embedding-3-small: 1536 dimensions)
  embedding vector(1536),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Indexes
  CONSTRAINT documents_filename_check CHECK (char_length(filename) <= 255),
  CONSTRAINT documents_content_check CHECK (char_length(content) > 0)
);

-- Document chunks table for large documents
CREATE TABLE IF NOT EXISTS public.document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

  -- Chunk data
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  token_count INTEGER NOT NULL,

  -- Embedding for this chunk
  embedding vector(1536),

  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT document_chunks_chunk_index_check CHECK (chunk_index >= 0),
  CONSTRAINT document_chunks_content_check CHECK (char_length(content) > 0),
  CONSTRAINT document_chunks_unique_chunk UNIQUE (document_id, chunk_index)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS documents_workspace_id_idx ON public.documents(workspace_id);
CREATE INDEX IF NOT EXISTS documents_uploaded_by_idx ON public.documents(uploaded_by);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON public.documents(created_at DESC);

-- Vector similarity search index (HNSW is faster than IVFFlat for most use cases)
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON public.documents
  USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS document_chunks_document_id_idx ON public.document_chunks(document_id);
CREATE INDEX IF NOT EXISTS document_chunks_workspace_id_idx ON public.document_chunks(workspace_id);

-- Vector similarity search index for chunks
CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx ON public.document_chunks
  USING hnsw (embedding vector_cosine_ops);

-- Updated_at trigger for documents
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER documents_updated_at_trigger
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION update_documents_updated_at();

-- RLS (Row Level Security) Policies
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;

-- Users can only access documents in their workspace
CREATE POLICY "Users can view documents in their workspace"
  ON public.documents
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert documents in their workspace"
  ON public.documents
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Users can update their own documents"
  ON public.documents
  FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own documents"
  ON public.documents
  FOR DELETE
  USING (uploaded_by = auth.uid());

-- Document chunks policies
CREATE POLICY "Users can view chunks in their workspace"
  ON public.document_chunks
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert chunks in their workspace"
  ON public.document_chunks
  FOR INSERT
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete chunks from their documents"
  ON public.document_chunks
  FOR DELETE
  USING (
    document_id IN (
      SELECT id FROM public.documents WHERE uploaded_by = auth.uid()
    )
  );

-- Semantic search function using cosine similarity
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  workspace_id_param UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  filename TEXT,
  title TEXT,
  content TEXT,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.filename,
    d.title,
    d.content,
    1 - (d.embedding <=> query_embedding) AS similarity,
    d.created_at
  FROM public.documents d
  WHERE d.workspace_id = workspace_id_param
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Semantic search function for chunks (more accurate for large documents)
CREATE OR REPLACE FUNCTION search_document_chunks(
  query_embedding vector(1536),
  workspace_id_param UUID,
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  filename TEXT,
  content TEXT,
  similarity FLOAT,
  chunk_index INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS chunk_id,
    c.document_id,
    d.filename,
    c.content,
    1 - (c.embedding <=> query_embedding) AS similarity,
    c.chunk_index
  FROM public.document_chunks c
  JOIN public.documents d ON c.document_id = d.id
  WHERE c.workspace_id = workspace_id_param
    AND c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Comments for documentation
COMMENT ON TABLE public.documents IS 'Stores uploaded documents with full-text content and vector embeddings for semantic search';
COMMENT ON TABLE public.document_chunks IS 'Stores chunked pieces of large documents with individual embeddings for more accurate retrieval';
COMMENT ON COLUMN public.documents.embedding IS 'Vector embedding from OpenAI text-embedding-3-small (1536 dimensions)';
COMMENT ON COLUMN public.document_chunks.embedding IS 'Vector embedding for this chunk from OpenAI text-embedding-3-small';
COMMENT ON FUNCTION search_documents IS 'Semantic search using cosine similarity on document embeddings';
COMMENT ON FUNCTION search_document_chunks IS 'Semantic search on document chunks for more granular results';
