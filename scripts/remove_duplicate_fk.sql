
-- Drop redundant Foreign Key constraint to resolve PGRST201 error
-- The error showed two constraints: 'fk_incidents_classroom' and 'incidents_classroom_id_fkey'
-- We will keep the default one 'incidents_classroom_id_fkey' (which likely existed before) 
-- and remove the one we added 'fk_incidents_classroom' to avoid ambiguity.

ALTER TABLE incidents DROP CONSTRAINT IF EXISTS fk_incidents_classroom;
