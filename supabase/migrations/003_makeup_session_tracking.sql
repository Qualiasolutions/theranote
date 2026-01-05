-- Migration: Add makeup session tracking and DOE compliance fields
-- Links makeup sessions to original missed sessions

-- Add original_session_id column to sessions table
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS original_session_id UUID REFERENCES sessions(id) ON DELETE SET NULL;

-- Add note_format column for narrative vs SOAP toggle
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS note_format TEXT DEFAULT 'soap' CHECK (note_format IN ('soap', 'narrative'));

-- Add narrative_notes column for narrative format
ALTER TABLE sessions
ADD COLUMN IF NOT EXISTS narrative_notes TEXT;

-- Create index for efficient makeup session lookups
CREATE INDEX IF NOT EXISTS idx_sessions_original_session_id
ON sessions(original_session_id)
WHERE original_session_id IS NOT NULL;

-- Add DOE-related fields to students table
ALTER TABLE students
ADD COLUMN IF NOT EXISTS osis_number TEXT,
ADD COLUMN IF NOT EXISTS grade_level TEXT DEFAULT 'PK',
ADD COLUMN IF NOT EXISTS service_type TEXT,
ADD COLUMN IF NOT EXISTS iep_start_date DATE,
ADD COLUMN IF NOT EXISTS iep_end_date DATE;

-- Add comments for documentation
COMMENT ON COLUMN sessions.original_session_id IS 'Links makeup sessions to the original missed session';
COMMENT ON COLUMN sessions.note_format IS 'Note format: soap (4 sections) or narrative (single text)';
COMMENT ON COLUMN sessions.narrative_notes IS 'Single text field for narrative format notes';
COMMENT ON COLUMN students.osis_number IS 'NYC DOE OSIS student identifier';
COMMENT ON COLUMN students.grade_level IS 'Student grade level (PK, K, 1, 2, etc.)';
COMMENT ON COLUMN students.service_type IS 'Primary service type for the student';
