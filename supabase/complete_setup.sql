-- DecisionOS Initial Database Schema
-- Created: 2026-08-14
-- Updated: 2026-08-14 - Added Comments and RAG support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ========================================
-- TABLES
-- ========================================

-- Workspaces (multi-tenant organizations)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users (extends Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'sales', 'production', 'finance')),
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks (replaces localStorage TaskCard)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtext TEXT,
  type TEXT NOT NULL CHECK (type IN ('TASK', 'REMINDER', 'INVOICE', 'APPROVAL')),
  source TEXT NOT NULL CHECK (source IN ('TEXT', 'VOICE', 'UPLOAD')),
  category TEXT NOT NULL CHECK (category IN ('CUSTOMER', 'SUPPLIER', 'INVOICE', 'PAYMENT', 'COMPLAINT', 'OTHER')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  done BOOLEAN DEFAULT FALSE,
  scheduled_date DATE,
  scheduled_time TIME,
  details_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Handoffs (inter-role task delegation)
CREATE TABLE handoffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instruction TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'submitted', 'approved', 'rejected')) DEFAULT 'pending',
  reply_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications (per-user notification counts)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  count INT DEFAULT 0,
  last_cleared_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, workspace_id)
);

-- Meetings (meeting notes and transcripts)
CREATE TABLE meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  transcript TEXT,
  attendees TEXT[],
  meeting_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Recordings (voice capture metadata)
CREATE TABLE voice_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  audio_file_path TEXT,
  transcript TEXT,
  duration_seconds FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Uploads (document upload tracking)
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INT,
  mime_type TEXT,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments (threaded comments with @mentions)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mentions UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document Embeddings (for RAG vector search)
CREATE TABLE document_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  upload_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  embedding vector(1536),
  chunk_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- INDEXES
-- ========================================

