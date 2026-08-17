import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getWorkspaceProfiles, getProfile, getProfileByRole } from '../profiles';
import { createClient } from '../../client';

// Mock the Supabase client
vi.mock('../../client', () => ({
  createClient: vi.fn(),
}));

describe('Profile Queries', () => {
  let mockSupabase: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Create mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    };

    vi.mocked(createClient).mockReturnValue(mockSupabase);
  });

  describe('getWorkspaceProfiles', () => {
    it('fetches all profiles for a workspace', async () => {
      const mockProfiles = [
        {
          id: 'user-1',
          workspace_id: 'workspace-1',
          role: 'owner',
          full_name: 'John Doe',
          email: 'john@example.com',
          avatar_url: null,
          phone: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 'user-2',
          workspace_id: 'workspace-1',
          role: 'sales',
          full_name: 'Jane Smith',
          email: 'jane@example.com',
          avatar_url: 'https://example.com/avatar.jpg',
          phone: '+1234567890',
          created_at: '2024-01-02T00:00:00Z',
          updated_at: '2024-01-02T00:00:00Z',
        },
      ];

      mockSupabase.order.mockResolvedValue({
        data: mockProfiles,
        error: null,
      });

      const result = await getWorkspaceProfiles('workspace-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1');
      expect(mockSupabase.order).toHaveBeenCalledWith('created_at', { ascending: true });

      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'user-1',
        workspaceId: 'workspace-1',
        role: 'owner',
        fullName: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('throws error when fetch fails', async () => {
      mockSupabase.order.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getWorkspaceProfiles('workspace-1')).rejects.toThrow(
        'Failed to fetch workspace profiles: Database error'
      );
    });
  });

  describe('getProfile', () => {
    it('fetches a single profile by user ID', async () => {
      const mockProfile = {
        id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'owner',
        full_name: 'John Doe',
        email: 'john@example.com',
        avatar_url: null,
        phone: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.single.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getProfile('user-1');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('id', 'user-1');
      expect(mockSupabase.single).toHaveBeenCalled();

      expect(result).toMatchObject({
        id: 'user-1',
        fullName: 'John Doe',
        email: 'john@example.com',
      });
    });

    it('returns null when profile not found', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Not found error code
      });

      const result = await getProfile('non-existent-user');

      expect(result).toBeNull();
    });

    it('throws error for other fetch failures', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      });

      await expect(getProfile('user-1')).rejects.toThrow(
        'Failed to fetch profile: Database error'
      );
    });
  });

  describe('getProfileByRole', () => {
    it('fetches profile by workspace and role', async () => {
      const mockProfile = {
        id: 'user-1',
        workspace_id: 'workspace-1',
        role: 'sales',
        full_name: 'Jane Smith',
        email: 'jane@example.com',
        avatar_url: null,
        phone: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      mockSupabase.maybeSingle.mockResolvedValue({
        data: mockProfile,
        error: null,
      });

      const result = await getProfileByRole('workspace-1', 'sales');

      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
      expect(mockSupabase.select).toHaveBeenCalledWith('*');
      expect(mockSupabase.eq).toHaveBeenCalledWith('workspace_id', 'workspace-1');
      expect(mockSupabase.eq).toHaveBeenCalledWith('role', 'sales');
      expect(mockSupabase.maybeSingle).toHaveBeenCalled();

      expect(result).toMatchObject({
        id: 'user-1',
        role: 'sales',
        fullName: 'Jane Smith',
      });
    });

    it('returns null when no matching profile found', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await getProfileByRole('workspace-1', 'production');

      expect(result).toBeNull();
    });

    it('throws error when fetch fails', async () => {
      mockSupabase.maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error' },
      });

      await expect(getProfileByRole('workspace-1', 'owner')).rejects.toThrow(
        'Failed to fetch profile by role: Database error'
      );
    });
  });
});
