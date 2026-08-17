# Workspace API Reference

## Quick Start

The `useWorkspace()` hook provides access to all workspace data with real-time updates.

```typescript
import { useWorkspace } from '@/contexts/WorkspaceContext';

function MyComponent() {
  const { tasks, createTask, tasksLoading } = useWorkspace();

  if (tasksLoading) return <Loading />;

  return (
    <div>
      {tasks.map(task => (
        <div key={task.id}>{task.title}</div>
      ))}
    </div>
  );
}
```

---

## API Reference

### Tasks

#### `tasks: Task[]`
Array of all tasks in the workspace. Updates automatically in real-time.

#### `tasksLoading: boolean`
True during initial load. False once tasks are fetched.

#### `tasksError: string | null`
Error message if task fetch failed, null otherwise.

#### `createTask(data): Promise<Task>`
Create a new task.

```typescript
await createTask({
  title: 'Follow up with client',
  subtext: 'Regarding Q1 proposal',
  type: 'TASK',
  source: 'TEXT',
  category: 'CUSTOMER',
  assignedTo: 'user-id',        // Optional
  scheduledDate: '2026-08-20',  // Optional YYYY-MM-DD
  scheduledTime: '14:30'        // Optional HH:MM
});
```

**Parameters:**
- `title` (string, required): Task title
- `subtext` (string, optional): Additional details
- `type` ('TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL', required): Task type
- `source` ('TEXT' | 'VOICE' | 'UPLOAD', required): How task was created
- `category` ('CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER', required): Task category
- `assignedTo` (string, optional): User ID to assign task to
- `scheduledDate` (string, optional): ISO date (YYYY-MM-DD)
- `scheduledTime` (string, optional): 24h time (HH:MM)

**Returns:** Promise resolving to the created Task

#### `updateTask(id, updates): Promise<Task>`
Update an existing task.

```typescript
await updateTask('task-id', {
  title: 'Updated title',
  done: true
});
```

**Parameters:**
- `id` (string, required): Task ID
- `updates` (Partial<Task>, required): Fields to update

**Returns:** Promise resolving to the updated Task

#### `toggleTaskDone(id, done): Promise<Task>`
Mark task as done/undone.

```typescript
await toggleTaskDone('task-id', true); // Mark done
await toggleTaskDone('task-id', false); // Mark undone
```

**Returns:** Promise resolving to the updated Task

#### `deleteTask(id): Promise<void>`
Delete a task.

```typescript
await deleteTask('task-id');
```

#### `refetchTasks(): Promise<void>`
Manually refetch all tasks (rarely needed, real-time updates handle this).

---

### Handoffs

#### `handoffs: Handoff[]`
Array of all handoffs in the workspace. Updates automatically in real-time.

#### `handoffsLoading: boolean`
True during initial load.

#### `handoffsError: string | null`
Error message if handoff fetch failed.

#### `createHandoff(data): Promise<Handoff>`
Create a new handoff.

```typescript
await createHandoff({
  toUserId: 'user-id',
  title: 'Review quotation',
  description: 'For Delhi retailer',
  instruction: 'Please approve by EOD'
});
```

**Parameters:**
- `toUserId` (string, required): User ID to assign handoff to
- `title` (string, required): Handoff title
- `description` (string, optional): Detailed description
- `instruction` (string, optional): Specific instructions

**Returns:** Promise resolving to the created Handoff

#### `submitHandoff(id, replyText): Promise<Handoff>`
Submit a response to a handoff.

```typescript
await submitHandoff('handoff-id', 'Reviewed and approved');
```

#### `approveHandoff(id): Promise<Handoff>`
Approve a handoff.

```typescript
await approveHandoff('handoff-id');
```

#### `rejectHandoff(id): Promise<Handoff>`
Reject a handoff.

```typescript
await rejectHandoff('handoff-id');
```

#### `deleteHandoff(id): Promise<void>`
Delete a handoff.

```typescript
await deleteHandoff('handoff-id');
```

#### `refetchHandoffs(): Promise<void>`
Manually refetch all handoffs.

---

### Notifications

#### `notificationCounts: NotificationCounts`
Object with counts for each role:

```typescript
{
  owner: 4,
  sales: 7,
  production: 3,
  finance: 5
}
```

#### `notificationsLoading: boolean`
True during initial load.

#### `notificationsError: string | null`
Error message if notification fetch failed.

#### `incrementNotificationCount(role): Promise<void>`
Increment count for a specific role.

```typescript
await incrementNotificationCount('sales'); // +1 for sales
```

#### `resetNotificationCount(role): Promise<void>`
Reset count to 0 for a specific role.

