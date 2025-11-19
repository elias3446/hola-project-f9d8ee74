-- Remove the policy using auth.uid() which conflicts
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;

-- Ensure the correct policy exists
DROP POLICY IF EXISTS "Usuarios pueden actualizar su participación" ON participantes_conversacion;

CREATE POLICY "Usuarios pueden actualizar su participación"
ON participantes_conversacion
FOR UPDATE
TO authenticated
USING (get_profile_id_from_auth() = user_id)
WITH CHECK (get_profile_id_from_auth() = user_id);