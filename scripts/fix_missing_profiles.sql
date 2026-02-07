
-- Sync Auth Users to Public Profiles
-- Run this in Supabase SQL Editor to fix missing profiles

-- 1. Insert missing profiles for existing users
INSERT INTO public.profiles (id, full_name, role, active)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email, 'Usuario Sistema'), 
    'admin', -- Defaulting to ADMIN so you can see everything immediately. Change to 'docente' later if needed.
    true
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);

-- 2. Create a trigger so this happens automatically in the future
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', NEW.email),
    'docente' -- Default role for new signups
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop verify to avoid dupes
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Re-create
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
