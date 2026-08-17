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
    INSERT INTO public.workspaces (name, owner_id)
    VALUES (
      COALESCE(NEW.full_name, 'My Workspace') || '''s Workspace',
      NEW.id
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
