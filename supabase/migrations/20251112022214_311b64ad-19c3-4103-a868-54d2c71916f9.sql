-- Drop existing policy that's causing the issue
DROP POLICY IF EXISTS "Users can update their own participation" ON participantes_conversacion;

-- Create updated policy that allows users to hide their own participation (for leaving groups)
CREATE POLICY "Users can update their own participation" 
ON participantes_conversacion 
FOR UPDATE 
USING (user_id = get_profile_id_from_auth())
WITH CHECK (user_id = get_profile_id_from_auth());