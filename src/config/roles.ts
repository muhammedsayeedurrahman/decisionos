export type Role = 'owner' | 'sales' | 'production' | 'finance';
export type Accent = 'red' | 'blue' | 'green' | 'yellow';
export type TabId = 'desk' | 'brief' | 'mywork' | 'people' | 'brain' | 'finance' | 'capture' | 'meetings' | 'settings';

export interface RoleConfig {
  id: Role;
  personName: string;
  initials: string;
  roleLabel: string;
  demoLabel: string;
  accent: Accent;
  navTabs: TabId[];
  tabTitles: Partial<Record<TabId, string>>;
  capturePlaceholder: string;
  voiceSample: string;
  canAddPeople: boolean;
}

const BASE_TAB_TITLES: Record<TabId, string> = {
  desk: 'Decision Desk',
  brief: 'CEO Brief',
  mywork: 'My Work',
  people: 'People & Directory',
  brain: 'Company Brain Search',
  finance: 'Financial Ledger',
  capture: 'AI Capture',
  meetings: 'Meeting Notes',
  settings: 'Workspace Settings',
};

// Every role sees the same nav — the demo differentiates roles by data and
// permissions (e.g. canAddPeople), not by hiding whole sections of the app.
const ALL_NAV_TABS: TabId[] = ['desk', 'brief', 'mywork', 'people', 'brain', 'finance', 'meetings', 'capture', 'settings'];

export const ROLES: Record<Role, RoleConfig> = {
  owner: {
    id: 'owner',
    personName: 'Rajesh Sharma',
    initials: 'RS',
    roleLabel: 'OWNER',
    demoLabel: 'OWNER INTERACTIVE DEMO',
    accent: 'red',
    navTabs: ALL_NAV_TABS,
    tabTitles: { ...BASE_TAB_TITLES, mywork: 'My Work Checklist' },
    capturePlaceholder: 'Speak, type, or upload a directive — e.g. Tell Priya to send revised quote to Delhi retailer by Friday…',
    voiceSample: 'Priya Nair, prepare revised quotations for Mumbai Retailer today. Critical priority.',
    canAddPeople: true,
  },
  sales: {
    id: 'sales',
    personName: 'Priya Nair',
    initials: 'PN',
    roleLabel: 'SALES MANAGER',
    demoLabel: 'SALES MANAGER INTERACTIVE DEMO',
    accent: 'blue',
    navTabs: ALL_NAV_TABS,
    tabTitles: { ...BASE_TAB_TITLES, mywork: 'My Work - Sales Deals' },
    capturePlaceholder: 'Speak, type, or upload a directive — e.g. Amit Verma, prepare premium cotton-nylon fabric samples today…',
    voiceSample: 'Amit Verma, prepare premium cotton-nylon fabric samples today. Urgent priority.',
    canAddPeople: false,
  },
  production: {
    id: 'production',
    personName: 'Amit Verma',
    initials: 'AV',
    roleLabel: 'PRODUCTION CHIEF',
    demoLabel: 'PRODUCTION CHIEF INTERACTIVE DEMO',
    accent: 'green',
    navTabs: ALL_NAV_TABS,
    tabTitles: { ...BASE_TAB_TITLES, mywork: 'My Work - Loom Floor' },
    capturePlaceholder: 'Speak, type, or upload a directive — e.g. Sunita Rao, verify dye supplier invoice for lot PO-4891 today…',
    voiceSample: 'Sunita Rao, verify dye supplier invoice for lot PO-4891 today.',
    canAddPeople: false,
  },
  finance: {
    id: 'finance',
    personName: 'Sunita Rao',
    initials: 'SR',
    roleLabel: 'FINANCE CONTROLLER',
    demoLabel: 'FINANCE CONTROLLER INTERACTIVE DEMO',
    accent: 'yellow',
    navTabs: ALL_NAV_TABS,
    tabTitles: { ...BASE_TAB_TITLES, mywork: 'My Work - Finance Ledger' },
    capturePlaceholder: 'Speak, type, or upload a directive — e.g. Priya Nair, confirm revised quotation received from Westside Retailer…',
    voiceSample: 'Priya Nair, confirm revised quotation received from Westside Retailer.',
    canAddPeople: false,
  },
};

interface AccentStyle {
  solidBg: string;
  solidHoverBg: string;
  solidText: string;
  text: string;
  softHoverBg: string;
  softBg: string;
  softText: string;
}

// Only the floating capture bar (mic / upload / submit / voice label) and the
// voice-preview "Apply & Distribute" button are accent-driven — the sidebar
// branding and notification badge stay brand-red across every dashboard.
export const ACCENT_STYLES: Record<Accent, AccentStyle> = {
  red: {
    solidBg: 'bg-brand-red',
    solidHoverBg: 'hover:bg-red-700',
    solidText: 'text-white',
    text: 'text-brand-red',
    softHoverBg: 'hover:text-brand-red hover:bg-red-50 dark:hover:bg-zinc-800',
    softBg: 'bg-brand-red/20',
    softText: 'text-brand-red',
  },
  blue: {
    solidBg: 'bg-brand-blue',
    solidHoverBg: 'hover:bg-blue-700',
    solidText: 'text-white',
    text: 'text-brand-blue',
    softHoverBg: 'hover:text-brand-blue hover:bg-blue-50 dark:hover:bg-zinc-800',
    softBg: 'bg-brand-blue/20',
    softText: 'text-brand-blue',
  },
  green: {
    solidBg: 'bg-green-600',
    solidHoverBg: 'hover:bg-green-700',
    solidText: 'text-white',
    text: 'text-green-600',
    softHoverBg: 'hover:text-green-600 hover:bg-green-50 dark:hover:bg-zinc-800',
    softBg: 'bg-green-600/20',
    softText: 'text-green-600',
  },
  yellow: {
    solidBg: 'bg-brand-yellow',
    solidHoverBg: 'hover:bg-yellow-500',
    solidText: 'text-zinc-950',
    text: 'text-yellow-600 dark:text-brand-yellow',
    softHoverBg: 'hover:text-yellow-600 hover:bg-yellow-50 dark:hover:bg-zinc-800',
    softBg: 'bg-brand-yellow/20',
    softText: 'text-yellow-600',
  },
};
