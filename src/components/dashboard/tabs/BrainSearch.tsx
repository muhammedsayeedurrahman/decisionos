'use client';

import React, { useState } from 'react';

interface BrainSearchProps {
  placeholder: string;
  respond: (query: string) => string;
}

export default function BrainSearch({ placeholder, respond }: BrainSearchProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleAsk = () => {
    if (!query.trim()) return;
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      setLoading(false);
      setResult(respond(query));
    }, 1000);
  };

  return (
    <div className="w-full space-y-6 animate-fade-up">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 rounded-lg space-y-4">
        <h3 className="font-logo text-lg font-black uppercase dark:text-white">Ask DecisionOS AI</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
            placeholder={placeholder}
            className="flex-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-3 py-2 text-xs font-mono focus:outline-none rounded"
          />
          <button onClick={handleAsk} className="border border-zinc-950 dark:border-zinc-700 bg-brand-ink dark:bg-zinc-800 text-white px-5 py-2 text-xs font-semibold uppercase hover:bg-zinc-800 rounded cursor-pointer">
            Query
          </button>
        </div>
        {loading && <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded text-xs font-mono text-zinc-400 animate-pulse">&gt; AI searching...</div>}
        {result && (
          <div className="p-4 bg-zinc-950 text-emerald-400 font-mono text-xs border border-zinc-900 rounded whitespace-pre-wrap leading-relaxed shadow-sm">{result}</div>
        )}
      </div>
    </div>
  );
}
