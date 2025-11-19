-- Drop the incorrect policy
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;

-- Create the correct policy to allow users to update their own participation
CREATE POLICY "Users can update their own participation"
ON participantes_conversacion
FOR UPDATE
TO authenticated
USING (user_id = get_profile_id_from_auth())
WITH CHECK (user_id = get_profile_id_from_auth());