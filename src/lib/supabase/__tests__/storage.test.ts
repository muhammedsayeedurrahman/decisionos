import { describe, it, expect } from 'vitest';
import { formatFileSize, getFileExtension, getFileIcon } from '../storage';

describe('Storage Utilities', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('formats with decimals', () => {
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
  });

  describe('getFileExtension', () => {
    it('extracts extension from filename', () => {
      expect(getFileExtension('document.pdf')).toBe('pdf');
      expect(getFileExtension('image.PNG')).toBe('png');
      expect(getFileExtension('file.name.with.dots.jpg')).toBe('jpg');
    });

    it('returns empty string for no extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('getFileIcon', () => {
    it('returns correct icon for image types', () => {
      expect(getFileIcon('image/jpeg')).toBe('🖼️');
      expect(getFileIcon('image/png')).toBe('🖼️');
    });

    it('returns correct icon for audio types', () => {
      expect(getFileIcon('audio/mpeg')).toBe('🎵');
      expect(getFileIcon('audio/wav')).toBe('🎵');
    });

    it('returns correct icon for document types', () => {
      expect(getFileIcon('application/pdf')).toBe('📄');
      expect(getFileIcon('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe('📝');
    });

    it('returns default icon for unknown types', () => {
      expect(getFileIcon('application/unknown')).toBe('📎');
    });
  });
});
