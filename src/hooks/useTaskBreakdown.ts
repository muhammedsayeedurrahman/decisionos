import { useState } from 'react';
import type { SubTask, TaskBreakdownResponse } from '@/app/api/task-breakdown/route';

export interface UseTaskBreakdownOptions {
  workspaceId?: string;
  onSuccess?: (breakdown: TaskBreakdownResponse) => void;
  onError?: (error: string) => void;
}

export function useTaskBreakdown(options: UseTaskBreakdownOptions = {}) {
  const [loading, setLoading] = useState(false);
  const [breakdown, setBreakdown] = useState<TaskBreakdownResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const breakdownTask = async (task: string, context?: string) => {
    setLoading(true);
    setError(null);
    setBreakdown(null);

    try {
      const response = await fetch('/api/task-breakdown', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          task,
          context,
          workspaceId: options.workspaceId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to break down task');
      }

      setBreakdown(data);

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);

      if (options.onError) {
        options.onError(errorMessage);
      }

      throw err;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setBreakdown(null);
    setError(null);
    setLoading(false);
  };

  return {
    loading,
    breakdown,
    error,
    breakdownTask,
    reset,
  };
}
