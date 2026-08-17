# Migration Guide: localStorage → Supabase Hooks

## Overview

This guide shows how to migrate components from localStorage-based state management to Supabase hooks with real-time updates.

**Before you start:** Complete Supabase setup (see IMPLEMENTATION_STATUS.md Step 1)

---

## Migration Pattern

### Before (localStorage):
```typescript
import { getSharedState, saveSharedState } from '@/utils/sharedState';

function MyComponent() {
  const [state, setState] = useState(getSharedState());

  const addTask = (task) => {
    const newState = {
      ...state,
      cards: [...state.cards, task]
    };
    setState(newState);
    saveSharedState(newState);
  };
}
```

### After (Supabase hooks):
```typescript
import { useTasks } from '@/lib/supabase/hooks';

function MyComponent() {
  const { tasks, loading, createTask } = useTasks();

  const addTask = async (taskData) => {
    await createTask(taskData);
    // State updates automatically via real-time subscription
  };
}
```

---

## Hook APIs

### `useTasks()`

Returns all tasks for the current workspace with real-time updates.

```typescript
const {
  tasks,              // Task[] - all workspace tasks
  loading,            // boolean - initial load state
  error,              // string | null - error message
  refetch,            // () => Promise<void> - manual refresh
  createTask,         // (data) => Promise<Task> - create new task
  updateTask,         // (id, updates) => Promise<Task> - update task
  toggleTaskDone,     // (id, done) => Promise<Task> - mark done/undone
  deleteTask          // (id) => Promise<void> - delete task
} = useTasks();
```

**Create Task Example:**
```typescript
await createTask({
  title: 'Follow up with Mumbai retailer',
  subtext: 'Quotation sent on 12th Jan',
  type: 'TASK',
  source: 'VOICE',
  category: 'CUSTOMER',
  assignedTo: 'user-id-here', // optional
  scheduledDate: '2026-08-20', // optional YYYY-MM-DD
  scheduledTime: '14:30'       // optional HH:MM
});
```

**Update Task Example:**
```typescript
await updateTask('task-id', {
  title: 'Updated title',
  done: true,
  scheduledDate: '2026-08-21'
});
```

---

### `useMyTasks()`

Returns only tasks assigned to the current user (lighter than `useTasks()`).

```typescript
const { tasks, loading, error } = useMyTasks();
```

Use this in "My Work" views for better performance.

---

### `useHandoffs()`

Returns all handoffs for the current workspace with real-time updates.

```typescript
const {
  handoffs,           // Handoff[] - all workspace handoffs
  loading,            // boolean - initial load state
  error,              // string | null - error message
  refetch,            // () => Promise<void> - manual refresh
  createHandoff,      // (data) => Promise<Handoff> - create handoff
  submitHandoff,      // (id, reply) => Promise<Handoff> - submit response
  approveHandoff,     // (id) => Promise<Handoff> - approve
  rejectHandoff,      // (id) => Promise<Handoff> - reject
  deleteHandoff       // (id) => Promise<void> - delete
} = useHandoffs();
```

**Create Handoff Example:**
```typescript
await createHandoff({
  toUserId: 'user-id-here',
  title: 'Review quotation for Delhi retailer',
  description: 'Premium cotton-nylon blend order',
  instruction: 'Please review and approve by EOD'
});
```

**Submit Response Example:**
```typescript
await submitHandoff('handoff-id', 'Reviewed and approved. Quotation sent.');
```

---

### `useMyHandoffs()`

Returns only handoffs assigned to the current user.

```typescript
const { handoffs, loading, error } = useMyHandoffs();
```

---

### `useNotifications()`

Returns notification counts for all roles with real-time updates.

```typescript
const {
  counts,             // { owner: number, sales: number, production: number, finance: number }
  loading,            // boolean - initial load state
  error,              // string | null - error message
  refetch,            // () => Promise<void> - manual refresh
  incrementCount,     // (role) => Promise<void> - +1 for role
  resetCount,         // (role) => Promise<void> - reset to 0
  resetAllCounts      // () => Promise<void> - reset all to 0
} = useNotifications();
```

**Usage Example:**
```typescript
// Increment when task is assigned
await incrementCount('sales');

// Reset when user views their dashboard
await resetCount(profile.role);

// Display badge
<div className="badge">{counts[profile.role]}</div>
```

---

## Step-by-Step Migration

### 1. Remove localStorage imports

**Before:**
```typescript
import { getSharedState, saveSharedState, WorkspaceState } from '@/utils/sharedState';
```

**After:**
```typescript
import { useTasks, useHandoffs, useNotifications } from '@/lib/supabase/hooks';
```

---

### 2. Replace state management

**Before:**
```typescript
const [state, setState] = useState<WorkspaceState>(getSharedState());

useEffect(() => {
  const interval = setInterval(() => {
    setState(getSharedState());
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

**After:**
```typescript
const { tasks } = useTasks();
const { handoffs } = useHandoffs();
const { counts } = useNotifications();

// Real-time updates happen automatically, no polling needed
```

---

### 3. Update mutations

**Before:**
```typescript
const handleAddTask = (task: TaskCard) => {
  const newState = {
    ...state,
    cards: [...state.cards, task]
  };
  setState(newState);
  saveSharedState(newState);
};
```

**After:**
```typescript
const { createTask } = useTasks();

const handleAddTask = async (taskData) => {
  try {
    await createTask(taskData);
    // UI updates automatically via real-time subscription
  } catch (error) {
    console.error('Failed to create task:', error);
    // Show error toast
  }
};
```

---

### 4. Handle loading states

Add loading indicators for better UX:

```typescript
const { tasks, loading } = useTasks();

