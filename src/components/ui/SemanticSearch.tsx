'use client';

import React, { useState } from 'react';
import { Search, FileText, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  upload_id: string;
  content: string;
  similarity: number;
}

export function SemanticSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/embeddings?query=${encodeURIComponent(query)}&limit=10`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Search failed');
      }

      setResults(data.results || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Search failed';
      setError(errorMsg);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;

    const queryWords = query.toLowerCase().split(/\s+/);
    let highlighted = text;

    queryWords.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    });

    return highlighted;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">
          AI-Powered Document Search
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Search your documents using natural language. Our AI understands context and meaning.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-zinc-400" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask anything about your documents... (e.g., 'Show me invoices from last month')"
            className="w-full pl-12 pr-4 py-4 border-2 border-zinc-300 dark:border-zinc-600 rounded-xl bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white placeholder-zinc-500 dark:placeholder-zinc-400 focus:outline-none focus:border-blue-500 dark:focus:border-blue-400 text-lg"
          />
        </div>
        <div className="mt-3 flex justify-between items-center">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {results.length > 0 && `Found ${results.length} relevant results`}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Search
              </>
            )}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          <p className="text-red-500 dark:text-red-500 text-xs mt-1">
            Make sure OpenAI API key is configured in your environment variables.
          </p>
        </div>
      )}

      {/* Search Results */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : results.length > 0 ? (
        <div className="space-y-4">
          {results.map((result, index) => (
            <div
              key={result.id}
              className="bg-white dark:bg-zinc-800 rounded-lg p-6 shadow-sm border border-zinc-200 dark:border-zinc-700 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        Result #{index + 1}
                      </span>
                      <div className="h-1 w-1 rounded-full bg-zinc-300 dark:bg-zinc-600"></div>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {Math.round(result.similarity * 100)}% match
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.round(result.similarity * 5)
                              ? 'bg-blue-500'
                              : 'bg-zinc-300 dark:bg-zinc-600'
                          }`}
                        ></div>
                      ))}
                    </div>
                  </div>
                  <p
                    className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: highlightText(
                        result.content.length > 300
                          ? result.content.substring(0, 300) + '...'
                          : result.content,
                        query
                      ),
                    }}
                  />
                  <button className="mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline">
                    View full document →
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : query && !loading ? (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-zinc-300 dark:text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-500 dark:text-zinc-400">
            No results found. Try a different search query.
          </p>
        </div>
      ) : null}

      {/* How it works */}
      {!query && (
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800">
          <h3 className="font-semibold text-zinc-900 dark:text-white mb-3">
            How AI Search Works
          </h3>
          <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Documents are automatically indexed when uploaded</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>AI understands context, not just keywords</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Results are ranked by semantic similarity</span>
            </li>
            <li className="flex gap-2">
              <span className="text-blue-600 dark:text-blue-400">•</span>
              <span>Search across all your uploaded documents at once</span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
