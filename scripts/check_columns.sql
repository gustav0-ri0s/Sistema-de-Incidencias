
-- CHECK COLUMNS SCRIPT
-- Run this in Supabase SQL Editor

SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('students', 'incident_participants', 'classrooms');