if (loading) {
  return <LoadingSpinner />;
}

return (
  <div>
    {tasks.map(task => <TaskCard key={task.id} task={task} />)}
  </div>
);
```

---

### 5. Handle errors

Display errors to users:

```typescript
const { tasks, loading, error } = useTasks();

if (error) {
  return (
    <div className="error-message">
      Failed to load tasks: {error}
      <button onClick={() => refetch()}>Retry</button>
    </div>
  );
}
```

---

## Data Mapping

### TaskCard (old) → Task (new)

```typescript
// Old localStorage format
interface TaskCard {
  id: number;               // ❌ number
  assignedTo: 'owner' | 'sales' | 'production' | 'finance';
  // ... other fields
}

// New Supabase format
interface Task {
  id: string;               // ✅ UUID string
  assignedTo: string | null; // ✅ UUID reference to users table
  workspaceId: string;      // ✅ Added for multi-tenancy
  createdBy: string;        // ✅ Added for audit trail
  createdAt: string;        // ✅ Added timestamp
  updatedAt: string;        // ✅ Added timestamp
  // ... other fields (same)
}
```

**Migration mapping:**
- `id: number` → `id: string` (UUID)
- `assignedTo: 'owner'` → `assignedTo: user.id` (UUID from users table)
- Add `workspaceId` from `profile.workspace_id`
- Add `createdBy` from `profile.id`

---

### HandoffItem (old) → Handoff (new)

```typescript
// Old localStorage format
interface HandoffItem {
  id: 'sales_handoff' | 'production_handoff'; // ❌ hard-coded IDs
  title: string;
  // ... other fields
}

// New Supabase format
interface Handoff {
  id: string;               // ✅ UUID
  workspaceId: string;      // ✅ Added
  fromUserId: string;       // ✅ Added (who created it)
  toUserId: string;         // ✅ Added (who it's assigned to)
  status: 'pending' | 'submitted' | 'approved' | 'rejected'; // ✅ More states
  // ... other fields
}
```

---

## Real-Time Benefits

### Before (polling):
```typescript
// Poll localStorage every second (inefficient, stale data possible)
useEffect(() => {
  const interval = setInterval(() => {
    setState(getSharedState());
  }, 1000);
  return () => clearInterval(interval);
}, []);
```

### After (real-time):
```typescript
// Instant updates when any user changes data
const { tasks } = useTasks();
// Database change → Supabase Realtime → Hook updates → UI re-renders
// No polling, no stale data, instant collaboration
```

---

## Example: Migrate DashboardPage

**Before:**
```typescript
'use client';
import { useState, useEffect } from 'react';
import { getSharedState, saveSharedState } from '@/utils/sharedState';

export default function DashboardPage() {
  const [state, setState] = useState(getSharedState());

  useEffect(() => {
    const interval = setInterval(() => {
      setState(getSharedState());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const addTask = (task) => {
    const newState = {
      ...state,
      cards: [...state.cards, task]
    };
    setState(newState);
    saveSharedState(newState);
  };

  return <TaskList tasks={state.cards} onAdd={addTask} />;
}
```

**After:**
```typescript
'use client';
import { useTasks } from '@/lib/supabase/hooks';

export default function DashboardPage() {
  const { tasks, loading, error, createTask } = useTasks();

  const addTask = async (taskData) => {
    try {
      await createTask(taskData);
      // UI updates automatically
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;

  return <TaskList tasks={tasks} onAdd={addTask} />;
}
```

**Benefits:**
- ✅ Real-time updates (no polling)
- ✅ Optimistic UI (instant feedback)
- ✅ Error handling
- ✅ Loading states
- ✅ Multi-user collaboration ready
- ✅ Persistent across devices
- ✅ Audit trail (createdAt, updatedAt)

---

## Testing After Migration

1. **Start dev server:** `npm run dev`
2. **Open two browser windows** side-by-side
3. **Test real-time sync:**
   - Create task in Window 1
   - Should appear instantly in Window 2
4. **Test optimistic updates:**
   - Mark task done in Window 1
   - UI updates instantly (optimistic)
   - Database confirms shortly after
5. **Test error handling:**
   - Disconnect internet
   - Try to create task
   - Should show error message
   - Reconnect → retry works

---

## Next Steps

1. ✅ Complete Supabase setup (IMPLEMENTATION_STATUS.md Step 1)
2. 🔄 Migrate components one by one:
   - Start with `DashboardPage.tsx`
   - Then `TaskCalendarFeed.tsx`
   - Then `NotificationsPanel.tsx`
3. 🧪 Test each component after migration
4. 🗑️ Remove `src/utils/sharedState.ts` when all migrations complete
5. 🚀 Deploy to production

---

## Troubleshooting

### "Not authenticated" errors
- Ensure user is logged in
- Check `useAuth()` returns valid `profile`
- Verify `.env.local` has correct Supabase keys

### Real-time not working
- Check Supabase dashboard → Database → Replication
- Ensure tables have `ALTER PUBLICATION supabase_realtime ADD TABLE tasks;`
- Check browser console for WebSocket errors

### Type errors
- Run `npm run build` to check TypeScript errors
- Ensure database types in `client.ts` match actual schema
- Re-generate types: `supabase gen types typescript --project-id <id> > src/lib/supabase/types.ts`

### Slow queries
- Check indexes in migration file
- Add composite indexes for common queries:
  ```sql
  CREATE INDEX idx_tasks_workspace_assigned ON tasks(workspace_id, assigned_to);
  ```

---

**Ready to migrate!** Start with one component, test thoroughly, then move to the next.
