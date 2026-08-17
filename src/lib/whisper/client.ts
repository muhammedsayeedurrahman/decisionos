/**
 * Client-side utilities for audio recording and Whisper API interaction
 */

export interface TranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
  processingTime?: number;
}

export interface TranscriptionError {
  error: string;
  message?: string;
  code?: string;
}

export interface TranscribeOptions {
  language?: string; // ISO 639-1 language code or 'auto' for auto-detection
}

/**
 * Send audio file to Whisper API for transcription
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: TranscribeOptions = {}
): Promise<TranscriptionResult> {
  const formData = new FormData();

  // Create a file with proper extension based on MIME type
  const extension = getFileExtension(audioBlob.type);
  const file = new File([audioBlob], `recording.${extension}`, { type: audioBlob.type });

  formData.append('audio', file);

  // Add language parameter if specified
  if (options.language && options.language !== 'auto') {
    formData.append('language', options.language);
  }

  const response = await fetch('/api/transcribe', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error((data as TranscriptionError).error || 'Transcription failed');
  }

  return data as TranscriptionResult;
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    'audio/wav': 'wav',
    'audio/mpeg': 'mp3',
    'audio/mp4': 'mp4',
    'audio/webm': 'webm',
    'audio/ogg': 'ogg',
    'audio/flac': 'flac',
  };

  return extensions[mimeType] || 'webm';
}

/**
 * Check if browser supports audio recording
 */
export function isRecordingSupported(): boolean {
  // Check if we're in a browser environment (not SSR)
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * Get user's microphone permission status
 */
export async function getMicrophonePermission(): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({ name: 'microphone' as PermissionName });
    return result.state;
  } catch {
    // Fallback for browsers that don't support permissions API
    return 'prompt';
  }
}
