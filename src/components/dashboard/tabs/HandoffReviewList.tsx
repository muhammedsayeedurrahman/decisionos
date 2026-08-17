'use client';

import React from 'react';
import { HandoffItem } from '@/utils/sharedState';

interface HandoffReviewListProps {
  handoffs: HandoffItem[];
  onApprove: (id: HandoffItem['id']) => void;
  onReject: (id: HandoffItem['id']) => void;
}

export default function HandoffReviewList({ handoffs, onApprove, onReject }: HandoffReviewListProps) {
  const submitted = handoffs.filter(h => h.status === 'submitted');
  if (submitted.length === 0) return null;

  return (
    <div className="p-5 bg-blue-50 dark:bg-zinc-900 border border-brand-blue rounded-lg space-y-4">
      <div className="flex items-center gap-1.5 text-brand-blue">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
          <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192ZM128,72Z"/>
        </svg>
        <h3 className="font-logo font-black text-xs uppercase tracking-wider">
          Pending Handoff Reviews{' '}
          <span className="bg-blue-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-black">{submitted.length}</span>
        </h3>
      </div>

      <div className="space-y-3">
        {submitted.map((handoff) => (
          <div key={handoff.id} className="bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded flex flex-col sm:flex-row justify-between gap-3 items-start sm:items-center">
            <div className="space-y-1">
              <span className="text-[8px] font-mono font-black uppercase text-zinc-400 block">
                {handoff.id === 'sales_handoff' ? 'SALES HANDOFF' : 'PRODUCTION HANDOFF'}
              </span>
              <p className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">{handoff.title}</p>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Reply: &quot;{handoff.replyText}&quot;
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button onClick={() => onApprove(handoff.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-mono font-bold px-3 py-1.5 rounded cursor-pointer">
                Approve
              </button>
              <button onClick={() => onReject(handoff.id)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-mono font-bold px-3 py-1.5 rounded cursor-pointer">
                Reject
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
