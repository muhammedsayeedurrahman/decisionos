'use client';

import React, { useState } from 'react';
import {
  Search,
  X,
  Filter,
  Star,
  Calendar,
  User,
  FileText,
  CheckSquare,
  AlertCircle,
  CheckCircle,
  Bookmark,
  Save,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { FilterCriteria, QuickFilter, SavedFilter } from '@/hooks/useAdvancedFilters';
import { Role } from '@/config/roles';

interface FilterPanelProps {
  criteria: FilterCriteria;
  updateCriteria: (updates: Partial<FilterCriteria>) => void;
  clearFilters: () => void;
  quickFilters: QuickFilter[];
  applyQuickFilter: (filterId: string) => void;
  savedFilters: SavedFilter[];
  saveCustomFilter: (name: string) => void;
  deleteSavedFilter: (filterId: string) => void;
  applySavedFilter: (filterId: string) => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  isOpen: boolean;
  onClose: () => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  User: <User className="w-3.5 h-3.5" />,
  AlertCircle: <AlertCircle className="w-3.5 h-3.5" />,
  Calendar: <Calendar className="w-3.5 h-3.5" />,
  CheckCircle: <CheckCircle className="w-3.5 h-3.5" />,
  FileText: <FileText className="w-3.5 h-3.5" />,
  CheckSquare: <CheckSquare className="w-3.5 h-3.5" />,
};

const CATEGORIES = ['CUSTOMER', 'SUPPLIER', 'INVOICE', 'PAYMENT', 'COMPLAINT', 'TASK'];
const ROLES: Role[] = ['owner', 'sales', 'production', 'finance'];
const TYPES = ['TASK', 'REMINDER', 'APPROVAL', 'INVOICE'];
const STATUSES = ['pending', 'completed'] as const;

export default function FilterPanel({
  criteria,
  updateCriteria,
  clearFilters,
  quickFilters,
  applyQuickFilter,
  savedFilters,
  saveCustomFilter,
  deleteSavedFilter,
  applySavedFilter,
  hasActiveFilters,
  activeFilterCount,
  isOpen,
  onClose,
}: FilterPanelProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [expandedSections, setExpandedSections] = useState({
    categories: false,
    assignees: false,
    types: false,
    statuses: false,
    dateRange: false,
    saved: false,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleSaveFilter = () => {
    if (filterName.trim()) {
      saveCustomFilter(filterName.trim());
      setFilterName('');
      setSaveDialogOpen(false);
    }
  };

  const toggleCategory = (category: string) => {
    const newCategories = criteria.categories.includes(category)
      ? criteria.categories.filter(c => c !== category)
      : [...criteria.categories, category];
    updateCriteria({ categories: newCategories });
  };

  const toggleAssignee = (assignee: Role) => {
    const newAssignees = criteria.assignees.includes(assignee)
      ? criteria.assignees.filter(a => a !== assignee)
      : [...criteria.assignees, assignee];
    updateCriteria({ assignees: newAssignees });
  };

  const toggleType = (type: string) => {
    const newTypes = criteria.types.includes(type)
      ? criteria.types.filter(t => t !== type)
      : [...criteria.types, type];
    updateCriteria({ types: newTypes });
  };

  const toggleStatus = (status: typeof STATUSES[number]) => {
    const newStatuses = criteria.statuses.includes(status)
      ? criteria.statuses.filter(s => s !== status)
      : [...criteria.statuses, status];
    updateCriteria({ statuses: newStatuses });
  };

  const removeFilter = (filterType: keyof FilterCriteria, value?: any) => {
    if (filterType === 'search') {
      updateCriteria({ search: '' });
    } else if (filterType === 'categories' && value) {
      toggleCategory(value);
    } else if (filterType === 'assignees' && value) {
      toggleAssignee(value);
    } else if (filterType === 'types' && value) {
      toggleType(value);
    } else if (filterType === 'statuses' && value) {
      toggleStatus(value);
    } else if (filterType === 'dateRange') {
      updateCriteria({ dateRange: { start: null, end: null } });
    } else if (filterType === 'starred') {
      updateCriteria({ starred: null });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/30 dark:bg-black/50 backdrop-blur-sm z-[250] flex items-start justify-end p-4 pt-20">
      <div
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <Filter className="w-5 h-5 text-brand-red" />
            <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white">
              Advanced Filters
            </h2>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-mono font-bold bg-brand-red text-white rounded-full">
                {activeFilterCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-200px)] overflow-y-auto p-5 space-y-4">
          {/* Search */}
          <div>
            <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs mb-2">
              Search Tasks
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={criteria.search}
                onChange={(e) => updateCriteria({ search: e.target.value })}
                placeholder="Fuzzy search by title, description..."
                className="w-full pl-10 pr-10 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-red/40"
              />
              {criteria.search && (
                <button
                  onClick={() => updateCriteria({ search: '' })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Filters */}
          <div>
            <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs mb-2">
              Quick Filters
            </label>
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((filter) => (
                <button
                  key={filter.id}
                  onClick={() => applyQuickFilter(filter.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  {ICON_MAP[filter.icon]}
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Chips */}
          {hasActiveFilters && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">
                  Active Filters
                </label>
                <button
                  onClick={clearFilters}
                  className="text-xs font-semibold text-brand-red hover:text-brand-red/80 cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {criteria.search && (
                  <FilterChip
                    label={`Search: "${criteria.search}"`}
                    onRemove={() => removeFilter('search')}
                  />
                )}
                {criteria.categories.map((cat) => (
                  <FilterChip
                    key={cat}
                    label={cat}
                    onRemove={() => removeFilter('categories', cat)}
                  />
                ))}
                {criteria.assignees.map((assignee) => (
                  <FilterChip
                    key={assignee}
                    label={`Assigned: ${assignee}`}
                    onRemove={() => removeFilter('assignees', assignee)}
                  />
                ))}
                {criteria.types.map((type) => (
                  <FilterChip
                    key={type}
                    label={`Type: ${type}`}
                    onRemove={() => removeFilter('types', type)}
                  />
                ))}
                {criteria.statuses.map((status) => (
                  <FilterChip
                    key={status}
                    label={status === 'completed' ? 'Completed' : 'Pending'}
                    onRemove={() => removeFilter('statuses', status)}
                  />
                ))}
                {(criteria.dateRange.start || criteria.dateRange.end) && (
                  <FilterChip
                    label="Date Range"
                    onRemove={() => removeFilter('dateRange')}
                  />
                )}
              </div>
            </div>
          )}

          {/* Category Filter */}
          <FilterSection
            title="Categories"
            count={criteria.categories.length}
            isExpanded={expandedSections.categories}
            onToggle={() => toggleSection('categories')}
          >
            <div className="space-y-2">
              {CATEGORIES.map((category) => (
                <label key={category} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.categories.includes(category)}
                    onChange={() => toggleCategory(category)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-brand-red focus:ring-brand-red/40 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{category}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Assignee Filter */}
          <FilterSection
            title="Assignees"
            count={criteria.assignees.length}
            isExpanded={expandedSections.assignees}
            onToggle={() => toggleSection('assignees')}
          >
            <div className="space-y-2">
              {ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.assignees.includes(role)}
                    onChange={() => toggleAssignee(role)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-brand-red focus:ring-brand-red/40 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{role}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Type Filter */}
          <FilterSection
            title="Types"
            count={criteria.types.length}
            isExpanded={expandedSections.types}
            onToggle={() => toggleSection('types')}
          >
            <div className="space-y-2">
              {TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.types.includes(type)}
                    onChange={() => toggleType(type)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-brand-red focus:ring-brand-red/40 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">{type}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Status Filter */}
          <FilterSection
            title="Status"
            count={criteria.statuses.length}
            isExpanded={expandedSections.statuses}
            onToggle={() => toggleSection('statuses')}
          >
            <div className="space-y-2">
              {STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={criteria.statuses.includes(status)}
                    onChange={() => toggleStatus(status)}
                    className="w-4 h-4 rounded border-zinc-300 dark:border-zinc-700 text-brand-red focus:ring-brand-red/40 cursor-pointer"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300 capitalize">{status}</span>
                </label>
              ))}
            </div>
          </FilterSection>

          {/* Saved Filters */}
          {savedFilters.length > 0 && (
            <FilterSection
              title="Saved Filters"
              count={savedFilters.length}
              isExpanded={expandedSections.saved}
              onToggle={() => toggleSection('saved')}
            >
              <div className="space-y-2">
                {savedFilters.map((filter) => (
                  <div
                    key={filter.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 group"
                  >
                    <button
                      onClick={() => applySavedFilter(filter.id)}
                      className="flex-1 flex items-center gap-2 text-left cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-brand-red" />
                      <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                        {filter.name}
                      </span>
                    </button>
                    <button
                      onClick={() => deleteSavedFilter(filter.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </FilterSection>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30">
          {saveDialogOpen ? (
            <>
              <input
                type="text"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                placeholder="Filter name..."
                className="flex-1 px-3 py-2 text-sm border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-950 focus:outline-none focus:ring-2 focus:ring-brand-red/40"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveFilter()}
              />
              <button
                onClick={handleSaveFilter}
                disabled={!filterName.trim()}
                className="px-4 py-2 text-sm font-semibold bg-brand-red text-white rounded-lg hover:bg-brand-red/90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Save
              </button>
              <button
                onClick={() => setSaveDialogOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              onClick={() => setSaveDialogOpen(true)}
              disabled={!hasActiveFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <Save className="w-4 h-4" />
              Save Current Filter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Filter chip component
function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-brand-red/10 text-brand-red rounded-lg text-xs font-semibold">
      <span>{label}</span>
      <button onClick={onRemove} className="hover:bg-brand-red/20 rounded-full p-0.5 cursor-pointer">
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}

// Collapsible filter section
function FilterSection({
  title,
  count,
  isExpanded,
  onToggle,
  children,
}: {
  title: string;
  count: number;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{title}</span>
          {count > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold bg-brand-red text-white rounded">
              {count}
            </span>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 transition-transform ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isExpanded && <div className="px-4 py-3">{children}</div>}
    </div>
  );
}
