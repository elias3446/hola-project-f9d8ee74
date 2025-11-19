-- Fix RLS policy for creating conversations and groups
-- The current INSERT policy is too restrictive

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON conversaciones;

-- Create a new INSERT policy that allows users to create conversations
-- where they are the creator (using their profile ID)
CREATE POLICY "Usuarios pueden crear conversaciones" 
ON conversaciones 
FOR INSERT 
TO public
WITH CHECK (
  created_by IN (
    SELECT id 
    FROM profiles 
    WHERE user_id = auth.uid()
  )
);