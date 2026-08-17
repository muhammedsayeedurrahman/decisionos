import { describe, it, expect } from 'vitest';
import { routeDirective } from '../sharedState';

describe('routeDirective', () => {
  describe('Sales routing', () => {
    it('routes customer-related keywords to sales', () => {
      expect(routeDirective('Call customer about order')).toMatchObject({
        assignedTo: 'sales',
        category: 'CUSTOMER',
      });

      expect(routeDirective('Follow up with client')).toMatchObject({
        assignedTo: 'sales',
        category: 'CUSTOMER',
      });

      expect(routeDirective('New buyer inquiry')).toMatchObject({
        assignedTo: 'sales',
        category: 'CUSTOMER',
      });
    });

    it('routes invoice keywords to sales/finance', () => {
      const result = routeDirective('Generate invoice for order');
      expect(result.category).toBe('INVOICE');
      // Could be sales or finance depending on context
      expect(['sales', 'finance']).toContain(result.assignedTo);
    });
  });

  describe('Production routing', () => {
    it('routes supplier keywords to production', () => {
      expect(routeDirective('Contact supplier for raw materials')).toMatchObject({
        assignedTo: 'production',
        category: 'SUPPLIER',
      });

      expect(routeDirective('Check vendor quality')).toMatchObject({
        assignedTo: 'production',
        category: 'SUPPLIER',
      });
    });

    it('routes production-related keywords', () => {
      expect(routeDirective('Check loom maintenance')).toMatchObject({
        assignedTo: 'production',
      });

      expect(routeDirective('Factory inspection needed')).toMatchObject({
        assignedTo: 'production',
      });
    });
  });

  describe('Finance routing', () => {
    it('routes payment keywords to finance', () => {
      expect(routeDirective('Process supplier payment')).toMatchObject({
        assignedTo: 'finance',
        category: 'PAYMENT',
      });

      expect(routeDirective('Transfer funds to vendor')).toMatchObject({
        assignedTo: 'finance',
        category: 'PAYMENT',
      });
    });

    it('routes ledger keywords to finance', () => {
      expect(routeDirective('Update ledger entries')).toMatchObject({
        assignedTo: 'finance',
      });

      expect(routeDirective('Reconcile accounts')).toMatchObject({
        assignedTo: 'finance',
      });
    });
  });

  describe('Owner routing', () => {
    it('routes strategy keywords to owner', () => {
      expect(routeDirective('Review quarterly goals')).toMatchObject({
        assignedTo: 'owner',
      });

      expect(routeDirective('Strategic planning meeting')).toMatchObject({
        assignedTo: 'owner',
      });
    });

    it('defaults to owner for unmatched keywords', () => {
      expect(routeDirective('Random unrelated task')).toMatchObject({
        assignedTo: 'owner',
        category: 'OTHER',
      });
    });
  });

  describe('Complaint routing', () => {
    it('routes complaint keywords correctly', () => {
      expect(routeDirective('Customer complaint about quality')).toMatchObject({
        category: 'COMPLAINT',
      });

      expect(routeDirective('Issue with delivery')).toMatchObject({
        category: 'COMPLAINT',
      });
    });
  });

  describe('Edge cases', () => {
    it('handles empty input', () => {
      const result = routeDirective('');
      expect(result).toHaveProperty('assignedTo');
      expect(result).toHaveProperty('category');
    });

    it('handles case insensitivity', () => {
      const lower = routeDirective('customer order');
      const upper = routeDirective('CUSTOMER ORDER');
      const mixed = routeDirective('CuStOmEr OrDeR');

      expect(lower.category).toBe(upper.category);
      expect(lower.category).toBe(mixed.category);
    });

    it('handles multiple matching keywords', () => {
      // When multiple keywords match, first match should win
      const result = routeDirective('Customer invoice payment');
      expect(result).toHaveProperty('assignedTo');
      expect(result).toHaveProperty('category');
    });

    it('handles special characters', () => {
      const result = routeDirective('Call customer @ 5pm re: order #123!');
      expect(result.category).toBe('CUSTOMER');
      expect(result.assignedTo).toBe('sales');
    });
  });
});
