/**
 * Tests for useWorkspace Hook
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useWorkspace } from '../useWorkspace';
import * as sharedState from '@/utils/sharedState';
import { WorkspaceState } from '@/utils/sharedState';
import { NotificationProvider } from '@/contexts/NotificationContext';
import React from 'react';

// Mock the sharedState utilities
vi.mock('@/utils/sharedState', async () => {
  const actual = await vi.importActual('@/utils/sharedState');
  return {
    ...actual,
    getSharedState: vi.fn(),
    saveSharedState: vi.fn(),
  };
});

// Create a stable mock for audio recorder
const mockAudioRecorder = {
  state: 'idle' as const,
  isRecording: false,
  transcription: '',
  detectedLanguage: null,
  error: null,
  audioBlob: null,
  recordingDuration: 0,
  startRecording: vi.fn(),
  stopRecording: vi.fn(),
  cancelRecording: vi.fn(),
  reset: vi.fn(),
  setLanguage: vi.fn(),
  isSupported: true,
};

// Mock the audio recorder hook
vi.mock('@/hooks/useAudioRecorder', () => ({
  useAudioRecorder: () => mockAudioRecorder,
}));

// Mock the file upload hook
vi.mock('@/hooks/useFileUpload', () => ({
  useFileUpload: vi.fn(() => ({
    upload: vi.fn().mockResolvedValue({ path: 'uploads/test.pdf' }),
    uploading: false,
    progress: 0,
    error: null,
  })),
}));

const MOCK_STATE: WorkspaceState = {
  cards: [
    {
      id: 1,
      title: 'Test Task',
      subtext: 'Test subtext',
      type: 'TASK',
      source: 'TEXT',
      category: 'OTHER',
      assignedTo: 'owner',
      done: false,
    },
  ],
  handoffs: [],
  notifications: { owner: 4, sales: 7, production: 3, finance: 5 },
};

// Wrapper component to provide NotificationProvider
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <NotificationProvider>{children}</NotificationProvider>
);

describe('useWorkspace', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // Reset document classes
    document.documentElement.classList.remove('dark');
    // Default mock implementation
    vi.mocked(sharedState.getSharedState).mockReturnValue(MOCK_STATE);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Initialization', () => {
    it('loads workspace state from localStorage on mount', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(sharedState.getSharedState).toHaveBeenCalledOnce();
      expect(result.current.workspaceState).toEqual(MOCK_STATE);
    });

    it('initializes theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');

      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.theme).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('initializes theme from system preference when not in localStorage', () => {
      // Mock matchMedia to prefer dark mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.theme).toBe('dark');
    });

    it('defaults to light theme when no preference', () => {
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.theme).toBe('light');
    });

    it('loads role configuration correctly', () => {
      const { result: ownerResult } = renderHook(() => useWorkspace('owner'), { wrapper });
      expect(ownerResult.current.config.personName).toBe('Rajesh Sharma');
      expect(ownerResult.current.config.id).toBe('owner');
      expect(ownerResult.current.config.roleLabel).toBe('OWNER');

      const { result: salesResult } = renderHook(() => useWorkspace('sales'));
      expect(salesResult.current.config.personName).toBe('Priya Nair');
      expect(salesResult.current.config.id).toBe('sales');
      expect(salesResult.current.config.roleLabel).toBe('SALES MANAGER');
    });
  });

  describe('Theme Toggle', () => {
    it('toggles theme from light to dark', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.theme).toBe('light');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
      expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('toggles theme from dark to light', () => {
      localStorage.setItem('theme', 'dark');
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.theme).toBe('dark');

      act(() => {
        result.current.toggleTheme();
      });

      expect(result.current.theme).toBe('light');
      expect(localStorage.getItem('theme')).toBe('light');
      expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
  });

  describe('Task Mutations', () => {
    it('marks task as done', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.handleMarkDone(1);
      });

      expect(result.current.workspaceState.cards[0].done).toBe(true);
      expect(sharedState.saveSharedState).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: expect.arrayContaining([
            expect.objectContaining({ id: 1, done: true }),
          ]),
        })
      );
    });

    it('toggles task done state', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      // Mark done
      act(() => {
        result.current.handleMarkDone(1);
      });
      expect(result.current.workspaceState.cards[0].done).toBe(true);

      // Mark undone
      act(() => {
        result.current.handleMarkDone(1);
      });
      expect(result.current.workspaceState.cards[0].done).toBe(false);
    });

    it('dismisses task', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.handleDismiss(1);
      });

      expect(result.current.workspaceState.cards).toHaveLength(0);
      expect(sharedState.saveSharedState).toHaveBeenCalledWith(
        expect.objectContaining({
          cards: [],
        })
      );
    });

    it('handles dismiss of non-existent task gracefully', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.handleDismiss(999);
      });

      // Should not crash, cards remain unchanged
      expect(result.current.workspaceState.cards).toHaveLength(1);
    });

    it('sends task to board with alert', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.handleSendToBoard('Test Task');
      });

      expect(result.current.alertMsg).toBe('"Test Task" advanced to Loom Workflows Board.');

      // Alert should clear after 3 seconds
      act(() => {
        vi.advanceTimersByTime(3000);
      });
      expect(result.current.alertMsg).toBeNull();

      vi.useRealTimers();
    });
  });

  describe('Notification Management', () => {
    it('clears notifications for current role', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.workspaceState.notifications.owner).toBe(4);

      act(() => {
        result.current.handleClearNotifications();
      });

      expect(result.current.workspaceState.notifications.owner).toBe(0);
      expect(result.current.alertMsg).toBe('Notifications cleared.');
      expect(sharedState.saveSharedState).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('does not clear notifications for other roles', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.handleClearNotifications();
      });

      expect(result.current.workspaceState.notifications.sales).toBe(7);
      expect(result.current.workspaceState.notifications.production).toBe(3);
      expect(result.current.workspaceState.notifications.finance).toBe(5);
    });
  });

  describe('Text Directive Handling', () => {
    it('structures text directive and creates task', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.setTextDirective('Call Priya about new order');
      });

      act(() => {
        result.current.handleStructureText(new Event('submit') as any);
      });

      expect(result.current.workspaceState.cards).toHaveLength(2);
      expect(result.current.workspaceState.cards[0].title).toBe('Call Priya about new order');
      expect(result.current.workspaceState.cards[0].assignedTo).toBe('sales');
      expect(result.current.workspaceState.cards[0].category).toBe('CUSTOMER');
      expect(result.current.alertMsg).toContain('SALES');
      expect(result.current.textDirective).toBe(''); // Cleared after submit

      vi.useRealTimers();
    });

    it('does not create task for empty text directive', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.setTextDirective('   ');
      });

      act(() => {
        result.current.handleStructureText(new Event('submit') as any);
      });

      expect(result.current.workspaceState.cards).toHaveLength(1); // Only the initial mock task
    });

    it('increments notification for other role when creating task', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.setTextDirective('Ask Amit to check looms');
      });

      act(() => {
        result.current.handleStructureText(new Event('submit') as any);
      });

      // Task assigned to production, so production notifications should increase
      expect(result.current.workspaceState.notifications.production).toBe(4); // Was 3
    });

    it('does not increment notification when assigning to self', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.setTextDirective('Random task for owner');
      });

      act(() => {
        result.current.handleStructureText(new Event('submit') as any);
      });

      // Task assigned to owner (default for unmatched keywords), no notification
      expect(result.current.workspaceState.notifications.owner).toBe(4); // Unchanged
    });
  });

  describe('Alert Messages', () => {
    it('triggers alert and auto-clears after 3 seconds', async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.alertMsg).toBeNull();

      act(() => {
        result.current.triggerAlert('Test alert message');
      });

      expect(result.current.alertMsg).toBe('Test alert message');

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.alertMsg).toBeNull();

      vi.useRealTimers();
    });

    it('overwrites previous alert when new one is triggered', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.triggerAlert('First alert');
      });

      expect(result.current.alertMsg).toBe('First alert');

      act(() => {
        result.current.triggerAlert('Second alert');
      });

      expect(result.current.alertMsg).toBe('Second alert');

      vi.useRealTimers();
    });
  });

  describe('Cross-Tab Sync', () => {
    it('updates state when storage event is received', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      const newState: WorkspaceState = {
        cards: [
          {
            id: 2,
            title: 'New Task from Another Tab',
            subtext: '',
            type: 'TASK',
            source: 'TEXT',
            category: 'OTHER',
            assignedTo: 'owner',
            done: false,
          },
        ],
        handoffs: [],
        notifications: { owner: 5, sales: 8, production: 4, finance: 6 },
      };

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'sharma_workspace_state',
          newValue: JSON.stringify(newState),
        });
        window.dispatchEvent(event);
      });

      expect(result.current.workspaceState.cards[0].id).toBe(2);
      expect(result.current.workspaceState.notifications.owner).toBe(5);
    });

    it('ignores storage events for other keys', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      const originalState = result.current.workspaceState;

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'some_other_key',
          newValue: JSON.stringify({ random: 'data' }),
        });
        window.dispatchEvent(event);
      });

      expect(result.current.workspaceState).toEqual(originalState);
    });

    it('handles malformed JSON in storage event gracefully', () => {
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      const originalState = result.current.workspaceState;

      act(() => {
        const event = new StorageEvent('storage', {
          key: 'sharma_workspace_state',
          newValue: 'invalid json{]',
        });
        window.dispatchEvent(event);
      });

      // Should not crash, state unchanged
      expect(result.current.workspaceState).toEqual(originalState);
    });
  });

  describe('Edge Cases', () => {
    it('handles empty workspace state', () => {
      vi.mocked(sharedState.getSharedState).mockReturnValue({
        cards: [],
        handoffs: [],
        notifications: { owner: 0, sales: 0, production: 0, finance: 0 },
      });

      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      expect(result.current.workspaceState.cards).toHaveLength(0);
    });

    it('handles multiple rapid alert triggers', () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useWorkspace('owner'), { wrapper });

      act(() => {
        result.current.triggerAlert('Alert 1');
        result.current.triggerAlert('Alert 2');
        result.current.triggerAlert('Alert 3');
      });

      // Only the last alert should be visible
      expect(result.current.alertMsg).toBe('Alert 3');

      vi.useRealTimers();
    });
  });
});