-- Tasks
CREATE INDEX idx_tasks_workspace ON tasks(workspace_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX idx_tasks_done ON tasks(done);
CREATE INDEX idx_tasks_workspace_assigned ON tasks(workspace_id, assigned_to);

-- Handoffs
CREATE INDEX idx_handoffs_workspace ON handoffs(workspace_id);
CREATE INDEX idx_handoffs_to_user ON handoffs(to_user_id);
CREATE INDEX idx_handoffs_status ON handoffs(status);
CREATE INDEX idx_handoffs_workspace_to_user ON handoffs(workspace_id, to_user_id);

-- Notifications
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_workspace ON notifications(workspace_id);

-- Users
CREATE INDEX idx_users_workspace ON users(workspace_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Meetings
CREATE INDEX idx_meetings_workspace ON meetings(workspace_id);
CREATE INDEX idx_meetings_created_at ON meetings(created_at DESC);

-- Voice Recordings
CREATE INDEX idx_voice_recordings_user ON voice_recordings(user_id);
CREATE INDEX idx_voice_recordings_workspace ON voice_recordings(workspace_id);

-- Uploads
CREATE INDEX idx_uploads_user ON uploads(user_id);
CREATE INDEX idx_uploads_workspace ON uploads(workspace_id);
CREATE INDEX idx_uploads_task ON uploads(task_id);

-- Comments
CREATE INDEX idx_comments_workspace ON comments(workspace_id);
CREATE INDEX idx_comments_task ON comments(task_id);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX idx_comments_mentions ON comments USING GIN(mentions);

-- Document Embeddings
CREATE INDEX idx_embeddings_workspace ON document_embeddings(workspace_id);
CREATE INDEX idx_embeddings_upload ON document_embeddings(upload_id);
CREATE INDEX idx_embeddings_vector ON document_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ========================================
-- ROW LEVEL SECURITY (RLS)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;

-- Workspaces: Users can only access their own workspace
CREATE POLICY "Users can view their workspace"
  ON workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Users: Can view users in same workspace
CREATE POLICY "Users can view users in their workspace"
  ON users FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own profile"
  ON users FOR UPDATE
  USING (id = auth.uid());

-- Tasks: Workspace-scoped access
CREATE POLICY "Users can view tasks in their workspace"
  ON tasks FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create tasks in their workspace"
  ON tasks FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update tasks in their workspace"
  ON tasks FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete tasks in their workspace"
  ON tasks FOR DELETE
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Handoffs: Workspace-scoped access
CREATE POLICY "Users can view handoffs in their workspace"
  ON handoffs FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create handoffs in their workspace"
  ON handoffs FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update handoffs in their workspace"
  ON handoffs FOR UPDATE
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Notifications: User-specific access
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- Meetings: Workspace-scoped access
CREATE POLICY "Users can view meetings in their workspace"
  ON meetings FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create meetings in their workspace"
  ON meetings FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Voice Recordings: User-specific access
CREATE POLICY "Users can view their own voice recordings"
  ON voice_recordings FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own voice recordings"
  ON voice_recordings FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Uploads: Workspace-scoped access
CREATE POLICY "Users can view uploads in their workspace"
  ON uploads FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create uploads in their workspace"
  ON uploads FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- Comments: Workspace-scoped access
CREATE POLICY "Users can view comments in their workspace"
  ON comments FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create comments in their workspace"
  ON comments FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own comments"
  ON comments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments"
  ON comments FOR DELETE
  USING (user_id = auth.uid());

-- Document Embeddings: Workspace-scoped access
CREATE POLICY "Users can view embeddings in their workspace"
  ON document_embeddings FOR SELECT
  USING (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

CREATE POLICY "System can insert embeddings"
  ON document_embeddings FOR INSERT
  WITH CHECK (workspace_id IN (SELECT workspace_id FROM users WHERE id = auth.uid()));

-- ========================================
-- FUNCTIONS & TRIGGERS
-- ========================================
-- Note: Functions are defined later in this file to avoid duplicates

-- ========================================
-- REALTIME
-- ========================================

-- Enable realtime for tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE handoffs;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE meetings;
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- ========================================
-- STORAGE BUCKETS
-- ========================================

-- Voice recordings bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-recordings', 'voice-recordings', false);

-- Document uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false);

-- Avatar images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true);

-- Storage policies for voice-recordings
CREATE POLICY "Users can upload their own voice recordings"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own voice recordings"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'voice-recordings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for documents
CREATE POLICY "Users can upload documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view documents in their workspace"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ========================================
-- DATABASE FUNCTIONS
-- ========================================

-- Function to increment notification count for a specific role
CREATE OR REPLACE FUNCTION increment_notification_count(
  p_workspace_id UUID,
  p_role TEXT
)
RETURNS VOID AS $$
BEGIN
  IF p_role = 'owner' THEN
    UPDATE notifications SET owner_count = owner_count + 1
    WHERE workspace_id = p_workspace_id;
  ELSIF p_role = 'sales' THEN
    UPDATE notifications SET sales_count = sales_count + 1
    WHERE workspace_id = p_workspace_id;
  ELSIF p_role = 'production' THEN
    UPDATE notifications SET production_count = production_count + 1
    WHERE workspace_id = p_workspace_id;
  ELSIF p_role = 'finance' THEN
    UPDATE notifications SET finance_count = finance_count + 1
    WHERE workspace_id = p_workspace_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_workspace_id UUID
)
RETURNS TABLE (
  id UUID,
  upload_id UUID,
  content TEXT,
  similarity float
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_embeddings.id,
    document_embeddings.upload_id,
    document_embeddings.content,
    1 - (document_embeddings.embedding <=> query_embedding) AS similarity
  FROM document_embeddings
  WHERE document_embeddings.workspace_id = p_workspace_id
    AND 1 - (document_embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY document_embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
-- Auth Triggers and Functions
-- Migration: 20260814000002_auth_triggers
-- Description: Auto-create user profile when signing up

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, role, workspace_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'owner'),
    NULL -- workspace_id will be set later
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to handle workspace creation for first user
CREATE OR REPLACE FUNCTION public.create_default_workspace()
RETURNS TRIGGER AS $$
DECLARE
  new_workspace_id UUID;
BEGIN
  -- If user doesn't have a workspace, create one
  IF NEW.workspace_id IS NULL THEN
    INSERT INTO public.workspaces (name, industry)
    VALUES (
      COALESCE(NEW.full_name, 'My Workspace') || '''s Workspace',
      'Textile Manufacturing'
    )
    RETURNING id INTO new_workspace_id;
    
    -- Update user with workspace_id
    UPDATE public.users
    SET workspace_id = new_workspace_id
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create workspace after user insert
DROP TRIGGER IF EXISTS on_user_created_workspace ON public.users;
CREATE TRIGGER on_user_created_workspace
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.create_default_workspace();
-- Migration: Fix RLS Policy Vulnerabilities
-- Date: 2026-08-14
-- Fixes: CRITICAL-5 (notification policy), CRITICAL-7 (storage bucket policies)

-- ============================================================================
-- FIX 1: Remove overly permissive notification insert policy
-- ============================================================================

DROP POLICY IF EXISTS "System can insert notifications" ON notifications;

-- Replace with workspace-scoped policy
CREATE POLICY "Users can insert notifications in their workspace"
  ON notifications FOR INSERT
  WITH CHECK (
    -- User must be in the same workspace
    workspace_id IN (
      SELECT workspace_id FROM users WHERE id = auth.uid()
    )
    -- Target user must be in the same workspace
    AND user_id IN (
      SELECT id FROM users
      WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- ============================================================================
-- FIX 2: Fix storage bucket RLS policies for proper workspace isolation
-- ============================================================================

-- Drop insecure policies
DROP POLICY IF EXISTS "Users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can view documents in their workspace" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload voice recordings" ON storage.objects;
DROP POLICY IF EXISTS "Users can view voice recordings" ON storage.objects;

-- ============================================================================
-- DOCUMENTS BUCKET: Enforce workspace isolation via folder structure
-- Expected path: {workspace_id}/{user_id}/filename
-- ============================================================================

CREATE POLICY "Users can upload documents to their workspace"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND auth.role() = 'authenticated'
    -- First folder segment must be user's workspace_id
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view documents from their workspace"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
    -- User can only delete files they uploaded
    AND owner_id = auth.uid()::text
  );

-- ============================================================================
-- AVATARS BUCKET: User-scoped access
-- Expected path: {user_id}/filename
-- ============================================================================

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND auth.role() = 'authenticated'
    -- First folder segment must be user's own ID
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can view avatars from their workspace"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM users
      WHERE workspace_id IN (
        SELECT workspace_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================================
-- VOICE RECORDINGS BUCKET: Workspace isolation
-- Expected path: {workspace_id}/{user_id}/filename
-- ============================================================================

CREATE POLICY "Users can upload voice recordings to their workspace"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'voice-recordings'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can view voice recordings from their workspace"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'voice-recordings'
    AND (storage.foldername(name))[1] IN (
      SELECT workspace_id::text FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own voice recordings"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'voice-recordings'
    AND owner_id = auth.uid()::text
  );

-- ============================================================================
-- VERIFICATION: View all RLS policies
-- ============================================================================

-- Run this query to verify policies are correct:
/*
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' OR tablename = 'objects'
ORDER BY tablename, policyname;
*/
-- ============================================================================
-- DecisionOS: Database Constraints, Indexes & Performance Optimization
-- Migration: 20260815000000_add_constraints_indexes
-- ============================================================================
-- This migration adds:
-- 1. Foreign key constraints for data integrity
-- 2. Indexes for query performance
-- 3. Unique constraints to prevent duplicates
-- 4. Check constraints for data validation
-- 5. Triggers for automatic timestamp updates
-- ============================================================================

BEGIN;

-- ============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ============================================================================

-- Workspaces table (already created in initial schema)
-- No foreign keys needed (top-level table)

-- Users table: workspace_id references workspaces
ALTER TABLE users
  ADD CONSTRAINT users_workspace_fk
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

-- Tasks table: workspace_id and user_id references
ALTER TABLE tasks
  ADD CONSTRAINT tasks_workspace_fk
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_assigned_to_fk
  FOREIGN KEY (assigned_to)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE tasks
  ADD CONSTRAINT tasks_created_by_fk
  FOREIGN KEY (created_by)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Handoffs table: workspace_id and user_id references
ALTER TABLE handoffs
  ADD CONSTRAINT handoffs_workspace_fk
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE handoffs
  ADD CONSTRAINT handoffs_from_user_fk
  FOREIGN KEY (from_user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

ALTER TABLE handoffs
  ADD CONSTRAINT handoffs_to_user_fk
  FOREIGN KEY (to_user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Uploads table: workspace_id and user_id references
ALTER TABLE uploads
  ADD CONSTRAINT uploads_workspace_fk
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE uploads
  ADD CONSTRAINT uploads_user_fk
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- Voice recordings table: workspace_id and user_id references
ALTER TABLE voice_recordings
  ADD CONSTRAINT voice_recordings_workspace_fk
  FOREIGN KEY (workspace_id)
  REFERENCES workspaces(id)
  ON DELETE CASCADE;

ALTER TABLE voice_recordings
  ADD CONSTRAINT voice_recordings_user_fk
  FOREIGN KEY (user_id)
  REFERENCES users(id)
  ON DELETE SET NULL;

-- ============================================================================
-- UNIQUE CONSTRAINTS
-- ============================================================================

-- Users: email must be unique globally
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email
  ON users(email);

-- Users: auth.users id must be unique (one user profile per auth account)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_auth_id
  ON users(id);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Tasks indexes for common queries

-- 1. Filter tasks by workspace and assigned user (most common query)
CREATE INDEX IF NOT EXISTS idx_tasks_workspace_assigned
  ON tasks(workspace_id, assigned_to)
  WHERE done = FALSE;

-- 2. Filter tasks by scheduled date (calendar view)
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled
  ON tasks(workspace_id, scheduled_date, scheduled_time)
  WHERE done = FALSE;

-- 3. Filter tasks by status and type
CREATE INDEX IF NOT EXISTS idx_tasks_type_done
  ON tasks(workspace_id, type, done);

-- 4. Filter tasks by category
CREATE INDEX IF NOT EXISTS idx_tasks_category
  ON tasks(workspace_id, category)
  WHERE done = FALSE;

-- 5. Recent tasks (for activity feed)
CREATE INDEX IF NOT EXISTS idx_tasks_created_at
  ON tasks(workspace_id, created_at DESC);

-- 6. Search tasks by title (GIN index for text search)
CREATE INDEX IF NOT EXISTS idx_tasks_title_search
  ON tasks USING gin(to_tsvector('english', title));

-- Handoffs indexes

-- 1. Filter handoffs by workspace and status
CREATE INDEX IF NOT EXISTS idx_handoffs_workspace_status
  ON handoffs(workspace_id, status);

-- 2. Filter handoffs by recipient
CREATE INDEX IF NOT EXISTS idx_handoffs_to_user
  ON handoffs(to_user_id, status);

-- 3. Recent handoffs
CREATE INDEX IF NOT EXISTS idx_handoffs_created_at
  ON handoffs(workspace_id, created_at DESC);

-- Uploads indexes

-- 1. User's uploads
CREATE INDEX IF NOT EXISTS idx_uploads_user
  ON uploads(user_id, created_at DESC);

-- 2. Workspace uploads
CREATE INDEX IF NOT EXISTS idx_uploads_workspace
  ON uploads(workspace_id, created_at DESC);

-- 3. Uploads by file type (for storage management)
CREATE INDEX IF NOT EXISTS idx_uploads_mime_type
  ON uploads(mime_type, created_at DESC);

-- Voice recordings indexes

-- 1. User's voice recordings
CREATE INDEX IF NOT EXISTS idx_voice_recordings_user
  ON voice_recordings(user_id, created_at DESC);

-- 2. Workspace voice recordings
CREATE INDEX IF NOT EXISTS idx_voice_recordings_workspace
  ON voice_recordings(workspace_id, created_at DESC);

-- Users indexes

-- 1. Users by workspace (for team directory)
CREATE INDEX IF NOT EXISTS idx_users_workspace
  ON users(workspace_id);

-- 2. Users by role (for routing)
CREATE INDEX IF NOT EXISTS idx_users_role
  ON users(workspace_id, role);

-- ============================================================================
-- CHECK CONSTRAINTS
-- ============================================================================

-- Users: role must be valid
ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('owner', 'sales', 'production', 'finance'));

-- Tasks: type must be valid
ALTER TABLE tasks
  ADD CONSTRAINT tasks_type_check
  CHECK (type IN ('TASK', 'REMINDER', 'INVOICE', 'APPROVAL'));

-- Tasks: source must be valid
ALTER TABLE tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN ('TEXT', 'VOICE', 'UPLOAD'));

-- Tasks: category must be valid
ALTER TABLE tasks
  ADD CONSTRAINT tasks_category_check
  CHECK (category IN ('CUSTOMER', 'SUPPLIER', 'INVOICE', 'PAYMENT', 'COMPLAINT', 'OTHER'));

-- Handoffs: status must be valid
ALTER TABLE handoffs
  ADD CONSTRAINT handoffs_status_check
  CHECK (status IN ('pending', 'submitted', 'approved', 'rejected'));

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handoffs_updated_at
  BEFORE UPDATE ON handoffs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

-- Update statistics for the query planner to use new indexes effectively
ANALYZE workspaces;
ANALYZE users;
ANALYZE tasks;
ANALYZE handoffs;
ANALYZE uploads;
ANALYZE voice_recordings;

-- ============================================================================
-- PERFORMANCE MONITORING
-- ============================================================================

-- Create a view for monitoring slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT
  query,
  calls,
  total_exec_time,
  mean_exec_time,
  min_exec_time,
  max_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries averaging > 100ms
ORDER BY mean_exec_time DESC
LIMIT 50;

-- Create a view for index usage monitoring
CREATE OR REPLACE VIEW v_index_usage AS
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE workspaces IS 'Multi-tenant workspace/company table';
COMMENT ON TABLE users IS 'User profiles extending auth.users';
COMMENT ON TABLE tasks IS 'Tasks, reminders, invoices, and approvals';
COMMENT ON TABLE handoffs IS 'Inter-role task handoffs and approvals';
COMMENT ON TABLE uploads IS 'File upload metadata and references';
COMMENT ON TABLE voice_recordings IS 'Voice transcription history';

COMMENT ON COLUMN users.role IS 'User role: owner, sales, production, finance';
COMMENT ON COLUMN tasks.type IS 'Task type: TASK, REMINDER, INVOICE, APPROVAL';
COMMENT ON COLUMN tasks.source IS 'Task creation source: TEXT, VOICE, UPLOAD';
COMMENT ON COLUMN tasks.category IS 'Task category for routing: CUSTOMER, SUPPLIER, INVOICE, etc.';
COMMENT ON COLUMN handoffs.status IS 'Handoff workflow status: pending, submitted, approved, rejected';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- To verify constraints and indexes after migration, run:
--
-- -- List all foreign keys
-- SELECT conname, conrelid::regclass AS table_name, confrelid::regclass AS referenced_table
-- FROM pg_constraint
-- WHERE contype = 'f' AND conrelid::regclass::text LIKE '%tasks%';
--
-- -- List all indexes
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'tasks';
--
-- -- Check index usage
-- SELECT * FROM v_index_usage WHERE tablename = 'tasks';
--
-- -- Find missing indexes (queries doing sequential scans)
-- SELECT schemaname, tablename, seq_scan, seq_tup_read,
--        idx_scan, seq_tup_read / seq_scan as avg_seq_tup
-- FROM pg_stat_user_tables
-- WHERE seq_scan > 0
-- ORDER BY seq_tup_read DESC
-- LIMIT 25;

COMMIT;
