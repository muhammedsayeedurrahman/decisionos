# Real-time Architecture

This document describes the real-time collaboration architecture in DecisionOS powered by Supabase Realtime.

## Overview

DecisionOS uses Supabase Realtime to enable multi-user collaboration. When one user creates, updates, or deletes a task, all other users see the change instantly without refreshing the page.

## Architecture Diagram

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│   Browser A     │         │   Browser B     │         │   Browser C     │
│   (Owner)       │         │   (Sales)       │         │   (Production)  │
└────────┬────────┘         └────────┬────────┘         └────────┬────────┘
         │                           │                           │
         │  WebSocket                │  WebSocket                │  WebSocket
         │  Connection               │  Connection               │  Connection
         │                           │                           │
         └───────────────────────────┼───────────────────────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  Supabase Realtime  │
                          │    (WebSocket       │
                          │     Broadcaster)    │
                          └──────────┬──────────┘
                                     │
                          ┌──────────▼──────────┐
                          │  PostgreSQL         │
                          │  (Source of Truth)  │
                          │                     │
                          │  - tasks            │
                          │  - handoffs         │
                          │  - notifications    │
                          └─────────────────────┘
```

## Data Flow

### 1. Task Creation Flow

```
User A creates task
       ↓
useTasks.createTask()
       ↓
Supabase client INSERT
       ↓
PostgreSQL writes row
       ↓
PostgreSQL trigger fires
       ↓
Supabase Realtime broadcasts
       ↓
All subscribed clients receive event
       ↓
handleRealtimeUpdate() in each client
       ↓
Local state updated with new task
       ↓
UI re-renders showing new task
```

### 2. Task Update Flow

```
User B marks task as done
       ↓
useTasks.toggleDone()
       ↓
Supabase client UPDATE
       ↓
PostgreSQL updates row
       ↓
Realtime broadcasts UPDATE event
       ↓
User A and C receive update
       ↓
Their UIs reflect task completion
```

## Real-time Channels

### Tasks Channel

**Purpose**: Sync task changes across all users in a workspace

**Subscription**:
```typescript
const channel = supabase.channel('tasks_changes')
  .on('postgres_changes', {
    event: '*',                    // INSERT, UPDATE, DELETE
    schema: 'public',
    table: 'tasks',
    filter: `workspace_id=eq.${workspace_id}`,
  }, handleRealtimeUpdate)
  .subscribe();
```

**Events**:
- `INSERT`: New task created
- `UPDATE`: Task modified (title, status, assignee, etc.)
- `DELETE`: Task deleted

**Handler**:
```typescript
function handleRealtimeUpdate(payload: RealtimePostgresChangesPayload<Task>) {
  switch (payload.eventType) {
    case 'INSERT':
      setTasks(prev => [...prev, payload.new]);
      break;
    case 'UPDATE':
      setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
      break;
    case 'DELETE':
      setTasks(prev => prev.filter(t => t.id !== payload.old.id));
      break;
  }
}
```

### Handoffs Channel

**Purpose**: Sync handoff requests and status updates

**Subscription**:
```typescript
const channel = supabase.channel('handoffs_changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'handoffs',
    filter: `workspace_id=eq.${workspace_id}`,
  }, handleHandoffUpdate)
  .subscribe();
