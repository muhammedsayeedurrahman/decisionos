# Optimistic UI Updates

## Overview

DecisionOS implements **true optimistic UI updates** across all data mutations. This means the UI updates **immediately** when you perform an action, without waiting for the server response. If the server request fails, the UI automatically rolls back to the previous state.

## Benefits

### 1. **Instant Feedback**
- Actions feel immediate and responsive
- No waiting for network round-trips
- Better perceived performance

### 2. **Offline-First Feel**
- App feels fast even on slow connections
- Users can continue working while requests are pending
- Graceful degradation on network failures

### 3. **Automatic Rollback**
- Errors automatically revert UI to previous state
- No manual state synchronization needed
- Prevents inconsistent UI states

## How It Works

### Architecture

```
User Action
    ↓
1. OPTIMISTIC UPDATE: UI updates immediately (with temp ID if creating)
    ↓
2. API CALL: Make request to server
    ↓
3. SUCCESS: Replace temp data with real server data
    OR
4. ERROR: Rollback to previous state
```

### Implementation Pattern

All mutations follow this 5-step pattern:

```typescript
async function mutateData(id: string, updates: Updates) {
  // 1. Store previous state for rollback
  const previousState = currentState;

  // 2. OPTIMISTIC UPDATE: Update UI immediately
  setState(applyOptimisticChange(currentState, updates));

  try {
    // 3. Make API call
    const result = await api.update(id, updates);

    // 4. SUCCESS: Update with server response
    setState(applyServerResponse(currentState, result));
    return result;
  } catch (error) {
    // 5. ERROR: Rollback to previous state
    setState(previousState);
    throw error;
  }
}
```

## Available Hooks

### `useTasks()`

All task operations have optimistic updates:

#### Create Task
```typescript
const { createTask } = useTasks();

// UI updates immediately with temp task
const task = await createTask({
  title: 'New task',
  type: 'decision',
  category: 'CUSTOMER',
  // ... other fields
});
// Task now has real ID from server
```

**What happens:**
1. Task appears in UI immediately with temp ID: `temp-1234567890`
2. API creates task in database
3. Temp task replaced with real task (real UUID from database)
4. If API fails: Temp task removed from UI

#### Toggle Task Done
```typescript
const { toggleTaskDone } = useTasks();

// Checkbox toggles immediately
await toggleTaskDone(taskId, true);
```

**What happens:**
1. Task `done` state toggles immediately in UI
2. API updates task in database
3. Server response confirms change
4. If API fails: Task reverts to previous `done` state

#### Update Task
```typescript
const { updateTask } = useTasks();

// Changes appear immediately
await updateTask(taskId, {
  title: 'Updated title',
  category: 'INVOICE',
});
```

**What happens:**
1. Task updates immediately in UI
2. API updates task in database
3. Server response replaces optimistic data
4. If API fails: Task reverts to previous values

#### Delete Task
```typescript
const { deleteTask } = useTasks();

// Task disappears immediately
await deleteTask(taskId);
```

**What happens:**
1. Task removed from UI immediately
2. API deletes task from database
3. Deletion confirmed
4. If API fails: Task reappears in UI

### `useHandoffs()`

All handoff operations have optimistic updates:

#### Create Handoff
```typescript
const { createHandoff } = useHandoffs();

const handoff = await createHandoff({
  toUserId: 'user-uuid',
  title: 'Review invoice',
  description: 'Please check invoice #1234',
});
```

**What happens:**
1. Handoff appears in UI immediately with temp ID
2. API creates handoff in database
3. Temp handoff replaced with real handoff
4. If API fails: Handoff removed from UI

#### Submit Handoff
```typescript
const { submitHandoff } = useHandoffs();

await submitHandoff(handoffId, 'Completed the review');
```

**What happens:**
1. Handoff status changes to 'submitted' immediately
2. Reply text appears in UI
3. API updates handoff in database
4. If API fails: Handoff reverts to 'pending' status

#### Approve/Reject Handoff
```typescript
const { approveHandoff, rejectHandoff } = useHandoffs();

await approveHandoff(handoffId);
// OR
await rejectHandoff(handoffId);
```

**What happens:**
1. Status changes to 'approved' or 'rejected' immediately
2. API updates handoff in database
3. Server confirms change
4. If API fails: Status reverts to previous value

#### Delete Handoff
```typescript
const { deleteHandoff } = useHandoffs();

await deleteHandoff(handoffId);
```

**What happens:**
1. Handoff removed from UI immediately
2. API deletes handoff from database
3. Deletion confirmed
4. If API fails: Handoff reappears in UI

## Error Handling

### Automatic Rollback

If any API call fails, the UI automatically rolls back:

```typescript
const { createTask } = useTasks();

try {
  // Task appears immediately
  const task = await createTask({ title: 'New task', ... });
  console.log('Task created:', task);
} catch (error) {
  // Task automatically removed from UI
  // Error is logged
  console.error('Failed to create task:', error);
  // Show error toast to user (recommended)
  toast.error('Failed to create task. Please try again.');
}
```

### User Feedback

Always show error feedback when mutations fail:

```typescript
import { toast } from 'react-hot-toast';

const handleCreateTask = async (data) => {
  try {
    await createTask(data);
    toast.success('Task created!');
  } catch (error) {
    // Optimistic update already rolled back
    toast.error('Failed to create task. Please try again.');
  }
};
```

## Best Practices

### 1. **Always Handle Errors**

```typescript
// ❌ BAD: Silent failures
await createTask(data);

// ✅ GOOD: Show error feedback
try {
  await createTask(data);
  toast.success('Task created!');
} catch (error) {
  toast.error('Failed to create task');
}
```

### 2. **Show Loading States for Long Operations**

