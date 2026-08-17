'use client';

import { useState, useRef, useCallback, useEffect } from 'react';

export type RecognitionState = 'idle' | 'listening' | 'processing' | 'done' | 'error';

export interface UseWebSpeechRecognitionOptions {
  language?: string; // BCP 47 language tag (e.g., 'en-US', 'hi-IN')
  continuous?: boolean; // Continue listening until stopped
  interimResults?: boolean; // Return interim results as user speaks
  onTranscriptionUpdate?: (text: string, isFinal: boolean) => void;
  onTranscriptionComplete?: (text: string) => void;
  onError?: (error: string) => void;
}

export interface UseWebSpeechRecognitionReturn {
  // State
  state: RecognitionState;
  isListening: boolean;
  transcription: string | null;
  interimTranscription: string | null;
  error: string | null;

  // Actions
  startListening: () => void;
  stopListening: () => void;
  reset: () => void;
  setLanguage: (language: string) => void;

  // Capabilities
  isSupported: boolean;
}

/**
 * Hook for real-time speech recognition using Web Speech API
 *
 * Features:
 * - Real-time transcription (no server required)
 * - Streaming interim results
 * - Multi-language support
 * - Free (browser-native)
 *
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Full support (iOS 14.5+)
 * - Firefox: Limited support
 *
 * Usage:
 * ```typescript
 * const { state, transcription, interimTranscription, startListening, stopListening } =
 *   useWebSpeechRecognition({
 *     language: 'en-US',
 *     continuous: true,
 *     interimResults: true,
 *     onTranscriptionUpdate: (text, isFinal) => console.log('Update:', text, isFinal)
 *   });
 * ```
 */
export function useWebSpeechRecognition(
  options: UseWebSpeechRecognitionOptions = {}
): UseWebSpeechRecognitionReturn {
  const [state, setState] = useState<RecognitionState>('idle');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [interimTranscription, setInterimTranscription] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState(options.language || 'en-US');

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const finalTranscriptRef = useRef<string>('');

  // Check browser support
  const isSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Initialize recognition
  useEffect(() => {
    if (!isSupported) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const recognition = new SpeechRecognitionAPI();
    recognition.lang = language;
    recognition.continuous = options.continuous ?? true;
    recognition.interimResults = options.interimResults ?? true;
    recognition.maxAlternatives = 1;

    // Handle results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';
      let finalText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
          finalText += transcript + ' ';
          finalTranscriptRef.current += transcript + ' ';
        } else {
          interimText += transcript;
        }
      }

      // Update interim transcription
      if (interimText) {
        setInterimTranscription(interimText);
        if (options.onTranscriptionUpdate) {
          options.onTranscriptionUpdate(finalTranscriptRef.current + interimText, false);
        }
      }

      // Update final transcription
      if (finalText) {
        setTranscription(finalTranscriptRef.current.trim());
        setInterimTranscription(null);
        if (options.onTranscriptionUpdate) {
          options.onTranscriptionUpdate(finalTranscriptRef.current.trim(), true);
        }
      }
    };

    // Handle end
    recognition.onend = () => {
      setState('done');
      const finalText = finalTranscriptRef.current.trim();
      setTranscription(finalText);
      setInterimTranscription(null);

      if (options.onTranscriptionComplete && finalText) {
        options.onTranscriptionComplete(finalText);
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);

      let errorMessage = 'Speech recognition failed';
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech was detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'No microphone was found. Ensure it is plugged in.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Check your connection.';
          break;
        case 'aborted':
          // User stopped - not an error
          return;
      }

      setError(errorMessage);
      setState('error');

      if (options.onError) {
        options.onError(errorMessage);
      }
    };

    // Handle start
    recognition.onstart = () => {
      setState('listening');
      setError(null);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, language, options.continuous, options.interimResults]);

  const startListening = useCallback(() => {
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser');
      setState('error');
      return;
    }

    if (!recognitionRef.current) {
      setError('Speech recognition not initialized');
      setState('error');
      return;
    }

    try {
      finalTranscriptRef.current = '';
      setTranscription(null);
      setInterimTranscription(null);
      setError(null);
      recognitionRef.current.start();
    } catch (err) {
      console.error('Failed to start speech recognition:', err);
      setError(err instanceof Error ? err.message : 'Failed to start speech recognition');
      setState('error');
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscription(null);
    setInterimTranscription(null);
    setError(null);
    setState('idle');
  }, []);

  return {
    state,
    isListening: state === 'listening',
    transcription,
    interimTranscription,
    error,
    startListening,
    stopListening,
    reset,
    setLanguage,
    isSupported,
  };
}
