'use client';

import { useState, useCallback } from 'react';
import { uploadFile, type UploadResult } from '@/lib/supabase/storage';

export interface UseFileUploadReturn {
  // State
  uploading: boolean;
  progress: number;
  uploadedFile: UploadResult | null;
  error: string | null;

  // Actions
  upload: (
    file: File,
    options?: {
      bucket?: 'documents' | 'avatars' | 'voice-recordings';
      folder?: string;
    }
  ) => Promise<UploadResult>;
  reset: () => void;
}

/**
 * Hook for uploading files to Supabase Storage
 *
 * Usage:
 * ```typescript
 * const { uploading, uploadedFile, upload, error } = useFileUpload();
 *
 * const handleUpload = async (file: File) => {
 *   try {
 *     const result = await upload(file, { bucket: 'documents' });
 *     console.log('Uploaded:', result.url);
 *   } catch (err) {
 *     console.error('Upload failed:', err);
 *   }
 * };
 * ```
 */
export function useFileUpload(): UseFileUploadReturn {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(
    async (
      file: File,
      options?: {
        bucket?: 'documents' | 'avatars' | 'voice-recordings';
        folder?: string;
      }
    ): Promise<UploadResult> => {
      setUploading(true);
      setProgress(0);
      setError(null);
      setUploadedFile(null);

      try {
        // Simulate progress (Supabase doesn't provide upload progress)
        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return 90;
            }
            return prev + 10;
          });
        }, 100);

        const result = await uploadFile(file, {
          bucket: options?.bucket || 'documents',
          folder: options?.folder,
        });

        clearInterval(progressInterval);
        setProgress(100);
        setUploadedFile(result);

        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setUploadedFile(null);
    setError(null);
  }, []);

  return {
    uploading,
    progress,
    uploadedFile,
    error,
    upload,
    reset,
  };
}
