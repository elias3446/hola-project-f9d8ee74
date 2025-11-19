-- Allow users to update their own participation (including hidden_at)
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;

CREATE POLICY "Users can update their own participation"
ON participantes_conversacion
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);