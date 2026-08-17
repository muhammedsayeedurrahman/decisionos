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

-- 3. Uploads by bucket (for storage management)
CREATE INDEX IF NOT EXISTS idx_uploads_bucket
  ON uploads(bucket, created_at DESC);

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

-- Uploads: bucket must be valid
ALTER TABLE uploads
  ADD CONSTRAINT uploads_bucket_check
  CHECK (bucket IN ('documents', 'avatars', 'voice-recordings'));

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
