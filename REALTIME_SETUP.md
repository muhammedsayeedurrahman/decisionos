# Supabase Realtime Setup Guide

This guide shows you how to enable real-time collaboration in DecisionOS.

## What is Real-time?

Supabase Realtime allows multiple users to see live updates when data changes. When User A creates a task, User B sees it appear instantly without refreshing the page.

## Step 1: Enable Realtime in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Click **Database** in the left sidebar
3. Click the **Replication** tab
4. You'll see a list of tables

### Enable Replication for These Tables:

Check the boxes next to:
- ✅ **tasks**
- ✅ **handoffs**
- ✅ **notifications**

Click **Save** at the bottom.

## Step 2: Verify Real-time is Working

### Test Multi-User Updates:

1. Open two browser windows (or one normal + one incognito)
2. Sign in as **different users** in each window:
   - Window 1: Sign in as Owner
   - Window 2: Sign in as Sales

3. In Window 1 (Owner):
   - Create a new task
   - Assign it to Sales

4. In Window 2 (Sales):
   - Watch the task appear instantly ✨
   - No page refresh needed!

### Test Real-time Indicators:

You should see a **green banner** at the top saying "Connected to real-time updates" when you first load the dashboard.

If you lose internet connection, you'll see a **red banner** saying "Connection lost" with a "Reconnect" button.

## Step 3: Understanding Real-time Subscriptions

DecisionOS has 3 real-time channels:

### 1. Tasks Channel
- **Triggers on**: INSERT, UPDATE, DELETE in `tasks` table
- **What happens**: 
  - New tasks appear instantly
  - Task status updates (done/not done) sync immediately
  - Deleted tasks disappear from all users' screens

### 2. Handoffs Channel
- **Triggers on**: INSERT, UPDATE, DELETE in `handoffs` table
- **What happens**:
  - Handoff requests appear when created
  - Status updates (pending → submitted → approved) sync
  - Reply text updates in real-time

### 3. Notifications Channel
- **Triggers on**: INSERT in `notifications` table
- **What happens**:
  - Bell icon updates with new count
  - Toast notifications appear
  - Notification dropdown updates

## Troubleshooting

### "Connection lost" appears immediately

**Cause**: Realtime not enabled in Supabase Dashboard  
**Fix**: Follow Step 1 above to enable replication

### Tasks don't appear in real-time

**Possible causes**:

1. **Realtime not enabled**: Enable in Dashboard → Database → Replication
2. **Wrong workspace**: Users must be in the same workspace to see each other's updates
3. **RLS policy issue**: Verify user has a profile in the `profiles` table

**Debug steps**:
```bash
# Check Supabase logs
# Go to Dashboard → Logs → Realtime Logs
# Look for subscription events
```

### Multiple connections/disconnections

**Cause**: Browser tab sleeping or network instability  
**Fix**: This is normal behavior. The app auto-reconnects when the tab becomes active again.

### Real-time works but notifications don't appear

**Cause**: Notification permissions or toast library issue  
**Fix**: Check browser console for errors. Ensure Sonner toast library is working.

## Performance Considerations

### Bandwidth Usage

Real-time subscriptions use WebSocket connections:
- **Idle connection**: ~1KB/minute
- **Active updates**: ~5-10KB per update
- **Battery impact**: Minimal (WebSocket is efficient)

### Scaling

Supabase Realtime scales automatically:
- **Free tier**: 200 concurrent connections
- **Pro tier**: 500 concurrent connections
- **Enterprise**: Unlimited

## Advanced: Custom Real-time Events

You can add custom real-time events beyond database changes:

### Example: Broadcast Typing Indicator

```typescript
// In a future update, add typing indicators:
const channel = supabase.channel('task_comments')
  .on('broadcast', { event: 'typing' }, (payload) => {
    console.log('User is typing:', payload.user);
  });

// Send typing event
channel.send({
  type: 'broadcast',
  event: 'typing',
  payload: { user: 'Alice' }
});
```

## Monitoring Real-time Health

### Connection Status Indicator

The app shows connection status in the top banner:

- 🟢 **Green**: Connected to real-time updates
- 🔵 **Blue**: Connecting...
- 🔴 **Red**: Connection lost (with Reconnect button)

### Check Supabase Dashboard

1. Go to **Database** → **Replication**
2. Click on a table (e.g., `tasks`)
3. See the **Subscriptions** count
4. This shows how many clients are subscribed in real-time

## Security: Row Level Security with Realtime

Real-time respects Row Level Security (RLS) policies:

- Users only receive updates for rows they have permission to see
- If User A creates a task in Workspace 1, User B in Workspace 2 won't see it
- RLS policies filter real-time updates automatically

**Example**: Sales user only sees tasks assigned to Sales or created by Sales, even in real-time.

## Next Steps

Once real-time is working:

1. ✅ Test multi-user collaboration
2. ✅ Verify connection status indicator
3. ✅ Check Supabase logs for any errors
4. 🚀 Deploy to production with same setup

---

**Questions?** Check the [Supabase Realtime docs](https://supabase.com/docs/guides/realtime) or open an issue.
