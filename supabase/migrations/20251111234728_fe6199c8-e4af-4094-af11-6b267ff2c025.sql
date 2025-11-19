-- Remove duplicate policies and create a single correct one
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su participación" ON participantes_conversacion;

-- Create single policy for updates with proper checks
CREATE POLICY "Usuarios pueden actualizar su participación"
ON participantes_conversacion
FOR UPDATE
TO authenticated
USING (get_profile_id_from_auth() = user_id)
WITH CHECK (get_profile_id_from_auth() = user_id);