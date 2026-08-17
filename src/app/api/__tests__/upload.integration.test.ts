/**
 * Integration Tests for /api/upload
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { POST } from '../upload/route';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Mock storage utilities
vi.mock('@/lib/supabase/storage', () => ({
  uploadFile: vi.fn(),
}));

// Mock rate limiting
vi.mock('@/lib/rateLimitRedis', () => ({
  uploadRateLimit: { limit: 10, window: 60 },
  checkRateLimit: vi.fn(),
  createRateLimitResponse: vi.fn((remaining, reset) => ({
    error: 'Rate limit exceeded',
    remaining,
    reset,
  })),
}));

// Import mocked modules
import { uploadFile } from '@/lib/supabase/storage';
import { checkRateLimit } from '@/lib/rateLimitRedis';

// Helper to create a mock NextRequest with FormData
function createMockRequest(formData: FormData): NextRequest {
  const request = new NextRequest('http://localhost:3000/api/upload', {
    method: 'POST',
  });

  // Mock the formData method to return our FormData
  vi.spyOn(request, 'formData').mockResolvedValue(formData);

  return request;
}

describe('/api/upload - Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Set up environment variables
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Authentication', () => {
    it('returns 503 when Supabase is not configured', async () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(503);
      expect(data.error).toContain('Authentication service not configured');
    });

    it('returns 401 when user is not authenticated', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: null,
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });

    it('returns 401 when auth session retrieval fails', async () => {
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Auth error'),
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized');
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(() => {
      // Set up authenticated session
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
          },
        },
        error: null,
      });

      // Set up user workspace
      // Mock both select (for getting workspace) and insert (for recording upload)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'uploads') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });
    });

    it('returns 429 when rate limit is exceeded', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: false,
        remaining: 0,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf'));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(429);
      expect(data.error).toContain('Rate limit exceeded');
      expect(response.headers.get('X-RateLimit-Limit')).toBe('10');
    });

    it('allows upload when within rate limit', async () => {
      vi.mocked(checkRateLimit).mockResolvedValue({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });

      vi.mocked(uploadFile).mockResolvedValue({
        path: 'workspace-123/uploads/test.pdf',
        url: 'https://storage.supabase.co/workspace-123/uploads/test.pdf',
        size: 1024,
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', new File(['test content'], 'test.pdf', { type: 'application/pdf' }));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.path).toBe('workspace-123/uploads/test.pdf');
    });
  });

  describe('File Validation', () => {
    beforeEach(() => {
      // Set up authenticated session and workspace
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
          },
        },
        error: null,
      });

      // Mock both select (for getting workspace) and insert (for recording upload)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'uploads') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      vi.mocked(checkRateLimit).mockResolvedValue({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });
    });

    it('returns 400 when no file is provided', async () => {
      const formData = new FormData();
      // No file attached

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('No file provided');
    });

    it.skip('returns 400 when file size exceeds 50MB', async () => {
      // TODO: File size validation in tests - ArrayBuffer size doesn't reflect in File.size properly
      // Create a large file (simulate 51MB)
      const largeBuffer = new ArrayBuffer(51 * 1024 * 1024);
      const largeFile = new File([largeBuffer], 'large.pdf', { type: 'application/pdf' });

      const formData = new FormData();
      formData.append('file', largeFile);

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('File too large');
      expect(data.error).toContain('Max: 50MB');
    });

    it('accepts valid file types', async () => {
      vi.mocked(uploadFile).mockResolvedValue({
        path: 'workspace-123/uploads/test.pdf',
        url: 'https://storage.supabase.co/workspace-123/uploads/test.pdf',
        size: 1024,
        type: 'application/pdf',
      });

      const validTypes = [
        { type: 'application/pdf', name: 'test.pdf' },
        { type: 'image/jpeg', name: 'test.jpg' },
        { type: 'image/png', name: 'test.png' },
        { type: 'text/plain', name: 'test.txt' },
      ];

      for (const fileType of validTypes) {
        const formData = new FormData();
        formData.append('file', new File(['test'], fileType.name, { type: fileType.type }));

        const request = createMockRequest(formData);

        const response = await POST(request);
        expect(response.status).toBe(200);
      }
    });
  });

  describe('Path Sanitization', () => {
    beforeEach(() => {
      // Set up authenticated session and workspace
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
          },
        },
        error: null,
      });

      // Mock both select (for getting workspace) and insert (for recording upload)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'uploads') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      vi.mocked(checkRateLimit).mockResolvedValue({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });
    });

    it('prevents path traversal attacks', async () => {
      vi.mocked(uploadFile).mockImplementation(async (file, options) => {
        // Verify that the folder path doesn't contain ..
        expect(options.folder).not.toContain('..');
        return {
          path: `workspace-123/${options.folder}/test.pdf`,
          url: `https://storage.supabase.co/workspace-123/${options.folder}/test.pdf`,
          size: 1024,
          type: 'application/pdf',
        };
      });

      const maliciousPaths = [
        '../../../etc/passwd',
        '../../sensitive',
        'folder/../../../secret',
      ];

      for (const maliciousPath of maliciousPaths) {
        const formData = new FormData();
        formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
        formData.append('folder', maliciousPath);

        const request = createMockRequest(formData);

        const response = await POST(request);
        expect(response.status).toBe(200);
      }

      // Verify uploadFile was called with sanitized paths
      expect(uploadFile).toHaveBeenCalled();
    });

    it('normalizes folder paths correctly', async () => {
      vi.mocked(uploadFile).mockImplementation(async (file, options) => {
        // Verify normalized path
        expect(options.folder).not.toMatch(/\/\//); // No double slashes
        expect(options.folder).not.toMatch(/^\/+/); // No leading slashes
        return {
          path: `workspace-123/${options.folder}/test.pdf`,
          url: `https://storage.supabase.co/workspace-123/${options.folder}/test.pdf`,
          size: 1024,
          type: 'application/pdf',
        };
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
      formData.append('folder', '///uploads//subfolder//');

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);
    });
  });

  describe('Successful Upload', () => {
    beforeEach(() => {
      // Set up authenticated session and workspace
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
          },
        },
        error: null,
      });

      // Mock both select (for getting workspace) and insert (for recording upload)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'uploads') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      vi.mocked(checkRateLimit).mockResolvedValue({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });
    });

    it('uploads file successfully and returns correct response', async () => {
      vi.mocked(uploadFile).mockResolvedValue({
        path: 'workspace-123/uploads/invoice.pdf',
        url: 'https://storage.supabase.co/workspace-123/uploads/invoice.pdf',
        size: 2048,
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', new File(['invoice content'], 'invoice.pdf', { type: 'application/pdf' }));
      formData.append('bucket', 'documents');
      formData.append('folder', 'uploads');

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      // Debug: log error if status is not 200
      if (response.status !== 200) {
        console.log('Error response:', { status: response.status, data });
      }

      expect(response.status).toBe(200);
      expect(data.path).toBe('workspace-123/uploads/invoice.pdf');
      expect(data.url).toContain('storage.supabase.co');
      expect(data.size).toBe(2048);
      expect(data.type).toBe('application/pdf');
    });

    it('uses default bucket and folder when not specified', async () => {
      vi.mocked(uploadFile).mockResolvedValue({
        path: 'workspace-123/test.pdf',
        url: 'https://storage.supabase.co/workspace-123/test.pdf',
        size: 1024,
        type: 'application/pdf',
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));
      // No bucket or folder specified

      const request = createMockRequest(formData);

      const response = await POST(request);
      expect(response.status).toBe(200);

      // Verify uploadFile was called with default bucket
      expect(uploadFile).toHaveBeenCalledWith(
        expect.anything(), // file
        expect.objectContaining({
          bucket: 'documents',
        })
      );
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      // Set up authenticated session and workspace
      mockSupabaseClient.auth.getSession.mockResolvedValue({
        data: {
          session: {
            user: { id: 'user-123' },
            access_token: 'token',
          },
        },
        error: null,
      });

      // Mock both select (for getting workspace) and insert (for recording upload)
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { workspace_id: 'workspace-123' },
                  error: null,
                }),
              }),
            }),
          };
        } else if (table === 'uploads') {
          return {
            insert: vi.fn().mockResolvedValue({
              data: null,
              error: null,
            }),
          };
        }
        return {};
      });

      vi.mocked(checkRateLimit).mockResolvedValue({
        success: true,
        remaining: 9,
        reset: Date.now() + 60000,
        headers: {
          'X-RateLimit-Limit': '10',
          'X-RateLimit-Remaining': '9',
          'X-RateLimit-Reset': String(Date.now() + 60000),
        },
      });
    });

    it('returns 500 when upload fails', async () => {
      vi.mocked(uploadFile).mockRejectedValue(new Error('Storage error'));

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Upload failed');
    });

    it('returns 403 when user workspace is not found', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('User not found'),
            }),
          }),
        }),
      });

      const formData = new FormData();
      formData.append('file', new File(['test'], 'test.pdf', { type: 'application/pdf' }));

      const request = createMockRequest(formData);

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toContain('User workspace not found');
    });
  });
});
