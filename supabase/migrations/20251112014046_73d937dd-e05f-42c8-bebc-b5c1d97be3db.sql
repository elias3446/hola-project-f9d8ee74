-- Update the INSERT policy to allow creating conversations
DROP POLICY IF EXISTS "Usuarios pueden crear conversaciones" ON conversaciones;

CREATE POLICY "Usuarios pueden crear conversaciones" ON conversaciones
FOR INSERT
WITH CHECK (
  -- Allow if the user is the creator
  created_by = get_profile_id_from_auth()
);