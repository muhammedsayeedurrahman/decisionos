'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { transcribeAudio, isRecordingSupported } from '@/lib/whisper/client';

export type RecordingState = 'idle' | 'recording' | 'processing' | 'done' | 'error';

export interface UseAudioRecorderOptions {
  language?: string; // ISO 639-1 language code or 'auto' for auto-detection
  onTranscriptionComplete?: (text: string, detectedLanguage?: string) => void;
  onError?: (error: string) => void;
}

export interface UseAudioRecorderReturn {
  // State
  state: RecordingState;
  isRecording: boolean;
  transcription: string | null;
  detectedLanguage: string | null;
  error: string | null;
  audioBlob: Blob | null;
  recordingDuration: number; // in seconds

  // Actions
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  cancelRecording: () => void;
  reset: () => void;
  setLanguage: (language: string) => void;

  // Capabilities
  isSupported: boolean;
}

/**
 * Hook for recording audio and transcribing with Whisper API
 *
 * Usage:
 * ```typescript
 * const { state, transcription, startRecording, stopRecording, setLanguage } = useAudioRecorder({
 *   language: 'en',
 *   onTranscriptionComplete: (text, lang) => console.log('Done:', text, lang)
 * });
 *
 * <button onClick={startRecording} disabled={state === 'recording'}>
 *   Start Recording
 * </button>
 * <button onClick={stopRecording} disabled={state !== 'recording'}>
 *   Stop Recording
 * </button>
 * {transcription && <p>{transcription}</p>}
 * ```
 */
export function useAudioRecorder(options: UseAudioRecorderOptions = {}): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [transcription, setTranscription] = useState<string | null>(null);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [language, setLanguage] = useState(options.language || 'auto');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const isSupported = isRecordingSupported();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    if (!isSupported) {
      setError('Audio recording is not supported in this browser');
      setState('error');
      return;
    }

    try {
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Determine best audio format
      const mimeType = getSupportedMimeType();

      // Create MediaRecorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Handle data available
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Handle recording stop
      mediaRecorder.onstop = async () => {
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }

        // Stop duration timer
        if (durationIntervalRef.current) {
          clearInterval(durationIntervalRef.current);
          durationIntervalRef.current = null;
        }

        // Create audio blob
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);

        // Transcribe audio
        setState('processing');
        try {
          const result = await transcribeAudio(blob, { language });
          setTranscription(result.text);
          setDetectedLanguage(result.language || null);
          setState('done');

          // Callback on success
          if (options.onTranscriptionComplete) {
            options.onTranscriptionComplete(result.text, result.language);
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Transcription failed';
          setError(errorMessage);
          setState('error');

          // Callback on error
          if (options.onError) {
            options.onError(errorMessage);
          }
        }
      };

      // Start recording
      mediaRecorder.start();
      setState('recording');
      setError(null);
      setTranscription(null);
      startTimeRef.current = Date.now();

      // Start duration timer
      durationIntervalRef.current = setInterval(() => {
        setRecordingDuration((Date.now() - startTimeRef.current) / 1000);
      }, 100);

    } catch (err) {
      console.error('Failed to start recording:', err);
      setError(err instanceof Error ? err.message : 'Failed to access microphone');
      setState('error');
    }
  }, [isSupported]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const cancelRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }

    // Stop all tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Reset state
    setState('idle');
    setTranscription(null);
    setError(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, []);

  const reset = useCallback(() => {
    setState('idle');
    setTranscription(null);
    setError(null);
    setAudioBlob(null);
    setRecordingDuration(0);
    audioChunksRef.current = [];
  }, []);

  return {
    state,
    isRecording: state === 'recording',
    transcription,
    detectedLanguage,
    error,
    audioBlob,
    recordingDuration,
    startRecording,
    stopRecording,
    cancelRecording,
    reset,
    setLanguage,
    isSupported,
  };
}

/**
 * Get the best supported MIME type for audio recording
 */
function getSupportedMimeType(): string {
  const types = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/ogg;codecs=opus',
    'audio/ogg',
    'audio/mp4',
  ];

  for (const type of types) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }

  // Fallback
  return 'audio/webm';
}
