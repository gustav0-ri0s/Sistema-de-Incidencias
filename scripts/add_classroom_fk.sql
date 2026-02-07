
-- Migration: Add classroom_id to incidents table (if missing) and enforce FK

DO $$ 
BEGIN
    -- 1. Add column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'incidents' AND column_name = 'classroom_id') THEN
        ALTER TABLE incidents ADD COLUMN classroom_id BIGINT;
    END IF;

    -- 2. Add Foreign Key constraint (safely)
    -- This assumes 'classrooms' table uses 'id' as Primary Key (BIGINT or INTEGER)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_incidents_classroom') THEN
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_classroom 
        FOREIGN KEY (classroom_id) 
        REFERENCES classrooms(id)
        ON DELETE SET NULL; -- If a classroom is deleted (though we prevented that in UI), keep the incident but nullify reference
    END IF;

END $$;
