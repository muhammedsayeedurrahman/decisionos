'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, CheckCircle, XCircle, AlertCircle, Info, Settings, X, Check, Trash2 } from 'lucide-react';
import { useNotifications, type Notification } from '@/contexts/NotificationContext';

const NOTIFICATION_ICONS = {
  success: <CheckCircle className="w-4 h-4" />,
  error: <XCircle className="w-4 h-4" />,
  warning: <AlertCircle className="w-4 h-4" />,
  info: <Info className="w-4 h-4" />,
};

const NOTIFICATION_COLORS = {
  success: 'text-green-600 dark:text-green-500',
  error: 'text-red-600 dark:text-red-500',
  warning: 'text-orange-600 dark:text-orange-500',
  info: 'text-blue-600 dark:text-blue-500',
};

/**
 * Notification center with dropdown panel
 * Connected to NotificationContext for global notification management
 */
export function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    if (notification.action) {
      notification.action.onClick();
    }
    setIsOpen(false);
  };

  const formatTimestamp = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          relative
          p-2
          rounded-lg
          hover:bg-zinc-100 dark:hover:bg-zinc-800
          transition-colors
        "
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5 text-zinc-700 dark:text-zinc-300" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="
              absolute -top-1 -right-1
              w-5 h-5
              bg-brand-red
              text-white text-xs font-bold
              rounded-full
              flex items-center justify-center
              border-2 border-white dark:border-zinc-900
            "
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="
                absolute right-0 top-full mt-2
                w-96 max-w-[calc(100vw-2rem)]
                bg-white dark:bg-zinc-900
                rounded-xl
                shadow-xl
                border border-zinc-200 dark:border-zinc-800
                overflow-hidden
                z-50
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800">
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100">
                  Notifications
                </h3>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        markAllAsRead();
                      }}
                      className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-brand-red dark:hover:text-brand-red transition-colors cursor-pointer"
                      title="Mark all as read"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List */}
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-12 h-12 text-zinc-300 dark:text-zinc-700 mx-auto mb-3" />
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      You're all caught up!
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {notifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`
                          relative group
                          ${!notification.read ? 'bg-brand-red/5 dark:bg-brand-red/10' : ''}
                        `}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full p-4 text-left hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        >
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={`
                              flex-shrink-0 w-8 h-8
                              flex items-center justify-center
                              rounded-full
                              bg-zinc-100 dark:bg-zinc-800
                              ${NOTIFICATION_COLORS[notification.type]}
                            `}>
                              {NOTIFICATION_ICONS[notification.type]}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 pr-8">
                              <div className="flex items-start justify-between gap-2 mb-1">
                                <p className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                                  {notification.title}
                                </p>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-brand-red rounded-full flex-shrink-0 mt-1" />
                                )}
                              </div>
                              {notification.message && (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mb-1">
                                  {notification.message}
                                </p>
                              )}
                              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-500">
                                <span>{formatTimestamp(notification.timestamp)}</span>
                                {notification.action && (
                                  <>
                                    <span>•</span>
                                    <span className="text-brand-red font-medium">{notification.action.label}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearNotification(notification.id);
                          }}
                          className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 p-1 text-zinc-400 hover:text-red-500 transition-opacity cursor-pointer"
                          title="Delete notification"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-zinc-200 dark:border-zinc-800">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearAll();
                    }}
                    className="
                      w-full
                      text-xs font-medium
                      text-zinc-600 dark:text-zinc-400
                      hover:text-brand-red dark:hover:text-brand-red
                      transition-colors
                      cursor-pointer
                    "
                  >
                    Clear all notifications
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
