'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTasks, useHandoffs, useNotifications } from '@/lib/supabase/hooks';
import { useAuth } from '@/contexts/AuthContext';
import { routeDirective } from '@/utils/sharedState';
import { Role, ROLES } from '@/config/roles';

export type VoiceState = 'idle' | 'recording' | 'thinking' | 'done';

const roleLabel = (role: Role) => role.charAt(0).toUpperCase() + role.slice(1);

/**
 * Supabase-powered workspace hook with real-time updates
 *
 * Replaces localStorage with Supabase database + real-time subscriptions.
 * API-compatible with the original useWorkspace for easy migration.
 */
export function useWorkspaceV2(role: Role) {
  const config = ROLES[role];
  const { profile } = useAuth();

  // Supabase hooks - automatic real-time updates
  const { tasks, createTask, updateTask, deleteTask } = useTasks();
  const { handoffs, createHandoff } = useHandoffs();
  const { counts, incrementCount, resetCount } = useNotifications();

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [textDirective, setTextDirective] = useState('');

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);

  const triggerAlert = useCallback((msg: string) => {
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const handleMarkDone = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      await updateTask(id, { done: !task.done });
    } catch (error) {
      triggerAlert('Failed to update task. Please try again.');
      console.error('Failed to mark task done:', error);
    }
  }, [tasks, updateTask, triggerAlert]);

  const handleDismiss = useCallback(async (id: string) => {
    try {
      await deleteTask(id);
    } catch (error) {
      triggerAlert('Failed to delete task. Please try again.');
      console.error('Failed to dismiss task:', error);
    }
  }, [deleteTask, triggerAlert]);

  const handleSendToBoard = useCallback((title: string) => {
    triggerAlert(`"${title}" advanced to Loom Workflows Board.`);
  }, [triggerAlert]);

  const handleClearNotifications = useCallback(async () => {
    try {
      await resetCount(role);
      triggerAlert('Notifications cleared.');
    } catch (error) {
      triggerAlert('Failed to clear notifications. Please try again.');
      console.error('Failed to clear notifications:', error);
    }
  }, [role, resetCount, triggerAlert]);

  const distributeCard = useCallback(async (cardData: {
    title: string;
    subtext: string;
    type: 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
    source: 'TEXT' | 'VOICE' | 'UPLOAD';
    category: 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
    assignedTo: Role;
  }) => {
    if (!profile || !profile.workspace_id) {
      triggerAlert('Not authenticated. Please sign in.');
      return;
    }

    try {
      // Find the user ID for the assigned role
      // For now, we'll use the current user's ID if assigning to self
      // TODO: Fetch workspace users and map role to user ID
      const assignedUserId = cardData.assignedTo === role ? profile.id : null;

      await createTask({
        title: cardData.title,
        subtext: cardData.subtext,
        type: cardData.type,
        source: cardData.source,
        category: cardData.category,
        assignedTo: assignedUserId,
      });

      // Increment notification count if assigned to someone else
      if (cardData.assignedTo !== role) {
        await incrementCount(cardData.assignedTo);
      }
    } catch (error) {
      triggerAlert('Failed to create task. Please try again.');
      console.error('Failed to distribute card:', error);
    }
  }, [profile, role, createTask, incrementCount, triggerAlert]);

  const recordTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const thinkTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearVoiceTimers = useCallback(() => {
    if (recordTimeoutRef.current) clearTimeout(recordTimeoutRef.current);
    if (thinkTimeoutRef.current) clearTimeout(thinkTimeoutRef.current);
    recordTimeoutRef.current = null;
    thinkTimeoutRef.current = null;
  }, []);

  useEffect(() => clearVoiceTimers, [clearVoiceTimers]);

  const handleMicClick = useCallback(() => {
    if (voiceState === 'idle') {
      setVoiceState('recording');
      recordTimeoutRef.current = setTimeout(() => {
        setVoiceState('thinking');
        thinkTimeoutRef.current = setTimeout(() => {
          setVoiceState('done');
          setTranscribedText(config.voiceSample);
        }, 1200);
      }, 2500);
    } else {
      clearVoiceTimers();
      setVoiceState('idle');
      setTranscribedText('');
    }
  }, [voiceState, config.voiceSample, clearVoiceTimers]);

  const handleApplyVoiceDirective = useCallback(async () => {
    if (!transcribedText) return;

    const parsed = routeDirective(transcribedText);
    await distributeCard({
      title: 'Voice: ' + transcribedText.substring(0, 45) + '...',
      subtext: transcribedText,
      type: 'TASK',
      source: 'VOICE',
      category: parsed.category,
      assignedTo: parsed.assignedTo,
    });

    setVoiceState('idle');
    setTranscribedText('');
    triggerAlert(`Voice directive assigned to ${parsed.assignedTo.toUpperCase()} and distributed!`);
  }, [transcribedText, distributeCard, triggerAlert]);

  const handleStructureText = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textDirective.trim()) return;

    const parsed = routeDirective(textDirective);
    await distributeCard({
      title: textDirective,
      subtext: `${roleLabel(role)} instruction assigned to ${parsed.assignedTo.toUpperCase()}`,
      type: 'TASK',
      source: 'TEXT',
      category: parsed.category,
      assignedTo: parsed.assignedTo,
    });

    setTextDirective('');
    triggerAlert(`Structured and assigned to ${parsed.assignedTo.toUpperCase()} successfully.`);
  }, [textDirective, role, distributeCard, triggerAlert]);

  const handleFileUpload = useCallback(async () => {
    triggerAlert('Scanning uploaded file...');

    setTimeout(async () => {
      await distributeCard({
        title: 'Verify invoice PO-8812 matching supplier delivery list',
        subtext: 'Structured from uploaded PDF document scan (purchase_order_8812.pdf).',
        type: 'INVOICE',
        source: 'UPLOAD',
        category: 'INVOICE',
        assignedTo: 'finance',
      });
      triggerAlert('Invoice structured and routed to Sunita Rao (Finance).');
    }, 1000);
  }, [distributeCard, triggerAlert]);

  // Convert Supabase Task[] to old TaskCard[] format for backwards compatibility
  const workspaceState = {
    cards: tasks.map(task => ({
      id: parseInt(task.id.substring(0, 8), 16), // Convert UUID to number for demo compatibility
      title: task.title,
      subtext: task.subtext || '',
      type: task.type,
      source: task.source,
      category: task.category,
      assignedTo: (role as 'owner' | 'sales' | 'production' | 'finance'), // Simplified for demo
      done: task.done,
      detailsCount: task.detailsCount,
      scheduledDate: task.scheduledDate || undefined,
      scheduledTime: task.scheduledTime || undefined,
    })),
    handoffs: handoffs.map(handoff => ({
      id: (handoff.id as 'sales_handoff' | 'production_handoff'), // Simplified for demo
      title: handoff.title,
      description: handoff.description || '',
      instruction: handoff.instruction || '',
      status: (handoff.status === 'rejected' ? 'approved' : handoff.status) as 'pending' | 'submitted' | 'approved',
      replyText: handoff.replyText || '',
    })),
    notifications: counts,
  };

  return {
    config,
    theme,
    toggleTheme,
    workspaceState,
    updateState: () => {}, // No longer needed, real-time updates happen automatically
    distributeCard,
    alertMsg,
    triggerAlert,
    voiceState,
    transcribedText,
    textDirective,
    setTextDirective,
    handleMicClick,
    handleApplyVoiceDirective,
    handleStructureText,
    handleFileUpload,
    handleMarkDone,
    handleDismiss,
    handleSendToBoard,
    handleClearNotifications,
  };
}
