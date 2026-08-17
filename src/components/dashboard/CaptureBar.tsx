'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, FileUp, Sparkles, X, CornerDownLeft, Radio } from 'lucide-react';
import { Accent, ACCENT_STYLES } from '@/config/roles';
import { VoiceState } from '@/hooks/useWorkspace';

interface CaptureBarProps {
  accent: Accent;
  placeholder: string;
  alertMsg: string | null;
  voiceState: VoiceState;
  transcribedText: string;
  textDirective: string;
  setTextDirective: (v: string) => void;
  onMicClick: () => void;
  onApplyVoiceDirective: () => void;
  onStructureText: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function CaptureBar({
  accent,
  placeholder,
  alertMsg,
  voiceState,
  transcribedText,
  textDirective,
  setTextDirective,
  onMicClick,
  onApplyVoiceDirective,
  onStructureText,
  onFileUpload,
}: CaptureBarProps) {
  const a = ACCENT_STYLES[accent];
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    onStructureText(e);
    if (textDirective.trim()) {
      setMobileDrawerOpen(false);
    }
  };

  return (
    <>
      {/* ─── Mobile Floating Action Button (< 768px) ─── */}
      <div className="md:hidden fixed bottom-6 right-5 z-40 flex items-center gap-2">
        {voiceState === 'recording' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-red-600 text-white px-3 py-1.5 rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg animate-pulse"
          >
            <Radio className="w-3.5 h-3.5" />
            <span>LISTENING...</span>
          </motion.div>
        )}