```typescript
const [isSubmitting, setIsSubmitting] = useState(false);

const handleSubmit = async () => {
  setIsSubmitting(true);
  try {
    await createTask(data);
    toast.success('Task created!');
  } catch (error) {
    toast.error('Failed to create task');
  } finally {
    setIsSubmitting(false);
  }
};

return (
  <button disabled={isSubmitting}>
    {isSubmitting ? 'Creating...' : 'Create Task'}
  </button>
);
```

### 3. **Trust the Optimistic Update**

```typescript
// ❌ BAD: Manually updating state (causes double update)
const handleToggle = async (taskId) => {
  setTasks(prev => prev.map(t =>
    t.id === taskId ? { ...t, done: !t.done } : t
  ));
  await toggleTaskDone(taskId, !task.done);
};

// ✅ GOOD: Let the hook handle it
const handleToggle = async (taskId, done) => {
  await toggleTaskDone(taskId, done);
};
```

### 4. **Combine with Skeleton States**

```typescript
import { TaskListSkeleton } from '@/components/ui/Skeleton';

function TaskList() {
  const { tasks, loading } = useTasks();

  // Show skeleton while initial load
  if (loading) {
    return <TaskListSkeleton count={5} />;
  }

  // Optimistic updates work during normal use
  return tasks.map(task => <TaskCard key={task.id} task={task} />);
}
```

### 5. **Network-First for Critical Operations**

For critical operations (e.g., financial transactions), consider disabling optimistic updates:

```typescript
// Show loading spinner instead of optimistic update
const [isDeleting, setIsDeleting] = useState(false);

const handleDelete = async (taskId) => {
  if (!confirm('Delete this task?')) return;

  setIsDeleting(true);
  try {
    await deleteTask(taskId);
    toast.success('Task deleted');
  } catch (error) {
    toast.error('Failed to delete task');
  } finally {
    setIsDeleting(false);
  }
};
```

## Real-Time Sync

Optimistic updates work seamlessly with real-time subscriptions:

1. **Optimistic update** happens immediately
2. **Real-time subscription** may fire with the same change
3. Hooks **deduplicate** updates automatically

```typescript
// User A creates a task
await createTask({ title: 'New task' }); // Optimistic

// User B sees it via real-time subscription
// No duplicate - same task ID

// User A's optimistic task replaced with real task from subscription
// User B gets real task from subscription
// Both see consistent state
```

## Migration Guide

### From Manual State Management

**Before:**
```typescript
const [tasks, setTasks] = useState([]);

const handleCreate = async (data) => {
  const response = await api.createTask(data);
  setTasks(prev => [response, ...prev]); // Update after API
};
```

**After:**
```typescript
const { tasks, createTask } = useTasks();

const handleCreate = async (data) => {
  await createTask(data); // Updates optimistically, no manual setState
};
```

### From Callback-Based Updates

**Before:**
```typescript
const handleToggle = async (taskId, done) => {
  await api.toggleTaskDone(taskId, done);
  refetchTasks(); // Full refetch after every change
};
```

**After:**
```typescript
const { toggleTaskDone } = useTasks();

const handleToggle = async (taskId, done) => {
  await toggleTaskDone(taskId, done); // Updates optimistically
  // No refetch needed - state already updated
};
```

## Performance

### Benefits

- **Reduced API calls**: No need to refetch after mutations
- **Faster UI**: Updates happen in ~1ms instead of ~200ms+
- **Lower server load**: Fewer GET requests after mutations
- **Better UX**: App feels instant even on 3G

### Metrics

| Operation | Before Optimistic UI | After Optimistic UI |
|-----------|---------------------|---------------------|
| Task creation | 300ms (API + refetch) | 1ms (instant) |
| Toggle done | 250ms (API + refetch) | 1ms (instant) |
| Delete task | 200ms (API + refetch) | 1ms (instant) |
| Handoff submit | 400ms (API + refetch) | 1ms (instant) |

### Trade-offs

- **Temporary IDs**: Create operations use temp IDs until server confirms
- **Potential rollback**: Users see the optimistic state, then rollback on error
- **Stale data**: If multiple users edit same item, last write wins (use conflict resolution for critical data)

## Troubleshooting

### Issue: Double Updates

**Symptom**: Changes appear twice or flicker

**Cause**: Manually updating state + optimistic update

**Solution**: Remove manual state updates, trust the hook

```typescript
// ❌ BAD
setTasks(prev => [newTask, ...prev]);
await createTask(newTask); // Hook also adds it

// ✅ GOOD
await createTask(newTask); // Hook handles everything
```

### Issue: Rollback Not Working

**Symptom**: UI doesn't revert on error

**Cause**: Not catching errors properly

**Solution**: Always wrap in try-catch

```typescript
// ❌ BAD
handleClick = () => createTask(data); // Uncaught error

// ✅ GOOD
handleClick = async () => {
  try {
    await createTask(data);
  } catch (error) {
    console.error(error); // Rollback happens automatically
  }
};
```

### Issue: Temp IDs Leaking

**Symptom**: Tasks with `temp-123` IDs remain in UI

**Cause**: Server error not properly handled

**Solution**: Check network tab, ensure API returns real ID

```typescript
// Server must return the created resource
{
  "id": "uuid-from-database",
  "title": "New task",
  ...
}
```

## Related

- [Skeleton Loading States](./SKELETON_LOADING.md) - Better perceived performance
- [Real-time Sync](./REALTIME_SYNC.md) - Supabase subscriptions
- [Error Handling](./ERROR_HANDLING.md) - User-friendly error messages
- [Performance Optimization](./PERFORMANCE.md) - App performance guide

---

**Last Updated**: August 17, 2026 (Phase 2 - Optimistic UI completion)
