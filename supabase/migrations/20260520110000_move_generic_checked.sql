-- Add generic_checked to entries table
ALTER TABLE entries ADD COLUMN IF NOT EXISTS generic_checked boolean NOT NULL DEFAULT false;

-- Drop generic_checked from students table
ALTER TABLE students DROP COLUMN IF EXISTS generic_checked;
