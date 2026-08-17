'use client';

import React, { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Sparkles, User, Lock, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardShell from './DashboardShell';
import CommandPalette from './CommandPalette';
import TaskCalendarFeed, { NewTaskInput } from '@/components/ui/TaskCalendarFeed';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import MyWorkChecklist from './tabs/MyWorkChecklist';
import PeopleDirectory from './tabs/PeopleDirectory';
import BrainSearch from './tabs/BrainSearch';
import MeetingNotes from './tabs/MeetingNotes';
import CaptureUpload from './tabs/CaptureUpload';
import FinanceLedger from './tabs/FinanceLedger';
import BriefBlock from './tabs/BriefBlock';
import HandoffReplyCard from './tabs/HandoffReplyCard';
import HandoffReviewList from './tabs/HandoffReviewList';
import KanbanBoard from './tabs/KanbanBoard';
import TimelineView from './tabs/TimelineView';
import { useWorkspace } from '@/hooks/useWorkspace';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAdvancedFilters } from '@/hooks/useAdvancedFilters';
import { Role, TabId, ROLES } from '@/config/roles';
import { ROLE_DATA, SHARED_ASSETS } from '@/config/roleData';
import { TaskCard, HandoffItem } from '@/utils/sharedState';
import FilterPanel from '@/components/ui/FilterPanel';

// Dynamic imports for modal components to reduce initial bundle size
const WelcomeModal = dynamic(() => import('@/components/onboarding/WelcomeModal').then(mod => ({ default: mod.WelcomeModal })), {
  ssr: false,
});
const KeyboardShortcutsHelp = dynamic(() => import('@/components/ui/KeyboardShortcutsHelp'), {
  ssr: false,
});

interface DashboardPageProps {
  role: Role;
}

const DESK_FILTERS: Record<Role, (card: TaskCard) => boolean> = {
  owner: () => true,
  sales: (card) => card.assignedTo === 'sales' || card.category === 'CUSTOMER' || card.category === 'INVOICE',
  production: (card) => card.assignedTo === 'production' || card.category === 'SUPPLIER',
  finance: (card) => card.assignedTo === 'finance' || card.category === 'INVOICE' || card.category === 'PAYMENT',
};

const HANDOFF_ID: Partial<Record<Role, HandoffItem['id']>> = {
  sales: 'sales_handoff',
  production: 'production_handoff',
};

const ROLE_CONTACTS: Record<Role, { phone: string; email: string }> = {
  owner: { phone: '+91 98200 10001', email: 'owner@sharma.com' },
  sales: { phone: '+91 98200 10002', email: 'sales@sharma.com' },
  production: { phone: '+91 98200 10003', email: 'production@sharma.com' },
  finance: { phone: '+91 98200 10004', email: 'finance@sharma.com' },
};

interface WorkspaceSettingsProps {
  role: Role;
  onSave: (msg: string) => void;
}

