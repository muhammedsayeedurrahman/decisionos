import { createClient } from './client';

const supabase = createClient();

export interface UploadResult {
  path: string;
  url: string;
  size: number;
  type: string;
}

export interface UploadOptions {
  bucket: 'documents' | 'avatars' | 'voice-recordings';
  folder?: string;
  maxSize?: number; // in bytes
  allowedTypes?: string[];
}

const DEFAULT_MAX_SIZE = 10 * 1024 * 1024; // 10MB

const DEFAULT_ALLOWED_TYPES = {
  documents: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
    'text/plain',
    'text/csv',
  ],
  avatars: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  'voice-recordings': [
    'audio/wav',
    'audio/mpeg',
    'audio/mp4',
    'audio/webm',
    'audio/ogg',
  ],
};

/**
 * Upload file to Supabase Storage
 */
export async function uploadFile(
  file: File,
  options: UploadOptions
): Promise<UploadResult> {
  const {
    bucket,
    folder = '',
    maxSize = DEFAULT_MAX_SIZE,
    allowedTypes = DEFAULT_ALLOWED_TYPES[bucket],
  } = options;

  // Validate file size
  if (file.size > maxSize) {
    throw new Error(
      `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds limit (${(maxSize / 1024 / 1024).toFixed(2)}MB)`
    );
  }

  // Validate file type
  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      `File type ${file.type} not allowed. Allowed types: ${allowedTypes.join(', ')}`
    );
  }

  // Generate unique filename
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = file.name.split('.').pop();
  const sanitizedName = file.name
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars
    .substring(0, 50); // Limit length

  const filename = `${sanitizedName}-${timestamp}-${randomString}.${extension}`;
  const path = folder ? `${folder}/${filename}` : filename;

  // Upload file
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(data.path);

  return {
    path: data.path,
    url: urlData.publicUrl,
    size: file.size,
    type: file.type,
  };
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: 'documents' | 'avatars' | 'voice-recordings',
  path: string
): Promise<void> {
  const { error } = await supabase.storage.from(bucket).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Get signed URL for private file (expires in 1 hour)
 */
export async function getSignedUrl(
  bucket: 'documents' | 'avatars' | 'voice-recordings',
  path: string,
  expiresIn: number = 3600 // 1 hour in seconds
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`);
  }

  return data.signedUrl;
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: 'documents' | 'avatars' | 'voice-recordings',
  folder: string = ''
): Promise<Array<{ name: string; size: number; createdAt: string }>> {
  const { data, error } = await supabase.storage.from(bucket).list(folder, {
    sortBy: { column: 'created_at', order: 'desc' },
  });

  if (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }

  return data.map((file) => ({
    name: file.name,
    size: file.metadata?.size || 0,
    createdAt: file.created_at,
  }));
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  // Only return extension if there's actually a dot in the filename
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
}

/**
 * Get file icon based on type
 */
export function getFileIcon(type: string): string {
  if (type.startsWith('image/')) return '🖼️';
  if (type.startsWith('audio/')) return '🎵';
  if (type.startsWith('video/')) return '🎥';
  if (type === 'application/pdf') return '📄';
  if (type.includes('word')) return '📝';
  if (type.includes('sheet') || type.includes('excel')) return '📊';
  if (type.includes('presentation') || type.includes('powerpoint')) return '📽️';
  if (type === 'text/plain') return '📃';
  if (type === 'text/csv') return '📋';
  return '📎';
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