```

**Events**:
- `INSERT`: New handoff created
- `UPDATE`: Handoff status changed (pending → submitted → approved)
- `DELETE`: Handoff deleted

### Notifications Channel

**Purpose**: Push notifications to users

**Subscription**:
```typescript
const channel = supabase.channel('notifications_changes')
  .on('postgres_changes', {
    event: 'INSERT',               // Only new notifications
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${user_id}`,
  }, handleNewNotification)
  .subscribe();
```

**Events**:
- `INSERT`: New notification created
  - Updates bell icon badge count
  - Shows toast notification
  - Adds to notification dropdown

### Connection Status Channel

**Purpose**: Monitor WebSocket connection health

**Subscription**:
```typescript
const channel = supabase.channel('presence_status', {
  config: {
    presence: { key: 'connection' },
  },
})
.on('presence', { event: 'sync' }, () => setStatus('connected'))
.on('presence', { event: 'join' }, () => setStatus('connected'))
.on('presence', { event: 'leave' }, () => setStatus('disconnected'))
.subscribe((status) => {
  if (status === 'SUBSCRIBED') setStatus('connected');
  else if (status === 'CHANNEL_ERROR') setStatus('error');
  else if (status === 'TIMED_OUT') setStatus('disconnected');
  else if (status === 'CLOSED') setStatus('disconnected');
});
```

**Status States**:
- `connecting`: Initial state, establishing WebSocket
- `connected`: WebSocket active, receiving updates
- `disconnected`: Connection lost, not receiving updates
- `error`: Connection error occurred

**UI Indicator**:
- Green banner: "Connected to real-time updates"
- Red banner: "Connection lost" with "Reconnect" button
- Blue banner: "Connecting..."

## Row Level Security (RLS) with Realtime

Supabase Realtime respects RLS policies. Users only receive updates for rows they have permission to see.

### Example: Tasks RLS Policy

```sql
CREATE POLICY "Users can view tasks in their workspace"
ON tasks
FOR SELECT
USING (workspace_id IN (
  SELECT workspace_id FROM profiles WHERE id = auth.uid()
));
```

**Real-time behavior**:
- User A (workspace 1) creates task → Only users in workspace 1 receive the event
- User B (workspace 2) does NOT see the task appear
- RLS filtering happens server-side before broadcasting

### Security Guarantees

1. **No cross-workspace leaks**: Users in Workspace 1 cannot see updates from Workspace 2
2. **Role-based filtering**: Sales users only see tasks assigned to them or created by them (via RLS)
3. **Auth-gated channels**: Unauthenticated users cannot subscribe to channels
4. **Server-side enforcement**: RLS policies run in PostgreSQL, not client-side filtering

## Connection Management

### Auto-Reconnection

Supabase Realtime handles reconnection automatically:
- Network drops → Client detects timeout → Auto-reconnects
- Server restarts → Client retries with exponential backoff
- Browser tab sleep → Reconnects when tab becomes active

### Manual Reconnection

Users can manually reconnect via the "Reconnect" button:

```typescript
const reconnect = () => {
  setStatus('connecting');
  if (channel) {
    channel.subscribe();
  }
};
```

### Subscription Lifecycle

```typescript
useEffect(() => {
  // Create channel
  const channel = supabase.channel('tasks_changes')
    .on('postgres_changes', { ... }, handler)
    .subscribe();

  // Cleanup on unmount
  return () => {
    supabase.removeChannel(channel);
  };
}, [workspace_id]);
```

**Important**: Always clean up channels in the `useEffect` return function to prevent memory leaks and duplicate subscriptions.

## Performance Considerations

### Bandwidth Usage

| Scenario | Bandwidth |
|----------|-----------|
| Idle connection (no updates) | ~1 KB/minute |
| Task created | ~5-10 KB per event |
| Task updated | ~5-10 KB per event |
| High-frequency updates (10/sec) | ~50-100 KB/sec |

### Scaling Limits

| Tier | Concurrent Connections | Cost |
|------|----------------------|------|
| Free | 200 | $0 |
| Pro | 500 | $25/month |
| Enterprise | Unlimited | Custom |

### Optimization Strategies

1. **Filter at database level**: Use `filter` parameter in subscription to reduce unnecessary events
   ```typescript
   filter: `workspace_id=eq.${workspace_id} AND assignee=eq.${role}`
   ```

2. **Debounce rapid updates**: If user is typing in a task title, debounce updates to avoid spamming the network
   ```typescript
   const debouncedUpdate = useDebouncedCallback(
     (taskId, newTitle) => updateTask(taskId, { title: newTitle }),
     500
   );
   ```

3. **Batch notifications**: Group multiple notifications into a single toast instead of showing 10 toasts at once

4. **Unsubscribe when not needed**: If user navigates away from dashboard, clean up all channels

## Troubleshooting

### Connection Lost Immediately

**Symptom**: Red "Connection lost" banner appears right after page load

**Cause**: Realtime not enabled in Supabase Dashboard

**Fix**: Go to Dashboard → Database → Replication → Enable replication for `tasks`, `handoffs`, `notifications`

### Tasks Don't Sync in Real-time

**Symptom**: User A creates task, User B doesn't see it

**Possible Causes**:
1. **Different workspaces**: User A is in workspace 1, User B is in workspace 2
2. **RLS blocking**: User B doesn't have permission to view the task
3. **Channel not subscribed**: Check browser console for subscription errors

**Debug Steps**:
1. Check Supabase logs: Dashboard → Logs → Realtime Logs
2. Check browser console for errors
3. Verify both users are in the same workspace
4. Test RLS policies in Supabase SQL Editor

### Multiple Connect/Disconnect Cycles

**Symptom**: Green → Red → Green → Red banner flickering

**Cause**: Network instability or browser tab throttling

**Fix**: This is expected behavior. Supabase Realtime will keep retrying until stable connection is established.

### High Latency

**Symptom**: Updates take 3-5 seconds to appear on other clients

**Possible Causes**:
1. **Slow network**: Check user's internet speed
2. **Supabase region mismatch**: Deploy Supabase in region closest to users
3. **Database load**: Check database performance metrics

**Fix**:
- Use Supabase edge functions for faster response
- Consider upgrading to Pro tier for better performance
- Check database indexes are in place

## Monitoring

### Supabase Dashboard

1. **Realtime Logs**: Dashboard → Logs → Realtime Logs
   - Shows all subscription events
   - Shows connection/disconnection events
   - Shows errors

2. **Database Replication**: Dashboard → Database → Replication
   - Shows which tables have replication enabled
   - Shows active subscription count per table

3. **API Usage**: Dashboard → Reports
   - Shows realtime bandwidth usage
   - Shows concurrent connection count
   - Shows error rates

### Client-Side Monitoring

**Connection Status Indicator**: Visible at top of dashboard (green/red banner)

**Browser Console Logs**:
```typescript
// Add logging to subscription handler
function handleRealtimeUpdate(payload) {
  console.log('Realtime event received:', payload.eventType, payload.new);
  // ... update state
}
```

**React DevTools**: Inspect `useTasks` hook state to verify updates are reflected

## Future Enhancements

### Presence (User Online Status)

Show which users are currently online in the workspace:

```typescript
const channel = supabase.channel('workspace_presence')
  .on('presence', { event: 'sync' }, () => {
    const state = channel.presenceState();
    setOnlineUsers(Object.values(state).flat());
  })
  .subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ user_id, name, role });
    }
  });
```

### Typing Indicators

Show when another user is typing in a task comment:

```typescript
// Send typing event
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { task_id, user_name },
});

// Listen for typing events
channel.on('broadcast', { event: 'typing' }, (payload) => {
  setTypingUsers(prev => [...prev, payload.user_name]);
});
```

### Cursor Sharing

Show other users' cursors on the dashboard (like Figma):

```typescript
channel.send({
  type: 'broadcast',
  event: 'cursor',
  payload: { x, y, user_id },
});
```

### Optimistic Updates

Update UI immediately before server confirms, then reconcile:

```typescript
const toggleDone = async (taskId: number) => {
  // Optimistic update
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, done: !t.done } : t
  ));

  // Server update
  const { error } = await supabase
    .from('tasks')
    .update({ done: !tasks.find(t => t.id === taskId)?.done })
    .eq('id', taskId);

  // Rollback on error
  if (error) {
    setTasks(prev => prev.map(t =>
      t.id === taskId ? { ...t, done: !t.done } : t
    ));
  }
};
```

## References

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [Supabase Realtime PostgreSQL Changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Supabase Presence](https://supabase.com/docs/guides/realtime/presence)
- [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Summary

DecisionOS uses Supabase Realtime to enable seamless multi-user collaboration. The architecture is built on:

1. **WebSocket connections** for low-latency updates
2. **PostgreSQL change data capture** for database-driven events
3. **Row Level Security** for workspace isolation
4. **Auto-reconnection** for reliability
5. **Connection monitoring** for user awareness

All real-time logic is encapsulated in React hooks (`useTasks`, `useHandoffs`, `useRealtimeStatus`), making it easy to integrate and test.
