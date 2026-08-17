'use client';

import React, { useState, useEffect } from 'react';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { Mic, Square, Loader2, CheckCircle, XCircle, Globe } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { getPreferredLanguage, setPreferredLanguage, getLanguageByCode } from '@/types/languages';

export interface VoiceRecorderProps {
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

/**
 * Voice recorder component with Whisper API integration
 *
 * Records audio from user's microphone and transcribes using OpenAI Whisper.
 *
 * Usage:
 * ```typescript
 * <VoiceRecorder
 *   onTranscriptionComplete={(text) => console.log('Transcribed:', text)}
 *   onError={(error) => console.error('Error:', error)}
 * />
 * ```
 */
export function VoiceRecorder({
  onTranscriptionComplete,
  onError,
  className = '',
}: VoiceRecorderProps) {
  const [language, setLanguage] = useState<string>('auto');

  // Load preferred language on mount
  useEffect(() => {
    setLanguage(getPreferredLanguage());
  }, []);

  const {
    state,
    isRecording,
    transcription,
    detectedLanguage,
    error,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    setLanguage: setRecorderLanguage,
    isSupported,
  } = useAudioRecorder({
    language,
    onTranscriptionComplete,
    onError,
  });

  // Update recorder language when language changes
  useEffect(() => {
    setRecorderLanguage(language);
  }, [language, setRecorderLanguage]);

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    setPreferredLanguage(newLanguage); // Save preference
  };

  // Notify parent when transcription completes
  React.useEffect(() => {
    if (state === 'done' && transcription && onTranscriptionComplete) {
      onTranscriptionComplete(transcription);
    }
  }, [state, transcription, onTranscriptionComplete]);

  // Notify parent of errors
  React.useEffect(() => {
    if (state === 'error' && error && onError) {
      onError(error);
    }
  }, [state, error, onError]);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md ${className}`}>
        <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm">
          <XCircle className="w-4 h-4" />
          <span>Audio recording is not supported in this browser</span>
        </div>
      </div>
    );
  }

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const selectedLanguageInfo = getLanguageByCode(language);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Language Selector */}
      {state === 'idle' && (
        <div className="flex items-center justify-between gap-4 p-3 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Language
            </span>
          </div>
          <LanguageSelector
            selectedLanguage={language}
            onChange={handleLanguageChange}
            compact
          />
        </div>
      )}

      {/* Detected Language Badge */}
      {detectedLanguage && state === 'done' && (
        <div className="flex items-center gap-2 px-3 py-2 bg-brand-blue/10 dark:bg-brand-blue/20 rounded-lg border border-brand-blue/20">
          <Globe className="w-4 h-4 text-brand-blue" />
          <span className="text-xs font-medium text-brand-blue">
            Detected: {getLanguageByCode(detectedLanguage)?.name || detectedLanguage}
            {selectedLanguageInfo?.code !== 'auto' && detectedLanguage !== language && (
              <span className="ml-1 text-zinc-500">(Expected: {selectedLanguageInfo?.name})</span>
            )}
          </span>
        </div>
      )}

      {/* Recording Button */}
      <div className="flex items-center gap-4">
        {state === 'idle' && (
          <button
            onClick={startRecording}
            className="flex items-center gap-2 px-4 py-3 bg-brand-red text-white font-bold uppercase tracking-wider rounded-md hover:shadow-[var(--shadow-brutal-sm)] dark:hover:shadow-[var(--shadow-brutal-red)] transition-all border border-zinc-950 dark:border-zinc-800"
          >
            <Mic className="w-5 h-5" />
            <span>Start Recording</span>
          </button>
        )}

        {state === 'recording' && (
          <div className="flex items-center gap-4">
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-3 bg-zinc-900 dark:bg-zinc-800 text-white font-bold uppercase tracking-wider rounded-md hover:shadow-[var(--shadow-brutal-sm)] dark:hover:shadow-[var(--shadow-brutal-white)] transition-all border border-zinc-950 dark:border-zinc-700"
            >
              <Square className="w-5 h-5" />
              <span>Stop Recording</span>
            </button>

            <div className="flex items-center gap-2 text-sm font-mono text-zinc-600 dark:text-zinc-400">
              <div className="w-3 h-3 bg-brand-red rounded-full animate-pulse" />
              <span>{formatDuration(recordingDuration)}</span>
            </div>

            <button
              onClick={cancelRecording}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors underline"
            >
              Cancel
            </button>
          </div>
        )}

        {state === 'processing' && (
          <div className="flex items-center gap-3 px-4 py-3 bg-zinc-100 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
            <Loader2 className="w-5 h-5 animate-spin text-brand-red" />
            <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Transcribing audio...
            </span>
          </div>
        )}

        {state === 'done' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-green-50 dark:bg-green-950/20 rounded-md border border-green-200 dark:border-green-800">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-sm font-medium text-green-700 dark:text-green-300">
                Transcription complete
              </span>
            </div>

            <button
              onClick={reset}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors underline"
            >
              Record Again
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-800">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </span>
            </div>

            <button
              onClick={reset}
              className="text-sm text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors underline"
            >
              Try Again
            </button>
          </div>
        )}
      </div>

      {/* Transcription Result */}
      {transcription && (
        <div className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-md border border-zinc-200 dark:border-zinc-800">
          <div className="label-mono mb-2 text-zinc-400 dark:text-zinc-500">
            Transcription
          </div>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {transcription}
          </p>
        </div>
      )}
    </div>
  );
}
