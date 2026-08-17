-- Seed data for Sharma Textiles demo workspace

-- Insert demo workspace
INSERT INTO workspaces (id, name, industry) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Sharma Textiles Pvt Ltd', 'Textile Manufacturing');

-- Note: Demo users will be created via Supabase Auth signup
-- This migration only sets up the workspace structure
