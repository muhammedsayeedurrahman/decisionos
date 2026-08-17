'use client';

import React, { useState } from 'react';
import { HandoffItem } from '@/utils/sharedState';

interface HandoffReplyCardProps {
  handoff: HandoffItem | undefined;
  onSubmitReply: (id: HandoffItem['id'], text: string) => void;
}

export default function HandoffReplyCard({ handoff, onSubmitReply }: HandoffReplyCardProps) {
  const [reply, setReply] = useState('');

  if (!handoff) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim()) return;
    onSubmitReply(handoff.id, reply);
    setReply('');
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 text-red-600 dark:text-red-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24ZM128,192ZM128,72Z"/>
        </svg>
        <h3 className="font-logo font-black text-xs uppercase tracking-wider">
          Needs Your Attention{' '}
          <span className="bg-red-100 dark:bg-red-950/50 px-2 py-0.5 rounded text-[10px] font-black font-mono">
            {handoff.status === 'pending' ? '1' : '0'}
          </span>
        </h3>
      </div>

      {handoff.status === 'pending' && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg w-full shadow-sm animate-fade-up">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 text-[8px] font-mono font-black uppercase rounded">
              &rarr; HANDOFF
            </span>
          </div>

          <h4 className="text-sm font-bold leading-snug mb-2 dark:text-white">{handoff.title}</h4>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 font-sans leading-relaxed">{handoff.description}</p>

          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-[11px] text-zinc-600 dark:text-zinc-400 mb-4">
            {handoff.instruction}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              required
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder="Reply to Rajesh Sharma"
              className="w-full h-20 border border-zinc-300 dark:border-zinc-800 p-2.5 rounded text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand-red bg-white dark:bg-zinc-950 dark:text-white resize-none"
            />
            <button type="submit" className="bg-zinc-950 dark:bg-zinc-100 text-white dark:text-zinc-950 px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-zinc-950 hover:bg-zinc-800 cursor-pointer">
              Send Response
            </button>
          </form>
        </div>
      )}

      {handoff.status === 'submitted' && (
        <div className="bg-green-50/50 dark:bg-green-950/10 border border-green-200 dark:border-green-900/50 p-5 rounded-lg w-full text-xs font-mono text-green-800 dark:text-green-300">
          &gt; Handoff action items completed. Response submitted: &quot;{handoff.replyText}&quot;. Awaiting Rajesh Sharma&apos;s review check.
        </div>
      )}

      {handoff.status === 'approved' && (
        <div className="bg-blue-50/50 dark:bg-zinc-900 border border-blue-200 dark:border-blue-900/50 p-5 rounded-lg w-full text-xs font-mono text-blue-800 dark:text-blue-300">
          &gt; Handoff response approved and verified by Rajesh Sharma. Task closed.
        </div>
      )}
    </div>
  );
}
