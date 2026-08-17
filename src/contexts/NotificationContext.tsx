'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { CheckCircle, XCircle, AlertCircle, Info, Bell } from 'lucide-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  showSuccess: (title: string, message?: string, action?: Notification['action']) => void;
  showError: (title: string, message?: string, action?: Notification['action']) => void;
  showWarning: (title: string, message?: string, action?: Notification['action']) => void;
  showInfo: (title: string, message?: string, action?: Notification['action']) => void;
  showNotification: (type: Notification['type'], title: string, message?: string, action?: Notification['action']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotification: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const STORAGE_KEY = 'decisionos_notifications';
const MAX_NOTIFICATIONS = 50;

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    if (typeof window === 'undefined') return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
        }));
      } catch {
        return [];
      }
    }
    return [];
  });

  // Persist notifications to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };

    setNotifications(prev => {
      const updated = [newNotification, ...prev].slice(0, MAX_NOTIFICATIONS);
      return updated;
    });

    return newNotification;
  }, []);

  const showSuccess = useCallback((title: string, message?: string, action?: Notification['action']) => {
    const notification = addNotification({ type: 'success', title, message, action });

    toast.success(title, {
      description: message,
      icon: <CheckCircle className="w-5 h-5" />,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 4000,
    });

    return notification.id;
  }, [addNotification]);

  const showError = useCallback((title: string, message?: string, action?: Notification['action']) => {
    const notification = addNotification({ type: 'error', title, message, action });

    toast.error(title, {
      description: message,
      icon: <XCircle className="w-5 h-5" />,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 6000,
    });

    return notification.id;
  }, [addNotification]);

  const showWarning = useCallback((title: string, message?: string, action?: Notification['action']) => {
    const notification = addNotification({ type: 'warning', title, message, action });

    toast.warning(title, {
      description: message,
      icon: <AlertCircle className="w-5 h-5" />,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 5000,
    });

    return notification.id;
  }, [addNotification]);

  const showInfo = useCallback((title: string, message?: string, action?: Notification['action']) => {
    const notification = addNotification({ type: 'info', title, message, action });

    toast.info(title, {
      description: message,
      icon: <Info className="w-5 h-5" />,
      action: action ? {
        label: action.label,
        onClick: action.onClick,
      } : undefined,
      duration: 4000,
    });

    return notification.id;
  }, [addNotification]);

  const showNotification = useCallback((
    type: Notification['type'],
    title: string,
    message?: string,
    action?: Notification['action']
  ) => {
    switch (type) {
      case 'success':
        return showSuccess(title, message, action);
      case 'error':
        return showError(title, message, action);
      case 'warning':
        return showWarning(title, message, action);
      case 'info':
        return showInfo(title, message, action);
    }
  }, [showSuccess, showError, showWarning, showInfo]);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        showNotification,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAll,
      }}
    >
      {children}
      <Toaster
        position="top-right"
        expand={true}
        richColors
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'var(--font-geist-sans)',
          },
          className: 'toast-notification',
        }}
      />
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
}
