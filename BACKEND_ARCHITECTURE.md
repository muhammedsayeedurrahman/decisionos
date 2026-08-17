# DecisionOS Backend Architecture

**Tech Stack:** Supabase (PostgreSQL + Auth + Real-time + Storage) + Whisper API

---

## 1. DATABASE SCHEMA

### Tables

#### `workspaces`
Multi-tenant organization/company container.

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT, -- e.g., "textile_manufacturing"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `users`
Extended from Supabase Auth users.

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'sales', 'production', 'finance')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `tasks`
Replaces TaskCard from localStorage.

```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtext TEXT,
  type TEXT NOT NULL CHECK (type IN ('TASK', 'REMINDER', 'INVOICE', 'APPROVAL')),
  source TEXT NOT NULL CHECK (source IN ('TEXT', 'VOICE', 'UPLOAD')),
  category TEXT NOT NULL CHECK (category IN ('CUSTOMER', 'SUPPLIER', 'INVOICE', 'PAYMENT', 'COMPLAINT', 'OTHER')),
  assigned_to UUID REFERENCES users(id),
  created_by UUID REFERENCES users(id),
  done BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  scheduled_time TIME,
  details_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `handoffs`
Inter-role task handoffs.

```sql
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  from_user_id UUID REFERENCES users(id),
  to_user_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  instruction TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  reply_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `notifications`
Per-user notification counts.

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  count INT DEFAULT 0,
  last_cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);
```

#### `meetings`
Meeting notes and transcripts.

```sql
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript TEXT,
  attendees TEXT[], -- Array of user emails
  meeting_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `voice_recordings`
Voice capture metadata.

```sql
CREATE TABLE voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  audio_file_path TEXT, -- Supabase Storage path
  transcript TEXT,
  duration_seconds FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `uploads`
Document upload tracking.

```sql
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL, -- Supabase Storage path
  file_name TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

## 2. ROW LEVEL SECURITY (RLS) POLICIES

All tables enforce workspace-based data isolation:

```sql
-- Example for tasks table
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Users can only see tasks in their workspace
CREATE POLICY "Users can view tasks in their workspace"
  ON tasks FOR SELECT
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Users can create tasks in their workspace
CREATE POLICY "Users can create tasks in their workspace"
  ON tasks FOR INSERT
  WITH CHECK (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));

-- Users can update tasks in their workspace
CREATE POLICY "Users can update tasks in their workspace"
  ON tasks FOR UPDATE
  USING (workspace_id IN (
    SELECT workspace_id FROM users WHERE id = auth.uid()
  ));
```

Repeat similar policies for all tables.

---

## 3. INDEXES

Performance optimization for common queries:

```sql
-- Tasks
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_done ON tasks(done);

-- Handoffs
CREATE INDEX idx_handoffs_workspace ON handoffs(workspace_id);
CREATE INDEX idx_handoffs_to_user ON handoffs(to_user_id);
CREATE INDEX idx_handoffs_status ON handoffs(status);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- Users
CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_role ON users(role);
```

---

## 4. SUPABASE REALTIME

Enable real-time subscriptions for live updates:

```sql
-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE handoffs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

Client-side subscriptions:
```typescript
// Subscribe to task changes
supabase
  .channel('tasks')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
    // Update UI with new task data
  })
  .subscribe();
```

---

## 5. AUTHENTICATION FLOW

### Sign Up
1. User enters email/password on registration page
2. Supabase Auth creates user in `auth.users`
3. Trigger creates entry in `users` table
4. Workspace is created (first user becomes owner)
5. User redirected to dashboard

### Sign In
1. User enters credentials on login page
2. Supabase Auth validates and returns JWT
3. JWT stored in httpOnly cookie
4. User redirected to role-specific dashboard
5. RLS policies enforce data access

### Session Management
- JWT auto-refresh via Supabase client
- Server-side session validation with middleware
- Logout clears session and redirects to login

---

## 6. API LAYER ARCHITECTURE

### Custom Hooks (React Query recommended)

```typescript
// src/hooks/api/useTasks.ts
export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('workspace_id', workspace.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: CreateTaskInput) => {
      const { data, error } = await supabase
        .from('tasks')
        .insert([task])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
}
```

---

## 7. WHISPER API INTEGRATION

### Voice Recording Flow

1. **Capture Audio** (Web Audio API)
   ```typescript
   const mediaRecorder = new MediaRecorder(stream);
   const audioChunks = [];
   mediaRecorder.ondataavailable = (e) => audioChunks.push(e.data);
   ```

2. **Upload to Supabase Storage**
   ```typescript
   const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
   const fileName = `${userId}-${Date.now()}.webm`;
   await supabase.storage.from('voice-recordings').upload(fileName, audioBlob);
   ```

3. **Call Whisper API**
   ```typescript
   const formData = new FormData();
   formData.append('file', audioBlob, 'recording.webm');
   formData.append('model', 'whisper-1');

   const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
     method: 'POST',
     headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
     body: formData
   });

   const { text } = await response.json();
   ```

4. **Process Transcript** (existing keyword routing)
   ```typescript
   const parsed = routeDirective(text);
   await createTask({ title: parsed.title, assignedTo: parsed.assignedTo, ... });
   ```

---

## 8. MIGRATION STRATEGY

### Phase 1: Parallel Operation
- Keep localStorage working
- Add Supabase queries alongside
- Feature flag to toggle between storage methods

### Phase 2: Gradual Migration
- Authentication first (blocks all features)
- Tasks CRUD next (core functionality)
- Handoffs, notifications, meetings (secondary features)

### Phase 3: Remove localStorage
- Delete sharedState.ts localStorage logic
- Remove demo data conditionals
- Clean up legacy code

---

## 9. DEPLOYMENT CONFIGURATION

### Environment Variables (Production)
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (public anon key)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (secret, server-side only)
OPENAI_API_KEY=sk-... (secret, server-side only)
NEXT_PUBLIC_APP_URL=https://decisionos.vercel.app
NODE_ENV=production
NEXT_PUBLIC_DEMO_MODE=false
```

### Vercel Deployment
1. Connect GitHub repo
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main
4. Use Vercel Edge Functions for API routes (if needed)

---

## 10. COST ESTIMATION

### Supabase (Free Tier Limits)
- Database: 500 MB (plenty for MVP)
- Storage: 1 GB
- Realtime connections: Unlimited
- Auth users: Unlimited
- Bandwidth: 5 GB/month

**Recommendation:** Start with free tier, upgrade at ~50-100 active users.

### Whisper API (OpenAI)
- $0.006 per minute of audio
- Average recording: 30 seconds = $0.003
- 1000 recordings/month = $3

**Total monthly cost (MVP):** $0-3 (Supabase free + Whisper usage)

---

## 11. NEXT STEPS (Implementation Order)

1. ✅ Create Supabase project
2. ✅ Run database migrations (schema + RLS)
3. ✅ Install Supabase client in Next.js
4. ✅ Implement authentication (login/signup pages)
5. ✅ Create API hooks for tasks CRUD
6. ✅ Migrate useWorkspace hook to use Supabase
7. ✅ Implement real-time subscriptions
8. ✅ Integrate Whisper API
9. ✅ Add file upload to Supabase Storage
10. ✅ Deploy to Vercel with production env vars

---

**Status:** Ready to implement 🚀
