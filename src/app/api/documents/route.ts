import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/**
 * GET /api/documents
 *
 * Lists all documents in the user's workspace
 *
 * Response:
 * - documents: Array of documents with metadata (no embeddings)
 */
export async function GET(request: NextRequest) {
  try {
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

    // Fetch documents (exclude embeddings and full content)
    const { data: documents, error: docsError } = await supabase
      .from('documents')
      .select('id, filename, title, file_size, file_type, uploaded_by, created_at')
      .eq('workspace_id', profile.workspace_id)
      .order('created_at', { ascending: false });

    if (docsError) {
      console.error('Failed to fetch documents:', docsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents || [] });
  } catch (error: any) {
    console.error('Documents list error:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/documents?id=<document_id>
 *
 * Deletes a document and all its chunks
 *
 * Query params:
 * - id: Document ID to delete
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get document ID from query params
    const url = new URL(request.url);
    const documentId = url.searchParams.get('id');

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    // Verify user owns this document
    const { data: document } = await supabase
      .from('documents')
      .select('uploaded_by')
      .eq('id', documentId)
      .single();

    if (!document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (document.uploaded_by !== user.id) {
      return NextResponse.json(
        { error: 'You can only delete your own documents' },
        { status: 403 }
      );
    }

    // Delete document (chunks will be deleted automatically via ON DELETE CASCADE)
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (deleteError) {
      console.error('Failed to delete document:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Document delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
