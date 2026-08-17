'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar, SidebarBody, SidebarLink, SidebarMobileTrigger } from '@/components/ui/sidebar';
import {
  LayoutDashboard, FileText, CheckSquare, Users, Brain,
  CircleDollarSign, Camera, CalendarDays, Settings, LogOut, Search, Sun, Moon
} from 'lucide-react';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';
import PillNav, { PillNavItem } from '@/components/PillNav';
import CaptureBar from './CaptureBar';
import { ACCENT_STYLES, TabId } from '@/config/roles';
import { useWorkspace } from '@/hooks/useWorkspace';

import { MobileBottomNav } from '@/components/ui/MobileBottomNav';

// Shared with CommandPalette so quick-search results use the same icon per tab.
export const TAB_ICONS: Record<TabId, React.ReactNode> = {
  desk: <LayoutDashboard size={18} className="shrink-0" />,
  brief: <FileText size={18} className="shrink-0" />,
  mywork: <CheckSquare size={18} className="shrink-0" />,
  people: <Users size={18} className="shrink-0" />,
  brain: <Brain size={18} className="shrink-0" />,
  finance: <CircleDollarSign size={18} className="shrink-0" />,
  capture: <Camera size={18} className="shrink-0" />,
  meetings: <CalendarDays size={18} className="shrink-0" />,
  settings: <Settings size={18} className="shrink-0" />,
};

interface DashboardShellProps {
  workspace: ReturnType<typeof useWorkspace>;
  activeTab: TabId;
  setActiveTab: (t: TabId) => void;
  headerTitle: string;
  extraHeaderItems?: PillNavItem[];
  onOpenPalette?: () => void;
  children: React.ReactNode;
  userName?: string; // Dynamic user name from signup/login
}

