-- Create policy to allow authenticated users to view public profile information of other users
CREATE POLICY "Users can view public profiles of other users"
ON profiles
FOR SELECT
USING (
  auth.uid() IS NOT NULL 
  AND deleted_at IS NULL 
  AND estado = 'activo'::user_status
);