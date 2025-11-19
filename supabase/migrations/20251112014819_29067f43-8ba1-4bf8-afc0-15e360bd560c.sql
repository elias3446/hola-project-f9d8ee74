-- Simplify INSERT policy to use helper function and 'authenticated' role
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON conversaciones;

CREATE POLICY "Usuarios pueden crear conversaciones"
ON conversaciones
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = get_profile_id_from_auth()
);