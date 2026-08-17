'use client';

import React, { useState, useEffect } from 'react';
import { useWebSpeechRecognition } from '@/hooks/useWebSpeechRecognition';
import { Mic, Square, Loader2, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface RealTimeVoiceInputProps {
  onTranscriptionComplete?: (text: string) => void;
  onTranscriptionUpdate?: (text: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
  language?: string;
  placeholder?: string;
  className?: string;
  autoSubmit?: boolean; // Auto-submit when user stops speaking
}

/**
 * Real-time voice input component using Web Speech API
 *
 * Features:
 * - Live transcription as user speaks
 * - Visual feedback with waveform animation
 * - Multi-language support
 * - Auto-submit when user stops speaking
 * - No server required (browser-native)
 *
 * Usage:
 * ```typescript
 * <RealTimeVoiceInput
 *   language="en-US"
 *   onTranscriptionComplete={(text) => console.log('Final:', text)}
 *   onTranscriptionUpdate={(text, isFinal) => console.log('Update:', text)}
 *   autoSubmit={true}
 * />
 * ```
 */
export function RealTimeVoiceInput({
  onTranscriptionComplete,
  onTranscriptionUpdate,
  onError,
  language = 'en-US',
  placeholder = 'Click the microphone to start speaking...',
  className = '',
  autoSubmit = false,
}: RealTimeVoiceInputProps) {
  const {
    state,
    isListening,
    transcription,
    interimTranscription,
    error,
    startListening,
    stopListening,
    reset,
    isSupported,
  } = useWebSpeechRecognition({
    language,
    continuous: true,
    interimResults: true,
    onTranscriptionUpdate,
    onTranscriptionComplete: (text) => {
      if (onTranscriptionComplete) {
        onTranscriptionComplete(text);
      }
      if (autoSubmit && text.trim()) {
        // Auto-submit after transcription
        setTimeout(() => reset(), 1000);
      }
    },
    onError,
  });

  const [volumeLevel, setVolumeLevel] = useState(0);

  // Simulate volume level animation while listening
  useEffect(() => {
    if (!isListening) {
      setVolumeLevel(0);
      return;
    }

    const interval = setInterval(() => {
      setVolumeLevel(Math.random() * 100);
    }, 100);

    return () => clearInterval(interval);
  }, [isListening]);

  if (!isSupported) {
    return (
      <div className={`p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-xl ${className}`}>
        <div className="flex items-center gap-3 text-yellow-700 dark:text-yellow-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-bold text-sm">Speech recognition not supported</p>
            <p className="text-xs mt-1">
              Please use Chrome, Edge, or Safari for real-time voice input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const displayText = interimTranscription || transcription || '';

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Microphone Button */}
      <div className="flex items-center justify-center">
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative flex items-center justify-center w-20 h-20 rounded-full border-4 transition-all duration-300 ${
            isListening
              ? 'bg-brand-red border-brand-red text-white shadow-lg shadow-brand-red/50 scale-110'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-brand-red hover:text-brand-red hover:scale-105'
          }`}
          aria-label={isListening ? 'Stop listening' : 'Start listening'}
        >
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="stop"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <Square className="w-8 h-8" />
              </motion.div>
            ) : (
              <motion.div
                key="mic"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
              >
                <Mic className="w-8 h-8" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Pulse animation while listening */}
          {isListening && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full bg-brand-red opacity-20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full bg-brand-red opacity-10"
                animate={{ scale: [1, 1.5, 1], opacity: [0.1, 0, 0.1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
              />
            </>
          )}
        </button>
      </div>

      {/* Status Text */}
      <div className="text-center">
        {state === 'idle' && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Click to start speaking
          </p>
        )}
        {isListening && (
          <div className="flex items-center justify-center gap-2">
            <div className="flex items-center gap-1">
              <motion.div
                className="w-1 h-3 bg-brand-red rounded-full"
                animate={{ height: [12, volumeLevel / 6 + 8, 12] }}
                transition={{ duration: 0.15 }}
              />
              <motion.div
                className="w-1 h-3 bg-brand-red rounded-full"
                animate={{ height: [12, volumeLevel / 5 + 10, 12] }}
                transition={{ duration: 0.2 }}
              />
              <motion.div
                className="w-1 h-3 bg-brand-red rounded-full"
                animate={{ height: [12, volumeLevel / 4 + 12, 12] }}
                transition={{ duration: 0.25 }}
              />
            </div>
            <p className="text-sm text-brand-red font-bold uppercase tracking-wider animate-pulse">
              Listening...
            </p>
          </div>
        )}
        {state === 'done' && !autoSubmit && (
          <p className="text-sm text-green-600 dark:text-green-400 font-medium">
            Transcription complete
          </p>
        )}
        {state === 'error' && error && (
          <div className="flex items-center justify-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
      </div>

      {/* Transcription Display */}
      {displayText && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 min-h-[100px]"
        >
          <div className="flex items-start gap-2 mb-2">
            <Volume2 className="w-4 h-4 text-zinc-400 dark:text-zinc-500 mt-0.5" />
            <span className="text-xs font-mono font-bold uppercase text-zinc-400 dark:text-zinc-500">
              {interimTranscription ? 'Speaking...' : 'Transcription'}
            </span>
          </div>
          <p className="text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed">
            {displayText}
            {interimTranscription && (
              <motion.span
                className="inline-block w-1 h-4 bg-brand-red ml-1"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            )}
          </p>
        </motion.div>
      )}

      {/* Action Buttons */}
      {(transcription || state === 'done') && !autoSubmit && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => {
              if (transcription && onTranscriptionComplete) {
                onTranscriptionComplete(transcription);
              }
              reset();
            }}
            className="px-4 py-2 bg-brand-red text-white font-bold uppercase tracking-wider text-xs rounded-lg hover:shadow-lg transition-all"
          >
            Use Transcription
          </button>
          <button
            onClick={reset}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase tracking-wider text-xs rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
          >
            Clear
          </button>
        </div>
      )}

      {/* Language Info */}
      <div className="text-center">
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          Language: {language === 'en-US' ? 'English (US)' : language === 'hi-IN' ? 'Hindi' : language}
        </p>
      </div>
    </div>
  );
}
