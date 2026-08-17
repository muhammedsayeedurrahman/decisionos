/**
 * Mock Data for Tests
 */

import { TaskCard, HandoffItem, WorkspaceState } from '@/utils/sharedState';

export const mockTasks: TaskCard[] = [
  {
    id: 1,
    title: 'Contact Sharma Textiles about invoice',
    subtext: 'Follow up on payment for order #1234',
    type: 'TASK',
    source: 'VOICE',
    category: 'INVOICE',
    assignedTo: 'finance',
    done: false,
    scheduledDate: '2026-08-15',
    scheduledTime: '10:00',
  },
  {
    id: 2,
    title: 'Call Priya about new retailer partnership',
    subtext: 'Discuss terms with BigMart chain',
    type: 'TASK',
    source: 'TEXT',
    category: 'CUSTOMER',
    assignedTo: 'sales',
    done: false,
  },
  {
    id: 3,
    title: 'Check loom maintenance schedule',
    subtext: 'Monthly maintenance due',
    type: 'REMINDER',
    source: 'TEXT',
    category: 'SUPPLIER',
    assignedTo: 'production',
    done: true,
  },
];

export const mockHandoffs: HandoffItem[] = [
  {
    id: 'sales_handoff',
    title: 'New Retailer Proposal',
    description: 'BigMart wants to partner for Q4 festival season',
    instruction: 'Review pricing and prepare counter-proposal',
    status: 'pending',
    replyText: '',
  },
];

export const mockWorkspaceState: WorkspaceState = {
  cards: mockTasks,
  handoffs: mockHandoffs,
  notifications: {
    owner: 2,
    sales: 1,
    production: 0,
    finance: 1,
  },
};
