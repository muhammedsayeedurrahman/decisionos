'use client';

import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Search, MessageSquare, X } from 'lucide-react';

interface Document {
  id: string;
  filename: string;
  title: string | null;
  file_size: number;
  file_type: string;
  created_at: string;
}

interface SearchResult {
  document_id: string;
  filename: string;
  content: string;
  similarity: number;
  chunk_index: number;
}

interface QASource {
  filename: string;
  similarity: number;
  excerpt: string;
}

export default function BrainSearch() {
  const [mode, setMode] = useState<'search' | 'qa'>('qa');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [qaAnswer, setQAAnswer] = useState<string | null>(null);
  const [qaSources, setQASources] = useState<QASource[]>([]);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch('/api/documents');
      if (res.ok) {
        const data = await res.json();
        setDocuments(data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await res.json();
      setUploadProgress(`✓ Uploaded! Created ${data.chunks} chunks.`);

      // Refresh document list
      await fetchDocuments();

      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 2000);
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadProgress(`✗ Error: ${error.message}`);
      setTimeout(() => {
        setUploadProgress('');
        setUploading(false);
      }, 3000);
    }

    // Reset input
    e.target.value = '';
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document?')) return;

    try {
      const res = await fetch(`/api/documents?id=${docId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setSearchResults([]);
    setQAAnswer(null);
    setQASources([]);

    try {
      const res = await fetch('/api/documents/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode, limit: 5 }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Search failed');
      }

      const data = await res.json();

      if (mode === 'search') {
        setSearchResults(data.results || []);
      } else {
        setQAAnswer(data.answer || 'No answer generated.');
        setQASources(data.sources || []);
      }
    } catch (error: any) {
      console.error('Search error:', error);
      if (mode === 'qa') {
        setQAAnswer(`Error: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full space-y-6 animate-fade-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-logo text-2xl font-black uppercase text-zinc-900 dark:text-white">
          Brain Search
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode('qa')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded transition-colors ${
              mode === 'qa'
                ? 'bg-brand-red text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <MessageSquare size={14} className="inline mr-1.5" />
            Q&A
          </button>
          <button
            onClick={() => setMode('search')}
            className={`px-3 py-1.5 text-xs font-semibold uppercase rounded transition-colors ${
              mode === 'search'
                ? 'bg-brand-red text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            <Search size={14} className="inline mr-1.5" />
            Search
          </button>
        </div>
      </div>

      {/* Upload Section */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-zinc-900 dark:text-white">
            Your Documents ({documents.length})
          </h3>
          <label className="flex items-center gap-2 px-3 py-1.5 bg-brand-red text-white text-xs font-semibold uppercase rounded cursor-pointer hover:bg-red-600 transition-colors">
            <Upload size={14} />
            Upload
            <input
              type="file"
              accept=".txt,.md,.pdf"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        {uploadProgress && (
          <div className={`text-xs font-mono mb-3 ${uploadProgress.startsWith('✗') ? 'text-red-600' : uploadProgress.startsWith('✓') ? 'text-emerald-600' : 'text-zinc-500'}`}>
            {uploadProgress}
          </div>
        )}

        {documents.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-sm">
            <FileText size={32} className="mx-auto mb-2 opacity-50" />
            <p>No documents yet. Upload a TXT, MD, or PDF file to get started.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-2 rounded bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FileText size={16} className="text-zinc-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-zinc-900 dark:text-white truncate">
                      {doc.title || doc.filename}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatFileSize(doc.file_size)} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteDocument(doc.id)}
                  className="p-1.5 text-zinc-400 hover:text-red-600 transition-colors shrink-0"
                  title="Delete document"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Interface */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 space-y-4">
        <h3 className="font-logo text-lg font-black uppercase dark:text-white">
          {mode === 'qa' ? 'Ask a Question' : 'Semantic Search'}
        </h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {mode === 'qa'
            ? 'Ask questions about your uploaded documents. AI will find relevant information and answer based on the content.'
            : 'Search your documents semantically. Find information even if you don\'t use exact keywords.'}
        </p>

        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            placeholder={
              mode === 'qa'
                ? 'e.g., What are the key points in the proposal?'
                : 'e.g., customer requirements, pricing strategy'
            }
            disabled={documents.length === 0}
            className="flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 rounded disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={handleSearch}
            disabled={!query.trim() || loading || documents.length === 0}
            className="border border-zinc-950 dark:border-zinc-700 bg-brand-ink dark:bg-zinc-800 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-zinc-800 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Searching...' : mode === 'qa' ? 'Ask' : 'Search'}
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded text-xs font-mono text-zinc-400 animate-pulse">
            &gt; {mode === 'qa' ? 'AI is thinking...' : 'Searching documents...'}
          </div>
        )}

        {/* Q&A Answer */}
        {mode === 'qa' && qaAnswer && (
          <div className="space-y-3">
            <div className="p-4 bg-zinc-950 text-emerald-400 font-mono text-sm border border-zinc-900 rounded leading-relaxed shadow-sm whitespace-pre-wrap">
              {qaAnswer}
            </div>

            {qaSources.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase">
                  Sources:
                </p>
                {qaSources.map((source, i) => (
                  <div
                    key={i}
                    className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-zinc-900 dark:text-white">
                        {source.filename}
                      </p>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {(source.similarity * 100).toFixed(0)}% match
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 italic">
                      "{source.excerpt}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Search Results */}
        {mode === 'search' && searchResults.length > 0 && (
          <div className="space-y-2">
            {searchResults.map((result, i) => (
              <div
                key={i}
                className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-zinc-900 dark:text-white">
                    {result.filename}
                    <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                      (chunk #{result.chunk_index})
                    </span>
                  </p>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {(result.similarity * 100).toFixed(0)}% match
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {result.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading &&
          mode === 'search' &&
          searchResults.length === 0 &&
          query &&
          (searchResults.length === 0 || qaAnswer === null) && (
            <div className="text-center py-8 text-zinc-400 dark:text-zinc-600 text-sm">
              <Search size={32} className="mx-auto mb-2 opacity-50" />
              <p>No matches found. Try a different query.</p>
            </div>
          )}
      </div>
    </div>
  );
}