        <button
          onClick={() => setMobileDrawerOpen(true)}
          aria-label="Open Directive Capture Drawer"
          className={`w-14 h-14 rounded-full ${a.solidBg} ${a.solidText} shadow-2xl flex items-center justify-center border-2 border-zinc-950 dark:border-zinc-800 active:scale-95 transition-transform cursor-pointer`}
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* ─── Mobile Bottom Sheet Modal (< 768px) ─── */}
      <AnimatePresence>
        {mobileDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileDrawerOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 md:hidden"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-t-3xl p-5 z-50 md:hidden overflow-y-auto shadow-2xl safe-area-padding-bottom"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${a.solidBg}`} />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                    Capture Directive
                  </span>
                </div>
                <button
                  onClick={() => setMobileDrawerOpen(false)}
                  className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {alertMsg && (
                <div className="mb-3 p-3 bg-zinc-900 dark:bg-zinc-800 text-white font-mono text-xs rounded-xl border border-zinc-700">
                  &gt; {alertMsg}
                </div>
              )}

              {voiceState === 'done' && transcribedText && (
                <div className="mb-3 p-3 bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs font-mono text-zinc-800 dark:text-zinc-200">
                  <div className="text-[10px] text-zinc-400 mb-1">TRANSCRIBED DIRECTIVE:</div>
                  <div className="break-words mb-2">{transcribedText}</div>
                  <button
                    onClick={() => {
                      onApplyVoiceDirective();
                      setMobileDrawerOpen(false);
                    }}
                    className={`w-full py-2.5 ${a.solidBg} ${a.solidText} rounded-lg text-xs font-black uppercase tracking-wider cursor-pointer`}
                  >
                    Apply &amp; Distribute
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <textarea
                  value={textDirective}
                  onChange={(e) => setTextDirective(e.target.value)}
                  placeholder={placeholder}
                  rows={3}
                  className="w-full p-3 font-mono text-sm border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red/30"
                />

                <div className="flex items-center justify-between gap-2 pt-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={onMicClick}
                      className={`p-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer ${
                        voiceState === 'recording'
                          ? `${a.solidBg} ${a.solidText} animate-pulse`
                          : voiceState === 'thinking'
                          ? `${a.softBg} ${a.softText}`
                          : `bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200`
                      }`}
                    >
                      <Mic className="w-5 h-5" />
                      <span className="text-xs font-mono font-bold">
                        {voiceState === 'recording' ? 'Stop' : voiceState === 'thinking' ? 'AI...' : 'Voice'}
                      </span>
                    </button>

                    <label
                      htmlFor="mobile-file-upload"
                      className="p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 cursor-pointer flex items-center gap-1.5"
                    >
                      <FileUp className="w-5 h-5" />
                      <span className="text-xs font-mono font-bold">Attach</span>
                      <input
                        id="mobile-file-upload"
                        type="file"
                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                        className="hidden"
                        onChange={onFileUpload}
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={!textDirective.trim()}
                    className={`flex items-center gap-1.5 ${a.solidBg} ${a.solidHoverBg} disabled:opacity-40 text-white px-5 py-3 rounded-xl text-xs font-mono font-black uppercase tracking-wider`}
                  >
                    <span>Structure</span>
                    <CornerDownLeft className="w-4 h-4" />
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Desktop Dock Capture Bar (>= 768px) ─── */}
      <div className="hidden md:block absolute bottom-0 left-0 right-0 px-6 pb-5 pt-3 bg-gradient-to-t from-zinc-50 via-zinc-50/95 dark:from-zinc-950 dark:via-zinc-950/95 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-3xl mx-auto">
          {voiceState === 'done' && transcribedText && (
            <div className="mb-2 p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono text-zinc-700 dark:text-zinc-300 shadow-sm flex items-center justify-between gap-2">
              <span className="break-words whitespace-normal flex-1">{transcribedText}</span>
              <button
                onClick={onApplyVoiceDirective}
                className={`shrink-0 ${a.solidBg} ${a.solidText} px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer ${a.solidHoverBg} transition-colors`}
              >
                Apply &amp; Distribute
              </button>
            </div>
          )}

          {alertMsg && (
            <div className="mb-2 p-2.5 bg-zinc-900 dark:bg-zinc-800 text-white font-mono text-xs rounded-xl border border-zinc-700 shadow-md">
              &gt; {alertMsg}
            </div>
          )}

          <form
            onSubmit={onStructureText}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            <textarea
              value={textDirective}
              onChange={(e) => setTextDirective(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (textDirective.trim()) onStructureText(e as unknown as React.FormEvent);
                }
              }}
              placeholder={placeholder}
              rows={2}
              className="w-full px-4 pt-3 pb-1 font-mono text-sm text-zinc-900 dark:text-white bg-transparent resize-none focus:outline-none placeholder:text-zinc-400 placeholder:text-xs"
            />
            <div className="flex items-center justify-between px-3 pb-3 gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={onMicClick}
                  title="Speak a directive"
                  aria-label="Speak a directive"
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    voiceState === 'recording'
                      ? `${a.solidBg} ${a.solidText} recording-pulse`
                      : voiceState === 'thinking'
                      ? `${a.softBg} ${a.softText}`
                      : `text-zinc-400 ${a.softHoverBg}`
                  }`}
                >
                  <Mic className="w-[18px] h-[18px]" />
                </button>

                <label
                  htmlFor="floating-file-upload"
                  title="Upload image, PDF or document"
                  className={`p-2 rounded-xl text-zinc-400 ${a.softHoverBg} cursor-pointer transition-all`}
                >
                  <span className="sr-only">Upload image, PDF or document</span>
                  <FileUp className="w-[18px] h-[18px]" />
                  <input
                    id="floating-file-upload"
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={onFileUpload}
                  />
                </label>

                {voiceState !== 'idle' && (
                  <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                    voiceState === 'recording' ? a.text : 'text-zinc-400'
                  }`}>
                    {voiceState === 'recording' && '● REC'}
                    {voiceState === 'thinking' && '⟳ AI...'}
                    {voiceState === 'done' && '✓ DONE'}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={!textDirective.trim()}
                className={`flex items-center gap-1.5 ${a.solidBg} ${a.solidHoverBg} disabled:opacity-30 disabled:cursor-not-allowed ${a.solidText} px-3 sm:px-4 py-2 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all cursor-pointer shadow-sm`}
              >
                <span>Structure It</span>
                <CornerDownLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
