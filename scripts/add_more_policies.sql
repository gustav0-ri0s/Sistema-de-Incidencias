
-- Add missing RLS policies for remaining tables
-- This is critical for queries that join these tables

-- 1. Policies for students
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver Estudiantes" ON students;
CREATE POLICY "Ver Estudiantes" ON students FOR SELECT 
TO authenticated 
USING (true);

-- 2. Policies for incident_participants
ALTER TABLE incident_participants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver Participantes" ON incident_participants;
CREATE POLICY "Ver Participantes" ON incident_participants FOR SELECT 
TO authenticated 
USING (true);

DROP POLICY IF EXISTS "Insertar Participantes" ON incident_participants;
CREATE POLICY "Insertar Participantes" ON incident_participants FOR INSERT 
TO authenticated 
WITH CHECK (true); -- Or refine to restrict who can add participants

-- 3. Policies for classrooms (just in case)
ALTER TABLE classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ver Salones" ON classrooms;
CREATE POLICY "Ver Salones" ON classrooms FOR SELECT 
TO authenticated 
USING (true);
