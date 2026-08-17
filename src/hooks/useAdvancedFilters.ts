'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import Fuse from 'fuse.js';
import { TaskCard } from '@/utils/sharedState';
import { Role } from '@/config/roles';

export interface FilterCriteria {
  search: string;
  categories: string[];
  assignees: Role[];
  types: string[];
  statuses: ('pending' | 'completed')[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  starred: boolean | null;
}

export interface QuickFilter {
  id: string;
  label: string;
  icon: string;
  criteria: Partial<FilterCriteria>;
}

export interface SavedFilter {
  id: string;
  name: string;
  criteria: FilterCriteria;
  createdAt: Date;
}

const INITIAL_CRITERIA: FilterCriteria = {
  search: '',
  categories: [],
  assignees: [],
  types: [],
  statuses: [],
  dateRange: { start: null, end: null },
  starred: null,
};

const QUICK_FILTERS: QuickFilter[] = [
  {
    id: 'my-tasks',
    label: 'My Tasks',
    icon: 'User',
    criteria: { statuses: ['pending'] },
  },
  {
    id: 'urgent',
    label: 'Urgent',
    icon: 'AlertCircle',
    criteria: { categories: ['COMPLAINT'], statuses: ['pending'] },
  },
  {
    id: 'this-week',
    label: 'This Week',
    icon: 'Calendar',
    criteria: {
      dateRange: {
        start: (() => {
          const now = new Date();
          const dayOfWeek = now.getDay();
          const monday = new Date(now);
          monday.setDate(now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
          monday.setHours(0, 0, 0, 0);
          return monday;
        })(),
        end: (() => {
          const now = new Date();
          const dayOfWeek = now.getDay();
          const sunday = new Date(now);
          sunday.setDate(now.getDate() - dayOfWeek + 7);
          sunday.setHours(23, 59, 59, 999);
          return sunday;
        })(),
      },
    },
  },
  {
    id: 'completed',
    label: 'Completed',
    icon: 'CheckCircle',
    criteria: { statuses: ['completed'] },
  },
  {
    id: 'invoices',
    label: 'Invoices',
    icon: 'FileText',
    criteria: { categories: ['INVOICE'] },
  },
  {
    id: 'approvals',
    label: 'Approvals',
    icon: 'CheckSquare',
    criteria: { types: ['APPROVAL'] },
  },
];

const STORAGE_KEY = 'decisionos_advanced_filters';
const SAVED_FILTERS_KEY = 'decisionos_saved_filters';

/**
 * Advanced filtering hook with fuzzy search, multi-criteria filtering,
 * and filter persistence
 */
export function useAdvancedFilters(tasks: TaskCard[], currentRole?: Role) {
  // Load persisted criteria
  const [criteria, setCriteria] = useState<FilterCriteria>(() => {
    if (typeof window === 'undefined') return INITIAL_CRITERIA;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Parse dates
        if (parsed.dateRange) {
          parsed.dateRange.start = parsed.dateRange.start ? new Date(parsed.dateRange.start) : null;
          parsed.dateRange.end = parsed.dateRange.end ? new Date(parsed.dateRange.end) : null;
        }
        return { ...INITIAL_CRITERIA, ...parsed };
      } catch {
        return INITIAL_CRITERIA;
      }
    }
    return INITIAL_CRITERIA;
  });

  // Load saved custom filters
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(SAVED_FILTERS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((f: any) => ({
          ...f,
          createdAt: new Date(f.createdAt),
          criteria: {
            ...f.criteria,
            dateRange: {
              start: f.criteria.dateRange.start ? new Date(f.criteria.dateRange.start) : null,
              end: f.criteria.dateRange.end ? new Date(f.criteria.dateRange.end) : null,
            },
          },
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist criteria changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(criteria));
  }, [criteria]);

  // Persist saved filters changes
  useEffect(() => {
    localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(savedFilters));
  }, [savedFilters]);

