'use client';

import React from 'react';

interface CaptureUploadProps {
  title: string;
  buttonLabel: string;
  onUpload: () => void;
}

export default function CaptureUpload({ title, buttonLabel, onUpload }: CaptureUploadProps) {
  return (
    <div className="w-full space-y-6 animate-fade-up">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-lg">
        <h3 className="font-logo text-sm font-black uppercase mb-4 tracking-wider dark:text-white">{title}</h3>
        <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-10 flex flex-col items-center justify-center gap-3 text-center bg-zinc-50/50 dark:bg-zinc-950/30">
          <p className="text-[10px] font-mono text-zinc-400 dark:text-zinc-500">Drag a file here, or</p>
          <button onClick={onUpload} className="bg-brand-blue text-white px-4 py-2 text-xs font-mono font-bold uppercase rounded border border-zinc-950 cursor-pointer">
            {buttonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