function WorkspaceSettings({ role, onSave }: WorkspaceSettingsProps) {
  const defaults = ROLE_CONTACTS[role] || { phone: '', email: '' };

  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile state - use demo signup name if available
  const [fullName, setFullName] = useState(getDemoUserName(role));
  const [mobileNumber, setMobileNumber] = useState(defaults.phone);
  const [email] = useState(defaults.email);

  // Preferences state
  const [prefLang, setPrefLang] = useState('en');

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      onSave('Full name is required');
      return;
    }
    onSave('Profile details updated successfully.');
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      onSave('Current password is required');
      return;
    }
    if (newPassword.length < 6) {
      onSave('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      onSave('Passwords do not match');
      return;
    }
    onSave('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-start animate-fade-up">
      {/* Settings Sub-Sidebar */}
      <div className="flex flex-row md:flex-col gap-1 w-full md:w-56 shrink-0 overflow-x-auto md:overflow-x-visible pb-3 md:pb-0 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 pr-0 md:pr-4 whitespace-nowrap">
        <button
          onClick={() => setActiveSection('profile')}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-l-2 text-left justify-start ${
            activeSection === 'profile'
              ? 'bg-zinc-100 dark:bg-zinc-800/80 text-brand-red border-brand-red pl-2.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-950 dark:hover:text-white border-transparent'
          }`}
        >
          <User size={14} className="shrink-0" />
          <span>Profile</span>
        </button>

        <button
          onClick={() => setActiveSection('security')}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-l-2 text-left justify-start ${
            activeSection === 'security'
              ? 'bg-zinc-100 dark:bg-zinc-800/80 text-brand-red border-brand-red pl-2.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-950 dark:hover:text-white border-transparent'
          }`}
        >
          <Lock size={14} className="shrink-0" />
          <span>Security</span>
        </button>

        <button
          onClick={() => setActiveSection('preferences')}
          className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer border-l-2 text-left justify-start ${
            activeSection === 'preferences'
              ? 'bg-zinc-100 dark:bg-zinc-800/80 text-brand-red border-brand-red pl-2.5'
              : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-950 dark:hover:text-white border-transparent'
          }`}
        >
          <Settings size={14} className="shrink-0" />
          <span>Preferences</span>
        </button>
      </div>

      {/* Settings Content Area */}
      <div className="flex-1 max-w-2xl w-full min-w-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15, ease: 'easeInOut' }}
            className="w-full"
          >
            {activeSection === 'profile' && (
              <div className="card-brutal p-5" data-testid="settings-profile-card">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="text-brand-red">
                    <path d="M128,20A108,108,0,1,0,236,128,108.12,108.12,0,0,0,128,20ZM79.57,196.57a60,60,0,0,1,96.86,0,83.72,83.72,0,0,1-96.86,0ZM100,120a28,28,0,1,1,28,28A28,28,0,0,1,100,120ZM194,179.94a83.48,83.48,0,0,0-29-23.42,52,52,0,1,0-74,0,83.48,83.48,0,0,0-29,23.42,84,84,0,1,1,131.9,0Z"></path>
                  </svg>
                  <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white">Your Profile</h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Your personal details, sign-in and WhatsApp routing.</p>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Full name</label>
                    <input
                      data-testid="profile-name-input"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      placeholder="Your name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Mobile number</label>
                    <input
                      data-testid="profile-phone-input"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      placeholder="+91 98765 43210"
                      value={mobileNumber}
                      onChange={(e) => setMobileNumber(e.target.value)}
                    />
                    <p className="label-mono text-zinc-400 dark:text-zinc-500 mt-1 text-[10px]">Used for OTP login and to route your WhatsApp messages to this workspace.</p>
                  </div>
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Email</label>
                    <input
                      disabled
                      data-testid="profile-email-input"
                      className="w-full border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-100 dark:bg-zinc-900/40 px-3 py-2 text-sm mt-1 text-zinc-400 cursor-not-allowed"
                      value={email}
                    />
                    <p className="label-mono text-zinc-400 dark:text-zinc-500 mt-1 text-[10px]">Email is your sign-in ID and can&apos;t be changed here.</p>
                  </div>
                  <button
                    type="submit"
                    data-testid="profile-save"
                    className="flex items-center justify-center gap-2 bg-brand-ink dark:bg-zinc-800 border border-zinc-950 dark:border-zinc-700 text-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-red dark:hover:bg-brand-red hover:text-white dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M222.14,69.17,186.83,33.86A19.86,19.86,0,0,0,172.69,28H48A20,20,0,0,0,28,48V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V83.31A19.86,19.86,0,0,0,222.14,69.17ZM164,204H92V160h72Zm40,0H188V156a20,20,0,0,0-20-20H88a20,20,0,0,0-20,20v48H52V52H171l33,33ZM164,84a12,12,0,0,1-12,12H96a12,12,0,0,1,0-24h56A12,12,0,0,1,164,84Z"></path>
                    </svg> Save changes
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'security' && (
              <div className="card-brutal p-5" data-testid="settings-security-card">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="text-brand-red">
                    <path d="M208,76H180V56A52,52,0,0,0,76,56V76H48A20,20,0,0,0,28,96V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V96A20,20,0,0,0,208,76ZM100,56a28,28,0,0,1,56,0V76H100ZM204,204H52V100H204Zm-60-52a16,16,0,1,1-16-16A16,16,0,0,1,144,152Z"></path>
                  </svg>
                  <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white">Password &amp; Security</h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Change the password you use to sign in.</p>

                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Current password</label>
                    <input
                      data-testid="password-current-input"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      placeholder="••••••••"
                      autoComplete="current-password"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">New password</label>
                    <input
                      data-testid="password-new-input"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      placeholder="At least 6 characters"
                      autoComplete="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Confirm new password</label>
                    <input
                      data-testid="password-confirm-input"
                      className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40"
                      placeholder="Re-enter new password"
                      autoComplete="new-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                  <button
                    type="submit"
                    data-testid="password-change-submit"
                    className="flex items-center justify-center gap-2 bg-brand-ink dark:bg-zinc-800 border border-zinc-950 dark:border-zinc-700 text-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-red dark:hover:bg-brand-red hover:text-white dark:hover:text-white transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 256 256">
                      <path d="M208,76H180V56A52,52,0,0,0,76,56V76H48A20,20,0,0,0,28,96V208a20,20,0,0,0,20,20H208a20,20,0,0,0,20-20V96A20,20,0,0,0,208,76ZM100,56a28,28,0,0,1,56,0V76H100ZM204,204H52V100H204Zm-60-52a16,16,0,1,1-16-16A16,16,0,0,1,144,152Z"></path>
                    </svg> Update password
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'preferences' && (
              <div className="card-brutal p-5" data-testid="settings-preferences-card">
                <div className="flex items-center gap-2 mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 256 256" className="text-brand-red">
                    <path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216ZM128,72a8,8,0,0,1,8,8v40a8,8,0,0,1-16,0V80A8,8,0,0,1,128,72Zm8,80a8,8,0,1,1-8-8A8,8,0,0,1,136,152Z"/>
                  </svg>
                  <h2 className="font-heading text-lg font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white">Preferences</h2>
                </div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Manage your workspace language and customization preferences.</p>

                <form onSubmit={(e) => { e.preventDefault(); onSave('Workspace preferences updated successfully.'); }} className="space-y-4">
                  <div>
                    <label className="label-mono text-zinc-500 dark:text-zinc-400 block text-xs">Language</label>
                    <select
                      value={prefLang}
                      onChange={(e) => setPrefLang(e.target.value)}
                      className="border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-sm mt-1 bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500/40 w-full max-w-sm"
                    >
                      <option value="en">English (US)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="flex items-center justify-center gap-2 bg-brand-ink dark:bg-zinc-800 border border-zinc-950 dark:border-zinc-700 text-white px-5 py-2.5 text-sm font-semibold uppercase tracking-wider rounded-lg hover:bg-brand-red dark:hover:bg-brand-red hover:text-white dark:hover:text-white transition-colors cursor-pointer"
                  >
                    Save preferences
                  </button>
                </form>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

// Helper function to get user name from demo signup or default to hardcoded name
function getDemoUserName(role: Role): string {
  if (typeof window !== 'undefined') {
    const demoUser = localStorage.getItem('demo_user');
    if (demoUser) {
      try {
        const userData = JSON.parse(demoUser);
        if (userData.fullName && userData.role === role) {
          return userData.fullName;
        }
      } catch (e) {
        // Invalid JSON, ignore
      }
    }
  }
  return ROLES[role]?.personName || '';
}

export default function DashboardPage({ role }: DashboardPageProps) {
  const workspace = useWorkspace(role);
  const { config, workspaceState, triggerAlert } = workspace;
  const data = ROLE_DATA[role];

  const [activeTab, setActiveTab] = useState<TabId>('desk');
  const [deskViewMode, setDeskViewMode] = useState<'feed' | 'kanban' | 'timeline'>('feed');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  // Check if user has completed onboarding (lazy initialization)
  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    if (typeof window === 'undefined') return false;
    const onboardingCompleted = localStorage.getItem('decisionos_onboarding_completed');
    return !onboardingCompleted;
  });
  const [showQuickCapture, setShowQuickCapture] = useState(false);

  // Advanced filtering system
  const advancedFilters = useAdvancedFilters(workspaceState.cards, config.id);

  // Keyboard shortcuts - defined in useMemo to share with help modal
  const shortcuts = useMemo(() => [
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      handler: () => setShowKeyboardHelp(true),
      category: 'General',
    },
    {
      key: 'k',
      meta: true,
      description: 'Open command palette',
      handler: () => setPaletteOpen(true),
      category: 'Navigation',
    },
    {
      key: '/',
      meta: true,
      description: 'Quick capture',
      handler: () => setShowQuickCapture(!showQuickCapture),
      category: 'Actions',
    },
    {
      key: 'n',
      meta: true,
      description: 'New task',
      handler: () => {
        if (activeTab !== 'desk') setActiveTab('desk');
        // Focus on task input (will be handled by TaskCalendarFeed)
      },
      category: 'Actions',
    },
    {
      key: 'f',
      meta: true,
      shift: true,
      description: 'Search everything',
      handler: () => setPaletteOpen(true),
      category: 'Navigation',
    },
    {
      key: 'f',
      meta: true,
      description: 'Open filters',
      handler: () => setShowFilterPanel(true),
      category: 'Navigation',
    },
    {
      key: ',',
      meta: true,
      description: 'Open settings',
      handler: () => setActiveTab('settings'),
      category: 'Navigation',
    },
    // Number keys 1-9 for tab switching
    ...(['1', '2', '3', '4', '5', '6', '7', '8', '9'] as const).map((num, index) => ({
      key: num,
      meta: true,
      description: `Switch to tab ${num}`,
      handler: () => {
        const tab = config.navTabs[index];
        if (tab) setActiveTab(tab);
      },
      category: 'Navigation',
    })),
  ], [config.navTabs, activeTab, showQuickCapture]);

  useKeyboardShortcuts({ shortcuts });

  // Memoize expensive computations to prevent unnecessary re-renders
  const deskCards = useMemo(
    () => workspaceState.cards.filter(DESK_FILTERS[role]),
    [workspaceState.cards, role]
  );

  // Apply advanced filters on top of role-filtered cards
  const filteredDeskCards = useMemo(() => {
    // First apply role-based filtering (deskCards already filtered)
    let result = deskCards;

    // Then apply advanced filters if any are active
    if (advancedFilters.hasActiveFilters) {
      // Use the filtered tasks from advanced filters
      result = advancedFilters.filteredTasks.filter(task =>
        deskCards.some(card => card.id === task.id)
      );
    }

    // Finally apply legacy category filter if no advanced filters
    if (!advancedFilters.hasActiveFilters && activeFilter !== 'ALL') {
      result = result.filter(card => card.category === activeFilter || card.type === activeFilter);
    }

    return result;
  }, [deskCards, advancedFilters.filteredTasks, advancedFilters.hasActiveFilters, activeFilter]);

  const submittedHandoffs = useMemo(
    () => workspaceState.handoffs.filter(h => h.status === 'submitted'),
    [workspaceState.handoffs]
  );

  const myHandoffId = HANDOFF_ID[role];
  const myHandoff = useMemo(
    () => myHandoffId ? workspaceState.handoffs.find(h => h.id === myHandoffId) : undefined,
    [myHandoffId, workspaceState.handoffs]
  );

  const handleSubmitHandoffReply = async (id: HandoffItem['id'], text: string) => {
    // Find the actual handoff ID from the legacy ID
    const handoff = workspaceState.handoffs.find(h => h.id === id);
    if (handoff) {
      // Extract numeric ID from the description or use a mapping
      // For now, we'll need to update the handoff in the database
      // This is a temporary workaround until we refactor the handoff system
      await workspace.approveHandoff(parseInt(id.split('_')[0]) || 1, text);
    }
    triggerAlert('Handoff feedback response sent to Rajesh Sharma.');
  };

  const handleApproveHandoff = async (id: HandoffItem['id']) => {
    const handoff = workspaceState.handoffs.find(h => h.id === id);
    if (handoff) {
      await workspace.approveHandoff(parseInt(id.split('_')[0]) || 1);
    }
    triggerAlert('Handoff feedback response approved and closed.');
  };

  const handleRejectHandoff = async (id: HandoffItem['id']) => {
    const handoff = workspaceState.handoffs.find(h => h.id === id);
    if (handoff) {
      await workspace.rejectHandoff(parseInt(id.split('_')[0]) || 1);
    }
    triggerAlert('Handoff response rejected and returned for review.');
  };

  const handleAddTask = async (input: NewTaskInput) => {
    await workspace.createTask({
      title: input.title,
      subtext: input.subtext,
      type: input.type,
      source: 'TEXT',
      category: input.category,
      assigned_to: role,
      done: false,
      scheduled_date: input.scheduledDate,
      reminder_time: input.scheduledTime,
    });
    triggerAlert('Task added to the calendar.');
  };

  const headerExtras = role === 'owner'
    ? [{
        label: (
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-brand-red animate-pulse" />
            <span className="hidden sm:inline">Send Daily Digest</span>
          </span>
        ),
        href: '#',
        onClick: () => triggerAlert('Daily briefing digest sent to core team!'),
        ariaLabel: 'Send Daily Digest'
      }]
    : undefined;

  return (
    <>
    {/* Welcome Modal - Onboarding */}
    <WelcomeModal
      isOpen={showWelcomeModal}
      onClose={() => setShowWelcomeModal(false)}
      onComplete={() => {
        setShowWelcomeModal(false);
        triggerAlert('Welcome to DecisionOS! Let\'s get started.');
      }}
      role={role}
      userName={getDemoUserName(role)}
    />

    <DashboardShell
      workspace={workspace}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      headerTitle={config.tabTitles[activeTab] ?? ''}
      extraHeaderItems={headerExtras}
      onOpenPalette={() => setPaletteOpen(true)}
      userName={getDemoUserName(role)}
    >
      {activeTab === 'desk' && (
        <div className="space-y-6 animate-fade-up">
          {/* Desk View Switcher */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl">
              <button
                onClick={() => setDeskViewMode('feed')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  deskViewMode === 'feed'
                    ? 'bg-white dark:bg-zinc-900 text-brand-red shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Calendar &amp; Feed
              </button>
              <button
                onClick={() => setDeskViewMode('kanban')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  deskViewMode === 'kanban'
                    ? 'bg-white dark:bg-zinc-900 text-brand-red shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Kanban Board
              </button>
              <button
                onClick={() => setDeskViewMode('timeline')}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  deskViewMode === 'timeline'
                    ? 'bg-white dark:bg-zinc-900 text-brand-red shadow-xs'
                    : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Advanced Filters Button */}
            <button
              onClick={() => setShowFilterPanel(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 hover:border-brand-red hover:text-brand-red transition-all cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              <span className="hidden sm:inline">Filters</span>
              {advancedFilters.activeFilterCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold bg-brand-red text-white rounded-full">
                  {advancedFilters.activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {role === 'owner' && (
            <HandoffReviewList handoffs={workspaceState.handoffs} onApprove={handleApproveHandoff} onReject={handleRejectHandoff} />
          )}
          {myHandoff && (
            <HandoffReplyCard handoff={myHandoff} onSubmitReply={handleSubmitHandoffReply} />
          )}

          {deskViewMode === 'feed' && (
            <ErrorBoundary>
              <TaskCalendarFeed
                cards={filteredDeskCards}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                handleMarkDone={workspace.handleMarkDone}
                handleDismiss={workspace.handleDismiss}
                handleSendToBoard={workspace.handleSendToBoard}
                onAddTask={handleAddTask}
              />
            </ErrorBoundary>
          )}

          {deskViewMode === 'kanban' && (
            <ErrorBoundary>
              <KanbanBoard
                cards={filteredDeskCards}
                role={role}
                onMarkDone={workspace.handleMarkDone}
                onDismiss={workspace.handleDismiss}
                onAddTask={handleAddTask}
              />
            </ErrorBoundary>
          )}

          {deskViewMode === 'timeline' && (
            <ErrorBoundary>
              <TimelineView
                cards={filteredDeskCards}
                role={role}
                onTaskClick={(taskId) => {
                  // Handle task click - could open a detail modal
                  console.log('Task clicked:', taskId);
                }}
                onDateChange={(taskId, newDate) => {
                  // Handle date change from timeline drag
                  console.log('Task date changed:', taskId, newDate);
                }}
              />
            </ErrorBoundary>
          )}
        </div>
      )}

      {activeTab === 'brief' && (
        role === 'owner' ? (
          <div className="w-full space-y-6 animate-fade-up">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="stat-card">
                <p className="stat-eyebrow">Cash Reserve</p>
                <p className="stat-value">$84,200</p>
              </div>
              <div className="stat-card">
                <p className="stat-eyebrow">Active Orders</p>
                <p className="stat-value">$124,000</p>
              </div>
              <div className="stat-card">
                <p className="stat-eyebrow">Dyeing Output</p>
                <p className="stat-value">94.8%</p>
              </div>
              <div className="stat-card">
                <p className="stat-eyebrow">Awaiting Approvals</p>
                <p className="stat-value text-brand-red">{submittedHandoffs.length}</p>
              </div>
            </div>
          </div>
        ) : data.brief ? (
          <BriefBlock variant={data.brief.variant} label={data.brief.label} text={data.brief.text} />
        ) : null
      )}

      {activeTab === 'mywork' && (
        <MyWorkChecklist
          initialTasks={data.myWorkTasks}
          placeholder={data.myWorkPlaceholder}
          onAdd={() => triggerAlert(data.myWorkAddToast)}
        />
      )}

      {activeTab === 'people' && (
        <PeopleDirectory canAdd={config.canAddPeople} onAdd={() => triggerAlert('New team member added to directory.')} />
      )}

      {activeTab === 'brain' && (
        <BrainSearch placeholder={data.aiPlaceholder} respond={data.aiRespond} />
      )}

      {activeTab === 'finance' && (
        <FinanceLedger
          assets={SHARED_ASSETS}
          showType={role === 'owner'}
          stats={role === 'finance' ? [
            { label: 'Total Spend', value: '$42,100' },
            { label: 'Outstanding Bills', value: '$18,300', tone: 'alert' },
            { label: 'Inventory value', value: '$15,750' },
          ] : undefined}
        />
      )}

      {activeTab === 'capture' && (
        <CaptureUpload title={data.captureCopy.title} buttonLabel={data.captureCopy.buttonLabel} onUpload={workspace.handleFileUpload} />
      )}

      {activeTab === 'meetings' && (
        <MeetingNotes meetings={data.meetings} extractTasks={data.extractTasks} onExtracted={() => triggerAlert(data.meetingsToast)} />
      )}

      {activeTab === 'settings' && (
        <WorkspaceSettings role={role} onSave={(msg) => triggerAlert(msg)} />
      )}
    </DashboardShell>

    <CommandPalette
      open={paletteOpen}
      onOpenChange={setPaletteOpen}
      config={config}
      workspaceState={workspaceState}
      setActiveTab={setActiveTab}
      setActiveFilter={setActiveFilter}
      toggleTheme={workspace.toggleTheme}
      handleClearNotifications={workspace.handleClearNotifications}
    />

    <KeyboardShortcutsHelp
      shortcuts={shortcuts}
      open={showKeyboardHelp}
      onClose={() => setShowKeyboardHelp(false)}
    />

    <FilterPanel
      criteria={advancedFilters.criteria}
      updateCriteria={advancedFilters.updateCriteria}
      clearFilters={advancedFilters.clearFilters}
      quickFilters={advancedFilters.quickFilters}
      applyQuickFilter={advancedFilters.applyQuickFilter}
      savedFilters={advancedFilters.savedFilters}
      saveCustomFilter={advancedFilters.saveCustomFilter}
      deleteSavedFilter={advancedFilters.deleteSavedFilter}
      applySavedFilter={advancedFilters.applySavedFilter}
      hasActiveFilters={advancedFilters.hasActiveFilters}
      activeFilterCount={advancedFilters.activeFilterCount}
      isOpen={showFilterPanel}
      onClose={() => setShowFilterPanel(false)}
    />
    </>
  );
}