  // Configure Fuse.js for fuzzy search
  const fuse = useMemo(
    () =>
      new Fuse(tasks, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'subtext', weight: 0.2 },
          { name: 'category', weight: 0.1 },
        ],
        threshold: 0.3,
        includeScore: true,
      }),
    [tasks]
  );

  // Apply all filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Fuzzy search
    if (criteria.search.trim()) {
      const searchResults = fuse.search(criteria.search);
      result = searchResults.map(r => r.item);
    }

    // Category filter
    if (criteria.categories.length > 0) {
      result = result.filter(task => criteria.categories.includes(task.category));
    }

    // Assignee filter
    if (criteria.assignees.length > 0) {
      result = result.filter(task => criteria.assignees.includes(task.assignedTo));
    }

    // Type filter
    if (criteria.types.length > 0) {
      result = result.filter(task => criteria.types.includes(task.type));
    }

    // Status filter
    if (criteria.statuses.length > 0) {
      result = result.filter(task => {
        const status = task.done ? 'completed' : 'pending';
        return criteria.statuses.includes(status);
      });
    }

    // Date range filter
    if (criteria.dateRange.start || criteria.dateRange.end) {
      result = result.filter(task => {
        if (!task.scheduledDate) return false;
        const taskDate = new Date(task.scheduledDate);

        if (criteria.dateRange.start && taskDate < criteria.dateRange.start) {
          return false;
        }
        if (criteria.dateRange.end && taskDate > criteria.dateRange.end) {
          return false;
        }
        return true;
      });
    }

    // Starred filter
    // Note: This requires starred state from parent component
    // We'll return all tasks and let the parent component handle starred filtering

    return result;
  }, [tasks, criteria, fuse]);

  // Update individual filter criteria
  const updateCriteria = useCallback((updates: Partial<FilterCriteria>) => {
    setCriteria(prev => ({ ...prev, ...updates }));
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setCriteria(INITIAL_CRITERIA);
  }, []);

  // Apply quick filter
  const applyQuickFilter = useCallback((filterId: string) => {
    const quickFilter = QUICK_FILTERS.find(f => f.id === filterId);
    if (quickFilter) {
      setCriteria(prev => ({ ...INITIAL_CRITERIA, ...quickFilter.criteria }));
    }
  }, []);

  // Save current criteria as custom filter
  const saveCustomFilter = useCallback((name: string) => {
    const newFilter: SavedFilter = {
      id: `custom-${Date.now()}`,
      name,
      criteria: { ...criteria },
      createdAt: new Date(),
    };
    setSavedFilters(prev => [...prev, newFilter]);
    return newFilter;
  }, [criteria]);

  // Delete saved filter
  const deleteSavedFilter = useCallback((filterId: string) => {
    setSavedFilters(prev => prev.filter(f => f.id !== filterId));
  }, []);

  // Apply saved filter
  const applySavedFilter = useCallback((filterId: string) => {
    const savedFilter = savedFilters.find(f => f.id === filterId);
    if (savedFilter) {
      setCriteria(savedFilter.criteria);
    }
  }, [savedFilters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return (
      criteria.search.trim() !== '' ||
      criteria.categories.length > 0 ||
      criteria.assignees.length > 0 ||
      criteria.types.length > 0 ||
      criteria.statuses.length > 0 ||
      criteria.dateRange.start !== null ||
      criteria.dateRange.end !== null ||
      criteria.starred !== null
    );
  }, [criteria]);

  // Count active filters
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (criteria.search.trim()) count++;
    if (criteria.categories.length > 0) count++;
    if (criteria.assignees.length > 0) count++;
    if (criteria.types.length > 0) count++;
    if (criteria.statuses.length > 0) count++;
    if (criteria.dateRange.start || criteria.dateRange.end) count++;
    if (criteria.starred !== null) count++;
    return count;
  }, [criteria]);

  return {
    criteria,
    filteredTasks,
    updateCriteria,
    clearFilters,
    quickFilters: QUICK_FILTERS,
    applyQuickFilter,
    savedFilters,
    saveCustomFilter,
    deleteSavedFilter,
    applySavedFilter,
    hasActiveFilters,
    activeFilterCount,
  };
}
