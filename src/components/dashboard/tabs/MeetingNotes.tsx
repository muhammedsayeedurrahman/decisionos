'use client';

import React, { useState } from 'react';

export interface Meeting {
  id: number;
  title: string;
  date: string;
  transcript: string;
}

interface MeetingNotesProps {
  meetings: Meeting[];
  extractTasks: (id: number) => string[];
  onExtracted?: () => void;
}

export default function MeetingNotes({ meetings, extractTasks, onExtracted }: MeetingNotesProps) {
  const [activeMeetingId, setActiveMeetingId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<string[]>([]);

  const selectMeeting = (id: number) => {
    setActiveMeetingId(id);
    setExtracted([]);
  };

  const handleExtract = (id: number) => {
    setLoading(true);
    setExtracted([]);
    setTimeout(() => {
      setLoading(false);
      setExtracted(extractTasks(id));
      onExtracted?.();
    }, 1200);
  };

  const activeMeeting = meetings.find(m => m.id === activeMeetingId);

  return (
    <div className="flex flex-col w-full animate-fade-up">
      {/* Mobile Selector Dropdown */}
      <div className="block md:hidden mb-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg">
        <label className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase block mb-2">Select Meeting</label>
        <select
          value={activeMeetingId ?? ''}
          onChange={(e) => selectMeeting(Number(e.target.value))}
          className="w-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 dark:text-white px-3 py-2.5 text-xs font-mono rounded focus:outline-none"
        >
          <option value="" disabled>-- Select a meeting --</option>
          {meetings.map((meeting) => (
            <option key={meeting.id} value={meeting.id}>
              {meeting.title} ({meeting.date})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
        {/* Desktop Sidebar List */}
        <div className="hidden md:block md:col-span-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 h-fit">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase block mb-2">Meetings list</span>
          <div className="space-y-2">
            {meetings.map((meeting) => (
              <button
                key={meeting.id}
                onClick={() => selectMeeting(meeting.id)}
                className={`w-full text-left p-3 border rounded transition-all cursor-pointer block ${
                  activeMeetingId === meeting.id ? 'border-brand-red bg-red-50/20 dark:bg-zinc-800' : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'
                }`}
              >
                <p className="text-xs font-bold truncate dark:text-white">{meeting.title}</p>
                <p className="text-[10px] font-mono text-zinc-400 mt-0.5">{meeting.date}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-4">
          {activeMeeting ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h4 className="text-xs font-bold dark:text-white">{activeMeeting.title}</h4>
                <button onClick={() => handleExtract(activeMeeting.id)} className="bg-brand-blue text-white text-xs font-mono font-bold px-3 py-1.5 border border-zinc-950 rounded cursor-pointer">
                  Extract Action Items
                </button>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded font-mono text-xs whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto text-zinc-700 dark:text-zinc-300">
                {activeMeeting.transcript}
              </div>
              {loading && <div className="p-4 bg-zinc-50 dark:bg-zinc-950 rounded text-xs font-mono text-zinc-400 animate-pulse">&gt; Parsing actions...</div>}
              {extracted.length > 0 && (
                <div className="bg-green-50/50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 p-4 rounded-lg space-y-1">
                  {extracted.map((t, i) => (
                    <li key={i} className="text-xs font-semibold text-green-900 dark:text-green-300">&bull; {t}</li>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-12 text-center text-xs text-zinc-400 font-mono bg-white dark:bg-zinc-900">
              &gt; Select a meeting to view transcript and action items.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
