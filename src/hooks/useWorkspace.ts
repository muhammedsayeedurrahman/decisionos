'use client';

import { useCallback, useEffect, useState } from 'react';
import { Role, ROLES } from '@/config/roles';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useFileUpload } from '@/hooks/useFileUpload';
import { useTasks, CreateTaskData } from '@/hooks/useTasks';
import { useHandoffs } from '@/hooks/useHandoffs';
import { useWorkspaceData } from '@/hooks/useWorkspaceData';
import { routeDirective, TaskCard, HandoffItem } from '@/utils/sharedState';
import { useNotifications } from '@/contexts/NotificationContext';

export type VoiceState = 'idle' | 'recording' | 'thinking' | 'done';

const roleLabel = (role: Role) => role.charAt(0).toUpperCase() + role.slice(1);

/**
 * Refactored workspace hook that uses Supabase API instead of localStorage
 * Maintains backward compatibility with existing components
 */
export function useWorkspace(role: Role) {
  const config = ROLES[role];

  // Notification system
  const { showSuccess, showError, showInfo } = useNotifications();

  // Theme state (still uses localStorage for user preference)
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  // Voice capture state
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [transcribedText, setTranscribedText] = useState('');
  const [textDirective, setTextDirective] = useState('');

  // Real audio recording and transcription
  const audioRecorder = useAudioRecorder();

  // Real file upload to Supabase Storage
  const fileUpload = useFileUpload();

  // Supabase data hooks
  const { tasks, loading: tasksLoading, createTask, updateTask, deleteTask, toggleDone } = useTasks(role);
  const { handoffs, loading: handoffsLoading, createHandoff, approveHandoff, rejectHandoff } = useHandoffs(role);
  const { workspace, user } = useWorkspaceData();

  // Calculate notifications count (pending tasks assigned to current role)
  const notificationCount = tasks.filter(t => !t.done && t.assigned_to === role).length;

  // Define triggerAlert for backward compatibility
  const triggerAlert = useCallback((msg: string) => {
    showSuccess(msg);
    // Also set alertMsg for any components still using it
    setAlertMsg(msg);
    setTimeout(() => setAlertMsg(null), 3000);
  }, [showSuccess]);

  // Theme management (still uses localStorage)
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const next = savedTheme === 'dark' || (!savedTheme && prefersDark) ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
  }, []);

  // Sync audio recorder state to voice state
  useEffect(() => {
    const recorderState = audioRecorder.state;
    if (recorderState === 'idle') {
      setVoiceState('idle');
    } else if (recorderState === 'recording') {
      setVoiceState('recording');
    } else if (recorderState === 'processing') {
      setVoiceState('thinking');
    } else if (recorderState === 'done') {
      setVoiceState('done');
    } else if (recorderState === 'error') {
      setVoiceState('idle');
      if (audioRecorder.error) {
        showError('Recording Error', audioRecorder.error);
      }
    }
  }, [audioRecorder.state, audioRecorder.error, showError]);

  // Sync transcription from audio recorder
  useEffect(() => {
    if (audioRecorder.transcription) {
      setTranscribedText(audioRecorder.transcription);
    }
  }, [audioRecorder.transcription]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', next === 'dark');
      localStorage.setItem('theme', next);
      return next;
    });
  }, []);

  const handleMarkDone = useCallback(async (id: number) => {
    await toggleDone(id);
  }, [toggleDone]);

  const handleDismiss = useCallback(async (id: number) => {
    await deleteTask(id);
    triggerAlert('Task dismissed');
  }, [deleteTask, triggerAlert]);

  const handleSendToBoard = useCallback((title: string) => {
    triggerAlert(`"${title}" advanced to Loom Workflows Board.`);
  }, [triggerAlert]);

  const handleClearNotifications = useCallback(() => {
    // In the new system, notifications are calculated from tasks
    // This could mark all pending tasks as read or similar
    triggerAlert('Notifications cleared.');
  }, [triggerAlert]);

  const distributeTask = useCallback(async (taskData: CreateTaskData) => {
    const created = await createTask(taskData);
    if (created && taskData.assigned_to !== role) {
      triggerAlert(`Task assigned to ${taskData.assigned_to.toUpperCase()}`);
    }
  }, [createTask, role, triggerAlert]);

  const handleMicClick = useCallback(async () => {
    if (voiceState === 'idle') {
      // Start real audio recording
      await audioRecorder.startRecording();
    } else if (voiceState === 'recording') {
      // Stop recording and trigger transcription
      await audioRecorder.stopRecording();
    } else {
      // Cancel or reset
      audioRecorder.cancelRecording();
      setTranscribedText('');
    }
  }, [voiceState, audioRecorder]);

  const handleApplyVoiceDirective = useCallback(async () => {
    if (!transcribedText) return;
    const parsed = routeDirective(transcribedText);

    await distributeTask({
      title: 'Voice: ' + transcribedText.substring(0, 45) + '...',
      subtext: transcribedText,
      type: 'TASK',
      source: 'VOICE',
      category: parsed.category,
      assigned_to: parsed.assignedTo,
      done: false,
    });

    setVoiceState('idle');
    setTranscribedText('');
    triggerAlert(`Voice directive assigned to ${parsed.assignedTo.toUpperCase()} and distributed!`);
  }, [transcribedText, distributeTask, triggerAlert]);

  const handleStructureText = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textDirective.trim()) return;
    const parsed = routeDirective(textDirective);

    await distributeTask({
      title: textDirective,
      subtext: `${roleLabel(role)} instruction assigned to ${parsed.assignedTo.toUpperCase()}`,
      type: 'TASK',
      source: 'TEXT',
      category: parsed.category,
      assigned_to: parsed.assignedTo,
      done: false,
    });

    setTextDirective('');
    triggerAlert(`Structured and assigned to ${parsed.assignedTo.toUpperCase()} successfully.`);
  }, [textDirective, role, distributeTask, triggerAlert]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file) return;

    try {
      showInfo('Uploading file...', `Processing ${file.name}`);

      // Upload file to Supabase Storage
      const result = await fileUpload.upload(file, {
        bucket: 'documents',
        folder: 'uploads',
      });

      // Create a task based on the uploaded file
      const parsed = routeDirective(`Process uploaded document: ${file.name}`);
      await distributeTask({
        title: `Process uploaded file: ${file.name}`,
        subtext: `Uploaded to: ${result.path}`,
        type: file.type.includes('pdf') ? 'INVOICE' : 'TASK',
        source: 'UPLOAD',
        category: parsed.category,
        assigned_to: parsed.assignedTo,
        done: false,
      });

      showSuccess('File uploaded', `${file.name} assigned to ${parsed.assignedTo.toUpperCase()}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      showError('Upload failed', errorMsg);
    }
  }, [fileUpload, distributeTask, showInfo, showSuccess, showError]);

  // Wrapper to extract file from input event
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
    // Reset input value so the same file can be uploaded again
    e.target.value = '';
  }, [handleFileUpload]);

  // Adapter: Convert database tasks to legacy TaskCard format for backward compatibility
  const cards: TaskCard[] = tasks.map(task => ({
    id: task.id,
    title: task.title,
    subtext: task.subtext || '',
    type: task.type as TaskCard['type'],
    source: task.source as TaskCard['source'],
    category: task.category as TaskCard['category'],
    done: task.done,
    assignedTo: task.assigned_to,
    scheduledDate: task.scheduled_date || undefined,
    scheduledTime: task.reminder_time || undefined,
  }));

  // Adapter: Convert database handoffs to legacy HandoffItem format
  const legacyHandoffs: HandoffItem[] = handoffs.map(handoff => ({
    id: `${handoff.from_role}_handoff` as HandoffItem['id'],
    title: `Handoff from ${handoff.from_role}`,
    description: handoff.message,
    instruction: handoff.message,
    status: handoff.status,
    replyText: handoff.reply_text || '',
  }));

  return {
    config,
    theme,
    toggleTheme,
    // Backward compatible workspace state
    workspaceState: {
      cards,
      handoffs: legacyHandoffs,
      notifications: {
        owner: role === 'owner' ? notificationCount : 0,
        sales: role === 'sales' ? notificationCount : 0,
        production: role === 'production' ? notificationCount : 0,
        finance: role === 'finance' ? notificationCount : 0,
      },
    },
    // New API for components that want to use Supabase directly
    tasks,
    handoffs,
    workspace,
    user,
    loading: tasksLoading || handoffsLoading,
    alertMsg,
    triggerAlert,
    voiceState,
    transcribedText,
    textDirective,
    setTextDirective,
    handleMicClick,
    handleApplyVoiceDirective,
    handleStructureText,
    handleFileUpload: handleFileInputChange,
    handleMarkDone,
    handleDismiss,
    handleSendToBoard,
    handleClearNotifications,
    // New methods for direct API access
    createTask: distributeTask,
    updateTask,
    deleteTask,
    createHandoff,
    approveHandoff,
    rejectHandoff,
  };
}
