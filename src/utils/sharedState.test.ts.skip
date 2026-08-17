/**
 * Tests for Shared State Utilities
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  routeDirective,
  explainRouting,
  getSharedState,
  saveSharedState,
  TaskCard,
  WorkspaceState,
} from './sharedState';

describe('routeDirective', () => {
  it('routes sales keywords to sales manager', () => {
    const testCases = [
      'Contact Priya about new order',
      'Call the sales team',
      'Sell more fabric to retailers',
      'New retailer inquiry',
    ];

    testCases.forEach((text) => {
      const result = routeDirective(text);
      expect(result.assignedTo).toBe('sales');
      expect(result.category).toBe('CUSTOMER');
    });
  });

  it('routes production keywords to production chief', () => {
    const testCases = [
      'Tell Amit to check the looms',
      'Production line is down',
      'Check fabric quality',
      'Produce 1000 meters',
    ];

    testCases.forEach((text) => {
      const result = routeDirective(text);
      expect(result.assignedTo).toBe('production');
      expect(result.category).toBe('SUPPLIER');
    });
  });

  it('routes finance keywords to finance controller', () => {
    const testCases = [
      'Pay invoice #1234',
      'Sunita needs to review costs',
      'Finance approval needed',
      'Payment overdue',
    ];

    testCases.forEach((text) => {
      const result = routeDirective(text);
      expect(result.assignedTo).toBe('finance');
      expect(result.category).toBe('INVOICE');
    });
  });

  it('defaults to owner for unmatched keywords', () => {
    const result = routeDirective('Random task with no specific keywords');
    expect(result.assignedTo).toBe('owner');
    expect(result.category).toBe('OTHER');
  });

  it('prioritizes sales keywords over other keywords', () => {
    const result = routeDirective('Ask Priya about production schedule');
    // Should route to sales because 'priya' appears first
    expect(result.assignedTo).toBe('sales');
  });

  it('handles case-insensitive matching', () => {
    expect(routeDirective('PRIYA NEEDS THIS').assignedTo).toBe('sales');
    expect(routeDirective('amit should handle').assignedTo).toBe('production');
    expect(routeDirective('INVOICE payment').assignedTo).toBe('finance');
  });

  it('returns routing reason with matched keywords', () => {
    const result = routeDirective('Contact Priya about sales');
    expect(result.reason).toContain('priya');
    expect(result.reason).toContain('sales');
    expect(result.reason).toContain('Sales');
  });
});

describe('explainRouting', () => {
  it('explains sales routing with matched keywords', () => {
    const card: TaskCard = {
      id: 1,
      title: 'Contact Priya',
      subtext: 'About new order',
      type: 'TASK',
      source: 'TEXT',
      category: 'CUSTOMER',
      assignedTo: 'sales',
      done: false,
    };

    const explanation = explainRouting(card);
    expect(explanation).toContain('priya');
    expect(explanation).toContain('Sales');
  });

  it('explains production routing with matched keywords', () => {
    const card: TaskCard = {
      id: 2,
      title: 'Check looms',
      subtext: 'Production issue',
      type: 'TASK',
      source: 'TEXT',
      category: 'SUPPLIER',
      assignedTo: 'production',
      done: false,
    };

    const explanation = explainRouting(card);
    expect(explanation).toContain('loom');
    expect(explanation).toContain('production');
    expect(explanation).toContain('Production');
  });

  it('explains finance routing with matched keywords', () => {
    const card: TaskCard = {
      id: 3,
      title: 'Pay invoice',
      subtext: 'Payment due',
      type: 'INVOICE',
      source: 'TEXT',
      category: 'INVOICE',
      assignedTo: 'finance',
      done: false,
    };

    const explanation = explainRouting(card);
    expect(explanation).toContain('invoice');
    expect(explanation).toContain('payment');
    expect(explanation).toContain('Finance');
  });

  it('explains upload source routing', () => {
    const card: TaskCard = {
      id: 4,
      title: 'Document scanned',
      subtext: '',
      type: 'INVOICE',
      source: 'UPLOAD',
      category: 'INVOICE',
      assignedTo: 'finance',
      done: false,
    };

    const explanation = explainRouting(card);
    expect(explanation).toContain('uploaded document');
    expect(explanation).toContain('Finance');
  });

  it('handles mismatched routing gracefully', () => {
    const card: TaskCard = {
      id: 5,
      title: 'Random task',
      subtext: 'No keywords',
      type: 'TASK',
      source: 'TEXT',
      category: 'OTHER',
      assignedTo: 'production',
      done: false,
    };

    const explanation = explainRouting(card);
    expect(explanation).toContain('Production');
  });
});

describe('localStorage state management', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('getSharedState returns default state when localStorage is empty', () => {
    const state = getSharedState();
    expect(state).toHaveProperty('cards');
    expect(state).toHaveProperty('handoffs');
    expect(state).toHaveProperty('notifications');
    expect(Array.isArray(state.cards)).toBe(true);
    expect(Array.isArray(state.handoffs)).toBe(true);
  });

  it('saveSharedState stores state in localStorage', () => {
    const testState: WorkspaceState = {
      cards: [
        {
          id: 1,
          title: 'Test Task',
          subtext: 'Test',
          type: 'TASK',
          source: 'TEXT',
          category: 'OTHER',
          assignedTo: 'owner',
          done: false,
        },
      ],
      handoffs: [],
      notifications: {
        owner: 0,
        sales: 0,
        production: 0,
        finance: 0,
      },
    };

    saveSharedState(testState);

    const retrieved = getSharedState();
    expect(retrieved.cards).toHaveLength(1);
    expect(retrieved.cards[0].title).toBe('Test Task');
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorage.setItem('sharma_workspace_state', 'invalid json{]');

    const state = getSharedState();
    // Should return default state instead of crashing
    expect(state).toHaveProperty('cards');
    expect(Array.isArray(state.cards)).toBe(true);
  });
});