```typescript
await resetNotificationCount('owner'); // Clear owner's notifications
```

#### `resetAllNotificationCounts(): Promise<void>`
Reset all role counts to 0.

```typescript
await resetAllNotificationCounts();
```

#### `refetchNotifications(): Promise<void>`
Manually refetch notification counts.

---

## Real-Time Updates

All data updates automatically via Supabase Realtime:

```typescript
// Window 1: Create a task
await createTask({ ... });

// Window 2: tasks array updates immediately
// No refresh needed!
```

**How it works:**
1. You call `createTask()`
2. Task is saved to database
3. Supabase Realtime broadcasts the change
4. All connected clients receive the update
5. `tasks` array updates automatically
6. React re-renders with new data

**No polling, no manual refetch, instant collaboration.**

---

## Error Handling

Always wrap mutations in try-catch:

```typescript
try {
  await createTask({ ... });
  // Success - UI already updated optimistically
} catch (error) {
  // Error - show toast notification
  console.error('Failed to create task:', error);
}
```

---

## Loading States

Show loading indicators during initial fetch:

```typescript
const { tasks, tasksLoading } = useWorkspace();

if (tasksLoading) {
  return <Spinner />;
}

return <TaskList tasks={tasks} />;
```

**Note:** Loading is only true during **initial** fetch. Real-time updates don't set loading to true.

---

## Optimistic Updates

All mutations update the UI **immediately**, then sync with the database:

```typescript
await toggleTaskDone('task-id', true);
// ✅ UI updates instantly (checkbox checks)
// ⏳ Database confirms in background
// ❌ On error, UI rolls back automatically
```

This makes the app feel instant even on slow connections.

---

## Complete Example

```typescript
'use client';

import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';

export default function TaskDashboard() {
  const { profile } = useAuth();
  const {
    tasks,
    tasksLoading,
    tasksError,
    createTask,
    toggleTaskDone,
    deleteTask,
    notificationCounts,
    resetNotificationCount
  } = useWorkspace();

  // Clear notifications when dashboard loads
  useEffect(() => {
    if (profile?.role) {
      resetNotificationCount(profile.role);
    }
  }, [profile, resetNotificationCount]);

  const handleAddTask = async () => {
    try {
      await createTask({
        title: 'New task',
        type: 'TASK',
        source: 'TEXT',
        category: 'OTHER'
      });
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  };

  const handleToggle = async (taskId: string, done: boolean) => {
    try {
      await toggleTaskDone(taskId, !done);
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (error) {
        console.error('Failed to delete task:', error);
      }
    }
  };

  if (tasksLoading) {
    return <div>Loading tasks...</div>;
  }

  if (tasksError) {
    return <div>Error: {tasksError}</div>;
  }

  return (
    <div>
      <header>
        <h1>My Tasks</h1>
        {profile && (
          <div className="badge">
            {notificationCounts[profile.role]} new
          </div>
        )}
      </header>

      <button onClick={handleAddTask}>
        Add Task
      </button>

      <ul>
        {tasks.map(task => (
          <li key={task.id}>
            <input
              type="checkbox"
              checked={task.done}
              onChange={() => handleToggle(task.id, task.done)}
            />
            <span>{task.title}</span>
            <button onClick={() => handleDelete(task.id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Migration from localStorage

See `MIGRATION_GUIDE.md` for detailed migration steps.

**Before:**
```typescript
const [state, setState] = useState(getSharedState());
```

**After:**
```typescript
const { tasks, createTask } = useWorkspace();
```

**Benefits:**
- ✅ Real-time sync across users
- ✅ Persistent across devices
- ✅ Optimistic updates
- ✅ Type-safe
- ✅ Error handling built-in
- ✅ No manual state management

---

## TypeScript Types

```typescript
interface Task {
  id: string;
  workspaceId: string;
  title: string;
  subtext: string | null;
  type: 'TASK' | 'REMINDER' | 'INVOICE' | 'APPROVAL';
  source: 'TEXT' | 'VOICE' | 'UPLOAD';
  category: 'CUSTOMER' | 'SUPPLIER' | 'INVOICE' | 'PAYMENT' | 'COMPLAINT' | 'OTHER';
  assignedTo: string | null;
  createdBy: string;
  done: boolean;
  scheduledDate: string | null;
  scheduledTime: string | null;
  detailsCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Handoff {
  id: string;
  workspaceId: string;
  fromUserId: string;
  toUserId: string;
  title: string;
  description: string | null;
  instruction: string | null;
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  replyText: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NotificationCounts {
  owner: number;
  sales: number;
  production: number;
  finance: number;
}
```

---

Ready to build! 🚀
