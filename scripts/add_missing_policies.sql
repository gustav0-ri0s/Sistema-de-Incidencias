
-- Add missing RLS policies for profiles and incident_categories

-- 1. Policies for profiles
-- Allow authenticated users to view all profiles (needed for teacher names)
DROP POLICY IF EXISTS "Ver Perfiles" ON profiles;
CREATE POLICY "Ver Perfiles" ON profiles FOR SELECT 
TO authenticated 
USING (true);

-- Allow users to update their own profile (optional but good practice)
DROP POLICY IF EXISTS "Actualizar Propio Perfil" ON profiles;
CREATE POLICY "Actualizar Propio Perfil" ON profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

-- 2. Policies for incident_categories
-- Allow authenticated users to view categories (needed for dropdowns and lists)
DROP POLICY IF EXISTS "Ver Categorias" ON incident_categories;
CREATE POLICY "Ver Categorias" ON incident_categories FOR SELECT 
TO authenticated 
USING (true);

-- Only admin/supervisor can manage categories (optional, usually setup elsewhere)
