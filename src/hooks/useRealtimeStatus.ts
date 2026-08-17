'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

/**
 * Hook to monitor Supabase Realtime connection status
 * Provides connection state and reconnection logic
 */
export function useRealtimeStatus() {
  const [status, setStatus] = useState<ConnectionStatus>('connecting');
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    // Create a presence channel to monitor connection
    const statusChannel = supabase.channel('presence_status', {
      config: {
        presence: {
          key: 'connection',
        },
      },
    });

    statusChannel
      .on('presence', { event: 'sync' }, () => {
        setStatus('connected');
      })
      .on('presence', { event: 'join' }, () => {
        setStatus('connected');
      })
      .on('presence', { event: 'leave' }, () => {
        setStatus('disconnected');
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setStatus('connected');
        } else if (status === 'CHANNEL_ERROR') {
          setStatus('error');
        } else if (status === 'TIMED_OUT') {
          setStatus('disconnected');
        } else if (status === 'CLOSED') {
          setStatus('disconnected');
        }
      });

    setChannel(statusChannel);

    return () => {
      statusChannel.unsubscribe();
    };
  }, []);

  const reconnect = () => {
    setStatus('connecting');
    if (channel) {
      channel.subscribe();
    }
  };

  return {
    status,
    isConnected: status === 'connected',
    isConnecting: status === 'connecting',
    isDisconnected: status === 'disconnected' || status === 'error',
    reconnect,
  };
}
