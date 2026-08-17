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
    AND owner_id = auth.uid()
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
    AND owner_id = auth.uid()
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