export default function DashboardShell({
  workspace,
  activeTab,
  setActiveTab,
  headerTitle,
  extraHeaderItems,
  onOpenPalette,
  children,
  userName,
}: DashboardShellProps) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { config, theme, toggleTheme, workspaceState, handleClearNotifications } = workspace;
  const avatarBg = ACCENT_STYLES[config.accent].solidBg;
  const notificationCount = workspaceState.notifications[config.id];

  // Use dynamic userName if provided, otherwise fall back to config.personName
  const displayName = userName || config.personName;

  const handleSignOut = () => {
    // Clear demo user session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('demo_user');
    }
    // Redirect to landing page
    router.push('/');
  };

  // Mobile bottom navigation items (top 4 most frequent tabs for the role)
  const mobileNavTabs: TabId[] = config.navTabs.slice(0, 4);
  const mobileNavItems = mobileNavTabs.map((tabId) => {
    const iconMap: Record<TabId, any> = {
      desk: LayoutDashboard,
      brief: FileText,
      mywork: CheckSquare,
      people: Users,
      brain: Brain,
      finance: CircleDollarSign,
      capture: Camera,
      meetings: CalendarDays,
      settings: Settings,
    };
    return {
      id: tabId,
      label: config.tabTitles[tabId] || tabId,
      icon: iconMap[tabId] || LayoutDashboard,
      onClick: () => setActiveTab(tabId),
      active: activeTab === tabId,
      badge: tabId === 'brief' ? notificationCount : undefined,
    };
  });

  return (
    // Sidebar wraps the whole shell (not just SidebarBody) so the mobile
    // hamburger trigger in the header below can share its open/close state
    // via useSidebar() — avoids a second prop-drilled state pair.
    <Sidebar open={sidebarOpen} setOpen={setSidebarOpen}>
      {/* Real-time connection status indicator */}
      <ConnectionStatus />

      <div className="flex flex-col md:flex-row h-screen overflow-hidden bg-zinc-100 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans transition-colors duration-200">

        <SidebarBody className="justify-between gap-6 bg-white dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 px-2 min-w-[60px]">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <div className="px-2 py-3 border-b border-zinc-100 dark:border-zinc-800 mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-brand-red rounded flex items-center justify-center font-logo font-black text-white text-sm shrink-0">D</div>
                {sidebarOpen && (
                  <span className="font-logo font-black text-base tracking-tight uppercase dark:text-white whitespace-nowrap">
                    Decision<span className="text-brand-red">OS</span>
                  </span>
                )}
              </div>
              {sidebarOpen && (
                <div className="font-mono text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold tracking-wider leading-tight mt-1">
                  SHARMA TEXTILES PVT LTD<br />TEXTILE MANUFACTURING
                </div>
              )}
            </div>

            <div className="flex flex-col gap-0.5 px-1">
              {config.navTabs.map((tabId) => (
                <SidebarLink
                  key={tabId}
                  link={{
                    href: '#',
                    label: config.tabTitles[tabId] ?? tabId,
                    icon: <span className={activeTab === tabId ? 'text-brand-red' : 'text-zinc-500 dark:text-zinc-400'}>{TAB_ICONS[tabId]}</span>,
                    onClick: () => { setActiveTab(tabId); setSidebarOpen(false); },
                  }}
                  className={`rounded-lg px-2 py-2.5 md:py-2 text-sm md:text-xs font-mono font-bold tracking-wider transition-colors ${
                    activeTab === tabId
                      ? 'bg-zinc-50 dark:bg-zinc-800/60 text-brand-red'
                      : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/30 hover:text-zinc-900 dark:hover:text-white'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="px-1 border-t border-zinc-100 dark:border-zinc-800 pt-3 flex flex-col gap-2">
            <SidebarLink
              link={{
                href: '#',
                label: displayName,
                icon: <div className={`w-7 h-7 rounded-full ${avatarBg} flex items-center justify-center font-logo font-black text-white text-[10px] shrink-0`}>{config.initials}</div>,
              }}
              className="px-2 py-1.5 text-xs font-bold dark:text-white"
            />
            <SidebarLink
              link={{
                href: '#',
                label: 'Sign Out',
                icon: <LogOut size={16} className="shrink-0 text-zinc-400" />,
                onClick: handleSignOut,
              }}
              className="px-2 py-1.5 text-xs font-mono font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
            />
          </div>
        </SidebarBody>

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          <header className="h-14 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between gap-2 px-3 sm:px-6 relative z-20 shrink-0">
            <div className="flex items-center gap-2 min-w-0 max-w-[50%] sm:max-w-none">
              <SidebarMobileTrigger className="-ml-1" />
              <h1 className="font-logo font-black text-xs uppercase tracking-wider text-zinc-900 dark:text-white truncate">
                {headerTitle}
              </h1>
              <span className="hidden sm:inline-block text-zinc-300 dark:text-zinc-700">|</span>
              <span className="hidden sm:inline-block bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 text-[9px] font-mono font-bold rounded text-zinc-600 dark:text-zinc-300 whitespace-nowrap">
                {config.demoLabel}
              </span>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <LanguageSwitcher />
              <PillNav
                className="dashboard-header-nav"
                baseColor="transparent"
                pillColor={theme === 'light' ? 'var(--muted)' : 'var(--card)'}
                pillTextColor={theme === 'light' ? 'var(--foreground)' : 'var(--card-foreground)'}
                hoveredPillTextColor="var(--brand-red)"
                initialLoadAnimation={false}
                items={[
                  ...(onOpenPalette ? [{
                    label: (
                      <span className="flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Search</span>
                        <kbd className="hidden md:inline ml-0.5 px-1 py-0.5 bg-zinc-950/5 dark:bg-white/10 rounded text-[8px] font-bold">Ctrl K</kbd>
                      </span>
                    ),
                    href: '#',
                    onClick: onOpenPalette,
                    ariaLabel: 'Quick search (Ctrl+K)',
                  }] : []),
                  ...(extraHeaderItems ?? []),
                  {
                    label: (
                      <span className="flex items-center gap-1">
                        {theme === 'light' ? (
                          <Moon className="w-3.5 h-3.5" />
                        ) : (
                          <Sun className="w-3.5 h-3.5" />
                        )}
                        <span className="hidden sm:inline">THEME</span>
                      </span>
                    ),
                    href: '#',
                    onClick: toggleTheme,
                  },
                ]}
              />
              <NotificationCenter />
            </div>
          </header>

          <main className="flex-1 overflow-hidden flex flex-col relative app-canvas dark:bg-zinc-950">
            <div className={`flex-1 overflow-y-auto p-4 sm:p-6 pb-24 md:pb-6 ${activeTab === 'desk' ? 'md:pb-24' : ''}`}>
              {children}
            </div>

            {activeTab === 'desk' && (
              <CaptureBar
                accent={config.accent}
                placeholder={config.capturePlaceholder}
                alertMsg={workspace.alertMsg}
                voiceState={workspace.voiceState}
                transcribedText={workspace.transcribedText}
                textDirective={workspace.textDirective}
                setTextDirective={workspace.setTextDirective}
                onMicClick={workspace.handleMicClick}
                onApplyVoiceDirective={workspace.handleApplyVoiceDirective}
                onStructureText={workspace.handleStructureText}
                onFileUpload={workspace.handleFileUpload}
              />
            )}

            {/* Mobile bottom navigation bar */}
            <MobileBottomNav items={mobileNavItems} />
          </main>
        </div>
      </div>
    </Sidebar>
  );
}
