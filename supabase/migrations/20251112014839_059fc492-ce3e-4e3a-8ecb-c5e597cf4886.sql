-- Fix INSERT policy for conversaciones
-- The issue is that created_by contains profile.id but we're checking against auth.uid()
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON conversaciones;

CREATE POLICY "Usuarios pueden crear conversaciones"
ON conversaciones
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = get_profile_id_from_auth()
);