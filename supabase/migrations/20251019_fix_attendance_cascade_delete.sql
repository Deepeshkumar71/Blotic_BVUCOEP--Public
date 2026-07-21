-- Migration: Fix cascade delete for attendance records
-- Date: 2025-10-19
-- Description: Allow old sessions to be deleted by adding CASCADE delete

-- Step 1: Drop existing foreign key constraint
DO $$ 
BEGIN
    ALTER TABLE attendance_records 
    DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;
EXCEPTION
    WHEN undefined_object THEN
        NULL;
END $$;

-- Step 2: Add foreign key with CASCADE delete
ALTER TABLE attendance_records
ADD CONSTRAINT attendance_records_session_id_fkey 
FOREIGN KEY (session_id) 
REFERENCES attendance_sessions(id) 
ON DELETE CASCADE;

-- Step 3: Update RLS policies for better delete permissions
DROP POLICY IF EXISTS "Admin and core can delete own sessions" ON attendance_sessions;
DROP POLICY IF EXISTS "Admin can delete any session" ON attendance_sessions;

CREATE POLICY "Admin can delete any session"
ON attendance_sessions
FOR DELETE
TO authenticated
USING (
  is_admin() OR (is_core() AND created_by = auth.uid())
);

-- Step 4: Update attendance records delete policy
DROP POLICY IF EXISTS "Admin and core can delete attendance" ON attendance_records;
DROP POLICY IF EXISTS "Admin and core can delete attendance records" ON attendance_records;

CREATE POLICY "Admin and core can delete attendance records"
ON attendance_records
FOR DELETE
TO authenticated
USING (is_admin_or_core());
