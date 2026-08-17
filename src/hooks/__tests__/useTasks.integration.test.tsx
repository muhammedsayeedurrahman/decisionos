/**
 * Integration Tests for Task Lifecycle
 * Tests the complete CRUD operations for tasks using Supabase
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks } from '../useTasks';
import { Role } from '@/types/database.types';

// Mock setup using vi.hoisted to avoid hoisting issues
const { mockChannel, mockSupabaseClient, mockProfile } = vi.hoisted(() => {
  const mockChannel = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
    unsubscribe: vi.fn(),
  };

  const mockSupabaseClient = {
    from: vi.fn(),
    channel: vi.fn(() => mockChannel),
    removeChannel: vi.fn(),
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'owner' as Role,
    workspace_id: 'workspace-123',
    created_at: new Date().toISOString(),
  };

  return { mockChannel, mockSupabaseClient, mockProfile };
});

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

// Mock Auth Context
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    profile: mockProfile,
    loading: false,
  }),
}));

// Mock Notification Context
vi.mock('@/contexts/NotificationContext', () => ({
  useNotifications: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
}));

describe('useTasks - Task Lifecycle Integration Tests', () => {
  const mockTasks = [
    {
      id: 1,
      workspace_id: 'workspace-123',
      title: 'Task 1',
      description: 'Description 1',
      type: 'TASK' as const,
      source: 'CAPTURE' as const,
      category: 'CUSTOMER' as const,
      assigned_to: 'owner' as Role,
      created_by: 'user-123',
      done: false,
      created_at: '2026-08-15T10:00:00Z',
      updated_at: '2026-08-15T10:00:00Z',
    },
    {
      id: 2,
      workspace_id: 'workspace-123',
      title: 'Task 2',
      description: 'Description 2',
      type: 'REMINDER' as const,
      source: 'CAPTURE' as const,
      category: 'INVOICE' as const,
      assigned_to: 'sales' as Role,
      created_by: 'user-123',
      done: false,
      created_at: '2026-08-15T11:00:00Z',
      updated_at: '2026-08-15T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Reset channel mock to always be chainable
    mockChannel.on.mockReturnValue(mockChannel);
    mockChannel.subscribe.mockReturnValue(mockChannel);
    mockSupabaseClient.channel.mockReturnValue(mockChannel);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Task Fetching', () => {
    it('fetches tasks for a workspace on mount', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockTasks,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('tasks');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(result.current.tasks[0].title).toBe('Task 1');
      expect(result.current.tasks[1].title).toBe('Task 2');
    });

    it('handles fetch errors gracefully', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Database connection failed'),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toEqual([]);
      });
    });

    it('filters tasks by workspace_id', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({
          data: mockTasks,
          error: null,
        }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      mockSupabaseClient.from.mockReturnValue({
        select: mockSelect,
      });

      renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(mockEq).toHaveBeenCalledWith('workspace_id', 'workspace-123');
      });
    });
  });

  describe('Task Creation', () => {
    it('creates a new task successfully', async () => {
      const newTask = {
        workspace_id: 'workspace-123',
        title: 'New Task',
        description: 'New Description',
        type: 'TASK' as const,
        source: 'CAPTURE' as const,
        category: 'CUSTOMER' as const,
        assigned_to: 'owner' as Role,
        created_by: 'user-123',
        done: false,
      };

      const createdTask = {
        ...newTask,
        id: 3,
        created_at: '2026-08-15T12:00:00Z',
        updated_at: '2026-08-15T12:00:00Z',
      };

      // Mock fetchTasks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      // Mock createTask
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: createdTask,
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await act(async () => {
        await result.current.createTask({
          title: 'New Task',
          description: 'New Description',
          category: 'CUSTOMER',
        });
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'New Task',
          description: 'New Description',
          workspace_id: 'workspace-123',
          created_by: 'user-123',
        })
      );
    });

    it('handles creation errors', async () => {
      // Mock fetchTasks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      // Mock createTask error
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: new Error('Insert failed'),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await act(async () => {
        const result_inner = await result.current.createTask({
          title: 'New Task',
          description: 'New Description',
          category: 'CUSTOMER',
        });
        expect(result_inner).toBeNull();
      });
    });

    it('sets correct defaults for new tasks', async () => {
      // Mock fetchTasks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 1 },
            error: null,
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        insert: mockInsert,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await act(async () => {
        await result.current.createTask({
          title: 'Task with defaults',
          category: 'CUSTOMER',
        });
      });

      expect(mockInsert).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'TASK',
          source: 'TEXT',
          done: false,
          assigned_to: undefined,
        })
      );
    });
  });

  describe('Task Updates', () => {
    beforeEach(() => {
      // Mock fetchTasks to return mock tasks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });
    });

    it('updates a task successfully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockTasks[0], title: 'Updated Task' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.updateTask(1, { title: 'Updated Task' });
      });

      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Updated Task' });
    });

    it('toggles task done status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { ...mockTasks[0], done: true },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.toggleDone(1);
      });

      expect(mockUpdate).toHaveBeenCalledWith({ done: true });
    });

    it('handles update errors gracefully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: new Error('Update failed'),
            }),
          }),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        update: mockUpdate,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      await act(async () => {
        const updateResult = await result.current.updateTask(1, { title: 'Failed Update' });
        expect(updateResult).toBeNull();
      });
    });
  });

  describe('Task Deletion', () => {
    beforeEach(() => {
      // Mock fetchTasks to return mock tasks
      mockSupabaseClient.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });
    });

    it('deletes a task successfully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: null,
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteTask(1);
      });

      expect(mockDelete).toHaveBeenCalled();
    });

    it('handles deletion errors gracefully', async () => {
      const mockDelete = vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          error: new Error('Delete failed'),
        }),
      });

      mockSupabaseClient.from.mockReturnValue({
        delete: mockDelete,
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      await act(async () => {
        await result.current.deleteTask(1);
      });

      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe.skip('Real-time Subscriptions', () => {
    // TODO: Fix realtime subscription mocks
    it('subscribes to task changes on mount', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(mockSupabaseClient.channel).toHaveBeenCalledWith('tasks_changes');
        expect(mockChannel.on).toHaveBeenCalledWith(
          'postgres_changes',
          expect.objectContaining({
            event: '*',
            schema: 'public',
            table: 'tasks',
          }),
          expect.any(Function)
        );
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });
    });

    it('unsubscribes from changes on unmount', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        }),
      });

      const { unmount } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(mockChannel.subscribe).toHaveBeenCalled();
      });

      unmount();

      expect(mockSupabaseClient.removeChannel).toHaveBeenCalledWith(mockChannel);
    });

    it('handles INSERT events from real-time subscription', async () => {
      let realtimeHandler: any = null;

      mockChannel.on.mockImplementation((event, filter, handler) => {
        realtimeHandler = handler;
        return mockChannel;
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Simulate INSERT event
      const newTask = {
        id: 3,
        workspace_id: 'workspace-123',
        title: 'Real-time Task',
        description: 'Added via real-time',
        type: 'TASK' as const,
        source: 'CAPTURE' as const,
        category: 'CUSTOMER' as const,
        assigned_to: 'owner' as Role,
        created_by: 'user-123',
        done: false,
        created_at: '2026-08-15T13:00:00Z',
        updated_at: '2026-08-15T13:00:00Z',
      };

      act(() => {
        realtimeHandler({
          eventType: 'INSERT',
          new: newTask,
          old: {},
        });
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(3);
        expect(result.current.tasks[2].title).toBe('Real-time Task');
      });
    });

    it('handles UPDATE events from real-time subscription', async () => {
      let realtimeHandler: any = null;

      mockChannel.on.mockImplementation((event, filter, handler) => {
        realtimeHandler = handler;
        return mockChannel;
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Simulate UPDATE event
      const updatedTask = {
        ...mockTasks[0],
        title: 'Updated via real-time',
        done: true,
      };

      act(() => {
        realtimeHandler({
          eventType: 'UPDATE',
          new: updatedTask,
          old: mockTasks[0],
        });
      });

      await waitFor(() => {
        expect(result.current.tasks[0].title).toBe('Updated via real-time');
        expect(result.current.tasks[0].done).toBe(true);
      });
    });

    it('handles DELETE events from real-time subscription', async () => {
      let realtimeHandler: any = null;

      mockChannel.on.mockImplementation((event, filter, handler) => {
        realtimeHandler = handler;
        return mockChannel;
      });

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });

      // Simulate DELETE event
      act(() => {
        realtimeHandler({
          eventType: 'DELETE',
          old: mockTasks[0],
          new: {},
        });
      });

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].id).toBe(2);
      });
    });
  });

  describe('Role-based Task Filtering', () => {
    it('returns all tasks for owner role', async () => {
      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockTasks,
              error: null,
            }),
          }),
        }),
      });

      const { result } = renderHook(() => useTasks('owner'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(2);
      });
    });

    it('filters tasks for non-owner roles', async () => {
      const salesTasks = mockTasks.filter(t => t.assigned_to === 'sales');

      mockSupabaseClient.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: salesTasks,
              error: null,
            }),
          }),
        }),
      });

      // Mock profile as sales
      vi.mocked(vi.importActual('@/contexts/AuthContext')).useAuth = () => ({
        user: { id: 'user-456', email: 'sales@example.com' },
        profile: { ...mockProfile, role: 'sales' as Role },
        loading: false,
      });

      const { result } = renderHook(() => useTasks('sales'));

      await waitFor(() => {
        expect(result.current.tasks).toHaveLength(1);
        expect(result.current.tasks[0].assigned_to).toBe('sales');
      });
    });
  });
});
