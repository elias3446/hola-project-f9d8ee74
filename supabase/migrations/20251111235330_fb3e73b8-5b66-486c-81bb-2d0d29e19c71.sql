-- Drop existing update policy if it exists
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;

-- Create policy to allow users to update their own participation records
CREATE POLICY "Users can update their own participation"
ON participantes_conversacion
FOR UPDATE
TO authenticated
USING (auth.uid() = (SELECT user_id FROM profiles WHERE id = participantes_conversacion.user_id))
WITH CHECK (auth.uid() = (SELECT user_id FROM profiles WHERE id = participantes_conversacion.user_id));