'use client';

/**
 * Shared types and utilities for DecisionOS
 *
 * NOTE: This file previously contained localStorage functions (getSharedState, saveSharedState)
 * which have been removed. The app now uses Supabase for data persistence.
 * See src/hooks/useTasks.ts, useHandoffs.ts, and useWorkspaceData.ts
 */

export interface TaskCard {
  id: number;
  title: string;
  subtext: string;
  type: 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
  source: 'TEXT' | 'VOICE' | 'UPLOAD';
  detailsCount?: number;
  category: 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
  done?: boolean;
  assignedTo: 'owner' | 'sales' | 'production' | 'finance';
  // Explicit calendar placement chosen via "Add Task" (date input, ISO
  // 'YYYY-MM-DD'; time input, 24h 'HH:MM'). When present, TaskCalendarFeed's
  // scheduler uses these instead of guessing from the title.
  scheduledDate?: string;
  scheduledTime?: string;
  // Timeline view support
  createdAt?: string; // ISO timestamp
  dueDate?: string; // ISO timestamp
}

export interface HandoffItem {
  id: 'sales_handoff' | 'production_handoff' | string;
  title: string;
  description: string;
  instruction: string;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  replyText: string;
}

export interface WorkspaceState {
  cards: TaskCard[];
  handoffs: HandoffItem[];
  notifications: {
    owner: number;
    sales: number;
    production: number;
    finance: number;
  };
}

const ROLE_LABELS: Record<TaskCard['assignedTo'], string> = {
  owner: 'Owner',
  sales: 'Sales',
  production: 'Production',
  finance: 'Finance',
};

// Keyword lists checked in priority order (sales, then production, then finance).
// Kept as one source of truth so routeDirective() and explainRouting() below
// can never drift apart and show a reason that doesn't match the assignment.
const ROUTING_KEYWORDS: [Exclude<TaskCard['assignedTo'], 'owner'>, TaskCard['category'], string[]][] = [
  ['sales', 'CUSTOMER', ['priya', 'sales', 'sell', 'retailer']],
  ['production', 'SUPPLIER', ['amit', 'production', 'loom', 'fabric', 'produce']],
  ['finance', 'INVOICE', ['sunita', 'finance', 'invoice', 'payment', 'pay', 'cost']],
];

// Helper to route directives by keywords
export function routeDirective(text: string): { assignedTo: TaskCard['assignedTo']; category: TaskCard['category']; reason: string } {
  const lower = text.toLowerCase();

  for (const [assignedTo, category, keywords] of ROUTING_KEYWORDS) {
    const matched = keywords.filter(k => lower.includes(k));
    if (matched.length > 0) {
      return {
        assignedTo,
        category,
        reason: `Matched "${matched.join('", "')}" → routed to ${ROLE_LABELS[assignedTo]}`,
      };
    }
  }
  return { assignedTo: 'owner', category: 'OTHER', reason: 'No routing keywords matched — held with Owner for review' };
}

// Explains why a card ended up with its current assignee, for display as a
// "routing rationale" chip. Cards created live by routeDirective() will always
// re-match their own text (it's a pure function of title+subtext), so no
// separate routingReason field needs to be stored or kept in sync.
export function explainRouting(card: Pick<TaskCard, 'title' | 'subtext' | 'assignedTo' | 'source'>): string {
  if (card.source === 'UPLOAD') {
    return `Detected from uploaded document → routed to ${ROLE_LABELS[card.assignedTo]}`;
  }
  const guess = routeDirective(`${card.title} ${card.subtext}`);
  if (guess.assignedTo === card.assignedTo) return guess.reason;
  return `Routed to ${ROLE_LABELS[card.assignedTo]}`;
}
