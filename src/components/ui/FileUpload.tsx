'use client';

import React, { useCallback, useState } from 'react';
import { useFileUpload } from '@/hooks/useFileUpload';
import { formatFileSize, getFileIcon } from '@/lib/supabase/storage';
import { Upload, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export interface FileUploadProps {
  onUploadComplete?: (url: string, path: string) => void;
  onError?: (error: string) => void;
  bucket?: 'documents' | 'avatars' | 'voice-recordings';
  folder?: string;
  maxSize?: number; // in MB
  accept?: string; // MIME types, e.g., "image/*,application/pdf"
  className?: string;
}

/**
 * Drag-and-drop file upload component with Supabase Storage
 *
 * Usage:
 * ```typescript
 * <FileUpload
 *   onUploadComplete={(url) => console.log('Uploaded:', url)}
 *   bucket="documents"
 *   accept="image/*,application/pdf"
 *   maxSize={10}
 * />
 * ```
 */
export function FileUpload({
  onUploadComplete,
  onError,
  bucket = 'documents',
  folder,
  maxSize = 10,
  accept,
  className = '',
}: FileUploadProps) {
  const { uploading, progress, uploadedFile, error, upload, reset } = useFileUpload();
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        const errorMsg = `File size (${formatFileSize(file.size)}) exceeds ${maxSize}MB limit`;
        setSelectedFile(null);
        if (onError) onError(errorMsg);
        return;
      }

      setSelectedFile(file);

      try {
        const result = await upload(file, { bucket, folder });
        if (onUploadComplete) {
          onUploadComplete(result.url, result.path);
        }
      } catch (err) {
        if (onError) {
          onError(err instanceof Error ? err.message : 'Upload failed');
        }
      }
    },
    [upload, bucket, folder, maxSize, onUploadComplete, onError]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFile(files[0]);
      }
    },
    [handleFile]
  );

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Upload Area */}
      {!uploading && !uploadedFile && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative border-2 border-dashed rounded-lg p-8
            transition-all cursor-pointer
            ${
              isDragging
                ? 'border-brand-red bg-red-50 dark:bg-red-950/20'
                : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600'
            }
          `}
        >
          <input
            type="file"
            onChange={handleFileSelect}
            accept={accept}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          <div className="flex flex-col items-center gap-3 text-center pointer-events-none">
            <div
              className={`
              w-12 h-12 rounded-full flex items-center justify-center
              ${isDragging ? 'bg-brand-red text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}
            `}
            >
              <Upload className="w-6 h-6" />
            </div>

            <div>
              <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                {isDragging ? 'Drop file here' : 'Drag and drop or click to upload'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {accept ? `Accepted: ${accept}` : 'All file types accepted'} · Max {maxSize}MB
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploading State */}
      {uploading && selectedFile && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getFileIcon(selectedFile.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {selectedFile.name}
                </p>
                <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">
                  {progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand-red transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                Uploading... {formatFileSize(selectedFile.size)}
              </p>
            </div>

            <Loader2 className="w-5 h-5 text-brand-red animate-spin flex-shrink-0" />
          </div>
        </div>
      )}

      {/* Success State */}
      {uploadedFile && selectedFile && (
        <div className="border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="text-2xl">{getFileIcon(uploadedFile.type)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-medium text-green-900 dark:text-green-100 truncate">
                  {selectedFile.name}
                </p>
                <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              </div>

              <p className="text-xs text-green-700 dark:text-green-300 mb-2">
                Uploaded successfully · {formatFileSize(uploadedFile.size)}
              </p>

              <a
                href={uploadedFile.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-green-600 dark:text-green-400 hover:underline"
              >
                View file →
              </a>
            </div>

            <button
              onClick={handleReset}
              className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 transition-colors flex-shrink-0"
              aria-label="Upload another file"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-1">
                Upload failed
              </p>
              <p className="text-xs text-red-700 dark:text-red-300">{error}</p>
            </div>

            <button
              onClick={handleReset}
              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 transition-colors flex-shrink-0"
              aria-label="Try again"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
