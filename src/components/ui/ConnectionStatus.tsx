'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useRealtimeStatus } from '@/hooks/useRealtimeStatus';

/**
 * Connection status indicator for Supabase Realtime
 * Shows at top of dashboard when connection status changes
 */
export function ConnectionStatus() {
  const { status, isConnected, isDisconnected, reconnect } = useRealtimeStatus();
  const [showStatus, setShowStatus] = React.useState(false);

  // Show status banner when disconnected or connecting
  React.useEffect(() => {
    if (status === 'disconnected' || status === 'error') {
      setShowStatus(true);
    } else if (status === 'connected') {
      // Show briefly when connected, then hide
      setShowStatus(true);
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  if (!showStatus) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 px-4 py-2 rounded-lg shadow-lg border flex items-center gap-2 text-sm font-medium ${
          isConnected
            ? 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900 text-green-700 dark:text-green-300'
            : isDisconnected
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
            : 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300'
        }`}
      >
        {status === 'connected' && (
          <>
            <Wifi className="w-4 h-4" />
            <span>Connected to real-time updates</span>
          </>
        )}
        {status === 'connecting' && (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Connecting...</span>
          </>
        )}
        {(status === 'disconnected' || status === 'error') && (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Connection lost</span>
            <button
              onClick={reconnect}
              className="ml-2 px-2 py-1 bg-red-700 dark:bg-red-600 text-white rounded text-xs font-bold hover:bg-red-800 dark:hover:bg-red-700 transition-colors"
            >
              Reconnect
            </button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
