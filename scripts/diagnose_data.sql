
-- DIAGNOSTIC SCRIPT
-- Run this in Supabase SQL Editor to see what is happening with the data.

-- 1. Check total incidents count (Raw count, bypassing RLS if run by admin/dashboard)
SELECT 'Total Incidencias' as check_name, COUNT(*) as count FROM incidents;

-- 2. Check if there are profiles
SELECT 'Total Perfiles' as check_name, COUNT(*) as count FROM profiles;

-- 3. Check specific profile for the current user (replace with your email if you know it, or just list all)
SELECT * FROM profiles LIMIT 5;

-- 4. Check one incident and its teacher relationship
SELECT 
    i.id as incident_id, 
    i.teacher_id, 
    p.full_name as teacher_name, 
    p.role as teacher_role
FROM incidents i
LEFT JOIN profiles p ON i.teacher_id = p.id
LIMIT 5;

-- 5. Check if RLS is effectively blocking (Simulate a query)
-- Note: You can't easily simulate 'auth.uid()' in simple SQL script without setting config params, 
-- but seeing the Raw Data above will tell us if data EXISTS.

-- IMPORTANT:
-- If Query 1 returns 0, then your table is simply empty!
-- If Query 1 returns > 0, but Query 4 shows "NULL" for teacher_name, 
-- then your incidents are linked to users that don't exist in the profiles table.
